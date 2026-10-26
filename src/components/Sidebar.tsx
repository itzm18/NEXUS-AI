import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  MessageSquare,
  Pin,
  Trash2,
  Edit2,
  Copy,
  Download,
  Check,
  X,
  Sliders,
  Sparkles,
  Bot,
  Database,
  ChevronRight,
  Upload,
} from 'lucide-react';
import { Conversation } from '../types';
import { exportConversationAsMarkdown, downloadFile } from '../utils/fileHelpers';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onTogglePin: (id: string) => void;
  onDuplicateConversation: (id: string) => void;
  onOpenSettings: () => void;
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  onTogglePin,
  onDuplicateConversation,
  onOpenSettings,
  isOpen,
  onCloseMobile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // Group conversations by Pin status & Date
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  }, [conversations, searchQuery]);

  const { pinned, today, yesterday, previousWeek, older } = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;
    const lastWeekStart = todayStart - 86400000 * 7;

    const pinned: Conversation[] = [];
    const today: Conversation[] = [];
    const yesterday: Conversation[] = [];
    const previousWeek: Conversation[] = [];
    const older: Conversation[] = [];

    for (const c of filteredConversations) {
      if (c.pinned) {
        pinned.push(c);
        continue;
      }
      const time = c.updatedAt || c.createdAt;
      if (time >= todayStart) {
        today.push(c);
      } else if (time >= yesterdayStart) {
        yesterday.push(c);
      } else if (time >= lastWeekStart) {
        previousWeek.push(c);
      } else {
        older.push(c);
      }
    }

    return { pinned, today, yesterday, previousWeek, older };
  }, [filteredConversations]);

  const handleStartRename = (c: Conversation) => {
    setEditingId(c.id);
    setEditTitle(c.title);
  };

  const handleSaveRename = (id: string) => {
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleExportMarkdown = (c: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    const md = exportConversationAsMarkdown(c);
    downloadFile(md, `${c.title.replace(/\s+/g, '_').toLowerCase()}.md`, 'text/markdown');
  };

  const handleExportJSON = (c: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    const json = JSON.stringify(c, null, 2);
    downloadFile(json, `${c.title.replace(/\s+/g, '_').toLowerCase()}.json`, 'application/json');
  };

  const totalMessages = useMemo(
    () => conversations.reduce((acc, c) => acc + c.messages.length, 0),
    [conversations]
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 flex flex-col w-72 lg:w-80 bg-slate-950 border-r border-slate-800 transition-transform duration-300 ease-in-out shrink-0 select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Logo and New Chat */}
        <div className="p-4 border-b border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 text-white font-black text-sm shadow-md shadow-cyan-950">
                N
              </div>
              <div>
                <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                  NexusAI Studio
                  <span className="text-[9px] uppercase tracking-wider font-mono bg-cyan-950 text-cyan-300 border border-cyan-800/60 px-1.5 py-0.2 rounded">
                    PRO
                  </span>
                </span>
                <p className="text-[10px] text-slate-500 font-medium">Agentic &amp; Multimodal</p>
              </div>
            </div>

            <button
              onClick={onCloseMobile}
              className="p-1 rounded-md text-slate-400 hover:text-white md:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* New Chat Button */}
          <button
            onClick={() => {
              onNewConversation();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-slate-950 font-bold px-4 py-2.5 text-xs shadow-lg shadow-cyan-950/50 transition active:scale-98"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>Start New Session</span>
          </button>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900/80 pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500/60 focus:outline-none focus:ring-1 focus:ring-cyan-500/60 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Conversation List Scrollable Area */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500 space-y-1">
              <MessageSquare className="h-6 w-6 mx-auto text-slate-600 mb-2" />
              <p>No conversations found</p>
              {searchQuery && <p className="text-[11px]">Try adjusting your search query</p>}
            </div>
          ) : (
            <>
              {/* Pinned Section */}
              {pinned.length > 0 && (
                <ConversationSection
                  title="Pinned"
                  icon={<Pin className="h-3 w-3 text-amber-400" />}
                  items={pinned}
                  activeId={activeId}
                  editingId={editingId}
                  editTitle={editTitle}
                  onSelect={(id) => {
                    onSelectConversation(id);
                    onCloseMobile();
                  }}
                  onStartRename={handleStartRename}
                  onSaveRename={handleSaveRename}
                  onCancelRename={() => setEditingId(null)}
                  setEditTitle={setEditTitle}
                  onTogglePin={onTogglePin}
                  onDuplicate={onDuplicateConversation}
                  onDelete={onDeleteConversation}
                  onExportMd={handleExportMarkdown}
                  onExportJson={handleExportJSON}
                />
              )}

              {/* Today Section */}
              {today.length > 0 && (
                <ConversationSection
                  title="Today"
                  items={today}
                  activeId={activeId}
                  editingId={editingId}
                  editTitle={editTitle}
                  onSelect={(id) => {
                    onSelectConversation(id);
                    onCloseMobile();
                  }}
                  onStartRename={handleStartRename}
                  onSaveRename={handleSaveRename}
                  onCancelRename={() => setEditingId(null)}
                  setEditTitle={setEditTitle}
                  onTogglePin={onTogglePin}
                  onDuplicate={onDuplicateConversation}
                  onDelete={onDeleteConversation}
                  onExportMd={handleExportMarkdown}
                  onExportJson={handleExportJSON}
                />
              )}

              {/* Yesterday Section */}
              {yesterday.length > 0 && (
                <ConversationSection
                  title="Yesterday"
                  items={yesterday}
                  activeId={activeId}
                  editingId={editingId}
                  editTitle={editTitle}
                  onSelect={(id) => {
                    onSelectConversation(id);
                    onCloseMobile();
                  }}
                  onStartRename={handleStartRename}
                  onSaveRename={handleSaveRename}
                  onCancelRename={() => setEditingId(null)}
                  setEditTitle={setEditTitle}
                  onTogglePin={onTogglePin}
                  onDuplicate={onDuplicateConversation}
                  onDelete={onDeleteConversation}
                  onExportMd={handleExportMarkdown}
                  onExportJson={handleExportJSON}
                />
              )}

              {/* Previous 7 Days Section */}
              {previousWeek.length > 0 && (
                <ConversationSection
                  title="Previous 7 Days"
                  items={previousWeek}
                  activeId={activeId}
                  editingId={editingId}
                  editTitle={editTitle}
                  onSelect={(id) => {
                    onSelectConversation(id);
                    onCloseMobile();
                  }}
                  onStartRename={handleStartRename}
                  onSaveRename={handleSaveRename}
                  onCancelRename={() => setEditingId(null)}
                  setEditTitle={setEditTitle}
                  onTogglePin={onTogglePin}
                  onDuplicate={onDuplicateConversation}
                  onDelete={onDeleteConversation}
                  onExportMd={handleExportMarkdown}
                  onExportJson={handleExportJSON}
                />
              )}

              {/* Older Section */}
              {older.length > 0 && (
                <ConversationSection
                  title="Older History"
                  items={older}
                  activeId={activeId}
                  editingId={editingId}
                  editTitle={editTitle}
                  onSelect={(id) => {
                    onSelectConversation(id);
                    onCloseMobile();
                  }}
                  onStartRename={handleStartRename}
                  onSaveRename={handleSaveRename}
                  onCancelRename={() => setEditingId(null)}
                  setEditTitle={setEditTitle}
                  onTogglePin={onTogglePin}
                  onDuplicate={onDuplicateConversation}
                  onDelete={onDeleteConversation}
                  onExportMd={handleExportMarkdown}
                  onExportJson={handleExportJSON}
                />
              )}
            </>
          )}
        </div>

        {/* Dashboard Footer Stats & Settings */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 space-y-2">
          {/* Quick Stats Widget */}
          <div className="flex items-center justify-between px-2 text-[11px] text-slate-500 font-mono">
            <span>{conversations.length} sessions</span>
            <span>•</span>
            <span>{totalMessages} messages</span>
          </div>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center justify-between p-2 rounded-xl text-xs text-slate-300 hover:bg-slate-900 transition border border-transparent hover:border-slate-800"
          >
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-cyan-400" />
              <span className="font-medium">Studio Settings (BYOK)</span>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
          </button>
        </div>
      </aside>
    </>
  );
};

interface ConversationSectionProps {
  title: string;
  icon?: React.ReactNode;
  items: Conversation[];
  activeId: string | null;
  editingId: string | null;
  editTitle: string;
  onSelect: (id: string) => void;
  onStartRename: (c: Conversation) => void;
  onSaveRename: (id: string) => void;
  onCancelRename: () => void;
  setEditTitle: (val: string) => void;
  onTogglePin: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onExportMd: (c: Conversation, e: React.MouseEvent) => void;
  onExportJson: (c: Conversation, e: React.MouseEvent) => void;
}

const ConversationSection: React.FC<ConversationSectionProps> = ({
  title,
  icon,
  items,
  activeId,
  editingId,
  editTitle,
  onSelect,
  onStartRename,
  onSaveRename,
  onCancelRename,
  setEditTitle,
  onTogglePin,
  onDuplicate,
  onDelete,
  onExportMd,
  onExportJson,
}) => {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
        {icon}
        <span>{title}</span>
      </div>

      <div className="space-y-0.5">
        {items.map((c) => {
          const isActive = activeId === c.id;
          const isEditing = editingId === c.id;

          if (isEditing) {
            return (
              <div key={c.id} className="p-1">
                <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-1 border border-cyan-500">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onSaveRename(c.id);
                      if (e.key === 'Escape') onCancelRename();
                    }}
                    autoFocus
                    className="flex-1 bg-transparent px-2 py-1 text-xs text-white focus:outline-none"
                  />
                  <button
                    onClick={() => onSaveRename(c.id)}
                    className="p-1 text-emerald-400 hover:bg-slate-800 rounded"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={onCancelRename}
                    className="p-1 text-slate-400 hover:bg-slate-800 rounded"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={`group flex items-center justify-between rounded-xl px-3 py-2 text-xs transition cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white font-medium shadow-sm border border-slate-800'
                  : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <MessageSquare className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-600'}`} />
                <span className="truncate">{c.title || 'Untitled Conversation'}</span>
              </div>

              {/* Hover actions */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePin(c.id);
                  }}
                  className="p-1 rounded text-slate-500 hover:text-amber-400 transition"
                  title={c.pinned ? 'Unpin' : 'Pin conversation'}
                >
                  <Pin className={`h-3 w-3 ${c.pinned ? 'text-amber-400 fill-current' : ''}`} />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartRename(c);
                  }}
                  className="p-1 rounded text-slate-500 hover:text-slate-200 transition"
                  title="Rename"
                >
                  <Edit2 className="h-3 w-3" />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate(c.id);
                  }}
                  className="p-1 rounded text-slate-500 hover:text-slate-200 transition"
                  title="Duplicate conversation"
                >
                  <Copy className="h-3 w-3" />
                </button>

                <button
                  type="button"
                  onClick={(e) => onExportMd(c, e)}
                  className="p-1 rounded text-slate-500 hover:text-cyan-400 transition"
                  title="Export Markdown (.md)"
                >
                  <Download className="h-3 w-3" />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(c.id);
                  }}
                  className="p-1 rounded text-slate-500 hover:text-rose-400 transition"
                  title="Delete"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
