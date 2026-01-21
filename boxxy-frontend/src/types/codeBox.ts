export type BoxColor = 'blue' | 'green' | 'orange' | 'purple';

export interface CodeBox {
  id: string;
  code: string;
  color: BoxColor;
}

export interface ExecutionResult {
  output: string;
  error?: string;
  compilationOutput?: string;
  success: boolean;
}
