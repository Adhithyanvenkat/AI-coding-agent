import React, { useState } from 'react';
import { api } from '../lib/api';
import { PROGRAMMING_LANGUAGES, CodeDebuggerOutput } from '../types';
import { 
  Bug, 
  Sparkles, 
  Loader2, 
  AlertTriangle, 
  Check, 
  Copy, 
  Wrench, 
  FileCheck,
  Bookmark,
  BookmarkCheck,
  Download
} from 'lucide-react';
import { motion } from 'motion/react';

interface CodeDebuggerViewProps {
  onAddFavoriteCount: (delta: number) => void;
  onRefreshHistory: () => void;
  showNotification: (message: string, type: 'success' | 'error') => void;
}

export default function CodeDebuggerView({ onAddFavoriteCount, onRefreshHistory, showNotification }: CodeDebuggerViewProps) {
  const [code, setCode] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<CodeDebuggerOutput | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [copied, setCopied] = useState(false);
  const [historyItemId, setHistoryItemId] = useState<string | null>(null);

  const handleDebug = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setOutput(null);
    setIsFavorited(false);

    try {
      const res = await api.debugCode(code.trim(), selectedLanguage);
      setOutput(res.output);
      setHistoryItemId(res.historyItem.id);
      onRefreshHistory();
      showNotification('Code debugged successfully!', 'success');
    } catch (err: any) {
      showNotification(err.message || 'Debugging failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output.fixedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!output) return;
    const langObj = PROGRAMMING_LANGUAGES.find(l => l.value === selectedLanguage);
    const ext = langObj ? langObj.extension : 'txt';
    const blob = new Blob([output.fixedCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `debugged_code_${Date.now()}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

  const activeLangLabel = PROGRAMMING_LANGUAGES.find(l => l.value === selectedLanguage)?.label || 'Code';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2 font-sans">
          <Bug className="w-5.5 h-5.5 text-indigo-400" />
          AI Code Debugger
        </h1>
        <p className="text-[#A1A1AA] text-xs mt-1">
          Paste your broken scripts, choose the language, and get instant explanations of logical bugs, clean patches, and standard code improvements.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Input Panel */}
        <div className="lg:col-span-5 bg-[#0D0D0D] border border-white/5 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" /> Input Broken Code
          </h2>

          <form onSubmit={handleDebug} className="space-y-4">
            <div>
              <label className="block text-slate-300 text-xs font-medium mb-1.5">
                Code Language
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                {PROGRAMMING_LANGUAGES.map(lang => (
                  <option key={lang.value} value={lang.value}>{lang.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 text-xs font-medium mb-1.5">
                Paste Source Code Snippet
              </label>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={`e.g., function calculateSum(arr) {\n  let sum = 0;\n  for (let i = 0; i <= arr.length; i++) { // bug here\n    sum += arr[i];\n  }\n  return sum;\n}`}
                rows={10}
                className="w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-xl text-white text-xs placeholder-zinc-650 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono resize-none leading-relaxed"
                required
              />
            </div>

            <button
              id="debug-code-btn"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-50 text-white text-xs font-medium rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-500/10"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing bugs...
                </>
              ) : (
                <>
                  <Bug className="w-4 h-4" />
                  Analyze & Debug
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Output Panel */}
        <div className="lg:col-span-7 space-y-4">
          {!output && !loading && (
            <div className="border border-dashed border-white/5 rounded-2xl p-12 text-center text-zinc-500 flex flex-col items-center justify-center min-h-[420px]">
              <FileCheck className="w-12 h-12 text-zinc-800 mb-4" />
              <p className="text-sm font-medium text-[#A1A1AA]">Debugger Engine Idle</p>
              <p className="text-xs text-zinc-650 mt-1 max-w-sm">
                Paste your broken code on the left side, select the correct framework/language, and click "Analyze & Debug".
              </p>
            </div>
          )}

          {loading && (
            <div className="border border-white/5 bg-[#0D0D0D]/40 rounded-2xl p-12 text-center text-[#A1A1AA] flex flex-col items-center justify-center min-h-[420px]">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-4" />
              <p className="text-sm font-medium text-zinc-300">Isolating Runtime Glitches</p>
              <p className="text-xs text-zinc-500 mt-1">
                Gemini is tracing execution, testing array boundaries, assessing division-by-zero potentials, and patching logic...
              </p>
            </div>
          )}

          {output && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              {/* Bug Explanation Card */}
              <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-red-400 text-sm font-bold">
                  <AlertTriangle className="w-4.5 h-4.5" />
                  <span>Identified Logical Flaws & Bugs</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-line">
                  {output.bugExplanation}
                </p>
              </div>

              {/* Corrected Code Card */}
              <div className="bg-[#0D0D0D] border border-white/5 rounded-2xl overflow-hidden flex flex-col">
                <div className="px-5 py-3 bg-[#050505] border-b border-white/5 flex items-center justify-between">
                  <span className="text-indigo-400 text-xs font-mono font-semibold flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4" /> Fixed Solution ({activeLangLabel})
                  </span>
                  
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
                      onClick={handleCopy}
                      className="p-1.5 rounded-lg border border-white/10 hover:border-white/20 text-[#A1A1AA] hover:text-white text-xs flex items-center justify-center transition-colors cursor-pointer"
                      title="Copy fixed code"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={handleDownload}
                      className="p-1.5 rounded-lg border border-white/10 hover:border-white/20 text-[#A1A1AA] hover:text-white text-xs flex items-center justify-center transition-colors cursor-pointer"
                      title="Download file"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-4 overflow-auto max-h-[350px]">
                  <pre className="font-mono text-xs text-[#EDEDED] leading-relaxed bg-[#050505] p-4 rounded-xl border border-white/5 whitespace-pre overflow-x-auto">
                    <code>{output.fixedCode}</code>
                  </pre>
                </div>
              </div>

              {/* Recommendations Card */}
              <div className="bg-[#0D0D0D] border border-white/5 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-indigo-400 text-sm font-bold">
                  <Wrench className="w-4.5 h-4.5" />
                  <span>Performance & Style Improvements</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-line">
                  {output.improvements}
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
