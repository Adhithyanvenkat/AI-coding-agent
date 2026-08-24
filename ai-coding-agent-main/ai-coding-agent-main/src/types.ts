export interface User {
  id: string;
  username: string;
}

export type TabType = 'dashboard' | 'generator' | 'scaffolder' | 'debugger' | 'analyzer' | 'chatbot' | 'history';

export interface HistoryItem {
  id: string;
  userId: string;
  type: 'generator' | 'debugger' | 'analyzer' | 'project' | 'chat';
  title: string;
  input: string;
  output: any; // Dynamic response object depending on the tool
  isFavorite: boolean;
  timestamp: string;
}

export interface CodeGeneratorOutput {
  code: string;
  explanation: string;
}

export interface CodeDebuggerOutput {
  fixedCode: string;
  bugExplanation: string;
  improvements: string;
}

export interface CodeAnalyzerOutput {
  timeComplexity: string;
  spaceComplexity: string;
  codeQuality: string;
  suggestions: string[];
  complexityMetrics: { metric: string; value: number }[];
}

export interface ProjectScaffolderOutput {
  title: string;
  readme: string;
  files: { path: string; content: string }[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export const PROGRAMMING_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript', extension: 'js' },
  { value: 'typescript', label: 'TypeScript', extension: 'ts' },
  { value: 'python', label: 'Python', extension: 'py' },
  { value: 'rust', label: 'Rust', extension: 'rs' },
  { value: 'go', label: 'Go', extension: 'go' },
  { value: 'cpp', label: 'C++', extension: 'cpp' },
  { value: 'java', label: 'Java', extension: 'java' },
  { value: 'ruby', label: 'Ruby', extension: 'rb' },
  { value: 'html', label: 'HTML/CSS', extension: 'html' },
  { value: 'sql', label: 'SQL', extension: 'sql' }
];

export const FRAMEWORKS = [
  { value: 'react', label: 'Vite React (Frontend)' },
  { value: 'express', label: 'Node.js + Express (Backend)' },
  { value: 'fullstack', label: 'Full-stack (React + Express)' }
];
