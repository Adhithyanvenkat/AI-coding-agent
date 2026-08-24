import React, { useState, useEffect } from 'react';
import { api } from './lib/api';
import { TabType, User } from './types';
import AuthView from './components/AuthView';
import DashboardView from './components/DashboardView';
import CodeGeneratorView from './components/CodeGeneratorView';
import ProjectScaffolderView from './components/ProjectScaffolderView';
import CodeDebuggerView from './components/CodeDebuggerView';
import CodeAnalyzerView from './components/CodeAnalyzerView';
import ChatbotView from './components/ChatbotView';
import HistoryView from './components/HistoryView';
import { 
  Code2, 
  Terminal, 
  LogOut, 
  Compass, 
  Bug, 
  Activity, 
  MessageSquare, 
  FolderGit2, 
  History, 
  Menu, 
  X, 
  User as UserIcon, 
  Loader2,
  Cpu,
  Bookmark,
  ShieldAlert,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Stats Counters
  const [historyCount, setHistoryCount] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);

  // Mobile sidebar menu toggling
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Global Notification State
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
  };

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Check auth on startup
  useEffect(() => {
    const initAuth = async () => {
      const token = api.getToken();
      if (token) {
        try {
          const u = await api.getMe();
          setUser(u);
          await fetchStats(u.id);
        } catch (err) {
          console.error('Session expired, clearing token', err);
          api.removeToken();
        }
      }
      setInitialLoading(false);
    };
    initAuth();
  }, []);

  const fetchStats = async (userId: string) => {
    try {
      const allHistory = await api.getHistory();
      setHistoryCount(allHistory.length);
      
      const favorites = allHistory.filter(item => item.isFavorite);
      setFavoriteCount(favorites.length);
    } catch (err) {
      console.error('Failed to load stats', err);
    }
  };

  const handleAuthSuccess = async (u: User) => {
    setUser(u);
    setActiveTab('dashboard');
    await fetchStats(u.id);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      api.removeToken();
      setUser(null);
      setActiveTab('dashboard');
    }
  };

  const handleRefreshHistory = async () => {
    if (user) {
      await fetchStats(user.id);
      setHistoryRefreshTrigger(prev => prev + 1);
    }
  };

  const handleAddFavoriteCount = (delta: number) => {
    setFavoriteCount(prev => Math.max(0, prev + delta));
  };

  // Nav items sidebar
  const navItems = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: Compass },
    { id: 'generator' as TabType, label: 'Code Generator', icon: Code2 },
    { id: 'scaffolder' as TabType, label: 'Project Scaffolder', icon: FolderGit2 },
    { id: 'debugger' as TabType, label: 'Code Debugger', icon: Bug },
    { id: 'analyzer' as TabType, label: 'Complexity Analyzer', icon: Activity },
    { id: 'chatbot' as TabType, label: 'Coding Chatbot', icon: MessageSquare },
    { id: 'history' as TabType, label: 'Activity Logs', icon: History }
  ];

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-[#A1A1AA]">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <span className="text-sm font-medium font-sans">Bootstrapping Full-Stack Agent Workspace...</span>
      </div>
    );
  }

  // Not logged in -> Show Auth Screen
  if (!user) {
    return <AuthView onAuthSuccess={handleAuthSuccess} showNotification={showNotification} />;
  }

  // Active Tab View Selector Component Resolver
  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView 
            username={user.username} 
            onNavigate={(t) => setActiveTab(t)} 
            historyCount={historyCount} 
            favoriteCount={favoriteCount} 
          />
        );
      case 'generator':
        return (
          <CodeGeneratorView 
            onAddFavoriteCount={handleAddFavoriteCount} 
            onRefreshHistory={handleRefreshHistory} 
            showNotification={showNotification}
          />
        );
      case 'scaffolder':
        return (
          <ProjectScaffolderView 
            onAddFavoriteCount={handleAddFavoriteCount} 
            onRefreshHistory={handleRefreshHistory} 
            showNotification={showNotification}
          />
        );
      case 'debugger':
        return (
          <CodeDebuggerView 
            onAddFavoriteCount={handleAddFavoriteCount} 
            onRefreshHistory={handleRefreshHistory} 
            showNotification={showNotification}
          />
        );
      case 'analyzer':
        return (
          <CodeAnalyzerView 
            onAddFavoriteCount={handleAddFavoriteCount} 
            onRefreshHistory={handleRefreshHistory} 
            showNotification={showNotification}
          />
        );
      case 'chatbot':
        return (
          <ChatbotView 
            onRefreshHistory={handleRefreshHistory} 
            showNotification={showNotification}
          />
        );
      case 'history':
        return (
          <HistoryView 
            onAddFavoriteCount={handleAddFavoriteCount} 
            refreshTrigger={historyRefreshTrigger} 
            onRefreshHistory={handleRefreshHistory} 
            showNotification={showNotification}
          />
        );
      default:
        return <div className="text-white text-sm">Component resolving error...</div>;
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex font-sans overflow-hidden">
      {/* 1. PERSISTENT SIDEBAR - DESKTOP */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#0D0D0D] border-r border-white/5 text-[#A1A1AA] flex-shrink-0 h-screen overflow-y-auto">
        {/* App Logo */}
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">AI Code Agent</h1>
            <span className="text-[10px] text-[#52525B] font-mono">v1.2.0 • Sandbox</span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 p-4 space-y-1.5">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === item.id 
                  ? 'bg-white/5 border border-white/5 text-white' 
                  : 'border border-transparent text-[#A1A1AA] hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className={`w-4.5 h-4.5 ${activeTab === item.id ? 'text-indigo-400' : 'text-[#52525B] group-hover:text-white'}`} />
              {item.label}
              {item.id === 'history' && historyCount > 0 && (
                <span className="ml-auto px-1.5 py-0.5 bg-[#18181B] text-[#A1A1AA] text-[10px] font-mono rounded-full">{historyCount}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer User Info */}
        <div className="p-4 border-t border-white/5 space-y-3 bg-black/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#18181B] flex items-center justify-center text-indigo-400 font-bold text-xs shrink-0 border border-white/5 uppercase">
              {user.username.slice(0, 2)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{user.username}</p>
              <p className="text-[10px] text-[#52525B]">Developer Profile</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-2 bg-[#050505] border border-white/5 hover:bg-red-500/10 hover:border-red-500/20 text-[#A1A1AA] hover:text-red-400 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
        </div>
      </aside>

      {/* MOBILE DRAWER OVERLAY MENU */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black"
            ></motion.div>

            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative flex flex-col w-64 max-w-xs bg-[#0D0D0D] h-full p-5 text-[#A1A1AA] z-50 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-5 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400">
                    <Terminal className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-sm font-bold text-white">AI Code Agent</span>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg border border-white/5 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 py-6 space-y-1.5">
                {navItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide cursor-pointer transition-all ${
                      activeTab === item.id 
                        ? 'bg-white/5 border border-white/5 text-white' 
                        : 'border border-transparent text-[#A1A1AA] hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <item.icon className="w-4.5 h-4.5" />
                    {item.label}
                  </button>
                ))}
              </nav>

              {/* Logout */}
              <div className="pt-4 border-t border-white/5 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#18181B] flex items-center justify-center text-indigo-400 font-bold text-xs shrink-0 border border-white/5">
                    {user.username.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-white truncate">{user.username}</span>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full py-2 bg-[#050505] border border-white/5 hover:bg-red-500/10 hover:border-red-500/20 text-[#A1A1AA] hover:text-red-400 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Log Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. MAIN APPLICATION WORKSPACE AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* TOP COMPACT NAV BAR */}
        <header className="h-16 border-b border-white/5 bg-[#0A0A0A]/80 backdrop-blur px-6 flex items-center justify-between flex-shrink-0 z-30">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-white/5 hover:text-white cursor-pointer"
            >
              <Menu className="w-4.5 h-4.5" />
            </button>

            {/* Path indicator */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs">
              <span className="text-[#A1A1AA] font-medium">Workspace</span>
              <span className="text-[#52525B] font-mono">/</span>
              <span className="text-white font-bold capitalize font-sans">{activeTab}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden md:inline-flex px-2.5 py-1 bg-[#0D0D0D] border border-white/5 text-[#A1A1AA] rounded-lg text-[10px] font-mono items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" /> API: Active
            </span>

            {/* Simple stats badges */}
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-[#0D0D0D] border border-white/5 text-[#A1A1AA] rounded-lg text-[10px] font-mono flex items-center gap-1">
                <Bookmark className="w-3 h-3 text-indigo-400" /> Saved: {favoriteCount}
              </span>
            </div>
          </div>
        </header>

        {/* CONTAINER WORKSPACE STAGE */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto z-10">
          <div className="max-w-6xl mx-auto pb-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderActiveView()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl border shadow-xl flex items-center gap-2 max-w-sm ${
              notification.type === 'error'
                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-450'
            }`}
          >
            {notification.type === 'error' ? (
              <ShieldAlert className="w-4.5 h-4.5 shrink-0" />
            ) : (
              <Check className="w-4.5 h-4.5 shrink-0" />
            )}
            <span className="text-xs font-semibold font-sans leading-relaxed">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
