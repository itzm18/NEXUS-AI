import React, { useState, useRef, useEffect } from 'react';
import { Brain, Sparkles, ZapOff, BrainCircuit, ChevronDown, Check } from 'lucide-react';
import { ThinkingLevelType } from '../types';
import { THINKING_LEVELS } from '../utils/presets';

interface ThinkingSelectorProps {
  level: ThinkingLevelType;
  onChange: (level: ThinkingLevelType) => void;
  supportsThinking?: boolean;
}

export const ThinkingSelector: React.FC<ThinkingSelectorProps> = ({
  level,
  onChange,
  supportsThinking = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
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

  const currentLevelInfo = THINKING_LEVELS.find((l) => l.id === level) || THINKING_LEVELS[2];

  const getIcon = (id: ThinkingLevelType) => {
    switch (id) {
      case 'off':
      case 'minimal':
        return <ZapOff className="h-3.5 w-3.5 text-slate-400" />;
      case 'low':
        return <Sparkles className="h-3.5 w-3.5 text-amber-400" />;
      case 'medium':
        return <BrainCircuit className="h-3.5 w-3.5 text-cyan-400" />;
      case 'high':
        return <Brain className="h-3.5 w-3.5 text-violet-400" />;
    }
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={!supportsThinking}
        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition ${
          level === 'high'
            ? 'border-violet-500/40 bg-violet-950/30 text-violet-300 hover:bg-violet-900/40'
            : level === 'medium'
            ? 'border-cyan-500/40 bg-cyan-950/30 text-cyan-300 hover:bg-cyan-900/40'
            : level === 'low'
            ? 'border-amber-500/40 bg-amber-950/30 text-amber-300 hover:bg-amber-900/40'
            : 'border-slate-700 bg-slate-900/80 text-slate-400 hover:bg-slate-800'
        } ${!supportsThinking ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={supportsThinking ? 'Adjust AI thinking and reasoning depth' : 'Current model does not support thinking level'}
      >
        {getIcon(level)}
        <span className="font-semibold">{currentLevelInfo.label}</span>
        <ChevronDown className="h-3 w-3 text-slate-500" />
      </button>

      {isOpen && (
        <div className="absolute left-0 bottom-full mb-2 w-72 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2.5 py-1.5 border-b border-slate-800 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Brain className="h-3.5 w-3.5 text-cyan-400" />
              Thinking Level (Reasoning)
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Controls depth of cognitive exploration before response.
            </p>
          </div>

          <div className="space-y-1">
            {THINKING_LEVELS.map((item) => {
              const isSelected = level === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onChange(item.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-start justify-between gap-3 p-2 rounded-lg text-left transition ${
                    isSelected
                      ? 'bg-cyan-950/60 border border-cyan-800/60 text-cyan-200'
                      : 'hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5">{getIcon(item.id)}</div>
                    <div>
                      <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                        {item.label}
                        {item.id === 'high' && (
                          <span className="text-[9px] bg-violet-900/60 text-violet-300 px-1.5 py-0.2 rounded font-mono">
                            Deep Proof
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
