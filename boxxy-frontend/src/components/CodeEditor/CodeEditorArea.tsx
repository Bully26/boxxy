import { useMemo } from 'react';
import { useCodeEditorStore } from '@/store/codeEditorStore';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { AnimatePresence } from 'framer-motion';
import { CodeBox, BoxColor } from '@/types/codeBox';
import { CodeBoxItem } from './CodeBoxItem';
import { EditorNavBar } from './EditorNavBar';



export function CodeEditorArea() {
  const {
    boxes,
    filterColor,
    isLoading,
    updateCode,
    updateColor,
    addBox,
    deleteBox,
    reorderBoxes,
    setFilterColor,
    runCode
  } = useCodeEditorStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const filteredBoxes = useMemo(() => {
    if (filterColor === null) return boxes;
    return boxes.filter(box => box.color === filterColor);
  }, [boxes, filterColor]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderBoxes(active.id as string, over.id as string);
    }
  };

  // Wrapper for submit that gets the code from store logic
  const handleSubmitByColor = async (color: BoxColor) => {
    // The store implementation of runCode takes 'code' string. 
    // We need to construct it here or update store to handle it.
    // Store has `getCombinedCode`.
    const code = useCodeEditorStore.getState().getCombinedCode(color);
    if (!code.trim()) return;

    // also open terminal
    useCodeEditorStore.getState().setTerminalOpen(true);
    await runCode(code);
  };

  return (
    <div className="flex flex-col h-full">
      <EditorNavBar
        filterColor={filterColor}
        submitColor={null} // EditorNavBar expects this if we want to show submit button specific to color?
        isLoading={isLoading}
        onShowAll={() => setFilterColor(null)}
        onFilterByColor={setFilterColor}
        onSubmitByColor={handleSubmitByColor}
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredBoxes.map(box => box.id)}
            strategy={verticalListSortingStrategy}
          >
            <AnimatePresence mode="popLayout">
              {filteredBoxes.map(box => (
                <CodeBoxItem
                  key={box.id}
                  box={box}
                  canDelete={boxes.length > 1}
                  onCodeChange={updateCode}
                  onColorChange={updateColor}
                  onAddBox={addBox}
                  onDeleteBox={deleteBox}
                />
              ))}
            </AnimatePresence>
          </SortableContext>
        </DndContext>

        {filteredBoxes.length === 0 && (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <p>No code boxes match the selected filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
