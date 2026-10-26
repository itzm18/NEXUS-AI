import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Music,
  FileCode,
  X,
  Square,
  Bot,
  Sliders,
  Sparkles,
  Mic,
  MicOff,
} from 'lucide-react';
import { Attachment, ThinkingLevelType } from '../types';
import { processFileToAttachment, formatFileSize, estimateTokenCount } from '../utils/fileHelpers';
import { ThinkingSelector } from './ThinkingSelector';
import { ModelSelector } from './ModelSelector';

interface PromptComposerProps {
  onSendMessage: (content: string, attachments: Attachment[]) => void;
  isStreaming: boolean;
  onStopStreaming: () => void;
  thinkingLevel: ThinkingLevelType;
  onChangeThinkingLevel: (level: ThinkingLevelType) => void;
  model: string;
  onChangeModel: (modelId: string, provider?: 'gemini' | 'oxionai' | 'custom') => void;
  agentMode: boolean;
  onToggleAgentMode: () => void;
  onOpenSettings: () => void;
  onOpenSystemPrompt: () => void;
  hasSystemPrompt: boolean;
}

export const PromptComposer: React.FC<PromptComposerProps> = ({
  onSendMessage,
  isStreaming,
  onStopStreaming,
  thinkingLevel,
  onChangeThinkingLevel,
  model,
  onChangeModel,
  agentMode,
  onToggleAgentMode,
  onOpenSettings,
  onOpenSystemPrompt,
  hasSystemPrompt,
}) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [previewModalImg, setPreviewModalImg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 220)}px`;
    }
  }, [input]);

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newAttachments: Attachment[] = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const att = await processFileToAttachment(files[i]);
        newAttachments.push(att);
      } catch (err) {
        console.error('Failed to process file:', err);
      }
    }
    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      await handleFilesSelected(e.dataTransfer.files);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (isStreaming) {
      onStopStreaming();
      return;
    }
    if (!input.trim() && attachments.length === 0) return;

    onSendMessage(input.trim(), attachments);
    setInput('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  // Toggle voice recognition if supported
  const toggleSpeech = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setInput((prev) => (prev ? prev + ' ' + transcript : transcript));
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
    }
  };

  const tokenEstimate = estimateTokenCount(input);

  const getFileIcon = (type: Attachment['type']) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="h-3.5 w-3.5 text-cyan-400" />;
      case 'audio':
        return <Music className="h-3.5 w-3.5 text-amber-400" />;
      case 'code':
        return <FileCode className="h-3.5 w-3.5 text-emerald-400" />;
      default:
        return <FileText className="h-3.5 w-3.5 text-slate-300" />;
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative mx-auto w-full max-w-4xl rounded-2xl border transition-all duration-200 bg-slate-900/90 shadow-2xl backdrop-blur-md ${
        isDragging
          ? 'border-cyan-400 ring-2 ring-cyan-500/30 bg-slate-800/90'
          : 'border-slate-800 focus-within:border-slate-700'
      }`}
    >
      {/* Drag Overlay Hint */}
      {isDragging && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-cyan-950/80 border-2 border-dashed border-cyan-400 text-cyan-200">
          <div className="flex flex-col items-center gap-2">
            <Paperclip className="h-8 w-8 animate-bounce text-cyan-300" />
            <span className="text-sm font-semibold">Drop images, PDFs, audio or code files here</span>
          </div>
        </div>
      )}

      {/* Top Composer Control Bar */}
      <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-2 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Thinking Level Dropdown */}
          <ThinkingSelector level={thinkingLevel} onChange={onChangeThinkingLevel} />

          {/* Agent Mode Toggle */}
          <button
            type="button"
            onClick={onToggleAgentMode}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition ${
              agentMode
                ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/40'
                : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:bg-slate-800'
            }`}
            title="Toggle autonomous agent loop with planning and tools"
          >
            <Bot className="h-3.5 w-3.5" />
            <span className="font-semibold">{agentMode ? 'Agent Mode: On' : 'Standard Chat'}</span>
          </button>

          {/* System Prompt Pill */}
          <button
            type="button"
            onClick={onOpenSystemPrompt}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs transition ${
              hasSystemPrompt
                ? 'border-violet-500/40 bg-violet-950/40 text-violet-300'
                : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:bg-slate-800'
            }`}
            title="Configure System Prompt & Persona"
          >
            <Sparkles className="h-3.5 w-3.5 text-violet-400" />
            <span>{hasSystemPrompt ? 'System Prompt Set' : 'Persona'}</span>
          </button>
        </div>

        {/* Current Model Selector & Settings trigger */}
        <div className="flex items-center gap-1.5">
          <ModelSelector
            currentModel={model}
            onSelectModel={onChangeModel}
            onOpenSettings={onOpenSettings}
          />
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition border border-transparent hover:border-slate-700"
            title="AI Studio & API Settings"
          >
            <Sliders className="h-3.5 w-3.5 text-cyan-400" />
          </button>
        </div>
      </div>

      {/* Multi-modal Attachments Preview Tray */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 pt-3 pb-1 border-b border-slate-800/60 max-h-36 overflow-y-auto">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 shadow-sm group"
            >
              {att.type === 'image' && att.url ? (
                <img
                  src={att.url}
                  alt={att.name}
                  onClick={() => setPreviewModalImg(att.url!)}
                  className="h-7 w-7 rounded object-cover cursor-pointer hover:opacity-80 transition"
                />
              ) : (
                getFileIcon(att.type)
              )}

              <div className="flex flex-col max-w-[130px]">
                <span className="truncate font-medium text-slate-200">{att.name}</span>
                <span className="text-[10px] text-slate-500">{formatFileSize(att.size)}</span>
              </div>

              <button
                type="button"
                onClick={() => removeAttachment(att.id)}
                className="text-slate-500 hover:text-rose-400 transition ml-1"
                title="Remove attachment"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Textarea Input Box */}
      <div className="flex items-end gap-2 px-4 py-3">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => handleFilesSelected(e.target.files)}
          multiple
          className="hidden"
          accept="image/*,audio/*,application/pdf,text/*,.py,.js,.ts,.tsx,.json,.csv,.md,.html,.css"
        />

        {/* Attachment Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-xl p-2.5 text-slate-400 hover:bg-slate-800 hover:text-cyan-400 transition shrink-0"
          title="Attach image, audio, PDF, or code files"
        >
          <Paperclip className="h-5 w-5" />
        </button>

        {/* Speech input */}
        <button
          type="button"
          onClick={toggleSpeech}
          className={`rounded-xl p-2.5 transition shrink-0 ${
            isRecording
              ? 'bg-rose-500/20 text-rose-400 animate-pulse'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
          title={isRecording ? 'Stop voice recording' : 'Voice input'}
        >
          {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>

        {/* Main Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            agentMode
              ? 'Ask the agent to research, plan, write and execute code, or build an artifact...'
              : 'Message NexusAI... (Shift+Enter for newline, drop files to upload)'
          }
          rows={1}
          className="flex-1 max-h-56 min-h-[44px] bg-transparent py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-none leading-relaxed"
        />

        {/* Send / Stop Generation Button */}
        {isStreaming ? (
          <button
            type="button"
            onClick={onStopStreaming}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-600 text-white hover:bg-rose-500 transition shrink-0 shadow-lg shadow-rose-900/30"
            title="Stop generation"
          >
            <Square className="h-4 w-4 fill-current" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!input.trim() && attachments.length === 0}
            className={`flex h-9 w-9 items-center justify-center rounded-xl transition shrink-0 ${
              input.trim() || attachments.length > 0
                ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-bold shadow-lg shadow-cyan-900/40 active:scale-95'
                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
            }`}
            title="Send prompt"
          >
            <ArrowUp className="h-4 w-4 stroke-[3]" />
          </button>
        )}
      </div>

      {/* Footer Info Strip */}
      <div className="flex items-center justify-between px-4 pb-2 text-[10px] text-slate-500">
        <span className="hidden sm:inline">
          Pro-tip: Multimodal upload supports high-res images, PDF documents, and audio tracks.
        </span>
        <div className="flex items-center gap-2 ml-auto">
          {tokenEstimate > 0 && <span>~{tokenEstimate} tokens</span>}
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewModalImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setPreviewModalImg(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img
              src={previewModalImg}
              alt="Enlarged preview"
              className="rounded-xl max-h-[85vh] max-w-full object-contain border border-slate-700"
            />
            <button
              onClick={() => setPreviewModalImg(null)}
              className="absolute -top-3 -right-3 rounded-full bg-slate-900 border border-slate-700 p-1.5 text-white shadow-xl hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
