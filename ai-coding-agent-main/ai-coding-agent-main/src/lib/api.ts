/// <reference types="vite/client" />
import { 
  TabType, 
  HistoryItem, 
  CodeGeneratorOutput, 
  CodeDebuggerOutput, 
  CodeAnalyzerOutput, 
  ProjectScaffolderOutput, 
  ChatMessage 
} from '../types';

const TOKEN_KEY = 'code_agent_token';

const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export const api = {
  // Authentication local storage helpers
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  removeToken() {
    localStorage.removeItem(TOKEN_KEY);
  },

  // Base HTTP Fetcher with automatic Authorization token attachment
  async fetchWithAuth(url: string, options: RequestInit = {}): Promise<any> {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };

    const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
    const response = await fetch(fullUrl, {
      ...options,
      headers
    });

    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(`Server returned non-JSON response: ${text.slice(0, 100)}`);
    }

    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong');
    }
    return data;
  },

  // Auth Operations
  async login(username: string, passwordPlain: string): Promise<{ token: string; user: { id: string; username: string } }> {
    const fullUrl = `${BASE_URL}/api/auth/login`;
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: passwordPlain })
    });
    
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(`Server returned non-JSON response: ${text.slice(0, 100)}`);
    }

    if (!response.ok) {
      throw new Error(data.error || 'Authentication failed');
    }
    this.setToken(data.token);
    return data;
  },

  async signup(username: string, passwordPlain: string): Promise<{ token: string; user: { id: string; username: string } }> {
    const fullUrl = `${BASE_URL}/api/auth/signup`;
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: passwordPlain })
    });
    
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(`Server returned non-JSON response: ${text.slice(0, 100)}`);
    }

    if (!response.ok) {
      throw new Error(data.error || 'Signup failed');
    }
    this.setToken(data.token);
    return data;
  },

  async getMe(): Promise<{ id: string; username: string }> {
    return this.fetchWithAuth('/api/auth/me');
  },

  // AI Service Operations
  async generateCode(prompt: string, language: string): Promise<{ output: CodeGeneratorOutput; historyItem: HistoryItem }> {
    return this.fetchWithAuth('/api/ai/generate', {
      method: 'POST',
      body: JSON.stringify({ prompt, language })
    });
  },

  async debugCode(code: string, language?: string): Promise<{ output: CodeDebuggerOutput; historyItem: HistoryItem }> {
    return this.fetchWithAuth('/api/ai/debug', {
      method: 'POST',
      body: JSON.stringify({ code, language })
    });
  },

  async analyzeCode(code: string, language?: string): Promise<{ output: CodeAnalyzerOutput; historyItem: HistoryItem }> {
    return this.fetchWithAuth('/api/ai/analyze', {
      method: 'POST',
      body: JSON.stringify({ code, language })
    });
  },

  async scaffoldProject(prompt: string, framework: string): Promise<{ output: ProjectScaffolderOutput; historyItem: HistoryItem }> {
    return this.fetchWithAuth('/api/ai/project', {
      method: 'POST',
      body: JSON.stringify({ prompt, framework })
    });
  },

  async chatbotMessage(messages: ChatMessage[]): Promise<{ output: { reply: string }; historyItem: HistoryItem }> {
    return this.fetchWithAuth('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ messages })
    });
  },

  // History Operations
  async getHistory(search?: string, favoritesOnly?: boolean): Promise<HistoryItem[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (favoritesOnly) params.append('favorites', 'true');
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.fetchWithAuth(`/api/history${queryString}`);
  },

  async toggleFavorite(itemId: string): Promise<HistoryItem> {
    return this.fetchWithAuth(`/api/history/${itemId}/favorite`, {
      method: 'POST'
    });
  },

  async deleteHistoryItem(itemId: string): Promise<{ success: boolean }> {
    return this.fetchWithAuth(`/api/history/${itemId}`, {
      method: 'DELETE'
    });
  },

  async clearHistory(): Promise<{ success: boolean }> {
    return this.fetchWithAuth('/api/history', {
      method: 'DELETE'
    });
  }
};
