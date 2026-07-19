/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  username: string;
  name: string;
  createdAt: string;
}

export interface Universe {
  id: string;
  title: string;
  description: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Character {
  id: string;
  name: string;
  bio: string;
  traits: {
    role: string;      // Protagonist, Antagonist, Supporting, etc.
    personality: string;
    appearance: string;
    abilities: string;
  };
  universeId: string;
  avatar: string; // Avatar placeholder/emoji or CSS theme
  createdAt: string;
}

export interface Chapter {
  id: string;
  title: string;
  content: string; // Sanitized HTML
  orderIndex: number;
  universeId: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseSchema {
  users: User[];
  universes: Universe[];
  characters: Character[];
  chapters: Chapter[];
}
