import { motion } from 'framer-motion';
import { FileInput, FileOutput, AlertCircle } from 'lucide-react';
import { useCodeEditorStore } from '@/store/codeEditorStore';

export function InputOutputPanel() {
  const {
    input,
    outputPanelText: output,
    hasError,
    setInput: onInputChange
  } = useCodeEditorStore();
  return (
    <div className="flex flex-col h-full border-l border-border bg-sidebar">
      {/* Input Section */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="panel-header">
          <div className="flex items-center gap-2">
            <FileInput className="w-4 h-4 text-primary" />
            <span>Input</span>
          </div>
        </div>
        <div className="flex-1 p-3">
          <textarea
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="Enter program input (stdin)..."
            className="w-full h-full resize-none bg-editor-bg border border-border rounded-md p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-border" />

      {/* Output Section */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="panel-header">
          <div className="flex items-center gap-2">
            <FileOutput className="w-4 h-4 text-terminal-success" />
            <span>Output</span>
          </div>
          {hasError && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1.5 text-destructive text-xs"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Error</span>
            </motion.div>
          )}
        </div>
        <div className="flex-1 p-3 overflow-y-auto">
          <div
            className={`w-full h-full bg-editor-bg border border-border rounded-md p-3 text-sm font-mono overflow-y-auto ${hasError ? 'text-terminal-error' : 'text-foreground'
              }`}
          >
            {output ? (
              <pre className="whitespace-pre-wrap">{output}</pre>
            ) : (
              <span className="text-muted-foreground italic">
                Program output will appear here...
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
