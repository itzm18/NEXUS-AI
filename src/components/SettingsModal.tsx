import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Key,
  Globe,
  Sliders,
  Cpu,
  ShieldCheck,
  Check,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Server,
  Zap,
  RefreshCw,
  Search,
  ExternalLink,
  Flame,
} from 'lucide-react';
import { AISettings } from '../types';
import { AVAILABLE_MODELS, BASE_URL_PRESETS, THINKING_LEVELS, ModelDefinition } from '../utils/presets';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AISettings;
  onSave: (updated: AISettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [localSettings, setLocalSettings] = useState<AISettings>({ ...settings });
  const [showKey, setShowKey] = useState(false);
  const [modelCategory, setModelCategory] = useState<string>('All');
  const [modelSearch, setModelSearch] = useState('');
  const [dynamicModels, setDynamicModels] = useState<ModelDefinition[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [fetchMessage, setFetchMessage] = useState<string | null>(null);

  const [testStatus, setTestStatus] = useState<{
    loading: boolean;
    success?: boolean;
    message?: string;
    latency?: number;
  }>({ loading: false });

  // Sync local settings whenever modal opens or parent settings prop updates
  useEffect(() => {
    if (isOpen) {
      setLocalSettings({ ...settings });
      setTestStatus({ loading: false });
      setFetchMessage(null);
    }
  }, [isOpen, settings]);

  const handleTestConnection = async () => {
    setTestStatus({ loading: true });
    try {
      const res = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: localSettings.provider,
          apiKey: localSettings.apiKey,
          baseUrl: localSettings.baseUrl,
          model: localSettings.model,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestStatus({
          loading: false,
          success: true,
          message: `Connected successfully! Latency: ${data.latency}ms (${data.model})`,
          latency: data.latency,
        });
      } else {
        setTestStatus({
          loading: false,
          success: false,
          message: data.error || 'Connection failed',
        });
      }
    } catch (err: any) {
      setTestStatus({
        loading: false,
        success: false,
        message: err.message || 'Network error',
      });
    }
  };

  const handleFetchLiveModels = async () => {
    setIsFetchingModels(true);
    setFetchMessage(null);
    try {
      const res = await fetch('/api/fetch-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: localSettings.provider,
          apiKey: localSettings.apiKey,
          baseUrl: localSettings.baseUrl,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.models)) {
        const fetched: ModelDefinition[] = data.models.map((m: any) => ({
          id: m.id,
          name: m.name || m.id,
          provider: localSettings.provider,
          category: localSettings.provider === 'oxionai' ? 'Oxion AI' : 'Custom',
          description: m.description || `Hosted live on ${localSettings.provider === 'oxionai' ? 'oxionai.com' : 'endpoint'}`,
          supportsThinking: m.id.includes('r1') || m.id.includes('think') || m.id.includes('flash'),
          maxContext: '128K tokens',
          badge: 'Live',
        }));

        setDynamicModels(fetched);
        setFetchMessage(`Fetched ${fetched.length} live models from ${localSettings.provider === 'oxionai' ? 'oxionai.com' : 'server'}!`);
      } else {
        setFetchMessage(data.error || 'Could not fetch live models. Check your API key and Base URL.');
      }
    } catch (err: any) {
      setFetchMessage(err.message || 'Network error while fetching models');
    } finally {
      setIsFetchingModels(false);
    }
  };

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  // Combine static and dynamically fetched models (avoid duplicates by ID)
  const combinedModels = React.useMemo(() => {
    const list = [...dynamicModels, ...AVAILABLE_MODELS];
    const seen = new Set<string>();
    return list.filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
  }, [dynamicModels]);

  const categories = ['All', 'Oxion AI', 'Google Gemini', 'Anthropic', 'OpenAI', 'DeepSeek', 'Meta Llama', 'Qwen & Mistral'];

  const filteredModels = combinedModels.filter((m) => {
    const matchesCategory =
      modelCategory === 'All' ||
      m.category === modelCategory ||
      (modelCategory === 'Oxion AI' && m.provider === 'oxionai');
    const matchesSearch =
      !modelSearch.trim() ||
      m.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
      m.id.toLowerCase().includes(modelSearch.toLowerCase()) ||
      m.description.toLowerCase().includes(modelSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                AI Studio &amp; API Configuration
                <span className="text-[10px] bg-gradient-to-r from-cyan-500 to-violet-500 text-slate-950 px-2 py-0.5 rounded-full font-black uppercase">
                  BYOK &amp; Oxion AI
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Configure your Oxion AI (oxionai.com) key, Google Gemini, or custom OpenAI-compatible endpoints.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[75vh] overflow-y-auto p-6 space-y-6 text-sm">
          {/* Provider Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Select Provider
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Oxion AI Option */}
              <button
                type="button"
                onClick={() =>
                  setLocalSettings({
                    ...localSettings,
                    provider: 'oxionai',
                    baseUrl: 'https://oxionai.com/v1',
                    model: 'gemma-2-2b',
                  })
                }
                className={`flex flex-col justify-between p-3.5 rounded-xl border text-left transition relative overflow-hidden ${
                  localSettings.provider === 'oxionai'
                    ? 'border-cyan-400 bg-gradient-to-b from-cyan-950/70 to-slate-900 text-cyan-100 ring-1 ring-cyan-400 shadow-md shadow-cyan-950/40'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                    <Flame className="h-4 w-4 text-cyan-400" />
                    <span>Oxion AI</span>
                  </div>
                  <span className="text-[9px] uppercase font-mono font-bold bg-cyan-950 text-cyan-300 px-1.5 py-0.2 rounded border border-cyan-800">
                    oxionai.com
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                  High-speed Gemma 2, Llama 3.3, DeepSeek R1 &amp; Qwen. Use your <code className="text-cyan-300">cc_...</code> key.
                </div>
              </button>

              {/* Google Gemini Option */}
              <button
                type="button"
                onClick={() =>
                  setLocalSettings({
                    ...localSettings,
                    provider: 'gemini',
                    model: 'gemini-3.8-flash',
                    baseUrl: '',
                  })
                }
                className={`flex flex-col justify-between p-3.5 rounded-xl border text-left transition ${
                  localSettings.provider === 'gemini'
                    ? 'border-violet-400 bg-gradient-to-b from-violet-950/70 to-slate-900 text-violet-100 ring-1 ring-violet-400 shadow-md shadow-violet-950/40'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                    <Zap className="h-4 w-4 text-violet-400" />
                    <span>Google Gemini</span>
                  </div>
                  <span className="text-[9px] uppercase font-mono font-bold bg-violet-950 text-violet-300 px-1.5 py-0.2 rounded border border-violet-800">
                    Native SDK
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                  Gemini 3.8 Flash &amp; 3.1 Flash-Lite with thinking levels and native multimodal analysis.
                </div>
              </button>

              {/* Custom / OpenAI / Ollama Option */}
              <button
                type="button"
                onClick={() =>
                  setLocalSettings({
                    ...localSettings,
                    provider: 'custom',
                    baseUrl: 'https://api.openai.com/v1',
                    model: 'gpt-4o',
                  })
                }
                className={`flex flex-col justify-between p-3.5 rounded-xl border text-left transition ${
                  localSettings.provider === 'custom'
                    ? 'border-emerald-400 bg-gradient-to-b from-emerald-950/70 to-slate-900 text-emerald-100 ring-1 ring-emerald-400 shadow-md shadow-emerald-950/40'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                    <Server className="h-4 w-4 text-emerald-400" />
                    <span>Custom / Ollama</span>
                  </div>
                  <span className="text-[9px] uppercase font-mono font-bold bg-emerald-950 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-800">
                    OpenAI / Local
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                  OpenAI, OpenRouter, Groq, Together, or local Ollama (<code className="text-emerald-300">localhost:11434</code>).
                </div>
              </button>
            </div>
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5 text-cyan-400" />
                {localSettings.provider === 'oxionai'
                  ? 'Oxion AI API Key (cc_...)'
                  : localSettings.provider === 'gemini'
                  ? 'Gemini API Key'
                  : 'Endpoint API Key'}
              </label>

              {localSettings.provider === 'oxionai' && (
                <a
                  href="https://oxionai.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[11px] text-cyan-400 hover:underline"
                >
                  <span>Get key at oxionai.com</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={localSettings.apiKey}
                onChange={(e) => setLocalSettings({ ...localSettings, apiKey: e.target.value })}
                placeholder={
                  localSettings.provider === 'oxionai'
                    ? 'cc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (48 characters)'
                    : localSettings.provider === 'gemini'
                    ? 'AIzaSy... (leave blank to use preconfigured environment key)'
                    : 'sk-... or Bearer token'
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 pr-10 text-xs font-mono text-slate-100 placeholder-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              Your key is saved locally in your browser storage and passed directly to the secure proxy backend.
            </p>
          </div>

          {/* Base URL */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-cyan-400" />
                API Base URL
              </label>
              <button
                type="button"
                onClick={handleFetchLiveModels}
                disabled={isFetchingModels}
                className="flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition"
                title="Query /v1/models on this endpoint to load available models"
              >
                {isFetchingModels ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                <span>Fetch Live Models</span>
              </button>
            </div>

            <input
              type="text"
              value={localSettings.baseUrl}
              onChange={(e) => setLocalSettings({ ...localSettings, baseUrl: e.target.value })}
              placeholder={
                localSettings.provider === 'oxionai'
                  ? 'https://oxionai.com/v1'
                  : localSettings.provider === 'gemini'
                  ? 'Default Google endpoint (leave blank)'
                  : 'https://api.openai.com/v1 or http://localhost:11434/v1'
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs font-mono text-slate-100 placeholder-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />

            {/* Quick URL Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {BASE_URL_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() =>
                    setLocalSettings({
                      ...localSettings,
                      baseUrl: preset.url,
                      provider: preset.provider as any,
                      model: preset.provider === 'oxionai' ? 'gemma-2-2b' : localSettings.model,
                    })
                  }
                  className={`rounded-md px-2 py-1 text-[11px] transition border ${
                    localSettings.baseUrl === preset.url
                      ? 'bg-cyan-600/30 border-cyan-500 text-cyan-200 font-semibold'
                      : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>

            {fetchMessage && (
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-cyan-300 flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                <span>{fetchMessage}</span>
              </div>
            )}
          </div>

          {/* Model Catalog Section */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5 text-cyan-400" />
                  Model Selection ({combinedModels.length} Models Available)
                </label>
                <p className="text-[11px] text-slate-400">
                  Select from Oxion AI models, Gemini series, Claude, OpenAI, DeepSeek, or Llama.
                </p>
              </div>

              {/* Model Search */}
              <div className="relative w-full sm:w-52">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  value={modelSearch}
                  onChange={(e) => setModelSearch(e.target.value)}
                  placeholder="Filter models..."
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 pl-8 pr-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap gap-1 border-b border-slate-800/80 pb-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setModelCategory(cat)}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
                    modelCategory === cat
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Custom Manual Model Input */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-medium shrink-0">Selected Model:</span>
              <input
                type="text"
                value={localSettings.model}
                onChange={(e) => setLocalSettings({ ...localSettings, model: e.target.value })}
                placeholder="Enter exact model ID..."
                className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-mono text-cyan-300 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            {/* Models Scrollable Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {filteredModels.map((m) => {
                const isSelected = localSettings.model === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setLocalSettings({
                        ...localSettings,
                        model: m.id,
                        ...(m.provider ? { provider: m.provider } : {}),
                        ...(m.provider === 'oxionai' && !localSettings.baseUrl
                          ? { baseUrl: 'https://oxionai.com/v1' }
                          : {}),
                      });
                    }}
                    className={`flex flex-col justify-between p-2.5 rounded-xl border text-left transition ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-950/60 text-cyan-200 ring-1 ring-cyan-400'
                        : 'border-slate-800/80 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-semibold text-slate-200 text-xs truncate max-w-[170px]">
                        {m.name}
                      </span>
                      {m.badge && (
                        <span className="text-[9px] font-mono font-bold bg-slate-800 text-cyan-300 px-1.5 py-0.2 rounded shrink-0">
                          {m.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-1">{m.description}</p>
                    <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 mt-1 pt-1 border-t border-slate-800/40">
                      <span>{m.id}</span>
                      <span>{m.maxContext}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Thinking Level & Budget */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Thinking Level &amp; Reasoning Depth
              </h4>
              <p className="text-[11px] text-slate-400">
                Adjust reasoning effort for thinking models (Gemini 3, DeepSeek R1, Claude 3.7, OpenAI o3/o1).
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {THINKING_LEVELS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setLocalSettings({ ...localSettings, thinkingLevel: t.id })}
                  className={`p-2.5 rounded-lg border text-center transition ${
                    localSettings.thinkingLevel === t.id
                      ? 'border-cyan-500 bg-cyan-950/60 text-cyan-200 font-semibold'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-semibold text-slate-200">{t.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{t.id}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Sampling Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Temperature</span>
                <span className="font-mono text-cyan-400">{localSettings.temperature}</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.05"
                value={localSettings.temperature}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, temperature: parseFloat(e.target.value) })
                }
                className="w-full accent-cyan-500"
              />
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Top-P</span>
                <span className="font-mono text-cyan-400">{localSettings.topP}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={localSettings.topP}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, topP: parseFloat(e.target.value) })
                }
                className="w-full accent-cyan-500"
              />
            </div>
          </div>

          {/* Test Status feedback */}
          {testStatus.message && (
            <div
              className={`flex items-center gap-2 p-3 rounded-xl text-xs ${
                testStatus.success
                  ? 'bg-emerald-950/40 border border-emerald-800/60 text-emerald-300'
                  : 'bg-rose-950/40 border border-rose-800/60 text-rose-300'
              }`}
            >
              {testStatus.success ? (
                <Check className="h-4 w-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              )}
              <span>{testStatus.message}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950 px-6 py-4">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testStatus.loading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition disabled:opacity-50"
          >
            {testStatus.loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Zap className="h-3.5 w-3.5 text-cyan-400" />
            )}
            <span>Test Connection</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-xl bg-cyan-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition shadow-lg shadow-cyan-900/30"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
