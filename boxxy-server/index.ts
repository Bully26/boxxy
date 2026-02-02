import express from "express";
import crypto from "crypto";
import cors from "cors";
import { createClient } from "redis";
import dotenv from 'dotenv';
dotenv.config();


import {
    SQSClient,
    SendMessageCommand,
} from "@aws-sdk/client-sqs";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
    DynamoDBDocumentClient,
    GetCommand,
} from "@aws-sdk/lib-dynamodb";

const PORT = process.env.PORT || 3000;
const REGION = process.env.AWS_REGION || "ap-south-1";

const QUEUE_URL = process.env.SQS_QUEUE_URL;

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;
const REDIS_URL = process.env.REDIS_URL;

const RATE_LIMIT = 5;
const RATE_WINDOW = 10;

// Express app setup
const app = express();

// CORS setup so frontend can talk to backend
const corsOptions = {
    origin: [
        "http://localhost:8080",
        "http://localhost:3000",
        "http://127.0.0.1:8080",
    ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
};

app.use(cors(corsOptions));
// need body parser for json
app.use(express.json());

// connect to redis instance
const redis = createClient({ url: REDIS_URL });
await redis.connect();

// initializing aws clients
const sqs = new SQSClient({ region: REGION });
const ddb = DynamoDBDocumentClient.from(
    new DynamoDBClient({ region: REGION })
);

// utility function to make random id
function generateJobId() {
    return crypto.randomUUID();
}

// middleware to handle rate limiting
async function rateLimiter(req, res, next) {
    // skip options method for corspreflight
    if (req.method === "OPTIONS") {
        return next();
    }

    const ip = req.ip;
    const key = `rate:${ip}`;

    // increment count in redis
    const count = await redis.incr(key);

    if (count === 1) {
        // set expiry if its the first request
        await redis.expire(key, RATE_WINDOW);
    }

    if (count > RATE_LIMIT) {
        return res.status(429).json({
            error: "Too many requests. Slow down.",
        });
    }

    next();
}

// health check route
app.get("/hii", async (req, res) => {
    try {
        await redis.ping();
        res.json({
            status: "ok",
            services: {
                api: "up",
                redis: "up",
                queue: "up",
            },
        });
    } catch {
        res.status(500).json({ status: "down" });
    }
});

// POST /submit - pushes job to queue
app.post("/submit", rateLimiter, async (req, res) => {
    const { code, input } = req.body;

    if (!code || typeof code !== "string") {
        return res.status(400).json({ error: "Code is required" });
    }

    const jobId = generateJobId();

    // set initial status
    await redis.set(`job:${jobId}`, "SUBMITTED");

    await sqs.send(
        new SendMessageCommand({
            QueueUrl: QUEUE_URL,
            MessageBody: JSON.stringify({
                id: jobId,
                code,
                input: input ?? "",
            }),
        })
    );

    console.log("Job submitted:", jobId);

    res.json({ jobId });
});

// GET /check/:jobId - returns the status of the job
app.get("/check/:jobId", async (req, res) => {
    const { jobId } = req.params;

    const status = await redis.get(`job:${jobId}`);

    if (!status) {
        // job not found 
        return res.status(404).json({ error: "Invalid job id" });
    }

    if (status === "SUBMITTED" || status === "PENDING") {
        return res.json({ status });
    }

    const data = await ddb.send(
        new GetCommand({
            TableName: TABLE_NAME,
            Key: { id: jobId },
        })
    );

    if (status === "FAILED") {
        return res.json({
            status: "FAILED",
            error: data?.Item?.result ?? "Execution failed",
        });
    }

    if (status === "COMPLETED") {
        return res.json({
            status: "COMPLETED",
            output: data?.Item?.result ?? "",
        });
    }

    res.json({ status });
});

// Start the server
app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
});
