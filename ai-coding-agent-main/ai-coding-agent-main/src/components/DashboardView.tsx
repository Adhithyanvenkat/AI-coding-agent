import React from 'react';
import { TabType } from '../types';
import { 
  Code2, 
  Terminal, 
  Settings, 
  Bookmark, 
  Cpu, 
  Compass, 
  Wrench, 
  Bug, 
  Activity, 
  MessageSquare, 
  FolderGit2, 
  ArrowRight,
  ShieldCheck,
  History
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardViewProps {
  username: string;
  onNavigate: (tab: TabType) => void;
  historyCount: number;
  favoriteCount: number;
}

export default function DashboardView({ username, onNavigate, historyCount, favoriteCount }: DashboardViewProps) {
  const tools = [
    {
      id: 'generator' as TabType,
      title: 'AI Code Generator',
      description: 'Generate high-quality code in JavaScript, Python, Rust, Go, C++, and more with clear explanations.',
      icon: Code2,
      color: 'from-[#0D0D0D] to-[#111111]',
      borderColor: 'border-white/5 hover:border-indigo-500/30',
      iconColor: 'text-indigo-400',
    },
    {
      id: 'scaffolder' as TabType,
      title: 'AI Project Scaffolder',
      description: 'Scaffold full multi-file architectures (React, Express, Fullstack) with visual trees and ZIP exports.',
      icon: FolderGit2,
      color: 'from-[#0D0D0D] to-[#111111]',
      borderColor: 'border-white/5 hover:border-indigo-500/30',
      iconColor: 'text-indigo-400',
    },
    {
      id: 'debugger' as TabType,
      title: 'AI Code Debugger',
      description: 'Isolate runtime, structural, or logical flaws instantly. Get fully corrected solutions and logs.',
      icon: Bug,
      color: 'from-[#0D0D0D] to-[#111111]',
      borderColor: 'border-white/5 hover:border-indigo-500/30',
      iconColor: 'text-indigo-400',
    },
    {
      id: 'analyzer' as TabType,
      title: 'AI Complexity Analyzer',
      description: 'Analyze Big O time/space characteristics, compute code quality indexes, and visualize metrics.',
      icon: Activity,
      color: 'from-[#0D0D0D] to-[#111111]',
      borderColor: 'border-white/5 hover:border-indigo-500/30',
      iconColor: 'text-indigo-400',
    },
    {
      id: 'chatbot' as TabType,
      title: 'AI Coding Partner',
      description: 'Engage with an interactive LLM conversational chat for software design questions and tutorials.',
      icon: MessageSquare,
      color: 'from-[#0D0D0D] to-[#111111]',
      borderColor: 'border-white/5 hover:border-indigo-500/30',
      iconColor: 'text-indigo-400',
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-[#0D0D0D] via-[#0D0D0D] to-indigo-950/20 border border-white/5 rounded-2xl p-6 md:p-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl">
          <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full text-xs font-medium inline-flex items-center gap-1.5 mb-4">
            <Cpu className="w-3.5 h-3.5 animate-pulse" /> Gemini-3.5-Flash Online
          </span>
          <h1 className="text-2xl md:text-3.5xl font-bold tracking-tight text-white font-sans">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">{username}</span>!
          </h1>
          <p className="text-[#A1A1AA] text-sm md:text-base mt-2 leading-relaxed">
            What are we coding today? Select a specialized agent tool below to generate clean components, debug broken loops, analyze execution graphs, or chat about software architecture.
          </p>
        </div>
      </motion.div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Activity Logs', value: historyCount, icon: History, color: 'text-indigo-400', bg: 'bg-[#0D0D0D] border-white/5' },
          { label: 'Saved Favorites', value: favoriteCount, icon: Bookmark, color: 'text-indigo-400', bg: 'bg-[#0D0D0D] border-white/5' },
          { label: 'Database Service', value: 'Local JSON', icon: ShieldCheck, color: 'text-indigo-400', bg: 'bg-[#0D0D0D] border-white/5', sub: 'Atlas Ready' },
          { label: 'System Ingress', value: 'Port 3000', icon: Terminal, color: 'text-indigo-400', bg: 'bg-[#0D0D0D] border-white/5', sub: 'Cloud Run Live' }
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`p-5 rounded-2xl border ${stat.bg} flex items-center justify-between`}
          >
            <div>
              <p className="text-[#A1A1AA] text-xs font-medium">{stat.label}</p>
              <h3 className="text-xl md:text-2xl font-bold text-white mt-1 font-mono">{stat.value}</h3>
              {stat.sub && <span className="text-[10px] text-[#52525B] mt-0.5 block">{stat.sub}</span>}
            </div>
            <div className={`p-3 rounded-xl bg-[#18181B] ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Grid: Tools Select */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Compass className="w-5 h-5 text-indigo-400" />
            Select Specialized AI Agent Tools
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool, i) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              onClick={() => onNavigate(tool.id)}
              className={`group bg-gradient-to-b ${tool.color} border ${tool.borderColor} rounded-2xl p-6 transition-all duration-350 cursor-pointer flex flex-col justify-between hover:-translate-y-1 shadow-md hover:shadow-black/60`}
            >
              <div>
                <div className={`p-3 rounded-xl bg-slate-950/20 w-fit mb-4 group-hover:scale-110 transition-transform ${tool.iconColor}`}>
                  <tool.icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-2 font-sans group-hover:text-indigo-400 transition-colors">
                  {tool.title}
                </h3>
                <p className="text-[#A1A1AA] text-xs leading-relaxed">
                  {tool.description}
                </p>
              </div>
              
              <div className="flex items-center text-xs font-semibold text-indigo-400 mt-6 pt-4 border-t border-white/5 group-hover:translate-x-1 transition-transform w-fit gap-1">
                Launch Utility <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
