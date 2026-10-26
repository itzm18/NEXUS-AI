import React, { useState, useEffect } from 'react';
import {
  X,
  Maximize2,
  Minimize2,
  RefreshCw,
  Copy,
  Check,
  Download,
  Smartphone,
  Tablet,
  Monitor,
  Terminal,
  Code2,
  Eye,
  Play,
  Loader2,
} from 'lucide-react';
import { Artifact, ExecutionResult } from '../types';
import { buildIframeSrcDoc, runJavaScriptCode, runPythonCode } from '../utils/codeRunner';
import { downloadFile } from '../utils/fileHelpers';

interface ArtifactViewerProps {
  artifact: Artifact | null;
  onClose: () => void;
  onUpdateArtifact?: (updated: Artifact) => void;
}

export const ArtifactViewer: React.FC<ArtifactViewerProps> = ({
  artifact,
  onClose,
  onUpdateArtifact,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'console'>('preview');
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editableCode, setEditableCode] = useState('');
  const [iframeKey, setIframeKey] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [execResult, setExecResult] = useState<ExecutionResult | null>(null);

  useEffect(() => {
    if (artifact) {
      setEditableCode(artifact.code);
      setExecResult(artifact.lastRunResult || null);
      // If code is pure JS or Python, default to code or console tab
      if (['javascript', 'js', 'python', 'py'].includes(artifact.language.toLowerCase())) {
        setActiveTab('code');
      } else {
        setActiveTab('preview');
      }
    }
  }, [artifact?.id]);

  if (!artifact) return null;

  const isHtmlOrReact = ['html', 'htm', 'react', 'jsx', 'tsx', 'svg'].includes(
    artifact.language.toLowerCase()
  );
  const isPython = ['python', 'py'].includes(artifact.language.toLowerCase());

  const handleCopy = () => {
    navigator.clipboard.writeText(editableCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext =
      artifact.language === 'python'
        ? 'py'
        : artifact.language === 'javascript'
        ? 'js'
        : artifact.language === 'html'
        ? 'html'
        : artifact.language === 'svg'
        ? 'svg'
        : 'txt';
    downloadFile(editableCode, `${artifact.title.replace(/\s+/g, '_').toLowerCase()}.${ext}`, 'text/plain');
  };

  const handleCodeChange = (newCode: string) => {
    setEditableCode(newCode);
    if (onUpdateArtifact) {
      onUpdateArtifact({ ...artifact, code: newCode });
    }
  };

  const handleRun = async () => {
    setIsRunning(true);
    try {
      let res: ExecutionResult;
      if (isPython) {
        res = await runPythonCode(editableCode);
      } else {
        res = await runJavaScriptCode(editableCode);
      }
      setExecResult(res);
      setActiveTab('console');
    } finally {
      setIsRunning(false);
    }
  };

  const iframeSrcDoc = buildIframeSrcDoc(
    editableCode,
    ['react', 'jsx', 'tsx'].includes(artifact.language.toLowerCase())
  );

  return (
    <div
      className={`flex flex-col bg-slate-900 border-l border-slate-800 transition-all duration-300 z-30 shadow-2xl ${
        isFullScreen
          ? 'fixed inset-0 z-50 w-full h-full'
          : 'w-full lg:w-[48%] h-full shrink-0'
      }`}
    >
      {/* Artifact Header */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
            <Code2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-slate-100">{artifact.title}</h3>
            <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400">
              {artifact.language}
            </span>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 rounded-lg bg-slate-900 p-1 border border-slate-800 text-xs">
          {isHtmlOrReact && (
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition ${
                activeTab === 'preview'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Preview</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition ${
              activeTab === 'code'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>Code</span>
          </button>

          <button
            onClick={() => setActiveTab('console')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition ${
              activeTab === 'console'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>Console</span>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center gap-1 rounded-md bg-emerald-600/20 px-2.5 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 transition disabled:opacity-50"
            title="Execute Code"
          >
            {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5 fill-current" />}
            <span className="hidden sm:inline">Run</span>
          </button>

          <button
            onClick={handleCopy}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            title="Copy Code"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          </button>

          <button
            onClick={handleDownload}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            title="Download Artifact File"
          >
            <Download className="h-4 w-4" />
          </button>

          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
          >
            {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>

          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition"
            title="Close Artifact Pane"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Secondary Toolbar (When Preview is active) */}
      {activeTab === 'preview' && isHtmlOrReact && (
        <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-950/60 px-4 py-1.5 text-xs">
          <div className="flex items-center gap-1 text-slate-400">
            <span className="text-[11px] font-medium text-slate-500 mr-1">Viewport:</span>
            <button
              onClick={() => setViewport('desktop')}
              className={`p-1 rounded ${viewport === 'desktop' ? 'bg-slate-800 text-cyan-400' : 'hover:text-white'}`}
              title="Desktop (100%)"
            >
              <Monitor className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewport('tablet')}
              className={`p-1 rounded ${viewport === 'tablet' ? 'bg-slate-800 text-cyan-400' : 'hover:text-white'}`}
              title="Tablet (768px)"
            >
              <Tablet className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewport('mobile')}
              className={`p-1 rounded ${viewport === 'mobile' ? 'bg-slate-800 text-cyan-400' : 'hover:text-white'}`}
              title="Mobile (375px)"
            >
              <Smartphone className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            onClick={() => setIframeKey((prev) => prev + 1)}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition"
            title="Reload sandbox preview"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Reload</span>
          </button>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative bg-slate-950">
        {/* Preview Tab */}
        {activeTab === 'preview' && (
          <div className="h-full w-full flex items-center justify-center p-3 bg-slate-950/80 overflow-auto">
            <div
              className={`h-full transition-all duration-300 rounded-xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900 ${
                viewport === 'mobile'
                  ? 'w-[375px] max-w-full'
                  : viewport === 'tablet'
                  ? 'w-[768px] max-w-full'
                  : 'w-full'
              }`}
            >
              <iframe
                key={iframeKey}
                title={artifact.title}
                srcDoc={iframeSrcDoc}
                sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
                className="w-full h-full border-0 bg-slate-950"
              />
            </div>
          </div>
        )}

        {/* Code Editor Tab */}
        {activeTab === 'code' && (
          <div className="h-full w-full flex flex-col">
            <textarea
              value={editableCode}
              onChange={(e) => handleCodeChange(e.target.value)}
              className="flex-1 w-full bg-slate-950 p-4 font-mono text-xs md:text-sm text-slate-100 leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-cyan-500/50 selection:bg-cyan-900/40"
              spellCheck={false}
              placeholder="Write or edit code..."
            />
          </div>
        )}

        {/* Console & Execution Output Tab */}
        {activeTab === 'console' && (
          <div className="h-full w-full p-4 overflow-y-auto font-mono text-xs space-y-3 bg-slate-950">
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Terminal className="h-4 w-4 text-emerald-400" />
                Execution Results &amp; Logs
              </span>
              {execResult?.executionTime !== undefined && (
                <span className="text-slate-500 font-mono">
                  Duration: {execResult.executionTime}ms
                </span>
              )}
            </div>

            {execResult ? (
              <>
                {execResult.output ? (
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Standard Output:</span>
                    <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-emerald-400 whitespace-pre-wrap">
                      {execResult.output}
                    </pre>
                  </div>
                ) : (
                  <div className="text-slate-500 italic">No standard output logged.</div>
                )}

                {execResult.result !== undefined && (
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Evaluated Result:</span>
                    <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-cyan-300 whitespace-pre-wrap">
                      {execResult.result}
                    </pre>
                  </div>
                )}

                {execResult.error && (
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-rose-400">Execution Error:</span>
                    <pre className="p-3 rounded-lg bg-rose-950/30 border border-rose-900/60 text-rose-300 whitespace-pre-wrap">
                      {execResult.error}
                    </pre>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-center gap-2">
                <Terminal className="h-8 w-8 text-slate-600" />
                <p>No execution recorded yet.</p>
                <button
                  onClick={handleRun}
                  className="mt-2 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500 transition"
                >
                  Run Script Now
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
