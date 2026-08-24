import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { HistoryItem, PROGRAMMING_LANGUAGES } from '../types';
import { 
  History, 
  Search, 
  Trash2, 
  Bookmark, 
  BookmarkCheck, 
  ChevronDown, 
  ChevronUp, 
  Code2, 
  Bug, 
  Activity, 
  FolderGit2, 
  MessageSquare,
  Copy,
  Download,
  Calendar,
  FileText,
  Clock,
  Database,
  TrendingUp,
  ExternalLink,
  Check,
  Loader2
} from 'lucide-react';
import { motion } from 'motion/react';
import JSZip from 'jszip';

interface HistoryViewProps {
  onAddFavoriteCount: (delta: number) => void;
  refreshTrigger: number;
  onRefreshHistory: () => void;
  showNotification: (message: string, type: 'success' | 'error') => void;
}

export default function HistoryView({ onAddFavoriteCount, refreshTrigger, onRefreshHistory, showNotification }: HistoryViewProps) {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [copiedItemText, setCopiedItemText] = useState<string | null>(null);

  // File explorer inside project expansion
  const [selectedProjFilePath, setSelectedProjFilePath] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const items = await api.getHistory(search.trim() || undefined, favoritesOnly);
      setHistoryItems(items);
    } catch (err: any) {
      showNotification('Failed to load activity logs: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [search, favoritesOnly, refreshTrigger]);

  const handleToggleFavorite = async (e: React.MouseEvent, item: HistoryItem) => {
    e.stopPropagation();
    try {
      const updated = await api.toggleFavorite(item.id);
      onAddFavoriteCount(updated.isFavorite ? 1 : -1);
      
      setHistoryItems(prev => prev.map(it => it.id === item.id ? { ...it, isFavorite: updated.isFavorite } : it));
      onRefreshHistory();
      showNotification(updated.isFavorite ? 'Added to favorites!' : 'Removed from favorites!', 'success');
    } catch (err: any) {
      showNotification('Failed to toggle favorite status: ' + err.message, 'error');
    }
  };

  const handleDeleteItem = async (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    if (!window.confirm('Delete this history item?')) return;
    try {
      const res = await api.deleteHistoryItem(itemId);
      if (res.success) {
        const deletedItem = historyItems.find(it => it.id === itemId);
        if (deletedItem?.isFavorite) {
          onAddFavoriteCount(-1);
        }
        setHistoryItems(prev => prev.filter(it => it.id !== itemId));
        if (expandedItemId === itemId) setExpandedItemId(null);
        onRefreshHistory();
        showNotification('History item deleted successfully!', 'success');
      }
    } catch (err: any) {
      showNotification('Failed to delete item: ' + err.message, 'error');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you absolutely sure you want to delete ALL activity logs? This cannot be undone.')) return;
    try {
      const res = await api.clearHistory();
      if (res.success) {
        setHistoryItems([]);
        setExpandedItemId(null);
        onAddFavoriteCount(0); // This resets counts in parent
        onRefreshHistory();
        showNotification('All activity logs cleared successfully!', 'success');
      }
    } catch (err: any) {
      showNotification('Failed to clear activity logs: ' + err.message, 'error');
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItemText(id);
    setTimeout(() => setCopiedItemText(null), 2000);
  };

  const handleDownloadFile = (codeText: string, type: string) => {
    const ext = type === 'generator' ? 'js' : 'txt';
    const blob = new Blob([codeText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `saved_code_${Date.now()}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadZip = async (output: any) => {
    try {
      const zip = new JSZip();
      output.files.forEach((file: any) => {
        zip.file(file.path, file.content);
      });
      zip.file('README.md', output.readme);
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${output.title || 'scaffolded-project'}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showNotification('ZIP project downloaded successfully!', 'success');
    } catch (err: any) {
      showNotification('Failed to pack ZIP: ' + err.message, 'error');
    }
  };

  const getIcon = (type: HistoryItem['type']) => {
    switch (type) {
      case 'generator': return <Code2 className="w-4 h-4 text-indigo-400" />;
      case 'debugger': return <Bug className="w-4 h-4 text-indigo-400" />;
      case 'analyzer': return <Activity className="w-4 h-4 text-indigo-400" />;
      case 'project': return <FolderGit2 className="w-4 h-4 text-indigo-400" />;
      case 'chat': return <MessageSquare className="w-4 h-4 text-indigo-400" />;
    }
  };

  const getTypeLabel = (type: HistoryItem['type']) => {
    switch (type) {
      case 'generator': return 'Generator';
      case 'debugger': return 'Debugger';
      case 'analyzer': return 'Analyzer';
      case 'project': return 'Scaffolder';
      case 'chat': return 'Chat';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2 font-sans">
            <History className="w-5.5 h-5.5 text-indigo-400" />
            Activity Logs & History
          </h1>
          <p className="text-[#A1A1AA] text-xs mt-1">
            Search, review, and recover previous codebase architectures, patched loops, and conversations.
          </p>
        </div>

        {historyItems.length > 0 && (
          <button
            onClick={handleClearAll}
            className="self-start sm:self-auto px-3.5 py-1.5 border border-white/10 hover:border-red-500/30 text-[#A1A1AA] hover:text-red-400 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear All History
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#0D0D0D] border border-white/5 rounded-xl p-4">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500 pointer-events-none">
            <Search className="w-4.5 h-4.5" />
          </span>
          <input
            type="text"
            placeholder="Search saved logs by query, title, or requirement..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setExpandedItemId(null);
            }}
            className="w-full pl-9 pr-4 py-2 bg-[#050505] border border-white/10 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Favorite filter button */}
        <button
          onClick={() => {
            setFavoritesOnly(!favoritesOnly);
            setExpandedItemId(null);
          }}
          className={`px-3 py-2 border rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer w-full sm:w-auto justify-center ${
            favoritesOnly 
              ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' 
              : 'border-white/10 text-[#A1A1AA] hover:text-white'
          }`}
        >
          {favoritesOnly ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          {favoritesOnly ? 'Showing Favorites' : 'Show Favorites Only'}
        </button>
      </div>

      {/* History Items List */}
      <div className="space-y-3">
        {loading && historyItems.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 flex flex-col items-center">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin mb-3" />
            <span className="text-xs">Fetching logs...</span>
          </div>
        ) : historyItems.length === 0 ? (
          <div className="border border-dashed border-white/5 rounded-2xl p-12 text-center text-zinc-500 flex flex-col items-center justify-center min-h-[250px]">
            <History className="w-10 h-10 text-zinc-800 mb-3" />
            <p className="text-xs font-medium text-[#A1A1AA]">No activity logs found</p>
            <p className="text-[11px] text-zinc-650 mt-1">
              {search || favoritesOnly ? 'Try clearing searches or toggling the favorites button.' : 'Generate or analyze code blocks, and find your histories listed here.'}
            </p>
          </div>
        ) : (
          historyItems.map((item) => {
            const isExpanded = expandedItemId === item.id;
            return (
              <div
                key={item.id}
                className={`border rounded-2xl overflow-hidden transition-all bg-[#0D0D0D] ${
                  isExpanded ? 'border-white/15 shadow-xl' : 'border-white/5 hover:border-white/10 shadow shadow-black/45'
                }`}
              >
                {/* Collapsed Header Bar */}
                <div
                  onClick={() => {
                    setExpandedItemId(isExpanded ? null : item.id);
                    // Reset internal file tree selection on expand
                    if (item.type === 'project' && item.output?.files?.length > 0) {
                      setSelectedProjFilePath(item.output.files[0].path);
                    }
                  }}
                  className="px-5 py-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-black/10"
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    {/* Badge type icon */}
                    <div className="p-2 bg-[#050505]/40 border border-white/5 rounded-xl shrink-0">
                      {getIcon(item.type)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wide">{getTypeLabel(item.type)}</span>
                        <span className="text-[10px] text-zinc-600">•</span>
                        <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(item.timestamp).toLocaleDateString()} at {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-white mt-1 truncate max-w-sm md:max-w-xl">
                        {item.title}
                      </h3>
                    </div>
                  </div>

                  {/* Actions right */}
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={(e) => handleToggleFavorite(e, item)}
                      className={`p-1.5 rounded-lg border text-xs cursor-pointer ${
                        item.isFavorite 
                          ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' 
                          : 'border-white/10 hover:border-white/20 text-[#A1A1AA] hover:text-white'
                      }`}
                    >
                      {item.isFavorite ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={(e) => handleDeleteItem(e, item.id)}
                      className="p-1.5 rounded-lg border border-white/10 hover:border-red-500/20 text-[#A1A1AA] hover:text-red-400 text-xs cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="text-slate-400">
                      {isExpanded ? <ChevronUp className="w-4.5 h-4.5" /> : <ChevronDown className="w-4.5 h-4.5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details Body */}
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="border-t border-white/5 p-5 bg-black/10 space-y-4 font-sans"
                  >
                    {/* Render specific inputs based on item.type */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono font-bold">Requirement/Input:</span>
                      <div className="p-3 bg-[#050505] rounded-xl border border-white/5 text-xs text-zinc-400 max-h-32 overflow-y-auto whitespace-pre-wrap font-mono">
                        {item.input}
                      </div>
                    </div>

                    {/* Render specific output views */}
                    <div className="space-y-2">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono font-bold">Generated Solution:</span>

                      {/* --- Type: Code Generator --- */}
                      {item.type === 'generator' && item.output && (
                        <div className="space-y-3">
                          <div className="flex justify-end gap-2 shrink-0">
                            <button
                              onClick={() => handleCopyText(item.output.code, item.id)}
                              className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-zinc-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              {copiedItemText === item.id ? <Check className="w-3 h-3 text-indigo-400" /> : <Copy className="w-3 h-3" />}
                              Copy Code
                            </button>
                            <button
                              onClick={() => handleDownloadFile(item.output.code, 'generator')}
                              className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-zinc-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Download className="w-3 h-3" />
                              Download
                            </button>
                          </div>
                          <pre className="font-mono text-xs text-[#EDEDED] leading-relaxed bg-[#050505] p-4 rounded-xl border border-white/5 overflow-x-auto whitespace-pre">
                            <code>{item.output.code}</code>
                          </pre>
                          <div className="whitespace-pre-line text-xs text-zinc-350 mt-2 bg-[#050505]/40 p-4 border border-white/5 rounded-xl">
                            {item.output.explanation}
                          </div>
                        </div>
                      )}

                      {/* --- Type: Debugger --- */}
                      {item.type === 'debugger' && item.output && (
                        <div className="space-y-4">
                          <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl text-xs text-slate-300 whitespace-pre-line">
                            <span className="font-bold text-red-400 block mb-1">🐞 Bugs Identified:</span>
                            {item.output.bugExplanation}
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-mono text-indigo-400 uppercase">Fixed Output Code</span>
                              <button
                                onClick={() => handleCopyText(item.output.fixedCode, item.id)}
                                className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-zinc-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                {copiedItemText === item.id ? <Check className="w-3 h-3 text-indigo-400" /> : <Copy className="w-3 h-3" />}
                                Copy Fixed Code
                              </button>
                            </div>
                            <pre className="font-mono text-xs text-[#EDEDED] leading-relaxed bg-[#050505] p-4 rounded-xl border border-white/5 overflow-x-auto whitespace-pre">
                              <code>{item.output.fixedCode}</code>
                            </pre>
                          </div>

                          <div className="p-4 bg-[#050505]/60 border border-white/5 rounded-xl text-xs text-zinc-300">
                            <span className="font-bold text-indigo-400 block mb-1">💡 Suggested Improvements:</span>
                            {item.output.improvements}
                          </div>
                        </div>
                      )}

                      {/* --- Type: Analyzer --- */}
                      {item.type === 'analyzer' && item.output && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-[#050505] border border-white/5 rounded-xl flex items-center gap-2.5">
                              <Clock className="w-4 h-4 text-indigo-400" />
                              <div>
                                <span className="text-[9px] text-zinc-500 block uppercase font-mono">Time Complexity</span>
                                <span className="text-xs font-mono font-bold text-white mt-0.5 block">{item.output.timeComplexity}</span>
                              </div>
                            </div>

                            <div className="p-3 bg-[#050505] border border-white/5 rounded-xl flex items-center gap-2.5">
                              <Database className="w-4 h-4 text-indigo-400" />
                              <div>
                                <span className="text-[9px] text-zinc-500 block uppercase font-mono">Space Complexity</span>
                                <span className="text-xs font-mono font-bold text-white mt-0.5 block">{item.output.spaceComplexity}</span>
                              </div>
                            </div>
                          </div>

                          {/* Metric progression fills */}
                          <div className="p-4 bg-[#0D0D0D] border border-white/5 rounded-xl space-y-3">
                            <span className="text-[10px] text-slate-450 font-bold block uppercase">Visual Complexity Breakdown</span>
                            <div className="space-y-3">
                              {item.output.complexityMetrics?.map((met: any, idx: number) => (
                                <div key={idx} className="space-y-1">
                                  <div className="flex justify-between text-[11px] font-medium text-[#A1A1AA]">
                                    <span>{met.metric}</span>
                                    <span>{met.value}%</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-[#050505] rounded-full overflow-hidden border border-white/5">
                                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${met.value}%` }}></div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Suggestions list */}
                          <div className="space-y-2">
                            <span className="text-[10px] text-zinc-500 uppercase font-mono font-bold block">Improvement Action Checklist</span>
                            <div className="space-y-1.5">
                              {item.output.suggestions?.map((sug: string, i: number) => (
                                <div key={i} className="text-xs text-zinc-300 flex items-start gap-1.5 bg-[#050505]/30 p-2 border border-white/5 rounded-lg">
                                  <span>✅</span>
                                  <span>{sug}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* --- Type: Project Scaffolder --- */}
                      {item.type === 'project' && item.output && (
                        <div className="bg-[#0D0D0D] border border-white/5 rounded-xl overflow-hidden">
                          <div className="px-4 py-2.5 bg-[#050505] border-b border-white/5 flex items-center justify-between">
                            <span className="text-xs font-bold text-white font-mono">📂 Scaffolder: {item.output.title}</span>
                            <button
                              onClick={() => handleDownloadZip(item.output)}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-505 text-white font-semibold rounded text-[10px] flex items-center gap-1.5 cursor-pointer transition-colors"
                            >
                              <Download className="w-3 h-3" />
                              ZIP Scaffolding
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[220px]">
                            {/* Inner tree list */}
                            <div className="md:col-span-4 bg-black/15 border-r border-white/5 p-2 space-y-1 max-h-56 overflow-y-auto">
                              {item.output.files?.map((file: any) => (
                                <button
                                  key={file.path}
                                  onClick={() => setSelectedProjFilePath(file.path)}
                                  className={`w-full text-left px-2 py-1 rounded text-[11px] flex items-center gap-1.5 truncate cursor-pointer ${
                                    selectedProjFilePath === file.path ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/15 font-semibold' : 'text-zinc-400 hover:text-white'
                                  }`}
                                >
                                  <FileText className="w-3 h-3 text-zinc-500 shrink-0" />
                                  <span className="truncate font-mono">{file.path}</span>
                                </button>
                              ))}
                            </div>

                            {/* Inner file view */}
                            <div className="md:col-span-8 p-3 bg-black/10 max-h-56 overflow-auto">
                              <pre className="font-mono text-[11px] text-zinc-350 whitespace-pre overflow-x-auto leading-relaxed">
                                <code>{item.output.files?.find((f: any) => f.path === selectedProjFilePath)?.content || '// Select a file on the left'}</code>
                              </pre>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* --- Type: Chatbot Message --- */}
                      {item.type === 'chat' && item.output && (
                        <div className="space-y-2">
                          <div className="p-4 bg-[#0D0D0D] border border-white/5 rounded-xl text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                            {item.output.reply}
                          </div>
                        </div>
                      )}

                    </div>
                  </motion.div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
