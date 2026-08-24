import 'dotenv/config';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';
import { db } from './src/server/db';
import { groqService } from './src/server/groqService';

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'code-agent-super-secret-key-2026';

// Request parsing middleware
app.use(express.json({ limit: '10mb' }));

// Auth token interface extension
export interface AuthenticatedRequest extends Request {
  user?: { id: string; username: string };
}

// Authentication middleware
function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      res.status(403).json({ error: 'Invalid or expired token' });
      return;
    }
    req.user = decoded as { id: string; username: string };
    next();
  });
}

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

app.post('/api/auth/signup', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  try {
    const user = await db.createUser(username, password);
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      token,
      user: { id: user.id, username: user.username }
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Signup failed' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  try {
    const user = await db.findUserByUsername(username);
    if (!user) {
      res.status(400).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(400).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: { id: user.id, username: user.username }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await db.findUserById(req.user!.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ id: user.id, username: user.username });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch user profiles' });
  }
});

// ==========================================
// AI CODE ASSISTANCE ROUTES (PROTECTED)
// ==========================================

app.post('/api/ai/generate', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { prompt, language } = req.body;
  if (!prompt || !language) {
    res.status(400).json({ error: 'Prompt and language are required' });
    return;
  }

  try {
    const output = await groqService.generateCode(prompt, language);
    const historyItem = await db.addHistory(
      req.user!.id,
      'generator',
      `${language} code for "${prompt.slice(0, 30)}${prompt.length > 30 ? '...' : ''}"`,
      prompt,
      output
    );
    res.json({ output, historyItem });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate code' });
  }
});

app.post('/api/ai/debug', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { code, language } = req.body;
  if (!code) {
    res.status(400).json({ error: 'Code block is required for debugging' });
    return;
  }

  try {
    const output = await groqService.debugCode(code, language);
    const historyItem = await db.addHistory(
      req.user!.id,
      'debugger',
      `Debugged ${language || 'code'} snippet`,
      code,
      output
    );
    res.json({ output, historyItem });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to debug code' });
  }
});

app.post('/api/ai/analyze', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { code, language } = req.body;
  if (!code) {
    res.status(400).json({ error: 'Code block is required for analysis' });
    return;
  }

  try {
    const output = await groqService.analyzeCode(code, language);
    const historyItem = await db.addHistory(
      req.user!.id,
      'analyzer',
      `Analyzed ${language || 'code'} snippet`,
      code,
      output
    );
    res.json({ output, historyItem });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to analyze code' });
  }
});

app.post('/api/ai/project', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { prompt, framework } = req.body;
  if (!prompt || !framework) {
    res.status(400).json({ error: 'Prompt and framework are required' });
    return;
  }

  try {
    const output = await groqService.generateProject(prompt, framework);
    const historyItem = await db.addHistory(
      req.user!.id,
      'project',
      `Project Scaffolding: ${output.title || 'App'} (${framework})`,
      prompt,
      output
    );
    res.json({ output, historyItem });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to scaffold project' });
  }
});

app.post('/api/ai/chat', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { messages } = req.body; // Full history array of role & content
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Messages list is required' });
    return;
  }

  try {
    const output = await groqService.chatbotResponse(messages);
    const latestUserMsg = messages[messages.length - 1].content;
    const historyItem = await db.addHistory(
      req.user!.id,
      'chat',
      `Chat: "${latestUserMsg.slice(0, 30)}${latestUserMsg.length > 30 ? '...' : ''}"`,
      latestUserMsg,
      output
    );
    res.json({ output, historyItem });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate chat response' });
  }
});

// ==========================================
// HISTORY MANAGEMENT ROUTES (PROTECTED)
// ==========================================

app.get('/api/history', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { search, favorites } = req.query;
  try {
    const items = await db.getHistory(
      req.user!.id,
      search as string,
      favorites === 'true'
    );
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

app.post('/api/history/:id/favorite', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    const item = await db.toggleFavorite(req.user!.id, id);
    if (!item) {
      res.status(404).json({ error: 'History item not found' });
      return;
    }
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
});

app.delete('/api/history/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    const deleted = await db.deleteHistory(req.user!.id, id);
    if (!deleted) {
      res.status(404).json({ error: 'History item not found' });
      return;
    }
    res.json({ success: true, message: 'History item deleted' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete history item' });
  }
});

app.delete('/api/history', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await db.clearHistory(req.user!.id);
    res.json({ success: true, message: 'All history cleared' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to clear history' });
  }
});

// ==========================================
// FRONTEND STATIC / DEV ROUTING
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    // Mount Vite dev server middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve production built files
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
