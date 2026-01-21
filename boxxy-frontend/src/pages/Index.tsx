import { motion } from 'framer-motion';
import { Code2 } from 'lucide-react';
import { CodeEditorArea } from '@/components/CodeEditor/CodeEditorArea';
import { TerminalPanel } from '@/components/Terminal/TerminalPanel';
import { InputOutputPanel } from '@/components/InputOutput/InputOutputPanel';
import { useCodeEditorStore } from '@/store/codeEditorStore';

const Index = () => {
  const { boxes } = useCodeEditorStore();

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header - god i hate css why is it so hard */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between px-4 py-3 bg-secondary border-b border-border"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
            <Code2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">C++ Playground</h1>
            <p className="text-xs text-muted-foreground">Write, compile, and run C++ code</p>
          </div>
        </div>
        <div className="text-xs text-muted-foreground font-mono">
          {boxes.length} block{boxes.length !== 1 ? 's' : ''}
        </div>
      </motion.header>

      {/* Main Content - where the magic (bugs) happens */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Code Editor + Terminal - basically the whole app */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-hidden">
            <CodeEditorArea />
          </div>

          <TerminalPanel />
        </div>

        {/* Right: Input/Output Panel - stays on the side like a rejected friend */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-80 flex-shrink-0"
        >
          <InputOutputPanel />
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
