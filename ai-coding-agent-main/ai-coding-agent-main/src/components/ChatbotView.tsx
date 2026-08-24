import React, { useState, useRef, useEffect } from 'react';
import { api } from '../lib/api';
import { ChatMessage } from '../types';
import { 
  MessageSquare, 
  Send, 
  Trash2, 
  User, 
  Cpu, 
  Sparkles, 
  Loader2,
  Copy,
  Check
} from 'lucide-react';
import { motion } from 'motion/react';

interface ChatbotViewProps {
  onRefreshHistory: () => void;
  showNotification: (message: string, type: 'success' | 'error') => void;
}

export default function ChatbotView({ onRefreshHistory, showNotification }: ChatbotViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const activePrompt = customPrompt || input;
    if (!activePrompt.trim() || loading) return;

    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: activePrompt.trim() }];
    setMessages(newMessages);
    if (!customPrompt) setInput('');
    setLoading(true);

    try {
      const res = await api.chatbotMessage(newMessages);
      setMessages([...newMessages, { role: 'model', content: res.output.reply }]);
      onRefreshHistory();
    } catch (err: any) {
      showNotification(err.message || 'Failed to get chat reply', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    if (window.confirm('Clear active chat session?')) {
      setMessages([]);
    }
  };

  const handleCopyMessage = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const starters = [
    'Explain MVC vs MVVM architecture in simple words.',
    'Write a quick Node Express rate limiting middleware.',
    'Explain the differences between REST and GraphQL.'
  ];

  return (
    <div className="bg-[#0D0D0D] border border-white/5 rounded-2xl flex flex-col h-[600px] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 bg-[#050505] border-b border-white/5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/15">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">AI Coding Companion</h2>
            <p className="text-[10px] text-zinc-500 font-mono">Model: Gemini-3.5-Flash</p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleClear}
            className="p-1.5 rounded-lg border border-white/10 hover:border-red-500/20 text-[#A1A1AA] hover:text-red-450 flex items-center gap-1 text-xs cursor-pointer transition-colors"
            title="Clear Chat"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Clear Session</span>
          </button>
        )}
      </div>

      {/* Messages body */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4 min-h-0 bg-[#050505]/20">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 max-w-lg mx-auto">
            <div className="inline-flex p-4 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2">
              <MessageSquare className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-sans">Start a Coding Dialogue</h3>
              <p className="text-[#A1A1AA] text-xs mt-1 leading-relaxed">
                I am your senior development assistant. You can ask me architectural questions, request refactoring schemes, inquire about security best practices, or build code scaffolds.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5 w-full">
              {starters.map((starter, i) => (
                <button
                  key={i}
                  onClick={(e) => handleSend(e, starter)}
                  className="w-full text-left p-3 bg-[#0D0D0D] border border-white/5 hover:border-indigo-500/30 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-indigo-500/[0.02] transition-all cursor-pointer font-sans"
                >
                  💡 "{starter}"
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'model' && (
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl shrink-0">
                <Cpu className="w-4.5 h-4.5" />
              </div>
            )}

            <div className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed space-y-2 relative group ${
              msg.role === 'user' 
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-tr-none' 
                : 'bg-[#0D0D0D] border border-white/5 text-[#EDEDED] rounded-tl-none'
            }`}>
              <div className="whitespace-pre-wrap">{msg.content}</div>
              
              {/* Message Actions */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button
                  onClick={() => handleCopyMessage(msg.content, i)}
                  className={`p-1 rounded bg-[#050505]/85 border text-[10px] cursor-pointer ${
                    copiedIndex === i 
                      ? 'border-indigo-500/50 text-indigo-400' 
                      : 'border-white/10 text-zinc-400 hover:text-white'
                  }`}
                  title="Copy message"
                >
                  {copiedIndex === i ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>

            {msg.role === 'user' && (
              <div className="p-2 bg-[#18181B] text-zinc-400 rounded-xl shrink-0">
                <User className="w-4.5 h-4.5" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-3 justify-start">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl shrink-0">
              <Cpu className="w-4.5 h-4.5 animate-pulse" />
            </div>
            <div className="bg-[#0D0D0D] border border-white/5 text-zinc-400 rounded-2xl rounded-tl-none p-4 text-xs flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              <span>Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Footer */}
      <div className="p-4 bg-[#050505] border-t border-white/5 shrink-0">
        <form onSubmit={(e) => handleSend(e)} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything or request refactoring here..."
            className="flex-1 px-4 py-2.5 bg-[#0D0D0D] border border-white/10 rounded-xl text-xs text-white placeholder-zinc-650 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            disabled={loading}
          />
          <button
            id="send-chat-msg-btn"
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-colors cursor-pointer shadow-lg shadow-indigo-500/10"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
