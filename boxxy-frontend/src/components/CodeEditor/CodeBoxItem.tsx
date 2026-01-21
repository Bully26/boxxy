import { memo, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { CodeBox, BoxColor } from '@/types/codeBox';
import { ColorSelector } from './ColorSelector';

interface CodeBoxItemProps {
  box: CodeBox;
  canDelete: boolean;
  onCodeChange: (id: string, code: string) => void;
  onColorChange: (id: string, color: BoxColor) => void;
  onAddBox: (id: string) => void;
  onDeleteBox: (id: string) => void;
}

const boxColorClasses: Record<BoxColor, string> = {
  blue: 'code-box-blue',
  green: 'code-box-green',
  orange: 'code-box-orange',
  purple: 'code-box-purple'
};

export const CodeBoxItem = memo(function CodeBoxItem({
  box,
  canDelete,
  onCodeChange,
  onColorChange,
  onAddBox,
  onDeleteBox
}: CodeBoxItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: box.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleEditorChange = useCallback((value: string | undefined) => {
    onCodeChange(box.id, value || '');
  }, [box.id, onCodeChange]);

  const lineCount = box.code.split('\n').length;
  const editorHeight = Math.max(150, Math.min(400, lineCount * 20 + 40));

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, height: 0 }}
      transition={{ duration: 0.2 }}
      className={`relative rounded-md overflow-hidden bg-editor-bg ${boxColorClasses[box.color]} ${isDragging ? 'z-50 shadow-2xl opacity-90' : 'z-0'
        }`}
    >
      {/* Header - drag handle and other junk */}
      <div className="flex items-center justify-between px-3 py-2 bg-secondary/50 border-b border-border">
        <div className="flex items-center gap-2">
          <button
            {...attributes}
            {...listeners}
            className="drag-handle p-1 rounded hover:bg-accent transition-colors"
            title="Drag to reorder"
          >
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </button>
          <span className="text-xs text-muted-foreground font-mono">C++</span>
        </div>

        <div className="flex items-center gap-3">
          <ColorSelector
            currentColor={box.color}
            onColorChange={(color) => onColorChange(box.id, color)}
          />

          <div className="flex items-center gap-1 border-l border-border pl-3">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onAddBox(box.id)}
              className="action-button text-muted-foreground hover:text-foreground"
              title="Add box below"
            >
              <Plus className="w-4 h-4" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onDeleteBox(box.id)}
              disabled={!canDelete}
              className={`action-button ${canDelete
                  ? 'text-muted-foreground hover:text-destructive'
                  : 'text-muted-foreground/30 cursor-not-allowed'
                }`}
              title={canDelete ? 'Delete box' : 'Cannot delete last box'}
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Editor - please dont crash please dont crash */}
      <div style={{ height: editorHeight }}>
        <Editor
          height="100%"
          language="cpp"
          theme="vs-dark"
          value={box.code}
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: "'JetBrains Mono', Consolas, Monaco, monospace",
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            insertSpaces: true,
            wordWrap: 'on',
            padding: { top: 10, bottom: 10 },
            renderLineHighlight: 'line',
            cursorBlinking: 'smooth',
            smoothScrolling: true,
          }}
        />
      </div>
    </motion.div>
  );
});
