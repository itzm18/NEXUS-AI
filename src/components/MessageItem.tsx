import React, { useState } from 'react';
import {
  Brain,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  RotateCcw,
  Volume2,
  VolumeX,
  Bot,
  User,
  Wrench,
  AlertTriangle,
  FileText,
  Music,
  FileCode,
  Image as ImageIcon,
  ExternalLink,
} from 'lucide-react';
import { Message, Attachment } from '../types';
import { MarkdownRenderer } from '../utils/markdownRenderer';
import { formatFileSize } from '../utils/fileHelpers';

interface MessageItemProps {
  message: Message;
  onRegenerate?: () => void;
  onOpenArtifact?: (code: string, language: string, title?: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onRegenerate,
  onOpenArtifact,
}) => {
  const [showThoughts, setShowThoughts] = useState(message.isStreaming ?? false);
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [selectedImg, setSelectedImg] = useState<string | null>(null);

  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeech = () => {
    if (!('speechSynthesis' in window)) return;

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(message.content.replace(/```[\s\S]*?```/g, 'Code block omitted.'));
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    }
  };

  const getAttachmentIcon = (type: Attachment['type']) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="h-4 w-4 text-cyan-400" />;
      case 'audio':
        return <Music className="h-4 w-4 text-amber-400" />;
      case 'code':
        return <FileCode className="h-4 w-4 text-emerald-400" />;
      default:
        return <FileText className="h-4 w-4 text-slate-300" />;
    }
  };

  return (
    <div
      className={`group relative flex gap-3.5 px-4 py-6 md:px-8 transition-colors ${
        isUser ? 'bg-transparent' : 'bg-slate-900/40 border-y border-slate-800/40'
      }`}
    >
      {/* Avatar */}
      <div className="shrink-0">
        {isUser ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 text-slate-300 border border-slate-700/60 shadow-sm">
            <User className="h-4 w-4" />
          </div>
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 to-violet-600 text-white shadow-md shadow-cyan-950/40">
            <Bot className="h-4 w-4" />
          </div>
        )}
      </div>

      {/* Main Body */}
      <div className="flex-1 min-w-0 space-y-3">
        {/* Header line */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200">
              {isUser ? 'You' : 'NexusAI'}
            </span>
            {message.model && !isUser && (
              <span className="font-mono text-[10px] text-slate-500 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700/50">
                {message.model}
              </span>
            )}
            <span className="text-[10px] text-slate-500">
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          {/* Quick Action buttons */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!isUser && (
              <button
                onClick={handleSpeech}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title={isPlayingAudio ? 'Stop reading' : 'Read aloud'}
              >
                {isPlayingAudio ? (
                  <VolumeX className="h-3.5 w-3.5 text-cyan-400" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5" />
                )}
              </button>
            )}

            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Copy message"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>

            {!isUser && onRegenerate && (
              <button
                onClick={onRegenerate}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Regenerate response"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Multi-modal Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2.5 my-2">
            {message.attachments.map((att) => (
              <div
                key={att.id}
                className="overflow-hidden rounded-xl border border-slate-700/80 bg-slate-950 shadow-sm"
              >
                {att.type === 'image' && att.url ? (
                  <div
                    className="relative cursor-pointer group/img"
                    onClick={() => setSelectedImg(att.url!)}
                  >
                    <img
                      src={att.url}
                      alt={att.name}
                      className="max-h-48 max-w-xs object-cover transition group-hover/img:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition flex items-center justify-center text-white text-xs font-semibold">
                      Click to Expand
                    </div>
                  </div>
                ) : att.type === 'audio' && att.url ? (
                  <div className="p-3 w-72 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                      <Music className="h-4 w-4 text-amber-400" />
                      <span className="truncate">{att.name}</span>
                    </div>
                    <audio controls src={att.url} className="w-full h-8" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 p-3 text-xs max-w-sm">
                    {getAttachmentIcon(att.type)}
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-slate-200">{att.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {formatFileSize(att.size)} • {att.mimeType}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Thinking Process Accordion */}
        {message.thought && (
          <div className="rounded-xl border border-violet-900/40 bg-violet-950/20 my-2 overflow-hidden">
            <button
              onClick={() => setShowThoughts(!showThoughts)}
              className="flex w-full items-center justify-between px-3.5 py-2 text-xs font-semibold text-violet-300 hover:bg-violet-900/20 transition"
            >
              <div className="flex items-center gap-2">
                <Brain className="h-3.5 w-3.5 text-violet-400 animate-pulse" />
                <span>Thinking Process</span>
                {message.thinkingDuration && (
                  <span className="text-[10px] font-mono text-violet-400/80 font-normal">
                    ({(message.thinkingDuration / 1000).toFixed(1)}s reasoning)
                  </span>
                )}
              </div>
              {showThoughts ? (
                <ChevronUp className="h-3.5 w-3.5 text-violet-400" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-violet-400" />
              )}
            </button>

            {showThoughts && (
              <div className="border-t border-violet-900/30 px-4 py-3 text-xs font-mono text-violet-200/80 leading-relaxed whitespace-pre-wrap bg-violet-950/30 max-h-60 overflow-y-auto">
                {message.thought}
              </div>
            )}
          </div>
        )}

        {/* Agent Tool Calls */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="space-y-2 my-2">
            {message.toolCalls.map((tool) => (
              <div
                key={tool.id}
                className="rounded-xl border border-slate-700/80 bg-slate-950 p-3 text-xs font-mono space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-300 font-semibold">
                    <Wrench className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Tool Action: {tool.name}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      tool.status === 'completed'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : tool.status === 'running'
                        ? 'bg-cyan-950 text-cyan-400 border border-cyan-800 animate-pulse'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}
                  >
                    {tool.status}
                  </span>
                </div>

                <div className="text-slate-400 text-[11px]">
                  Args: {JSON.stringify(tool.args)}
                </div>

                {tool.output && (
                  <pre className="p-2 rounded bg-slate-900 text-slate-200 text-[11px] overflow-x-auto border border-slate-800">
                    {tool.output}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Markdown Rendered Content */}
        <div className="text-sm">
          <MarkdownRenderer content={message.content} onOpenArtifact={onOpenArtifact} />

          {message.isStreaming && !message.content && (
            <div className="flex items-center gap-2 text-xs text-cyan-400 animate-pulse py-1">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Formulating thoughts and code...</span>
            </div>
          )}
        </div>

        {/* Error notice if present */}
        {message.error && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-900/60 bg-rose-950/40 p-3 text-xs text-rose-300">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
            <div className="space-y-0.5">
              <div className="font-semibold">Generation Error</div>
              <p className="text-rose-200/90 leading-snug">{message.error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox for Images */}
      {selectedImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
          onClick={() => setSelectedImg(null)}
        >
          <img
            src={selectedImg}
            alt="Expanded view"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl border border-slate-700"
          />
        </div>
      )}
    </div>
  );
};
