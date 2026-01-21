import { motion, AnimatePresence } from 'framer-motion';
import { Terminal as TerminalIcon, ChevronUp, ChevronDown, X, Loader2 } from 'lucide-react';

import { useCodeEditorStore } from '@/store/codeEditorStore';

export function TerminalPanel() {
  const {
    isTerminalOpen: isOpen,
    terminalOutput: output,
    isLoading,
    toggleTerminal: onToggle,
    clearOutput: onClear
  } = useCodeEditorStore();
  return (
    <div className="border-t border-border bg-terminal-bg">
      {/* Terminal Header */}
      <div
        className="flex items-center justify-between px-4 py-2 bg-secondary cursor-pointer hover:bg-accent transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Terminal</span>
          {isLoading && (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
          )}
        </div>

        <div className="flex items-center gap-2">
          {isOpen && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title="Clear terminal"
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
          <button className="p-1 rounded hover:bg-muted transition-colors">
            {isOpen ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Terminal Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 200, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="h-[200px] overflow-y-auto p-4 font-mono text-sm">
              {output ? (
                <pre className="whitespace-pre-wrap text-foreground/90">
                  {output.split('\n').map((line, index) => (
                    <div
                      key={index}
                      className={`${line.includes('error') ? 'text-terminal-error' :
                          line.includes('warning') ? 'text-terminal-warning' :
                            line.startsWith('$') ? 'text-terminal-success' :
                              ''
                        }`}
                    >
                      {line}
                    </div>
                  ))}
                </pre>
              ) : (
                <div className="text-muted-foreground italic">
                  {isLoading ? 'Executing code...' : 'Terminal output will appear here...'}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
