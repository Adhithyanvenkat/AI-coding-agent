import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DB_FILE = process.env.VERCEL
  ? path.join('/tmp', 'db.json')
  : path.join(process.cwd(), 'db.json');

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
}

export interface HistoryItem {
  id: string;
  userId: string;
  type: 'generator' | 'debugger' | 'analyzer' | 'project' | 'chat';
  title: string;
  input: string;
  output: any; // Can be code + explanation, fixed code, project files, chat message array, or complexity report
  isFavorite: boolean;
  timestamp: string;
}

interface DatabaseSchema {
  users: User[];
  history: HistoryItem[];
}

// Ensure database file exists
function initDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial: DatabaseSchema = { users: [], history: [] };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error initializing database file, resetting...', err);
    const initial: DatabaseSchema = { users: [], history: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
}

function writeDb(data: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write database:', err);
  }
}

export const db = {
  // User operations
  createUser: async (username: string, passwordPlain: string): Promise<User> => {
    const schema = initDb();
    const existing = schema.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (existing) {
      throw new Error('Username already exists');
    }
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(passwordPlain, salt);
    const newUser: User = {
      id: Math.random().toString(36).substring(2, 11),
      username,
      passwordHash,
      createdAt: new Date().toISOString()
    };
    schema.users.push(newUser);
    writeDb(schema);
    return newUser;
  },

  findUserByUsername: async (username: string): Promise<User | undefined> => {
    const schema = initDb();
    return schema.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  },

  findUserById: async (id: string): Promise<User | undefined> => {
    const schema = initDb();
    return schema.users.find(u => u.id === id);
  },

  // History operations
  addHistory: async (
    userId: string,
    type: HistoryItem['type'],
    title: string,
    input: string,
    output: any
  ): Promise<HistoryItem> => {
    const schema = initDb();
    const newItem: HistoryItem = {
      id: Math.random().toString(36).substring(2, 11),
      userId,
      type,
      title,
      input,
      output,
      isFavorite: false,
      timestamp: new Date().toISOString()
    };
    schema.history.unshift(newItem); // Newest first
    writeDb(schema);
    return newItem;
  },

  getHistory: async (userId: string, search?: string, onlyFavorites?: boolean): Promise<HistoryItem[]> => {
    const schema = initDb();
    let items = schema.history.filter(item => item.userId === userId);
    
    if (onlyFavorites) {
      items = items.filter(item => item.isFavorite);
    }
    
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(item => 
        item.title.toLowerCase().includes(q) || 
        item.input.toLowerCase().includes(q)
      );
    }
    return items;
  },

  deleteHistory: async (userId: string, itemId: string): Promise<boolean> => {
    const schema = initDb();
    const initialLen = schema.history.length;
    schema.history = schema.history.filter(item => !(item.userId === userId && item.id === itemId));
    writeDb(schema);
    return schema.history.length < initialLen;
  },

  toggleFavorite: async (userId: string, itemId: string): Promise<HistoryItem | undefined> => {
    const schema = initDb();
    const item = schema.history.find(item => item.userId === userId && item.id === itemId);
    if (item) {
      item.isFavorite = !item.isFavorite;
      writeDb(schema);
      return item;
    }
    return undefined;
  },

  clearHistory: async (userId: string): Promise<void> => {
    const schema = initDb();
    schema.history = schema.history.filter(item => item.userId !== userId);
    writeDb(schema);
  }
};
