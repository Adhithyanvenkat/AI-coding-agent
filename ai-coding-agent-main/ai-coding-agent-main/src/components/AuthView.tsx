import React, { useState } from 'react';
import { api } from '../lib/api';
import { Code, KeyRound, User, Loader2, Sparkles, Terminal } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthViewProps {
  onAuthSuccess: (user: { id: string; username: string }) => void;
  showNotification?: (message: string, type: 'success' | 'error') => void;
}

export default function AuthView({ onAuthSuccess }: AuthViewProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const res = await api.login(username.trim(), password);
        onAuthSuccess(res.user);
      } else {
        const res = await api.signup(username.trim(), password);
        onAuthSuccess(res.user);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Absolute Decorative Ambient Lights */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo and Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 p-0.5 shadow-lg shadow-indigo-500/10 mb-4">
            <div className="w-full h-full bg-[#0D0D0D] rounded-[14px] flex items-center justify-center">
              <Terminal className="w-8 h-8 text-indigo-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-sans">
            AI Code <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-550">Agent</span>
          </h1>
          <p className="text-[#A1A1AA] text-sm mt-2">
            The ultimate developer companion for code generation, debugging, & project scaffolding
          </p>
        </div>

        {/* Card Panel */}
        <div className="bg-[#0D0D0D]/90 border border-white/5 backdrop-blur-md rounded-2xl p-8 shadow-2xl relative">
          <div className="absolute top-0 right-0 p-4">
            <Sparkles className="w-5 h-5 text-indigo-400/20" />
          </div>

          <h2 className="text-xl font-semibold text-white mb-6">
            {isLogin ? 'Welcome back' : 'Create an account'}
          </h2>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1.5" htmlFor="username">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                  <User className="w-4.5 h-4.5" />
                </span>
                <input
                  id="username"
                  type="text"
                  placeholder="e.g. developer_42"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#050505]/60 border border-white/10 rounded-xl text-white placeholder-zinc-650 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1.5" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                  <KeyRound className="w-4.5 h-4.5" />
                </span>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#050505]/60 border border-white/10 rounded-xl text-white placeholder-zinc-650 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition-colors"
                  required
                />
              </div>
            </div>

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-50 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                isLogin ? 'Sign In' : 'Sign Up'
              )}
            </button>
          </form>

          {/* Toggle mode */}
          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <button
              id="auth-toggle-mode-btn"
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-[#A1A1AA] hover:text-indigo-400 text-sm transition-colors cursor-pointer"
            >
              {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
            </button>
          </div>
        </div>
        
        {/* Footnote */}
        <div className="text-center mt-6">
          <p className="text-xs text-zinc-650">
            Secure offline-first persistence enabled.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
