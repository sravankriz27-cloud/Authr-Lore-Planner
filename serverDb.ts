/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { MongoClient } from 'mongodb';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

let mongoClient: MongoClient | null = null;
let dbStatus = {
  isPersistent: false,
  type: 'local_file',
  connected: false,
  message: 'Initializing...',
  uriProvided: false,
  errorDetails: null as string | null
};

// Sanitizes user-provided MongoDB URIs (e.g., handles angle brackets `<password>`, quotes, trailing spaces)
export function getSanitizedMongoUri(): string | null {
  let uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) return null;

  uri = uri.trim();
  if ((uri.startsWith('"') && uri.endsWith('"')) || (uri.startsWith("'") && uri.endsWith("'"))) {
    uri = uri.substring(1, uri.length - 1).trim();
  }

  // Regex to detect password pattern: mongodb(+srv)://username:password@host...
  const match = uri.match(/^(mongodb(?:\+srv)?:\/\/([^:]+):)([^@]+)(@.+)$/);
  if (match) {
    const prefix = match[1]; // mongodb+srv://username:
    let pass = match[3];      // password or <password>
    const suffix = match[4]; // @cluster...

    // If password is wrapped in angle brackets like <myPass123>, strip the brackets
    if (pass.startsWith('<') && pass.endsWith('>')) {
      pass = pass.substring(1, pass.length - 1);
    }

    // Warn if password was left as default placeholder
    if (pass === 'db_password' || pass === 'password' || pass === 'your_password' || pass === '<db_password>') {
      console.warn('⚠️ MONGODB_URI contains unreplaced placeholder password!');
    }

    return `${prefix}${encodeURIComponent(pass)}${suffix}`;
  }

  return uri;
}

// Initial template if database is brand new
const getInitialData = () => ({
  users: [
    { id: 'user-demo', username: 'demo', name: 'demo_writer', createdAt: new Date().toISOString() }
  ],
  credentials: {
    'demo': 'demo123'
  },
  universes: [
    {
      id: 'univ-demo-1',
      title: 'The Chrono Chronicles',
      description: 'An epic sci-fi universe centering around time-travel paradoxes and memory-stealing temporal storms.',
      ownerId: 'user-demo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  characters: [
    {
      id: 'char-demo-1',
      name: 'Aiden Vance',
      bio: 'A rogue chronologist who discovered the first stable wormhole in his garage. He is brilliant but constantly distracted by alternate timelines.',
      traits: {
        role: 'Protagonist',
        personality: 'Sarcastic, fiercely loyal, deeply regretful of past timeline edits.',
        appearance: 'Mid-30s, windswept graying hair, wears a leather jacket patched with copper wires.',
        abilities: 'Can remember alternate timelines that have been erased.'
      },
      universeId: 'univ-demo-1',
      avatar: '🧭',
      createdAt: new Date().toISOString()
    },
    {
      id: 'char-demo-2',
      name: 'Lyra Vance',
      bio: 'Aiden\'s daughter from a future timeline that technically no longer exists. She travels back to warn him of a looming timeline collapse.',
      traits: {
        role: 'Supporting',
        personality: 'Highly focused, disciplined, carrying the weight of a dying world.',
        appearance: 'Late teens, athletic build, silver cybernetic left eye.',
        abilities: 'Possesses future knowledge and advanced temporal weaponry.'
      },
      universeId: 'univ-demo-1',
      avatar: '⌛',
      createdAt: new Date().toISOString()
    }
  ],
  chapters: [
    {
      id: 'chap-demo-1',
      title: 'The Wormhole in the Garage',
      content: '<h2>Chapter 1: The Wormhole in the Garage</h2><p>Aiden Vance stared at the glowing blue sphere hovering exactly two inches above his workbench. It hummed with a low-frequency vibration that rattled his coffee mug.</p><p><i>"This isn\'t supposed to happen,"</i> he muttered, adjusted his brass chronometer. The readings were off the charts. Literally. The screen on his quantum spectrum analyzer had cracked under the pressure.</p><p>He reached out a gloved finger, holding his breath...</p>',
      orderIndex: 0,
      universeId: 'univ-demo-1',
      isPublished: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'chap-demo-2',
      title: 'Echoes of a Future',
      content: '<h2>Chapter 2: Echoes of a Future</h2><p>The temporal storm hit without warning. Aiden woke up on his garage floor to the sound of shattered glass and a blinding flash of light.</p><p>Standing in front of the flickering temporal rift was a young woman. Her clothes were scorched, and her left eye gleamed with a metallic, cybernetic sheen.</p><p>She looked directly at Aiden, her eyes widening in disbelief. <i>"Dad?"</i> she whispered.</p>',
      orderIndex: 1,
      universeId: 'univ-demo-1',
      isPublished: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
});

async function getMongoClient(): Promise<MongoClient> {
  if (mongoClient) return mongoClient;

  const mongoUri = getSanitizedMongoUri();
  if (!mongoUri) {
    dbStatus = {
      isPersistent: false,
      type: 'local_file',
      connected: false,
      message: 'MONGODB_URI is not set in environment variables. Running on temporary container disk.',
      uriProvided: false,
      errorDetails: 'Missing MONGODB_URI environment variable'
    };
    throw new Error('MONGODB_URI environment variable is not defined.');
  }

  try {
    const client = new MongoClient(mongoUri, {
      connectTimeoutMS: 5000,
      serverSelectionTimeoutMS: 5000,
    });
    await client.connect();
    mongoClient = client;
    dbStatus = {
      isPersistent: true,
      type: 'mongodb_atlas',
      connected: true,
      message: 'Successfully connected to persistent Cloud MongoDB Database!',
      uriProvided: true,
      errorDetails: null
    };
    console.log('✅ Successfully connected to MongoDB Atlas Cloud Database!');
    return mongoClient;
  } catch (err: any) {
    mongoClient = null;
    const errMsg = err?.message || String(err);
    dbStatus = {
      isPersistent: false,
      type: 'local_file',
      connected: false,
      message: 'MongoDB connection failed. Check password and MongoDB Atlas Network Access (Allow 0.0.0.0/0).',
      uriProvided: true,
      errorDetails: errMsg
    };
    console.error('❌ MongoDB Atlas Connection Failed:', errMsg);
    throw err;
  }
}

export function getDbDiagnostics() {
  return dbStatus;
}

// Read database
export async function readDb() {
  const mongoUri = getSanitizedMongoUri();

  if (mongoUri) {
    try {
      const client = await getMongoClient();
      const db = client.db('lore-planner');
      const collection = db.collection('state');
      const doc = await collection.findOne({ _id: 'global_state' as any });
      if (doc) {
        const { _id, ...rest } = doc;
        return rest;
      } else {
        const initial = getInitialData();
        await collection.insertOne({ _id: 'global_state' as any, ...initial });
        return initial;
      }
    } catch (err: any) {
      // Fallback silently to local storage for this attempt
    }
  }

  // Fallback to local file database
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initial = getInitialData();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }

  try {
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error reading local DB file:', err);
    return getInitialData();
  }
}

// Write database
export async function writeDb(data: any) {
  const mongoUri = getSanitizedMongoUri();

  if (mongoUri) {
    try {
      const client = await getMongoClient();
      const db = client.db('lore-planner');
      const collection = db.collection('state');
      await collection.replaceOne(
        { _id: 'global_state' as any },
        { ...data },
        { upsert: true }
      );
      return;
    } catch (err: any) {
      // Fallback to local disk write
    }
  }

  // Fallback to local file database
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing local DB file:', err);
  }
}
