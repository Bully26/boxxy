import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { BoxColor } from '@/types/codeBox';

// -- Types (why do i need so many types) --

export interface CodeBox {
  id: string;
  code: string;
  color: BoxColor;
}

export interface ExecutionOutput {
  stdout: string;
  stderr: string;
  exit_code: number;
  runtime_ms: number;
  status: string;
}

export interface ExecutionResult {
  output: string | ExecutionOutput;
  error?: string;
  compilationOutput?: string;
  success: boolean;
}

interface CodeEditorState {
  // Box State - keeps track of the little boxes
  boxes: CodeBox[];
  filterColor: BoxColor | null;

  // Execution State - is it running? is it broken? probably.
  isLoading: boolean;
  terminalOutput: string;
  outputPanelText: string;
  hasError: boolean;
  input: string; // for InputOutputPanel
  isTerminalOpen: boolean;

  // Actions - things you can do aka buttons
  addBox: (afterId: string) => void;
  deleteBox: (id: string) => void;
  updateCode: (id: string, code: string) => void;
  updateColor: (id: string, color: BoxColor) => void;
  reorderBoxes: (activeId: string, overId: string) => void;
  setFilterColor: (color: BoxColor | null) => void;

  // Execution Actions - time to run the dangerous code
  runCode: (code: string) => Promise<void>;
  clearOutput: () => void;
  setInput: (input: string) => void;
  setTerminalOpen: (isOpen: boolean) => void;
  toggleTerminal: () => void;

  // Helpers - i dont even know what this does
  getCombinedCode: (color: BoxColor) => string;
}

const DEFAULT_CODE = `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`;

export const useCodeEditorStore = create<CodeEditorState>((set, get) => ({
  // Initial State - setup the misery
  boxes: [{ id: uuidv4(), code: DEFAULT_CODE, color: 'blue' }],
  filterColor: null,
  isLoading: false,
  terminalOutput: '',
  outputPanelText: '',
  hasError: false,
  input: '',
  isTerminalOpen: false,

  // Box Actions - adding removing stuff
  addBox: (afterId: string) => {
    set((state) => {
      const index = state.boxes.findIndex((box) => box.id === afterId);
      const newBox: CodeBox = {
        id: uuidv4(),
        code: '// New code block\n',
        color: 'blue',
      };
      const newBoxes = [...state.boxes];
      newBoxes.splice(index + 1, 0, newBox);
      return { boxes: newBoxes };
    });
  },

  deleteBox: (id: string) => {
    set((state) => {
      if (state.boxes.length <= 1) return {};
      return { boxes: state.boxes.filter((box) => box.id !== id) };
    });
  },

  updateCode: (id: string, code: string) => {
    set((state) => ({
      boxes: state.boxes.map((box) =>
        box.id === id ? { ...box, code } : box
      ),
    }));
  },

  updateColor: (id: string, color: BoxColor) => {
    set((state) => ({
      boxes: state.boxes.map((box) =>
        box.id === id ? { ...box, color } : box
      ),
    }));
  },

  reorderBoxes: (activeId: string, overId: string) => {
    set((state) => {
      const oldIndex = state.boxes.findIndex((box) => box.id === activeId);
      const newIndex = state.boxes.findIndex((box) => box.id === overId);

      if (oldIndex === -1 || newIndex === -1) return {};

      const newBoxes = [...state.boxes];
      const [removed] = newBoxes.splice(oldIndex, 1);
      newBoxes.splice(newIndex, 0, removed);
      return { boxes: newBoxes };
    });
  },

  setFilterColor: (color) => set({ filterColor: color }),

  // Execution Actions - here we go again
  runCode: async (code: string) => {
    set({ isLoading: true, terminalOutput: '', outputPanelText: '', hasError: false });
    const { input } = get();

    try {
      // 1. Submit Code - send it to the backend black hole
      const submitResponse = await fetch(`${import.meta.env.VITE_API_URL}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, input }),
      });

      if (!submitResponse.ok) {
        throw new Error('Failed to submit code');
      }

      const { jobId } = await submitResponse.json();

      // 2. Poll Status - are we there yet? are we there yet?
      const pollInterval = 1000; // 1 second
      let status = 'PENDING';
      let result: any = null;

      while (status === 'PENDING' || status === 'SUBMITTED') {
        await new Promise((resolve) => setTimeout(resolve, pollInterval));

        const checkResponse = await fetch(`${import.meta.env.VITE_API_URL}/check/${jobId}`);
        if (!checkResponse.ok) {
          throw new Error('Failed to check status');
        }

        const data = await checkResponse.json();
        status = data.status;

        if (status === 'COMPLETED' || status === 'FAILED') {
          result = data;
          break;
        }
      }

      // 3. Handle Result - finally some output
      if (status === 'COMPLETED') {
        const outputData = result.output;
        // Construct a formatted output string
        let formattedOutput = outputData.stdout || '';
        if (outputData.stderr) {
          formattedOutput += '\nError:\n' + outputData.stderr;
        }
        if (outputData.exit_code !== 0) {
          formattedOutput += `\n\nProcess finished with exit code ${outputData.exit_code}`;
        }

        set({
          terminalOutput: formattedOutput,
          outputPanelText: formattedOutput,
          isLoading: false,
          hasError: outputData.exit_code !== 0
        });
      } else if (status === 'FAILED') {
        set({
          terminalOutput: result.error || 'Execution failed',
          outputPanelText: result.error || 'Execution failed',
          isLoading: false,
          hasError: true
        });
      }

    } catch (e: any) {
      set({
        isLoading: false,
        hasError: true,
        terminalOutput: e.message || 'An unexpected error occurred.',
        outputPanelText: 'Error'
      });
    }
  },

  clearOutput: () => {
    set({ terminalOutput: '', outputPanelText: '', hasError: false });
  },

  setInput: (input) => set({ input }),
  setTerminalOpen: (isOpen) => set({ isTerminalOpen: isOpen }),
  toggleTerminal: () => set((state) => ({ isTerminalOpen: !state.isTerminalOpen })),

  getCombinedCode: (color: BoxColor) => {
    const state = get();
    return state.boxes
      .filter((box) => box.color === color)
      .map((box) => box.code)
      .join('\n\n');
  },
}));
