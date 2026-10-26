import { SystemPromptPreset, ThinkingLevelType } from '../types';

export const SYSTEM_PROMPT_PRESETS: SystemPromptPreset[] = [
  {
    id: 'general_architect',
    name: 'Full-Stack Software Architect',
    icon: 'Layers',
    category: 'coding',
    description: 'Writes production-grade TypeScript, React, Node, and Python code with high standards and clean modular patterns.',
    prompt: `You are an elite Principal Software Architect and Full-Stack Engineer.
Provide comprehensive, production-ready code with clear explanations, optimal time/space complexity, and modern architectural patterns.
Whenever writing code, structure it cleanly, add comments where insightful, and supply executable artifacts or examples where helpful.`,
  },
  {
    id: 'deep_reasoner',
    name: 'Deep Logic & Math Thinker',
    icon: 'Brain',
    category: 'reasoning',
    description: 'Excels at complex multi-step reasoning, mathematical proofs, algorithm analysis, and systemic decomposition.',
    prompt: `You are an advanced mathematical and systemic reasoning engine.
Break down every question into first principles.
Think methodically through edge cases, formulate explicit hypotheses, verify assumptions, and clearly substantiate all claims with step-by-step logic before concluding.`,
  },
  {
    id: 'autonomous_agent',
    name: 'Autonomous Agentic Executor',
    icon: 'Bot',
    category: 'general',
    description: 'Plans tasks autonomously, recommends tools, writes and executes code to verify facts, and provides synthesized outcomes.',
    prompt: `You are an autonomous AI agent capable of breaking down complex goals into multi-stage execution plans.
When faced with tasks requiring calculation, code verification, data extraction, or synthesis:
1. State your plan and reasoning.
2. Formulate code or tool actions to execute.
3. Inspect and verify results.
4. Deliver a concise, authoritative synthesis with actionable next steps.`,
  },
  {
    id: 'data_scientist',
    name: 'Data Scientist & Statistical Analyst',
    icon: 'BarChart3',
    category: 'analysis',
    description: 'Expert in CSV analysis, exploratory data analysis, statistical modeling, and generating rich data tables and visualizations.',
    prompt: `You are an expert Data Scientist and Statistical Modeler.
Analyze data structures critically. Provide insights on distributions, outliers, correlation, and patterns.
Deliver findings with clear tables, structured summaries, and reproducible Python/JavaScript visualization code.`,
  },
  {
    id: 'ui_designer',
    name: 'UI/UX & Frontend Designer',
    icon: 'Palette',
    category: 'creative',
    description: 'Designs beautiful, responsive, modern web components with Tailwind CSS and polished interactions.',
    prompt: `You are a world-class Product Designer and Senior Frontend Engineer.
Generate stunning, responsive UI components using modern HTML, Tailwind CSS, and React.
Focus on subtle micro-interactions, clean typographic hierarchy, accessible contrasts, and sleek dark/light aesthetics. Return full runnable artifact code.`,
  },
];

export interface ModelDefinition {
  id: string;
  name: string;
  provider: 'gemini' | 'oxionai' | 'custom';
  category: 'Oxion AI' | 'Google Gemini' | 'DeepSeek' | 'Anthropic' | 'OpenAI' | 'Meta Llama' | 'Qwen & Mistral';
  description: string;
  supportsThinking: boolean;
  maxContext: string;
  badge?: string;
}

export const AVAILABLE_MODELS: ModelDefinition[] = [
  // --- Oxion AI Models (oxionai.com) ---
  {
    id: 'gemma-2-2b',
    name: 'Gemma 2 2B (Oxion AI)',
    provider: 'oxionai',
    category: 'Oxion AI',
    description: 'Oxion AI lightweight high-speed model for rapid generation and coding.',
    supportsThinking: false,
    maxContext: '8K tokens',
    badge: 'Oxion Default',
  },
  {
    id: 'gemma-2-9b-it',
    name: 'Gemma 2 9B IT (Oxion AI)',
    provider: 'oxionai',
    category: 'Oxion AI',
    description: 'High performance instruction-tuned model hosted on Oxion AI.',
    supportsThinking: false,
    maxContext: '8K tokens',
    badge: 'Oxion Fast',
  },
  {
    id: 'gemma-2-27b-it',
    name: 'Gemma 2 27B IT (Oxion AI)',
    provider: 'oxionai',
    category: 'Oxion AI',
    description: 'Frontier-grade open weights reasoning and math on Oxion AI.',
    supportsThinking: false,
    maxContext: '8K tokens',
    badge: 'Oxion Heavy',
  },
  {
    id: 'llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B Instruct (Oxion AI)',
    provider: 'oxionai',
    category: 'Oxion AI',
    description: "Meta's flagship 70B open instruction model hosted on Oxion AI.",
    supportsThinking: false,
    maxContext: '128K tokens',
    badge: 'Oxion Flagship',
  },
  {
    id: 'llama-3.1-8b-instruct',
    name: 'Llama 3.1 8B Instruct (Oxion AI)',
    provider: 'oxionai',
    category: 'Oxion AI',
    description: 'Fast, lightweight general reasoning and chat on Oxion AI.',
    supportsThinking: false,
    maxContext: '128K tokens',
    badge: 'Oxion Popular',
  },
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1 (Oxion AI)',
    provider: 'oxionai',
    category: 'Oxion AI',
    description: 'Full chain-of-thought reasoning and math logic on Oxion AI.',
    supportsThinking: true,
    maxContext: '64K tokens',
    badge: 'Oxion Reasoning',
  },
  {
    id: 'deepseek-v3',
    name: 'DeepSeek V3 (Oxion AI)',
    provider: 'oxionai',
    category: 'Oxion AI',
    description: '671B parameter Mixture-of-Experts frontier model on Oxion AI.',
    supportsThinking: false,
    maxContext: '64K tokens',
    badge: 'Oxion SOTA',
  },
  {
    id: 'qwen-2.5-coder-32b-instruct',
    name: 'Qwen 2.5 Coder 32B (Oxion AI)',
    provider: 'oxionai',
    category: 'Oxion AI',
    description: 'Elite programming and artifact generation engine on Oxion AI.',
    supportsThinking: false,
    maxContext: '128K tokens',
    badge: 'Oxion Coding',
  },
  {
    id: 'mistral-nemo',
    name: 'Mistral NeMo 12B (Oxion AI)',
    provider: 'oxionai',
    category: 'Oxion AI',
    description: 'State-of-the-art multilingual 12B model by Mistral on Oxion AI.',
    supportsThinking: false,
    maxContext: '128K tokens',
    badge: 'Oxion',
  },

  // --- Google Gemini Native Models ---
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    provider: 'gemini',
    category: 'Google Gemini',
    description: 'Flagship speed, multi-modal reasoning, and thinking level control.',
    supportsThinking: true,
    maxContext: '1M tokens',
    badge: 'Gemini Flagship',
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash-Lite',
    provider: 'gemini',
    category: 'Google Gemini',
    description: 'Ultra-low latency, high throughput response generation.',
    supportsThinking: true,
    maxContext: '1M tokens',
    badge: 'Gemini Lite',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'gemini',
    category: 'Google Gemini',
    description: 'Versatile multimodal processing for images, documents, and code.',
    supportsThinking: false,
    maxContext: '1M tokens',
    badge: 'Gemini Fast',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'gemini',
    category: 'Google Gemini',
    description: 'Heavyweight reasoning and master coding with large context.',
    supportsThinking: false,
    maxContext: '2M tokens',
    badge: 'Gemini Pro',
  },

  // --- Anthropic Claude Models (via Oxion/OpenRouter/Proxy) ---
  {
    id: 'claude-3-7-sonnet',
    name: 'Claude 3.7 Sonnet',
    provider: 'custom',
    category: 'Anthropic',
    description: 'Hybrid reasoning and thinking tokens with exceptional coding quality.',
    supportsThinking: true,
    maxContext: '200K tokens',
    badge: 'Hybrid SOTA',
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'custom',
    category: 'Anthropic',
    description: 'Industry benchmark for software engineering and artifact design.',
    supportsThinking: false,
    maxContext: '200K tokens',
    badge: 'Top Coding',
  },
  {
    id: 'claude-3-5-haiku',
    name: 'Claude 3.5 Haiku',
    provider: 'custom',
    category: 'Anthropic',
    description: 'Instant response times with high accuracy.',
    supportsThinking: false,
    maxContext: '200K tokens',
    badge: 'Instant',
  },

  // --- OpenAI Models ---
  {
    id: 'gpt-4o',
    name: 'GPT-4o (Omni Flagship)',
    provider: 'custom',
    category: 'OpenAI',
    description: 'Flagship multimodal intelligence for high-context tasks.',
    supportsThinking: false,
    maxContext: '128K tokens',
    badge: 'Omni',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'custom',
    category: 'OpenAI',
    description: 'Fast, cost-efficient model for everyday chat and code tasks.',
    supportsThinking: false,
    maxContext: '128K tokens',
    badge: 'Mini',
  },
  {
    id: 'o3-mini',
    name: 'OpenAI o3-mini',
    provider: 'custom',
    category: 'OpenAI',
    description: 'Specialized STEM, coding, and mathematical reasoning.',
    supportsThinking: true,
    maxContext: '200K tokens',
    badge: 'Reasoning',
  },
  {
    id: 'o1',
    name: 'OpenAI o1',
    provider: 'custom',
    category: 'OpenAI',
    description: 'Maximum depth reasoning model for complex scientific workflows.',
    supportsThinking: true,
    maxContext: '200K tokens',
    badge: 'Heavy Reasoning',
  },

  // --- DeepSeek Direct Models ---
  {
    id: 'deepseek/deepseek-r1',
    name: 'DeepSeek R1 (Direct/Router)',
    provider: 'custom',
    category: 'DeepSeek',
    description: 'Open-weights reasoning champion rivaling OpenAI o1.',
    supportsThinking: true,
    maxContext: '64K tokens',
    badge: 'R1 Reasoning',
  },
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek V3 (Chat)',
    provider: 'custom',
    category: 'DeepSeek',
    description: 'Flagship general MoE model with exceptional coding ability.',
    supportsThinking: false,
    maxContext: '64K tokens',
    badge: 'MoE',
  },

  // --- Meta Llama Series ---
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    name: 'Meta Llama 3.3 70B',
    provider: 'custom',
    category: 'Meta Llama',
    description: 'Near-frontier open model with high benchmark scores.',
    supportsThinking: false,
    maxContext: '128K tokens',
    badge: 'Open SOTA',
  },
  {
    id: 'meta-llama/llama-3.1-405b-instruct',
    name: 'Meta Llama 3.1 405B',
    provider: 'custom',
    category: 'Meta Llama',
    description: 'Massive 405B parameter open model for extreme complexity.',
    supportsThinking: false,
    maxContext: '128K tokens',
    badge: '405B Giant',
  },

  // --- Qwen & Mistral Series ---
  {
    id: 'qwen/qwen-2.5-coder-32b-instruct',
    name: 'Qwen 2.5 Coder 32B',
    provider: 'custom',
    category: 'Qwen & Mistral',
    description: 'Top-tier coding agent and bug fixer.',
    supportsThinking: false,
    maxContext: '128K tokens',
    badge: 'Coder',
  },
  {
    id: 'mistralai/mistral-large-2411',
    name: 'Mistral Large 2411',
    provider: 'custom',
    category: 'Qwen & Mistral',
    description: "Mistral's flagship reasoning, agentic tool use, and multilingual engine.",
    supportsThinking: false,
    maxContext: '128K tokens',
    badge: 'Mistral SOTA',
  },
];

export const THINKING_LEVELS: {
  id: ThinkingLevelType;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    id: 'off',
    label: 'Off / Minimal',
    description: 'Zero thinking latency. Immediate direct response generation.',
    icon: 'ZapOff',
  },
  {
    id: 'low',
    label: 'Low Thinking',
    description: 'Lightweight reasoning for straightforward logic and quick math.',
    icon: 'Sparkles',
  },
  {
    id: 'medium',
    label: 'Medium Thinking',
    description: 'Balanced reasoning depth. Ideal for coding and problem decomposition.',
    icon: 'BrainCircuit',
  },
  {
    id: 'high',
    label: 'High (Deep Reasoning)',
    description: 'Maximum cognitive exploration for architecture, proofs, and complex debugging.',
    icon: 'Brain',
  },
];

export const BASE_URL_PRESETS = [
  { name: 'Oxion AI (oxionai.com)', url: 'https://oxionai.com/v1', provider: 'oxionai' },
  { name: 'Oxion AI (WWW)', url: 'https://www.oxionai.com/v1', provider: 'oxionai' },
  { name: 'Google Gemini (Official)', url: '', provider: 'gemini' },
  { name: 'OpenAI Official API', url: 'https://api.openai.com/v1', provider: 'custom' },
  { name: 'OpenRouter (Multi-Model)', url: 'https://openrouter.ai/api/v1', provider: 'custom' },
  { name: 'Local Ollama Server', url: 'http://localhost:11434/v1', provider: 'custom' },
  { name: 'Groq Cloud High-Speed', url: 'https://api.groq.com/openai/v1', provider: 'custom' },
  { name: 'Together AI', url: 'https://api.together.xyz/v1', provider: 'custom' },
  { name: 'DeepInfra Endpoint', url: 'https://api.deepinfra.com/v1/openai', provider: 'custom' },
];
