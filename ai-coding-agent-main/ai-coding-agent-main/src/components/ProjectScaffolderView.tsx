import React, { useState } from 'react';
import { api } from '../lib/api';
import { FRAMEWORKS, ProjectScaffolderOutput } from '../types';
import { 
  FolderGit2, 
  Sparkles, 
  Loader2, 
  Folder, 
  FileText, 
  Download, 
  Terminal,
  Bookmark,
  BookmarkCheck,
  Eye,
  Check,
  BookOpen
} from 'lucide-react';
import { motion } from 'motion/react';
import JSZip from 'jszip';

interface ProjectScaffolderViewProps {
  onAddFavoriteCount: (delta: number) => void;
  onRefreshHistory: () => void;
  showNotification: (message: string, type: 'success' | 'error') => void;
}

export default function ProjectScaffolderView({ onAddFavoriteCount, onRefreshHistory, showNotification }: ProjectScaffolderViewProps) {
  const [prompt, setPrompt] = useState('');
  const [selectedFramework, setSelectedFramework] = useState('fullstack');
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<ProjectScaffolderOutput | null>(null);
  const [historyItemId, setHistoryItemId] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  
  // File Explorer State
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [showReadme, setShowReadme] = useState(true);
  const [zipDownloading, setZipDownloading] = useState(false);

  const handleScaffold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setOutput(null);
    setSelectedFilePath(null);
    setShowReadme(true);
    setIsFavorited(false);

    try {
      const res = await api.scaffoldProject(prompt.trim(), selectedFramework);
      setOutput(res.output);
      setHistoryItemId(res.historyItem.id);
      
      // Auto-select first file if available
      if (res.output.files && res.output.files.length > 0) {
        setSelectedFilePath(res.output.files[0].path);
      }
      onRefreshHistory();
      showNotification('Project scaffolded successfully!', 'success');
    } catch (err: any) {
      showNotification(err.message || 'Scaffolding failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadZip = async () => {
    if (!output) return;
    setZipDownloading(true);

    try {
      const zip = new JSZip();
      
      // Add files to zip
      output.files.forEach(file => {
        zip.file(file.path, file.content);
      });

      // Add readme
      zip.file('README.md', output.readme);

      // Generate blob
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
      showNotification('Zip packing failed: ' + err.message, 'error');
    } finally {
      setZipDownloading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!historyItemId) return;
    try {
      const res = await api.toggleFavorite(historyItemId);
      setIsFavorited(res.isFavorite);
      onAddFavoriteCount(res.isFavorite ? 1 : -1);
      onRefreshHistory();
    } catch (err: any) {
      console.error(err);
    }
  };

  const currentFileContent = output?.files.find(f => f.path === selectedFilePath)?.content || '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2 font-sans">
          <FolderGit2 className="w-5.5 h-5.5 text-indigo-400" />
          AI Project Scaffolder
        </h1>
        <p className="text-[#A1A1AA] text-xs mt-1">
          Auto-generate full directory trees, package.json files, dependencies, and README.md scripts for boilerplate codebases.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Scaffolding Control Form */}
        <div className="lg:col-span-4 bg-[#0D0D0D] border border-white/5 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" /> Project Specifications
          </h2>

          <form onSubmit={handleScaffold} className="space-y-4">
            <div>
              <label className="block text-slate-300 text-xs font-medium mb-1.5">
                Target Framework Stack
              </label>
              <select
                value={selectedFramework}
                onChange={(e) => setSelectedFramework(e.target.value)}
                className="w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                {FRAMEWORKS.map(framework => (
                  <option key={framework.value} value={framework.value}>{framework.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 text-xs font-medium mb-1.5">
                App Idea & Requirements
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., A fitness tracker dashboard with localstorage sync, workout charts, and weight logging forms..."
                rows={5}
                className="w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-xl text-white text-xs placeholder-zinc-650 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none leading-relaxed"
                required
              />
            </div>

            <button
              id="scaffold-project-btn"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-50 text-white text-xs font-medium rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-500/10"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Scaffolding Project...
                </>
              ) : (
                <>
                  <FolderGit2 className="w-4 h-4" />
                  Generate Boilerplate
                </>
              )}
            </button>
          </form>

          {/* Quick Ideas */}
          <div className="pt-3 border-t border-white/5">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Boilerplate Ideas:</span>
            <div className="space-y-1.5 mt-2">
              {[
                'Fullstack Chat Room with Express and local memory',
                'React Task Kanban Board with custom categories',
                'Express API proxy with caching middleware'
              ].map((sug, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrompt(sug)}
                  className="w-full text-left text-[11px] text-[#A1A1AA] hover:text-indigo-400 truncate block py-1 hover:pl-1 transition-all"
                >
                  → {sug}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Project Display Panel */}
        <div className="lg:col-span-8 space-y-4">
          {!output && !loading && (
            <div className="border border-dashed border-white/5 rounded-2xl p-12 text-center text-zinc-500 flex flex-col items-center justify-center min-h-[420px]">
              <FolderGit2 className="w-12 h-12 text-zinc-800 mb-4" />
              <p className="text-sm font-medium text-[#A1A1AA]">Scaffolder Ready</p>
              <p className="text-xs text-zinc-650 mt-1 max-w-sm">
                State your application requirements, choose a target stack, and download a compiled code workspace instantly.
              </p>
            </div>
          )}

          {loading && (
            <div className="border border-white/5 bg-[#0D0D0D]/40 rounded-2xl p-12 text-center text-[#A1A1AA] flex flex-col items-center justify-center min-h-[420px]">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-4" />
              <p className="text-sm font-medium text-zinc-300">Assembling Framework Boilerplate</p>
              <p className="text-xs text-zinc-500 mt-1">
                Gemini is compiling file lists, routing entries, dependencies, and crafting auto-guides...
              </p>
            </div>
          )}

          {output && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#0D0D0D] border border-white/5 rounded-2xl overflow-hidden"
            >
              {/* Header and download actions */}
              <div className="px-5 py-3.5 bg-[#050505] border-b border-white/5 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-400" />
                  <span className="text-white text-xs font-semibold font-mono">{output.title}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleFavorite}
                    className={`p-1.5 rounded-lg border text-xs flex items-center justify-center transition-colors cursor-pointer ${
                      isFavorited 
                        ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' 
                        : 'border-white/10 hover:border-white/20 text-[#A1A1AA] hover:text-white'
                    }`}
                    title={isFavorited ? 'Remove Favorite' : 'Save Favorite'}
                  >
                    {isFavorited ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={handleDownloadZip}
                    disabled={zipDownloading}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-500/10 transition-colors"
                  >
                    {zipDownloading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    Download ZIP
                  </button>
                </div>
              </div>

              {/* Grid: 2 columns (File Tree Left / Content Right) */}
              <div className="grid grid-cols-1 md:grid-cols-12 min-h-[380px]">
                {/* Left File Tree Column */}
                <div className="md:col-span-4 border-r border-white/5 bg-black/10 p-3 space-y-2">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono font-bold block px-2 mb-2">Project Files</span>
                  
                  {/* Readme option */}
                  <button
                    onClick={() => {
                      setShowReadme(true);
                      setSelectedFilePath(null);
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                      showReadme ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' : 'text-[#A1A1AA] hover:text-slate-200'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">README.md</span>
                  </button>

                  <div className="space-y-1">
                    {output.files.map(file => (
                      <button
                        key={file.path}
                        onClick={() => {
                          setShowReadme(false);
                          setSelectedFilePath(file.path);
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                          !showReadme && selectedFilePath === file.path 
                            ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-semibold' 
                            : 'text-[#A1A1AA] hover:text-slate-200'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span className="truncate font-mono text-[11px]">{file.path}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right Source Code/Readme Column */}
                <div className="md:col-span-8 p-4 bg-[#0D0D0D] overflow-auto max-h-[500px]">
                  {showReadme ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-white/5 text-zinc-200 text-xs font-semibold">
                        <BookOpen className="w-4 h-4 text-indigo-400" />
                        <span>Project Documentation (README.md)</span>
                      </div>
                      <pre className="font-sans text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap bg-[#050505] p-4 rounded-xl border border-white/5">
                        <code>{output.readme}</code>
                      </pre>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-white/5">
                        <div className="text-zinc-200 text-[11px] font-mono truncate max-w-xs md:max-w-md">
                          📄 {selectedFilePath}
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(currentFileContent);
                            showNotification('File content copied to clipboard!', 'success');
                          }}
                          className="px-2 py-1 bg-white/5 hover:bg-white/10 text-[#A1A1AA] hover:text-white rounded text-[10px] font-semibold border border-white/10 cursor-pointer"
                        >
                          Copy File
                        </button>
                      </div>
                      <pre className="font-mono text-xs text-zinc-300 leading-relaxed bg-[#050505] p-4 rounded-xl border border-white/5 overflow-x-auto whitespace-pre">
                        <code>{currentFileContent}</code>
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
