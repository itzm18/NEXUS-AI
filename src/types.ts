export type Role = 'user' | 'assistant' | 'system';

export type ThinkingLevelType = 'off' | 'minimal' | 'low' | 'medium' | 'high';

export interface Attachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  data: string; // base64 string
  url?: string;
  type: 'image' | 'audio' | 'pdf' | 'code' | 'text';
  textPreview?: string;
}

export interface AgentToolCall {
  id: string;
  name: string;
  args: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'error';
  output?: string;
  executionTime?: number;
}

export interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  result?: string;
  executionTime?: number;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  thought?: string;
  thinkingDuration?: number;
  attachments?: Attachment[];
  timestamp: number;
  toolCalls?: AgentToolCall[];
  model?: string;
  isStreaming?: boolean;
  error?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
  systemPrompt?: string;
  systemPromptId?: string;
  model?: string;
  thinkingLevel?: ThinkingLevelType;
  tags?: string[];
}

export interface AISettings {
  provider: 'gemini' | 'oxionai' | 'custom';
  apiKey: string;
  baseUrl: string;
  model: string;
  thinkingLevel: ThinkingLevelType;
  thinkingBudget: number;
  temperature: number;
  topP: number;
  systemPrompt: string;
  agentMode: boolean;
  enableSearch: boolean;
  enableCodeExec: boolean;
  autoOpenArtifacts: boolean;
}

export interface SystemPromptPreset {
  id: string;
  name: string;
  icon: string;
  description: string;
  prompt: string;
  category: 'coding' | 'reasoning' | 'creative' | 'analysis' | 'general';
}

export interface Artifact {
  id: string;
  title: string;
  language: string;
  code: string;
  type: 'html' | 'javascript' | 'python' | 'react' | 'svg' | 'markdown' | 'json';
  createdAt: number;
  lastRunResult?: ExecutionResult;
}
