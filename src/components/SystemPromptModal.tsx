import React, { useState, useEffect } from 'react';
import { X, Sparkles, Check, Layers, Brain, Bot, BarChart3, Palette, Save } from 'lucide-react';
import { SystemPromptPreset } from '../types';
import { SYSTEM_PROMPT_PRESETS } from '../utils/presets';

interface SystemPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPrompt: string;
  onApplyPrompt: (prompt: string, presetId?: string) => void;
}

export const SystemPromptModal: React.FC<SystemPromptModalProps> = ({
  isOpen,
  onClose,
  currentPrompt,
  onApplyPrompt,
}) => {
  const [promptText, setPromptText] = useState(currentPrompt);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPromptText(currentPrompt);
    }
  }, [isOpen, currentPrompt]);

  if (!isOpen) return null;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Layers':
        return <Layers className="h-4 w-4 text-cyan-400" />;
      case 'Brain':
        return <Brain className="h-4 w-4 text-violet-400" />;
      case 'Bot':
        return <Bot className="h-4 w-4 text-emerald-400" />;
      case 'BarChart3':
        return <BarChart3 className="h-4 w-4 text-amber-400" />;
      case 'Palette':
        return <Palette className="h-4 w-4 text-pink-400" />;
      default:
        return <Sparkles className="h-4 w-4 text-cyan-400" />;
    }
  };

  const handleSelectPreset = (preset: SystemPromptPreset) => {
    setSelectedId(preset.id);
    setPromptText(preset.prompt);
  };

  const handleApply = () => {
    onApplyPrompt(promptText, selectedId || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">System Prompts &amp; Personas</h2>
              <p className="text-xs text-slate-400">
                Guide tone, architecture standards, tool habits, and cognitive constraints.
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
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Preset Buttons Grid */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Curated Persona Presets
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SYSTEM_PROMPT_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-left transition ${
                    selectedId === p.id
                      ? 'border-violet-500 bg-violet-950/40 text-violet-200 ring-1 ring-violet-500'
                      : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="mt-0.5">{getIcon(p.icon)}</div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                      {p.name}
                      {selectedId === p.id && <Check className="h-3.5 w-3.5 text-violet-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                      {p.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Active System Prompt Text
              </label>
              <button
                type="button"
                onClick={() => setPromptText('')}
                className="text-[11px] text-slate-500 hover:text-rose-400 transition"
              >
                Clear
              </button>
            </div>
            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="e.g. You are a senior software architect specializing in scalable distributed systems..."
              rows={6}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3.5 font-mono text-xs text-slate-100 placeholder-slate-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 leading-relaxed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950 px-6 py-4">
          <button
            type="button"
            onClick={() => {
              setPromptText(
                'You are an expert AI assistant that provides accurate, concise, and structured answers with code and explanations.'
              );
            }}
            className="text-xs text-slate-400 hover:text-slate-200 transition"
          >
            Reset to Default
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
              onClick={handleApply}
              className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-5 py-2 text-xs font-bold text-white hover:bg-violet-500 transition shadow-lg shadow-violet-900/30"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Apply Prompt</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
