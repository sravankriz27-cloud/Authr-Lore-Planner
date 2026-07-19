/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { readDb, writeDb } from './serverDb';
import { User, Universe, Character, Chapter } from './src/types';

// Add custom properties to Express Request types
interface AuthenticatedRequest extends Request {
  user?: User;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser limit increased to handle larger text/chapters comfortably
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Helper for generating short IDs
  const generateId = (prefix: string) => `${prefix}-${Math.random().toString(36).substr(2, 9)}`;

  // ==========================================
  // AUTHENTICATION MIDDLEWARE
  // ==========================================
  const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <userId> or custom token

    if (!token) {
      res.status(401).json({ error: 'Access token is required' });
      return;
    }

    const db = await readDb();
    // In our simplified custom auth, the token itself is the user-id or verified token
    const user = db.users.find((u: User) => u.id === token);

    if (!user) {
      res.status(403).json({ error: 'Invalid or expired session token' });
      return;
    }

    req.user = user;
    next();
  };

  // ==========================================
  // REUSABLE OWNERSHIP CHECKS
  // ==========================================
  const verifyUniverseOwnership = async (universeId: string, userId: string): Promise<boolean> => {
    const db = await readDb();
    const universe = db.universes.find((u: Universe) => u.id === universeId);
    return !!(universe && universe.ownerId === userId);
  };

  // ==========================================
  // API HEALTH & SYSTEM
  // ==========================================
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ==========================================
  // AUTHENTICATION ENDPOINTS
  // ==========================================
  app.post('/api/auth/signup', async (req: Request, res: Response) => {
    const { username, password, name } = req.body;

    if (!username || !password || !name) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    const db = await readDb();
    const existing = db.users.find((u: User) => u.username.toLowerCase() === username.toLowerCase());
    if (existing) {
      res.status(400).json({ error: 'Username already taken' });
      return;
    }

    const newUser: User = {
      id: generateId('user'),
      username: username.toLowerCase().trim(),
      name: name.trim(),
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    db.credentials = db.credentials || {};
    db.credentials[newUser.username] = password;

    await writeDb(db);

    res.status(201).json({ token: newUser.id, user: newUser });
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    const db = await readDb();
    const user = db.users.find((u: User) => u.username.toLowerCase() === username.toLowerCase());
    const savedPassword = db.credentials && db.credentials[username.toLowerCase()];

    if (!user || savedPassword !== password) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    res.json({ token: user.id, user });
  });

  app.get('/api/auth/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    res.json({ user: req.user });
  });

  // ==========================================
  // UNIVERSE/PROJECTS ENDPOINTS
  // ==========================================
  app.get('/api/universes', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    const db = await readDb();
    const userUniverses = db.universes.filter((u: Universe) => u.ownerId === req.user?.id);
    res.json(userUniverses);
  });

  app.post('/api/universes', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    const { title, description } = req.body;

    if (!title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    const db = await readDb();
    const newUniverse: Universe = {
      id: generateId('univ'),
      title: title.trim(),
      description: (description || '').trim(),
      ownerId: req.user!.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.universes.push(newUniverse);
    await writeDb(db);

    res.status(201).json(newUniverse);
  });

  app.put('/api/universes/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { title, description } = req.body;

    if (!await verifyUniverseOwnership(id, req.user!.id)) {
      res.status(403).json({ error: 'Forbidden: You do not own this universe' });
      return;
    }

    const db = await readDb();
    const index = db.universes.findIndex((u: Universe) => u.id === id);

    if (index === -1) {
      res.status(404).json({ error: 'Universe not found' });
      return;
    }

    db.universes[index] = {
      ...db.universes[index],
      title: title !== undefined ? title.trim() : db.universes[index].title,
      description: description !== undefined ? description.trim() : db.universes[index].description,
      updatedAt: new Date().toISOString()
    };

    await writeDb(db);
    res.json(db.universes[index]);
  });

  app.delete('/api/universes/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    if (!await verifyUniverseOwnership(id, req.user!.id)) {
      res.status(403).json({ error: 'Forbidden: You do not own this universe' });
      return;
    }

    const db = await readDb();
    // Cascade delete chapters & characters
    db.universes = db.universes.filter((u: Universe) => u.id !== id);
    db.characters = db.characters.filter((c: Character) => c.universeId !== id);
    db.chapters = db.chapters.filter((ch: Chapter) => ch.universeId !== id);

    await writeDb(db);
    res.json({ message: 'Universe and all its assets deleted successfully' });
  });

  // ==========================================
  // CHARACTER ENDPOINTS (Scoped under universe)
  // ==========================================
  app.get('/api/universes/:univId/characters', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    const { univId } = req.params;

    if (!await verifyUniverseOwnership(univId, req.user!.id)) {
      res.status(403).json({ error: 'Forbidden: You do not own this universe' });
      return;
    }

    const db = await readDb();
    const chars = db.characters.filter((c: Character) => c.universeId === univId);
    res.json(chars);
  });

  app.post('/api/universes/:univId/characters', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    const { univId } = req.params;
    const { name, bio, traits, avatar } = req.body;

    if (!await verifyUniverseOwnership(univId, req.user!.id)) {
      res.status(403).json({ error: 'Forbidden: You do not own this universe' });
      return;
    }

    if (!name) {
      res.status(400).json({ error: 'Character name is required' });
      return;
    }

    const db = await readDb();
    const newChar: Character = {
      id: generateId('char'),
      name: name.trim(),
      bio: (bio || '').trim(),
      traits: {
        role: traits?.role || 'Supporting',
        personality: traits?.personality || '',
        appearance: traits?.appearance || '',
        abilities: traits?.abilities || ''
      },
      universeId: univId,
      avatar: avatar || '👤',
      createdAt: new Date().toISOString()
    };

    db.characters.push(newChar);
    await writeDb(db);

    res.status(201).json(newChar);
  });

  app.put('/api/universes/:univId/characters/:charId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    const { univId, charId } = req.params;
    const { name, bio, traits, avatar } = req.body;

    if (!await verifyUniverseOwnership(univId, req.user!.id)) {
      res.status(403).json({ error: 'Forbidden: You do not own this universe' });
      return;
    }

    const db = await readDb();
    const index = db.characters.findIndex((c: Character) => c.id === charId && c.universeId === univId);

    if (index === -1) {
      res.status(404).json({ error: 'Character not found in this universe' });
      return;
    }

    db.characters[index] = {
      ...db.characters[index],
      name: name !== undefined ? name.trim() : db.characters[index].name,
      bio: bio !== undefined ? bio.trim() : db.characters[index].bio,
      avatar: avatar !== undefined ? avatar : db.characters[index].avatar,
      traits: {
        role: traits?.role !== undefined ? traits.role : db.characters[index].traits.role,
        personality: traits?.personality !== undefined ? traits.personality : db.characters[index].traits.personality,
        appearance: traits?.appearance !== undefined ? traits.appearance : db.characters[index].traits.appearance,
        abilities: traits?.abilities !== undefined ? traits.abilities : db.characters[index].traits.abilities,
      }
    };

    await writeDb(db);
    res.json(db.characters[index]);
  });

  app.delete('/api/universes/:univId/characters/:charId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    const { univId, charId } = req.params;

    if (!await verifyUniverseOwnership(univId, req.user!.id)) {
      res.status(403).json({ error: 'Forbidden: You do not own this universe' });
      return;
    }

    const db = await readDb();
    const charIndex = db.characters.findIndex((c: Character) => c.id === charId && c.universeId === univId);

    if (charIndex === -1) {
      res.status(404).json({ error: 'Character not found' });
      return;
    }

    db.characters.splice(charIndex, 1);
    await writeDb(db);

    res.json({ message: 'Character deleted successfully' });
  });

  // ==========================================
  // CHAPTER ENDPOINTS (Scoped under universe)
  // ==========================================
  app.get('/api/universes/:univId/chapters', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    const { univId } = req.params;

    if (!await verifyUniverseOwnership(univId, req.user!.id)) {
      res.status(403).json({ error: 'Forbidden: You do not own this universe' });
      return;
    }

    const db = await readDb();
    const chaps = db.chapters
      .filter((c: Chapter) => c.universeId === univId)
      .sort((a: Chapter, b: Chapter) => a.orderIndex - b.orderIndex);

    res.json(chaps);
  });

  app.post('/api/universes/:univId/chapters', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    const { univId } = req.params;
    const { title, content, isPublished } = req.body;

    if (!await verifyUniverseOwnership(univId, req.user!.id)) {
      res.status(403).json({ error: 'Forbidden: You do not own this universe' });
      return;
    }

    if (!title) {
      res.status(400).json({ error: 'Chapter title is required' });
      return;
    }

    const db = await readDb();
    const siblingChapters = db.chapters.filter((c: Chapter) => c.universeId === univId);
    const maxOrderIndex = siblingChapters.reduce((max: number, c: Chapter) => c.orderIndex > max ? c.orderIndex : max, -1);

    const newChapter: Chapter = {
      id: generateId('chap'),
      title: title.trim(),
      content: content || '',
      orderIndex: maxOrderIndex + 1,
      universeId: univId,
      isPublished: !!isPublished,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.chapters.push(newChapter);
    await writeDb(db);

    res.status(201).json(newChapter);
  });

  // Reorder Chapters endpoint: PUT /api/universes/:id/chapters/reorder
  // Accepts a list of IDs in their exact new order. Corrects all orderIndexes efficiently.
  app.put('/api/universes/:univId/chapters/reorder', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    const { univId } = req.params;
    const { order } = req.body; // Array of chapter ID strings in new order

    if (!await verifyUniverseOwnership(univId, req.user!.id)) {
      res.status(403).json({ error: 'Forbidden: You do not own this universe' });
      return;
    }

    if (!order || !Array.isArray(order)) {
      res.status(400).json({ error: 'Order array of IDs is required' });
      return;
    }

    const db = await readDb();

    // Reassign order indices for all chapters matching the universe
    let updatedCount = 0;
    db.chapters = db.chapters.map((chap: Chapter) => {
      if (chap.universeId === univId) {
        const newIndex = order.indexOf(chap.id);
        if (newIndex !== -1) {
          updatedCount++;
          return {
            ...chap,
            orderIndex: newIndex,
            updatedAt: new Date().toISOString()
          };
        }
      }
      return chap;
    });

    await writeDb(db);
    res.json({ success: true, count: updatedCount });
  });

  app.put('/api/universes/:univId/chapters/:chapId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    const { univId, chapId } = req.params;
    const { title, content, isPublished } = req.body;

    if (!await verifyUniverseOwnership(univId, req.user!.id)) {
      res.status(403).json({ error: 'Forbidden: You do not own this universe' });
      return;
    }

    const db = await readDb();
    const index = db.chapters.findIndex((c: Chapter) => c.id === chapId && c.universeId === univId);

    if (index === -1) {
      res.status(404).json({ error: 'Chapter not found' });
      return;
    }

    db.chapters[index] = {
      ...db.chapters[index],
      title: title !== undefined ? title.trim() : db.chapters[index].title,
      content: content !== undefined ? content : db.chapters[index].content,
      isPublished: isPublished !== undefined ? isPublished : db.chapters[index].isPublished,
      updatedAt: new Date().toISOString()
    };

    await writeDb(db);
    res.json(db.chapters[index]);
  });

  app.delete('/api/universes/:univId/chapters/:chapId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    const { univId, chapId } = req.params;

    if (!await verifyUniverseOwnership(univId, req.user!.id)) {
      res.status(403).json({ error: 'Forbidden: You do not own this universe' });
      return;
    }

    const db = await readDb();
    const chapIndex = db.chapters.findIndex((c: Chapter) => c.id === chapId && c.universeId === univId);

    if (chapIndex === -1) {
      res.status(404).json({ error: 'Chapter not found' });
      return;
    }

    const deletedChap = db.chapters[chapIndex];
    db.chapters.splice(chapIndex, 1);

    // Re-index remaining sibling chapters to keep them sequential
    let relativeIndex = 0;
    db.chapters = db.chapters
      .map((c: Chapter) => {
        if (c.universeId === univId) {
          return { ...c, orderIndex: relativeIndex++ };
        }
        return c;
      });

    await writeDb(db);
    res.json({ message: 'Chapter deleted and timeline re-sequenced successfully' });
  });

  // ==========================================
  // VITE DEVELOPMENT OR PRODUCTION MIDDLEWARE
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
