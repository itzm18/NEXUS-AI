import React, { useState } from 'react';
import { Play, Copy, Check, ExternalLink, Terminal, AlertCircle, Loader2 } from 'lucide-react';
import { runJavaScriptCode, runPythonCode } from './codeRunner';
import { ExecutionResult } from '../types';

interface MarkdownRendererProps {
  content: string;
  onOpenArtifact?: (code: string, language: string, title?: string) => void;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, onOpenArtifact }) => {
  if (!content) return null;

  // Split content into code blocks and markdown segments
  const parts = parseMarkdownBlocks(content);

  return (
    <div className="space-y-3 leading-relaxed text-slate-200">
      {parts.map((part, index) => {
        if (part.type === 'code') {
          return (
            <CodeBlockCard
              key={index}
              code={part.content}
              language={part.language || 'text'}
              onOpenArtifact={onOpenArtifact}
            />
          );
        }
        return <FormattedText key={index} text={part.content} />;
      })}
    </div>
  );
};

interface CodeBlockCardProps {
  code: string;
  language: string;
  onOpenArtifact?: (code: string, language: string, title?: string) => void;
}

const CodeBlockCard: React.FC<CodeBlockCardProps> = ({ code, language, onOpenArtifact }) => {
  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [execResult, setExecResult] = useState<ExecutionResult | null>(null);
  const [showConsole, setShowConsole] = useState(false);

  const cleanLang = language.toLowerCase().trim();
  const isRunnable = ['javascript', 'js', 'typescript', 'ts', 'python', 'py'].includes(cleanLang);
  const isArtifactCandidate = ['html', 'htm', 'react', 'jsx', 'tsx', 'svg', 'javascript', 'js'].includes(cleanLang);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRun = async () => {
    setIsRunning(true);
    setShowConsole(true);
    try {
      let result: ExecutionResult;
      if (cleanLang === 'python' || cleanLang === 'py') {
        result = await runPythonCode(code);
      } else {
        result = await runJavaScriptCode(code);
      }
      setExecResult(result);
    } catch (err: any) {
      setExecResult({
        success: false,
        error: err.message || 'Execution failed',
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-slate-700/80 bg-slate-950 shadow-md">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-2 text-xs">
        <div className="flex items-center gap-2 font-mono text-slate-400">
          <Terminal className="h-3.5 w-3.5 text-cyan-400" />
          <span className="uppercase tracking-wider font-semibold text-slate-300">
            {language || 'code'}
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-500">{code.split('\n').length} lines</span>
        </div>

        <div className="flex items-center gap-1.5">
          {isRunnable && (
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600/20 px-2.5 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-600/30 transition border border-emerald-500/30 active:scale-95 disabled:opacity-50"
              title="Run code in sandbox"
            >
              {isRunning ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5 fill-current" />
              )}
              <span>{isRunning ? 'Running...' : 'Run'}</span>
            </button>
          )}

          {isArtifactCandidate && onOpenArtifact && (
            <button
              onClick={() => onOpenArtifact(code, cleanLang, `${cleanLang.toUpperCase()} Artifact`)}
              className="inline-flex items-center gap-1 rounded-md bg-cyan-600/20 px-2 py-1 text-xs font-medium text-cyan-300 hover:bg-cyan-600/30 transition border border-cyan-500/30"
              title="Open in interactive artifact preview"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Preview</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition"
            title="Copy code"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Text Body */}
      <div className="overflow-x-auto p-4 text-xs md:text-sm font-mono leading-relaxed text-slate-100 bg-slate-950/70">
        <pre className="selection:bg-cyan-900/50">
          <code>{code}</code>
        </pre>
      </div>

      {/* Sandboxed Execution Console Output */}
      {showConsole && execResult && (
        <div className="border-t border-slate-800 bg-slate-900/95 p-3 text-xs font-mono">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="flex items-center gap-1.5 font-semibold text-slate-300">
              <Terminal className="h-3 w-3 text-emerald-400" /> Console Output
              {execResult.executionTime !== undefined && (
                <span className="text-slate-500 font-normal">({execResult.executionTime}ms)</span>
              )}
            </span>
            <button
              onClick={() => setShowConsole(false)}
              className="text-slate-500 hover:text-slate-300 transition"
            >
              Dismiss
            </button>
          </div>

          {execResult.output && (
            <pre className="rounded bg-slate-950 p-2.5 text-emerald-400 whitespace-pre-wrap max-h-48 overflow-y-auto border border-slate-800">
              {execResult.output}
            </pre>
          )}

          {execResult.result !== undefined && (
            <div className="mt-2 text-cyan-300">
              <span className="text-slate-500">Return value: </span>
              <span className="font-semibold">{execResult.result}</span>
            </div>
          )}

          {execResult.error && (
            <div className="mt-2 flex items-start gap-1.5 text-rose-400 bg-rose-950/30 border border-rose-900/50 p-2.5 rounded">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <pre className="whitespace-pre-wrap font-sans text-xs">{execResult.error}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Formatted markdown text renderer (handles headers, lists, tables, bold, blockquotes)
const FormattedText: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');
  const renderedElements: React.ReactNode[] = [];
  let tableBuffer: string[] = [];
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for Table syntax (| a | b |)
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      inTable = true;
      tableBuffer.push(line);
      continue;
    } else if (inTable) {
      inTable = false;
      renderedElements.push(<MarkdownTable key={`tbl-${i}`} lines={[...tableBuffer]} />);
      tableBuffer = [];
    }

    // Headings
    if (line.startsWith('### ')) {
      renderedElements.push(
        <h4 key={i} className="text-base font-bold text-slate-100 mt-4 mb-2 flex items-center gap-2">
          {formatInline(line.replace('### ', ''))}
        </h4>
      );
    } else if (line.startsWith('## ')) {
      renderedElements.push(
        <h3 key={i} className="text-lg font-bold text-slate-100 mt-5 mb-2 pb-1 border-b border-slate-800">
          {formatInline(line.replace('## ', ''))}
        </h3>
      );
    } else if (line.startsWith('# ')) {
      renderedElements.push(
        <h2 key={i} className="text-xl font-bold text-white mt-6 mb-3">
          {formatInline(line.replace('# ', ''))}
        </h2>
      );
    } else if (line.startsWith('> ')) {
      renderedElements.push(
        <blockquote key={i} className="border-l-4 border-cyan-500/60 bg-slate-900/40 pl-3 py-1.5 my-2 italic text-slate-300 rounded-r">
          {formatInline(line.replace('> ', ''))}
        </blockquote>
      );
    } else if (/^[-*+]\s/.test(line)) {
      renderedElements.push(
        <li key={i} className="ml-5 list-disc text-slate-200 my-0.5">
          {formatInline(line.replace(/^[-*+]\s/, ''))}
        </li>
      );
    } else if (/^\d+\.\s/.test(line)) {
      renderedElements.push(
        <li key={i} className="ml-5 list-decimal text-slate-200 my-0.5">
          {formatInline(line.replace(/^\d+\.\s/, ''))}
        </li>
      );
    } else if (line.trim() === '---' || line.trim() === '***') {
      renderedElements.push(<hr key={i} className="my-4 border-slate-800" />);
    } else if (line.trim() === '') {
      renderedElements.push(<div key={i} className="h-1.5" />);
    } else {
      renderedElements.push(
        <p key={i} className="my-1 text-slate-200">
          {formatInline(line)}
        </p>
      );
    }
  }

  if (tableBuffer.length > 0) {
    renderedElements.push(<MarkdownTable key="tbl-last" lines={tableBuffer} />);
  }

  return <>{renderedElements}</>;
};

// Markdown Table renderer
const MarkdownTable: React.FC<{ lines: string[] }> = ({ lines }) => {
  if (lines.length < 2) return null;
  const parseRow = (row: string) =>
    row
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());

  const headers = parseRow(lines[0]);
  const rows = lines
    .slice(2)
    .filter((l) => !l.includes('---'))
    .map(parseRow);

  return (
    <div className="my-3 overflow-x-auto rounded-lg border border-slate-800 bg-slate-950">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-900 text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-800">
          <tr>
            {headers.map((h, idx) => (
              <th key={idx} className="px-3.5 py-2.5">
                {formatInline(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800 text-slate-300">
          {rows.map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-slate-900/50 transition">
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="px-3.5 py-2">
                  {formatInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Inline formatter for bold, code, links
function formatInline(text: string): React.ReactNode {
  // Split inline code `code`
  const codeParts = text.split(/(`[^`]+`)/);

  return codeParts.map((part, idx) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 1) {
      return (
        <code
          key={idx}
          className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-cyan-300 border border-slate-700/60"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Process bold **text**
    const boldParts = part.split(/(\*\*[^*]+\*\*)/);
    return boldParts.map((bPart, bIdx) => {
      if (bPart.startsWith('**') && bPart.endsWith('**') && bPart.length > 3) {
        return (
          <strong key={`${idx}-${bIdx}`} className="font-semibold text-white">
            {bPart.slice(2, -2)}
          </strong>
        );
      }
      return bPart;
    });
  });
}

function parseMarkdownBlocks(text: string): { type: 'text' | 'code'; content: string; language?: string }[] {
  const regex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const blocks: { type: 'text' | 'code'; content: string; language?: string }[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({
        type: 'text',
        content: text.substring(lastIndex, match.index),
      });
    }

    blocks.push({
      type: 'code',
      language: match[1] || 'text',
      content: match[2],
    });

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    blocks.push({
      type: 'text',
      content: text.substring(lastIndex),
    });
  }

  return blocks;
}
