import React, { useState, useRef, useEffect } from 'react';
import { Cpu, ChevronDown, Check, Search, Flame, Zap, Server, Sparkles } from 'lucide-react';
import { AVAILABLE_MODELS } from '../utils/presets';

interface ModelSelectorProps {
  currentModel: string;
  onSelectModel: (modelId: string, provider?: 'gemini' | 'oxionai' | 'custom') => void;
  onOpenSettings: () => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  currentModel,
  onSelectModel,
  onOpenSettings,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeModelInfo = AVAILABLE_MODELS.find((m) => m.id === currentModel);

  const getProviderIcon = (provider?: string) => {
    if (provider === 'oxionai') return <Flame className="h-3.5 w-3.5 text-cyan-400" />;
    if (provider === 'gemini') return <Zap className="h-3.5 w-3.5 text-violet-400" />;
    return <Server className="h-3.5 w-3.5 text-emerald-400" />;
  };

  const categories = ['All', 'Oxion AI', 'Google Gemini', 'Anthropic', 'OpenAI', 'DeepSeek', 'Meta Llama', 'Qwen & Mistral'];

  const filtered = AVAILABLE_MODELS.filter((m) => {
    const matchesCat =
      category === 'All' ||
      m.category === category ||
      (category === 'Oxion AI' && m.provider === 'oxionai');
    const matchesSearch =
      !search.trim() ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.id.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900/90 text-xs text-slate-200 hover:bg-slate-800 transition max-w-[200px] sm:max-w-[260px]"
        title="Quick Switch AI Model"
      >
        {getProviderIcon(activeModelInfo?.provider)}
        <span className="font-semibold truncate">
          {activeModelInfo?.name || currentModel}
        </span>
        <ChevronDown className="h-3 w-3 text-slate-500 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute left-0 bottom-full sm:bottom-auto sm:top-full mb-2 sm:mb-0 sm:mt-2 w-80 sm:w-96 rounded-2xl border border-slate-700 bg-slate-900 p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-cyan-400" />
              Switch Model
            </span>
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenSettings();
              }}
              className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
            >
              <span>More Settings</span>
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Oxion AI, Gemini, Claude, Llama..."
              className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-8 pr-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1 pb-2 mb-2 border-b border-slate-800/80">
            {categories.slice(0, 5).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
                  category === cat
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white bg-slate-950'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
            {filtered.map((m) => {
              const isSelected = currentModel === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    onSelectModel(m.id, m.provider);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition ${
                    isSelected
                      ? 'bg-cyan-950/70 border border-cyan-800/80 text-cyan-200'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {getProviderIcon(m.provider)}
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate text-slate-100 flex items-center gap-1.5">
                        {m.name}
                        {m.badge && (
                          <span className="text-[9px] bg-slate-800 text-cyan-300 px-1 rounded font-mono">
                            {m.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate font-mono">
                        {m.id} • {m.maxContext}
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-cyan-400 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
