import React, { useState } from 'react';
import { api } from '../lib/api';
import { PROGRAMMING_LANGUAGES, CodeAnalyzerOutput } from '../types';
import { 
  Activity, 
  Sparkles, 
  Loader2, 
  FileText, 
  Clock, 
  Database, 
  ListChecks, 
  TrendingUp,
  Bookmark,
  BookmarkCheck,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';

interface CodeAnalyzerViewProps {
  onAddFavoriteCount: (delta: number) => void;
  onRefreshHistory: () => void;
  showNotification: (message: string, type: 'success' | 'error') => void;
}

export default function CodeAnalyzerView({ onAddFavoriteCount, onRefreshHistory, showNotification }: CodeAnalyzerViewProps) {
  const [code, setCode] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<CodeAnalyzerOutput | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [historyItemId, setHistoryItemId] = useState<string | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setOutput(null);
    setIsFavorited(false);

    try {
      const res = await api.analyzeCode(code.trim(), selectedLanguage);
      setOutput(res.output);
      setHistoryItemId(res.historyItem.id);
      onRefreshHistory();
      showNotification('Static analysis completed successfully!', 'success');
    } catch (err: any) {
      showNotification(err.message || 'Analysis failed', 'error');
    } finally {
      setLoading(false);
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

  // Helper to color-code metric progress fills
  const getMetricColor = (val: number) => {
    if (val >= 85) return 'bg-gradient-to-r from-emerald-500 to-teal-400';
    if (val >= 60) return 'bg-gradient-to-r from-amber-500 to-yellow-400';
    return 'bg-gradient-to-r from-rose-500 to-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2 font-sans">
          <Activity className="w-5.5 h-5.5 text-indigo-400" />
          AI Complexity Analyzer
        </h1>
        <p className="text-[#A1A1AA] text-xs mt-1">
          Perform a static analysis on your code blocks to calculate Big O time/space characteristics, compute general code quality scores, and inspect visual rating boards.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Input Side */}
        <div className="lg:col-span-5 bg-[#0D0D0D] border border-white/5 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" /> Input Snippet
          </h2>

          <form onSubmit={handleAnalyze} className="space-y-4">
            <div>
              <label className="block text-slate-300 text-xs font-medium mb-1.5">
                Target Language
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
                Paste Source Code
              </label>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={`e.g., function fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}`}
                rows={10}
                className="w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-xl text-white text-xs placeholder-zinc-650 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono resize-none leading-relaxed"
                required
              />
            </div>

            <button
              id="analyze-code-btn"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-50 text-white text-xs font-medium rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-500/10"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Calculating metrics...
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4" />
                  Run Static Analysis
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Complexity Outputs */}
        <div className="lg:col-span-7 space-y-4">
          {!output && !loading && (
            <div className="border border-dashed border-white/5 rounded-2xl p-12 text-center text-zinc-500 flex flex-col items-center justify-center min-h-[420px]">
              <TrendingUp className="w-12 h-12 text-zinc-850 mb-4" />
              <p className="text-sm font-medium text-[#A1A1AA]">Complexity Analyzer Idle</p>
              <p className="text-xs text-zinc-650 mt-1 max-w-sm">
                Enter your code snippet on the left panel, and click "Run Static Analysis" to parse structural characteristics.
              </p>
            </div>
          )}

          {loading && (
            <div className="border border-white/5 bg-[#0D0D0D]/40 rounded-2xl p-12 text-center text-zinc-500 flex flex-col items-center justify-center min-h-[420px]">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-4" />
              <p className="text-sm font-medium text-slate-300">Calculating Algorithmic Complexity</p>
              <p className="text-xs text-zinc-500 mt-1">
                Gemini is compiling loops, checking recursion depths, computing variable space bounds, and analyzing coding patterns...
              </p>
            </div>
          )}

          {output && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              {/* Complexity Badges row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#0D0D0D] border border-white/5 p-4 rounded-2xl flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase font-mono">Time Complexity</span>
                    <span className="text-sm font-bold text-white font-mono mt-0.5 block">{output.timeComplexity}</span>
                  </div>
                </div>

                <div className="bg-[#0D0D0D] border border-white/5 p-4 rounded-2xl flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase font-mono">Space Complexity</span>
                    <span className="text-sm font-bold text-white font-mono mt-0.5 block">{output.spaceComplexity}</span>
                  </div>
                </div>

                <div className="bg-[#0D0D0D] border border-white/5 p-4 rounded-2xl flex items-center gap-3 relative">
                  <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase font-mono">Code Quality</span>
                    <span className="text-sm font-bold text-white mt-0.5 block truncate">{output.codeQuality}</span>
                  </div>

                  <button
                    onClick={handleToggleFavorite}
                    className={`absolute top-3 right-3 p-1 rounded border text-xs flex items-center justify-center transition-colors cursor-pointer ${
                      isFavorited 
                        ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' 
                        : 'border-white/10 hover:border-white/20 text-[#A1A1AA] hover:text-white'
                    }`}
                    title="Toggle Favorite"
                  >
                    {isFavorited ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Graphical Visual Complexity Metrics Board */}
              <div className="bg-[#0D0D0D] border border-white/5 rounded-2xl p-5 space-y-4">
                <span className="text-xs font-bold text-slate-200 block border-b border-white/5 pb-2">
                  Structural Performance Indicators
                </span>

                <div className="space-y-3.5">
                  {output.complexityMetrics.map((met, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-[#A1A1AA]">{met.metric}</span>
                        <span className="text-white font-mono">{met.value}%</span>
                      </div>
                      <div className="h-2 w-full bg-[#050505] rounded-full overflow-hidden border border-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${met.value}%` }}
                          transition={{ duration: 0.6, delay: idx * 0.05 }}
                          className={`h-full rounded-full ${getMetricColor(met.value)}`}
                        ></motion.div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actionable Suggestions */}
              <div className="bg-[#0D0D0D] border border-white/5 rounded-2xl p-5 space-y-3">
                <span className="text-xs font-bold text-slate-200 block flex items-center gap-2 border-b border-white/5 pb-2">
                  <ListChecks className="w-4 h-4 text-indigo-400" /> Improvement Action Items
                </span>
                <div className="space-y-2 mt-2">
                  {output.suggestions.map((sug, i) => (
                    <div key={i} className="flex gap-2.5 text-xs text-zinc-300 leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <span>{sug}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
