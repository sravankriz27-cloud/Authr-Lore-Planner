/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { MongoClient } from 'mongodb';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

let mongoClient: MongoClient | null = null;
let memoryCache: any = null;

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

let mongoConnectionFailed = false;

async function getMongoClient(): Promise<MongoClient> {
  if (mongoClient) return mongoClient;
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not defined.');
  }
  try {
    mongoClient = new MongoClient(MONGODB_URI, {
      connectTimeoutMS: 4000,
      serverSelectionTimeoutMS: 4000,
    });
    await mongoClient.connect();
    console.log('Successfully connected to MongoDB Cloud Database!');
    return mongoClient;
  } catch (err) {
    mongoClient = null;
    throw err;
  }
}

// Read database
export async function readDb() {
  if (memoryCache) {
    return memoryCache;
  }

  if (MONGODB_URI && !mongoConnectionFailed) {
    try {
      const client = await getMongoClient();
      const db = client.db('lore-planner');
      const collection = db.collection('state');
      const doc = await collection.findOne({ _id: 'global_state' as any });
      if (doc) {
        const { _id, ...rest } = doc;
        memoryCache = rest;
        return memoryCache;
      } else {
        const initial = getInitialData();
        await collection.insertOne({ _id: 'global_state' as any, ...initial });
        memoryCache = initial;
        return memoryCache;
      }
    } catch (err: any) {
      console.error('Failed to read from MongoDB, falling back to local storage:', err);
      mongoConnectionFailed = true;
    }
  }

  // Fallback to local file database
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initial = getInitialData();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    memoryCache = initial;
    return memoryCache;
  }

  try {
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    memoryCache = JSON.parse(content);
    return memoryCache;
  } catch (err) {
    console.error('Error reading local DB file:', err);
    return getInitialData();
  }
}

// Write database
export async function writeDb(data: any) {
  memoryCache = data;

  if (MONGODB_URI && !mongoConnectionFailed) {
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
    } catch (err) {
      console.error('Failed to write to MongoDB, fallback saving to local:', err);
      mongoConnectionFailed = true;
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
