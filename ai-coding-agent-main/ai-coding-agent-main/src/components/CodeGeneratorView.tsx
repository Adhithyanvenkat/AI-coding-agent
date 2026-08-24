import React, { useState } from 'react';
import { api } from '../lib/api';
import { PROGRAMMING_LANGUAGES, CodeGeneratorOutput } from '../types';
import { 
  Code2, 
  Sparkles, 
  Loader2, 
  Copy, 
  Check, 
  Download, 
  Bookmark, 
  BookmarkCheck,
  FileCode, 
  FlaskConical, 
  Info,
  ChevronRight,
  HelpCircle
} from 'lucide-react';
import { motion } from 'motion/react';

interface CodeGeneratorViewProps {
  onAddFavoriteCount: (delta: number) => void;
  onRefreshHistory: () => void;
  showNotification: (message: string, type: 'success' | 'error') => void;
}

export default function CodeGeneratorView({ onAddFavoriteCount, onRefreshHistory, showNotification }: CodeGeneratorViewProps) {
  const [prompt, setPrompt] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<CodeGeneratorOutput | null>(null);
  
  // Extra Unit Tests Feature State
  const [testsLoading, setTestsLoading] = useState(false);
  const [unitTests, setUnitTests] = useState<string | null>(null);
  
  const [copied, setCopied] = useState(false);
  const [copiedTests, setCopiedTests] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [activeTab, setActiveTab] = useState<'code' | 'explanation' | 'tests'>('code');
  const [historyItemId, setHistoryItemId] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setUnitTests(null);
    setOutput(null);
    setIsFavorited(false);
    setActiveTab('code');

    try {
      const res = await api.generateCode(prompt.trim(), selectedLanguage);
      setOutput(res.output);
      setHistoryItemId(res.historyItem.id);
      onRefreshHistory();
      showNotification('Code snippet generated successfully!', 'success');
    } catch (err: any) {
      showNotification(err.message || 'Error generating code', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTests = async () => {
    if (!output) return;
    setTestsLoading(true);
    setActiveTab('tests');

    try {
      // We call our code generator on the server but with a spec for Unit Tests
      const testPrompt = `Write full unit test cases (using popular frameworks like Jest, PyTest, or Mocha) for the following code:\n\n${output.code}`;
      const res = await api.generateCode(testPrompt, selectedLanguage);
      setUnitTests(res.output.code);
      showNotification('Unit tests generated successfully!', 'success');
    } catch (err: any) {
      showNotification(err.message || 'Error generating unit tests', 'error');
    } finally {
      setTestsLoading(false);
    }
  };

  const handleCopy = (text: string, isTest: boolean = false) => {
    navigator.clipboard.writeText(text);
    if (isTest) {
      setCopiedTests(true);
      setTimeout(() => setCopiedTests(false), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!output) return;
    const langObj = PROGRAMMING_LANGUAGES.find(l => l.value === selectedLanguage);
    const ext = langObj ? langObj.extension : 'txt';
    const blob = new Blob([output.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `generated_code_${Date.now()}.${ext}`;
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
          <Code2 className="w-5.5 h-5.5 text-indigo-400" />
          AI Code Generator
        </h1>
        <p className="text-[#A1A1AA] text-xs mt-1">
          Input your functional requirement and generate production-ready code with complete inline annotations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Input Side */}
        <div className="lg:col-span-4 bg-[#0D0D0D] border border-white/5 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" /> Prompt Specifications
          </h2>

          <form onSubmit={handleGenerate} className="space-y-4">
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
                Requirements
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., A debounced search function that caches API results and aborts stale requests..."
                rows={5}
                className="w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-xl text-white text-xs placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none leading-relaxed"
                required
              />
            </div>

            <button
              id="generate-code-btn"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-50 text-white text-xs font-medium rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-500/10"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Snippet...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Code
                </>
              )}
            </button>
          </form>

          {/* Quick suggestions */}
          <div className="pt-3 border-t border-white/5">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Suggested prompts:</span>
            <div className="space-y-1.5 mt-2">
              {[
                'LRU Cache implementation',
                'Debounced async input hook',
                'Binary search tree with balancing'
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

        {/* Right Output Side */}
        <div className="lg:col-span-8 space-y-4">
          {!output && !loading && (
            <div className="border border-dashed border-white/5 rounded-2xl p-12 text-center text-zinc-500 flex flex-col items-center justify-center min-h-[350px]">
              <FileCode className="w-12 h-12 text-zinc-800 mb-4" />
              <p className="text-sm font-medium text-[#A1A1AA]">Ready to Generate</p>
              <p className="text-xs text-zinc-650 mt-1 max-w-sm">
                Set target parameters on the left panel, click generate, and view clean syntax-styled output here.
              </p>
            </div>
          )}

          {loading && (
            <div className="border border-white/5 bg-[#0D0D0D]/40 rounded-2xl p-12 text-center text-zinc-500 flex flex-col items-center justify-center min-h-[350px]">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-4" />
              <p className="text-sm font-medium text-zinc-300">Synthesizing Code Model</p>
              <p className="text-xs text-zinc-500 mt-1">
                Gemini is assembling imports, structuring parameters, and writing step-by-step logic...
              </p>
            </div>
          )}

          {output && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#0D0D0D] border border-white/5 rounded-2xl overflow-hidden flex flex-col"
            >
              {/* Header actions */}
              <div className="px-5 py-3.5 bg-[#050505] border-b border-white/5 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/70"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70"></span>
                  <span className="text-[#A1A1AA] text-xs font-mono ml-2 font-medium">{activeLangLabel} Snippet</span>
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
                    onClick={() => handleCopy(output.code)}
                    className="p-1.5 rounded-lg border border-white/10 hover:border-white/20 text-[#A1A1AA] hover:text-white text-xs flex items-center justify-center transition-colors cursor-pointer"
                    title="Copy code"
                  >
                    {copied ? <Check className="w-4 h-4 text-indigo-400" /> : <Copy className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={handleDownload}
                    className="p-1.5 rounded-lg border border-white/10 hover:border-white/20 text-[#A1A1AA] hover:text-white text-xs flex items-center justify-center transition-colors cursor-pointer"
                    title="Download code file"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  {/* Unit tests action */}
                  <button
                    onClick={handleGenerateTests}
                    className="px-2.5 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 text-xs font-medium rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <FlaskConical className="w-3.5 h-3.5" />
                    Unit Tests
                  </button>
                </div>
              </div>

              {/* View Selector Tabs */}
              <div className="flex border-b border-white/5 bg-black/10 px-4">
                <button
                  onClick={() => setActiveTab('code')}
                  className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                    activeTab === 'code' ? 'border-indigo-500 text-white' : 'border-transparent text-[#A1A1AA] hover:text-slate-200'
                  }`}
                >
                  Source Code
                </button>
                <button
                  onClick={() => setActiveTab('explanation')}
                  className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                    activeTab === 'explanation' ? 'border-indigo-500 text-white' : 'border-transparent text-[#A1A1AA] hover:text-slate-200'
                  }`}
                >
                  AI Explanation
                </button>
                {unitTests && (
                  <button
                    onClick={() => setActiveTab('tests')}
                    className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                      activeTab === 'tests' ? 'border-indigo-500 text-white' : 'border-transparent text-[#A1A1AA] hover:text-slate-200'
                    }`}
                  >
                    Unit Tests
                  </button>
                )}
              </div>

              {/* Tab Display Area */}
              <div className="p-5 overflow-auto max-h-[500px]">
                {activeTab === 'code' && (
                  <pre className="font-mono text-xs text-[#EDEDED] leading-relaxed bg-[#050505] p-4 rounded-xl border border-white/5 whitespace-pre overflow-x-auto">
                    <code>{output.code}</code>
                  </pre>
                )}

                {activeTab === 'explanation' && (
                  <div className="text-zinc-300 text-xs space-y-3 leading-relaxed font-sans">
                    <div className="p-3 bg-[#050505] border border-white/5 rounded-lg flex gap-2 text-zinc-400 mb-2">
                      <Info className="w-4.5 h-4.5 text-indigo-400 shrink-0 mt-0.5" />
                      <span>The following analysis details execution logic, time efficiency, and API usage considerations.</span>
                    </div>
                    <div className="whitespace-pre-line">{output.explanation}</div>
                  </div>
                )}

                {activeTab === 'tests' && (
                  <div className="space-y-4">
                    {testsLoading ? (
                      <div className="py-12 text-center text-zinc-500 flex flex-col items-center">
                        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin mb-3" />
                        <span className="text-xs">Generating Unit Tests under Jest/PyTest guidelines...</span>
                      </div>
                    ) : (
                      unitTests && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-mono">Test Scaffolding for {activeLangLabel}</span>
                            <button
                              onClick={() => handleCopy(unitTests, true)}
                              className="px-2 py-1 border border-white/10 hover:border-white/20 rounded text-[10px] text-slate-300 flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              {copiedTests ? <Check className="w-3 h-3 text-indigo-400" /> : <Copy className="w-3 h-3" />}
                              {copiedTests ? 'Copied' : 'Copy Tests'}
                            </button>
                          </div>
                          <pre className="font-mono text-xs text-[#EDEDED] leading-relaxed bg-[#050505] p-4 rounded-xl border border-white/5 whitespace-pre overflow-x-auto">
                            <code>{unitTests}</code>
                          </pre>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
