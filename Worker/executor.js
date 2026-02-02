import fs from "fs/promises";
import { spawn } from "child_process";
import os from "os";
import path from "path";

async function toolExists(cmd) {
  return new Promise((resolve) => {
    const p = spawn("which", [cmd]);
    p.on("close", (code) => resolve(code === 0));
    p.on("error", () => resolve(false));
  });
}

export async function executeCpp(code, input = "", opt = {}) {
  code = (code ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\u00A0/g, " ")
    .replace(/\t/g, " ");

  const MEM  = opt.memory_bytes ?? 256 * 1024 * 1024;
  const CPU  = opt.cpu_seconds ?? 5;
  const WALL = opt.wall_ms ?? 5000;
  const OUTL = opt.max_output ?? 1024 * 1024;

  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "job-"));
  const src = path.join(workDir, "main.cpp");
  const bin = path.join(workDir, "exec");

  // ---- SIMPLE WRAP (no hacks) ----
  const wrapped = `
#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

${code}

    return 0;
}
`;

  await fs.writeFile(src, wrapped, "utf8");

  // ---- COMPILE ----
  const compile = await new Promise((resolve) => {
    let stderr = "";
    const p = spawn("g++", [
      src,
      "-O2",
      "-std=gnu++17",
      "-o", bin
    ], { cwd: workDir });

    p.stderr.on("data", d => stderr += d);
    p.on("close", c => resolve({ c, stderr }));
    p.on("error", e => resolve({ c: 127, stderr: String(e) }));
  });

  if (compile.c !== 0) {
    await fs.rm(workDir, { recursive: true, force: true });
    return { status: "compile_error", stdout: "", stderr: compile.stderr };
  }

  const haveFirejail = await toolExists("firejail");
  const havePrlimit  = await toolExists("prlimit");

  let cmd, args;

  if (haveFirejail) {
    cmd = "firejail";
    args = [
      "--quiet",
      "--private=" + workDir,
      "--private-tmp",
      "--nogroups",
      "--nonewprivs",
      "--seccomp",
      "--noroot",
      "--nosound",
      "--net=none",
      "--rlimit-nproc=1",
      "--",
      ...(havePrlimit
        ? ["/usr/bin/prlimit",
           `--as=${MEM}`,
           `--cpu=${CPU}`,
           "--",
           "./exec"]
        : ["./exec"])
    ];
  } else if (havePrlimit) {
    cmd = "prlimit";
    args = [`--as=${MEM}`, `--cpu=${CPU}`, "--", bin];
  } else {
    cmd = bin;
    args = [];
  }

  const child = spawn(cmd, args, {
    cwd: workDir,
    stdio: ["pipe", "pipe", "pipe"],
    detached: true
  });

  // ---- STDIN ----
  if (typeof input === "string" && input.length) {
    child.stdin.write(input);
  }
  child.stdin.end();

  let out = [];
  let err = [];
  let used = 0;
  let killedByTime = false;
  let killedByOutput = false;

  const start = Date.now();

  const timer = setTimeout(() => {
    killedByTime = true;
    try { process.kill(-child.pid, "SIGKILL"); } catch {}
  }, WALL);

  child.stdout.on("data", (chunk) => {
    used += chunk.length;
    if (used <= OUTL) {
      out.push(chunk);
    } else {
      killedByOutput = true;
      try { process.kill(-child.pid, "SIGKILL"); } catch {}
    }
  });

  child.stderr.on("data", (c) => err.push(c));

  const ex = await new Promise((resolve) =>
    child.on("close", (code, sig) => {
      clearTimeout(timer);
      resolve({ code, sig, runtime_ms: Date.now() - start });
    })
  );

  await fs.rm(workDir, { recursive: true, force: true });

  const stdout = Buffer.concat(out).toString();
  const stderr = Buffer.concat(err).toString();

  let status;
  if (killedByOutput) status = "output_limit_exceeded";
  else if (killedByTime) status = "timeout";
  else if (ex.sig) status = "killed";
  else if (ex.code !== 0) status = "runtime_error";
  else status = "success";

  return {
    status,
    stdout,
    stderr,
    exit_code: ex.code,
    signal: ex.sig,
    runtime_ms: ex.runtime_ms,
    used_firejail: haveFirejail
  };
}

export default executeCpp;
