import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Sliders,
  Sparkles,
  Bot,
  Brain,
  Code2,
  Share2,
  Trash2,
  ArrowRight,
  Download,
  Zap,
  Terminal,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { Conversation, Message, AISettings, Attachment, Artifact, ThinkingLevelType } from './types';
import { Sidebar } from './components/Sidebar';
import { PromptComposer } from './components/PromptComposer';
import { MessageItem } from './components/MessageItem';
import { ArtifactViewer } from './components/ArtifactViewer';
import { SettingsModal } from './components/SettingsModal';
import { SystemPromptModal } from './components/SystemPromptModal';
import { exportConversationAsMarkdown, downloadFile } from './utils/fileHelpers';

const DEFAULT_SETTINGS: AISettings = {
  provider: 'gemini',
  apiKey: '',
  baseUrl: '',
  model: 'gemini-3.8-flash',
  thinkingLevel: 'medium',
  thinkingBudget: 0,
  temperature: 0.7,
  topP: 0.95,
  systemPrompt: 'You are an advanced AI assistant and autonomous engineer. Provide accurate, clean, structured responses with executable code and thoughtful explanations.',
  agentMode: false,
  enableSearch: false,
  enableCodeExec: true,
  autoOpenArtifacts: true,
};

const STARTER_PROMPTS = [
  {
    icon: 'Code2',
    title: 'Interactive Particle Canvas',
    prompt: 'Write a complete, single-file HTML & JavaScript interactive particle vortex simulation with customizable physics controls and neon visual glow.',
    category: 'Artifact & Code',
  },
  {
    icon: 'Brain',
    title: 'Deep Multi-Step Logic',
    prompt: 'Analyze the P vs NP problem from first principles. Detail the known barriers (Relativization, Natural Proofs, Algebrization) with step-by-step mathematical reasoning.',
    category: 'Reasoning',
  },
  {
    icon: 'Bot',
    title: 'Autonomous Data Analysis',
    prompt: 'Act as an autonomous data agent. Write a Python script to simulate 10,000 Monte Carlo stock price paths, compute value at risk (VaR), and output the statistical summary.',
    category: 'Agent Execution',
  },
  {
    icon: 'Layers',
    title: 'Full-Stack Architecture Plan',
    prompt: 'Design a high-throughput real-time event streaming pipeline using Kafka, Redis, and WebSockets. Include data flow diagrams and TypeScript interfaces.',
    category: 'Architecture',
  },
];

export default function App() {
  // Settings State with LocalStorage
  const [settings, setSettings] = useState<AISettings>(() => {
    try {
      const saved = localStorage.getItem('nexus_ai_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Conversations State with LocalStorage
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_ai_conversations');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    // Seed with a welcoming conversation
    const initialId = 'conv_' + Date.now();
    return [
      {
        id: initialId,
        title: 'Welcome to NexusAI Studio',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [
          {
            id: 'm_intro',
            role: 'assistant',
            content: `👋 **Welcome to NexusAI Agentic Studio & Multi-Modal Playground!**

This workbench gives you full access to next-gen AI capabilities:
- 🧠 **Configurable Thinking Level**: Tune reasoning depth from Minimal to High (Deep Reasoning) with live thought inspection.
- 📁 **Multi-Modal Uploads**: Drag and drop images, PDFs, audio tracks, and source code files.
- ⚡ **Real-Time Code Execution**: Run JavaScript, TypeScript, and Python directly in a sandboxed runner.
- 🎨 **Artifact Studio**: Live responsive preview for interactive HTML/JS, React components, and SVGs.
- 🔑 **BYOK & Custom Endpoints**: Connect your own Gemini key, OpenAI endpoint, or local Ollama server in Settings.
- 🤖 **Autonomous Agent Mode**: Multi-step tool actions and structured execution plans.

Try one of the starter prompts below, drop a file, or ask any question to get started!`,
            timestamp: Date.now(),
            model: 'gemini-3.8-flash',
          },
        ],
      },
    ];
  });

  const [activeId, setActiveId] = useState<string | null>(() => {
    const saved = localStorage.getItem('nexus_ai_active_id');
    return saved || conversations[0]?.id || null;
  });

  const [isStreaming, setIsStreaming] = useState(false);
  const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSystemPromptOpen, setIsSystemPromptOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync settings to localStorage
  useEffect(() => {
    localStorage.setItem('nexus_ai_settings', JSON.stringify(settings));
  }, [settings]);

  // Sync conversations to localStorage
  useEffect(() => {
    localStorage.setItem('nexus_ai_conversations', JSON.stringify(conversations));
  }, [conversations]);

  // Sync activeId
  useEffect(() => {
    if (activeId) {
      localStorage.setItem('nexus_ai_active_id', activeId);
    }
  }, [activeId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, isStreaming]);

  const activeConversation = conversations.find((c) => c.id === activeId) || conversations[0];

  const handleNewConversation = () => {
    const newConv: Conversation = {
      id: 'conv_' + Date.now(),
      title: 'New Conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      systemPrompt: settings.systemPrompt,
      model: settings.model,
      thinkingLevel: settings.thinkingLevel,
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveId(newConv.id);
  };

  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      if (activeId === id) {
        setActiveId(updated[0]?.id || null);
      }
      return updated;
    });
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle, updatedAt: Date.now() } : c))
    );
  };

  const handleTogglePin = (id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c))
    );
  };

  const handleDuplicateConversation = (id: string) => {
    const target = conversations.find((c) => c.id === id);
    if (!target) return;
    const duplicated: Conversation = {
      ...target,
      id: 'conv_' + Date.now(),
      title: `${target.title} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: target.messages.map((m) => ({ ...m, id: 'm_' + Math.random().toString(36).substring(2, 9) })),
    };
    setConversations((prev) => [duplicated, ...prev]);
    setActiveId(duplicated.id);
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  const handleSendMessage = async (content: string, attachments: Attachment[]) => {
    if (!activeConversation) return;

    const userMessage: Message = {
      id: 'm_' + Date.now(),
      role: 'user',
      content,
      attachments,
      timestamp: Date.now(),
    };

    const assistantPlaceholderId = 'm_' + (Date.now() + 1);
    const assistantMessage: Message = {
      id: assistantPlaceholderId,
      role: 'assistant',
      content: '',
      thought: '',
      timestamp: Date.now(),
      model: settings.model,
      isStreaming: true,
    };

    // Update conversation with user message & empty assistant placeholder
    const updatedMessages = [...activeConversation.messages, userMessage, assistantMessage];
    const isFirstUserMessage = activeConversation.messages.filter((m) => m.role === 'user').length === 0;
    const newTitle = isFirstUserMessage
      ? content.slice(0, 36) + (content.length > 36 ? '...' : '')
      : activeConversation.title;

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversation.id
          ? {
              ...c,
              title: newTitle,
              messages: updatedMessages,
              updatedAt: Date.now(),
            }
          : c
      )
    );

    setIsStreaming(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const thinkingStartTime = Date.now();
    let accumulatedContent = '';
    let accumulatedThought = '';

    try {
      // Send chat request to our Express SSE API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          provider: settings.provider,
          apiKey: settings.apiKey,
          baseUrl: settings.baseUrl,
          model: settings.model,
          messages: [...activeConversation.messages, userMessage],
          systemPrompt: activeConversation.systemPrompt || settings.systemPrompt,
          temperature: settings.temperature,
          topP: settings.topP,
          thinkingLevel: settings.thinkingLevel,
          thinkingBudget: settings.thinkingBudget,
          agentMode: settings.agentMode,
          enableSearch: settings.enableSearch,
          enableCodeExec: settings.enableCodeExec,
        }),
      });

      if (!response.ok || !response.body) {
        const errText = await response.text();
        throw new Error(`Server returned error ${response.status}: ${errText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const jsonStr = trimmed.replace(/^data:\s*/, '');
          if (!jsonStr) continue;

          try {
            const data = JSON.parse(jsonStr);

            if (data.type === 'content') {
              accumulatedContent += data.text || '';
            } else if (data.type === 'thought') {
              accumulatedThought += data.text || '';
            } else if (data.type === 'error') {
              throw new Error(data.message || 'Generation error');
            } else if (data.type === 'done') {
              // Generation completed
            }

            // Real-time state update
            setConversations((prev) =>
              prev.map((c) =>
                c.id === activeConversation.id
                  ? {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id === assistantPlaceholderId
                          ? {
                              ...m,
                              content: accumulatedContent,
                              thought: accumulatedThought || undefined,
                              thinkingDuration: accumulatedThought ? Date.now() - thinkingStartTime : undefined,
                            }
                          : m
                      ),
                    }
                  : c
              )
            );
          } catch (parseErr: any) {
            if (parseErr.message?.includes('Generation error')) throw parseErr;
          }
        }
      }

      // Check if code block exists to extract artifact automatically if enabled
      if (settings.autoOpenArtifacts && accumulatedContent) {
        const codeBlockMatch = accumulatedContent.match(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/);
        if (codeBlockMatch) {
          const lang = (codeBlockMatch[1] || 'html').toLowerCase();
          if (['html', 'react', 'jsx', 'tsx', 'javascript', 'js', 'svg'].includes(lang)) {
            setActiveArtifact({
              id: 'art_' + Date.now(),
              title: `${lang.toUpperCase()} Component`,
              language: lang,
              code: codeBlockMatch[2],
              type: lang === 'svg' ? 'svg' : lang === 'react' ? 'react' : 'html',
              createdAt: Date.now(),
            });
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User aborted intentionally
      } else {
        console.error('Chat error:', err);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConversation.id
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantPlaceholderId
                      ? {
                          ...m,
                          error: err.message || 'An error occurred while calling the model API.',
                          content: accumulatedContent || 'Generation failed.',
                        }
                      : m
                  ),
                }
              : c
          )
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversation.id
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantPlaceholderId
                    ? {
                        ...m,
                        isStreaming: false,
                        thinkingDuration: accumulatedThought ? Date.now() - thinkingStartTime : undefined,
                      }
                    : m
                ),
              }
            : c
        )
      );
    }
  };

  const handleOpenArtifact = (code: string, language: string, title?: string) => {
    setActiveArtifact({
      id: 'art_' + Date.now(),
      title: title || `${language.toUpperCase()} Artifact`,
      language,
      code,
      type: language === 'svg' ? 'svg' : ['react', 'jsx', 'tsx'].includes(language) ? 'react' : 'html',
      createdAt: Date.now(),
    });
  };

  const handleApplySystemPrompt = (prompt: string) => {
    if (activeConversation) {
      setConversations((prev) =>
        prev.map((c) => (c.id === activeConversation.id ? { ...c, systemPrompt: prompt } : c))
      );
    }
    setSettings((prev) => ({ ...prev, systemPrompt: prompt }));
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* History & Conversation Management Sidebar */}
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelectConversation={setActiveId}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onTogglePin={handleTogglePin}
        onDuplicateConversation={handleDuplicateConversation}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Studio Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Main Header Bar */}
        <header className="h-14 border-b border-slate-800 bg-slate-950/80 px-4 flex items-center justify-between shrink-0 backdrop-blur-md z-20">
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger on Mobile */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 md:hidden transition"
              title="Toggle Conversations Drawer"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Conversation Title & Provider Badge */}
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
                {activeConversation?.title || 'NexusAI Studio'}
              </h1>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className={`font-bold uppercase tracking-wider px-1.5 py-0.2 rounded text-[9px] font-mono transition ${
                    settings.provider === 'oxionai'
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 hover:bg-cyan-900'
                      : settings.provider === 'gemini'
                      ? 'bg-violet-950 text-violet-300 border border-violet-800 hover:bg-violet-900'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                  }`}
                  title="Click to configure provider in Settings"
                >
                  {settings.provider === 'oxionai' ? 'Oxion AI' : settings.provider === 'gemini' ? 'Gemini' : 'Custom'}
                </button>
                <span className="font-mono text-slate-300 truncate max-w-[130px]">{settings.model}</span>
                <span>•</span>
                <span className="capitalize">{settings.thinkingLevel} reasoning</span>
                {settings.agentMode && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-400 flex items-center gap-0.5">
                      <Bot className="h-2.5 w-2.5" /> Agent Active
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Header Action Tools */}
          <div className="flex items-center gap-2">
            {/* Artifacts Pane Toggle if an artifact exists */}
            {activeArtifact && (
              <button
                onClick={() => setActiveArtifact(null)}
                className="flex items-center gap-1.5 rounded-xl bg-cyan-600/20 border border-cyan-500/40 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-600/30 transition"
                title="Hide Artifact Preview"
              >
                <Code2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Close Artifact</span>
              </button>
            )}

            {/* Export conversation */}
            <button
              onClick={() => {
                if (activeConversation) {
                  const md = exportConversationAsMarkdown(activeConversation);
                  downloadFile(
                    md,
                    `${activeConversation.title.replace(/\s+/g, '_').toLowerCase()}.md`,
                    'text/markdown'
                  );
                }
              }}
              className="p-2 rounded-xl text-slate-400 hover:bg-slate-900 hover:text-white transition border border-transparent hover:border-slate-800"
              title="Export Conversation as Markdown"
            >
              <Download className="h-4 w-4" />
            </button>

            {/* Persona Preset Trigger */}
            <button
              onClick={() => setIsSystemPromptOpen(true)}
              className="p-2 rounded-xl text-slate-400 hover:bg-slate-900 hover:text-violet-400 transition border border-transparent hover:border-slate-800"
              title="System Prompt &amp; Personas"
            >
              <Sparkles className="h-4 w-4" />
            </button>

            {/* Settings Trigger */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition"
              title="Settings (API Key &amp; Base URL)"
            >
              <Sliders className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          </div>
        </header>

        {/* Content Container (Chat + Artifacts Split Pane) */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Messages Feed */}
          <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950">
            <div className="flex-1 overflow-y-auto">
              {!activeConversation || activeConversation.messages.length === 0 ? (
                /* Empty State / Starter Playground */
                <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
                  <div className="text-center space-y-3">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-violet-600 text-white shadow-xl shadow-cyan-950/60 mb-2">
                      <Bot className="h-7 w-7" />
                    </div>
                    <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                      NexusAI Agentic Studio
                    </h2>
                    <p className="text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
                      Powered by high-capacity reasoning models with multimodal file analysis, real-time code execution, and autonomous tools.
                    </p>
                  </div>

                  {/* Starter Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                    {STARTER_PROMPTS.map((starter, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(starter.prompt, [])}
                        className="group flex flex-col justify-between p-4 rounded-2xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900 hover:border-slate-700 text-left transition duration-200 shadow-sm hover:shadow-md"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 font-mono">
                              {starter.category}
                            </span>
                            <ArrowRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition" />
                          </div>
                          <h3 className="font-semibold text-slate-200 text-sm group-hover:text-white">
                            {starter.title}
                          </h3>
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                            {starter.prompt}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Features Quick Badge Row */}
                  <div className="pt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800">
                      <Brain className="h-3.5 w-3.5 text-violet-400" /> Thinking Levels
                    </span>
                    <span className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800">
                      <Terminal className="h-3.5 w-3.5 text-emerald-400" /> Code Sandbox
                    </span>
                    <span className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800">
                      <Code2 className="h-3.5 w-3.5 text-cyan-400" /> Live Artifacts
                    </span>
                    <span className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800">
                      <Sliders className="h-3.5 w-3.5 text-amber-400" /> BYOK &amp; Base URL
                    </span>
                  </div>
                </div>
              ) : (
                /* Chat Messages */
                <div className="divide-y divide-slate-800/20 pb-8">
                  {activeConversation.messages.map((msg) => (
                    <MessageItem
                      key={msg.id}
                      message={msg}
                      onRegenerate={
                        msg.role === 'assistant'
                          ? () => {
                              const lastUserMsg = activeConversation.messages
                                .filter((m) => m.role === 'user')
                                .slice(-1)[0];
                              if (lastUserMsg) {
                                handleSendMessage(lastUserMsg.content, lastUserMsg.attachments || []);
                              }
                            }
                          : undefined
                      }
                      onOpenArtifact={handleOpenArtifact}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Bottom Prompt Composer Area */}
            <div className="p-4 border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
              <PromptComposer
                onSendMessage={handleSendMessage}
                isStreaming={isStreaming}
                onStopStreaming={handleStopStreaming}
                thinkingLevel={settings.thinkingLevel}
                onChangeThinkingLevel={(lvl) => setSettings((s) => ({ ...s, thinkingLevel: lvl }))}
                model={settings.model}
                onChangeModel={(modelId, provider) =>
                  setSettings((s) => ({
                    ...s,
                    model: modelId,
                    ...(provider ? { provider } : {}),
                    ...(provider === 'oxionai' && (!s.baseUrl || s.baseUrl === 'https://api.openai.com/v1')
                      ? { baseUrl: 'https://oxionai.com/v1' }
                      : {}),
                  }))
                }
                agentMode={settings.agentMode}
                onToggleAgentMode={() =>
                  setSettings((s) => ({ ...s, agentMode: !s.agentMode }))
                }
                onOpenSettings={() => setIsSettingsOpen(true)}
                onOpenSystemPrompt={() => setIsSystemPromptOpen(true)}
                hasSystemPrompt={Boolean(activeConversation?.systemPrompt || settings.systemPrompt)}
              />
            </div>
          </div>

          {/* Interactive Artifacts Split View */}
          {activeArtifact && (
            <ArtifactViewer
              artifact={activeArtifact}
              onClose={() => setActiveArtifact(null)}
              onUpdateArtifact={(updated) => setActiveArtifact(updated)}
            />
          )}
        </div>
      </div>

      {/* Settings Modal (BYOK & Base URL) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={(updated) => setSettings(updated)}
      />

      {/* System Prompt & Persona Modal */}
      <SystemPromptModal
        isOpen={isSystemPromptOpen}
        onClose={() => setIsSystemPromptOpen(false)}
        currentPrompt={activeConversation?.systemPrompt || settings.systemPrompt}
        onApplyPrompt={handleApplySystemPrompt}
      />
    </div>
  );
}
