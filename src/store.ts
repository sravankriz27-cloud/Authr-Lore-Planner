/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { User, Universe, Character, Chapter } from './types';

interface AppState {
  // Auth state
  token: string | null;
  user: User | null;
  authError: string | null;
  authLoading: boolean;

  // Data state
  universes: Universe[];
  characters: Character[];
  chapters: Chapter[];
  
  // Selection/UI state
  selectedUniverseId: string | null;
  selectedChapterId: string | null;
  activeTab: 'chapters' | 'lore' | 'settings';
  loadingUniverses: boolean;
  loadingChaptersAndLore: boolean;
  savingChapter: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';

  // Actions - Auth
  setToken: (token: string | null) => void;
  login: (username: string,password: string) => Promise<boolean>;
  signup: (username: string,password: string, name: string) => Promise<boolean>;
  logout: () => void;
  checkMe: () => Promise<void>;

  // Actions - Universes
  fetchUniverses: () => Promise<void>;
  createUniverse: (title: string, description: string) => Promise<Universe | null>;
  updateUniverse: (id: string, title: string, description: string) => Promise<void>;
  deleteUniverse: (id: string) => Promise<void>;
  selectUniverse: (id: string | null) => void;

  // Actions - Characters
  fetchCharacters: (universeId: string) => Promise<void>;
  createCharacter: (universeId: string, charData: Omit<Character, 'id' | 'universeId' | 'createdAt'>) => Promise<void>;
  updateCharacter: (universeId: string, charId: string, charData: Partial<Character>) => Promise<void>;
  deleteCharacter: (universeId: string, charId: string) => Promise<void>;

  // Actions - Chapters
  fetchChapters: (universeId: string) => Promise<void>;
  createChapter: (universeId: string, title: string, content?: string) => Promise<Chapter | null>;
  updateChapter: (universeId: string, chapterId: string, chapterData: Partial<Chapter>, silent?: boolean) => Promise<void>;
  reorderChapters: (universeId: string, orderedIds: string[]) => Promise<void>;
  deleteChapter: (universeId: string, chapterId: string) => Promise<void>;
  selectChapter: (id: string | null) => void;

  // Actions - UI
  setActiveTab: (tab: 'chapters' | 'lore' | 'settings') => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const getStoredToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('story_lore_token');
  }
  return null;
};

export const useAppStore = create<AppState>((set, get) => ({
  token: getStoredToken(),
  user: null,
  authError: null,
  authLoading: false,

  universes: [],
  characters: [],
  chapters: [],
  
  selectedUniverseId: typeof window !== 'undefined' ? localStorage.getItem('authr_selected_universe_id') : null,
  selectedChapterId: typeof window !== 'undefined' ? localStorage.getItem('authr_selected_chapter_id') : null,
  activeTab: (typeof window !== 'undefined' ? localStorage.getItem('authr_active_tab') : 'chapters') as 'chapters' | 'lore' | 'settings' || 'chapters',
  loadingUniverses: false,
  loadingChaptersAndLore: false,
  savingChapter: false,
  saveStatus: 'idle',
  theme: (typeof window !== 'undefined' ? localStorage.getItem('authr_theme') : 'dark') === 'light' ? 'light' : 'dark',

  setToken: (token) => {
    if (token) {
      localStorage.setItem('story_lore_token', token);
    } else {
      localStorage.removeItem('story_lore_token');
    }
    set({ token });
  },

  login: async (username, password) => {
    set({ authLoading: true, authError: null });
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      get().setToken(data.token);
      set({ user: data.user, authLoading: false });
      return true;
    } catch (err: any) {
      set({ authError: err.message, authLoading: false });
      return false;
    }
  },

  signup: async (username, password, name) => {
    set({ authLoading: true, authError: null });
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, name })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      get().setToken(data.token);
      set({ user: data.user, authLoading: false });
      return true;
    } catch (err: any) {
      set({ authError: err.message, authLoading: false });
      return false;
    }
  },

  logout: () => {
    get().setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authr_selected_universe_id');
      localStorage.removeItem('authr_selected_chapter_id');
      localStorage.removeItem('authr_active_tab');
    }
    set({
      user: null,
      universes: [],
      characters: [],
      chapters: [],
      selectedUniverseId: null,
      selectedChapterId: null,
      activeTab: 'chapters'
    });
  },

  checkMe: async () => {
    const { token } = get();
    if (!token) return;

    try {
      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        set({ user: data.user });
      } else {
        get().logout();
      }
    } catch {
      // Offline or network error
      get().logout();
    }
  },

  // ==========================================
  // UNIVERSE ACTIONS
  // ==========================================
  fetchUniverses: async () => {
    const { token } = get();
    if (!token) return;

    set({ loadingUniverses: true });
    try {
      const response = await fetch('/api/universes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        set({ universes: data });
      }
    } catch (err) {
      console.error('Error fetching universes:', err);
    } finally {
      set({ loadingUniverses: false });
    }
  },

  createUniverse: async (title, description) => {
    const { token } = get();
    if (!token) return null;

    try {
      const response = await fetch('/api/universes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, description })
      });

      if (response.ok) {
        const newUniv = await response.json();
        set((state) => ({ universes: [...state.universes, newUniv] }));
        return newUniv;
      }
    } catch (err) {
      console.error('Error creating universe:', err);
    }
    return null;
  },

  updateUniverse: async (id, title, description) => {
    const { token } = get();
    if (!token) return;

    try {
      const response = await fetch(`/api/universes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, description })
      });

      if (response.ok) {
        const updated = await response.json();
        set((state) => ({
          universes: state.universes.map((u) => u.id === id ? updated : u)
        }));
      }
    } catch (err) {
      console.error('Error updating universe:', err);
    }
  },

  deleteUniverse: async (id) => {
    const { token } = get();
    if (!token) return;

    try {
      const response = await fetch(`/api/universes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        set((state) => {
          const nextUniverseId = state.selectedUniverseId === id ? null : state.selectedUniverseId;
          const nextChapterId = state.selectedUniverseId === id ? null : state.selectedChapterId;
          if (typeof window !== 'undefined') {
            if (nextUniverseId) {
              localStorage.setItem('authr_selected_universe_id', nextUniverseId);
            } else {
              localStorage.removeItem('authr_selected_universe_id');
            }
            if (nextChapterId) {
              localStorage.setItem('authr_selected_chapter_id', nextChapterId);
            } else {
              localStorage.removeItem('authr_selected_chapter_id');
            }
          }
          return {
            universes: state.universes.filter((u) => u.id !== id),
            selectedUniverseId: nextUniverseId,
            selectedChapterId: nextChapterId
          };
        });
      }
    } catch (err) {
      console.error('Error deleting universe:', err);
    }
  },

  selectUniverse: (id) => {
    if (typeof window !== 'undefined') {
      if (id) {
        localStorage.setItem('authr_selected_universe_id', id);
      } else {
        localStorage.removeItem('authr_selected_universe_id');
      }
      localStorage.removeItem('authr_selected_chapter_id');
      localStorage.setItem('authr_active_tab', 'chapters');
    }
    set({ selectedUniverseId: id, selectedChapterId: null, activeTab: 'chapters' });
    if (id) {
      get().fetchChapters(id);
      get().fetchCharacters(id);
    } else {
      set({ chapters: [], characters: [] });
    }
  },

  // ==========================================
  // CHARACTER ACTIONS
  // ==========================================
  fetchCharacters: async (universeId) => {
    const { token } = get();
    if (!token) return;

    set({ loadingChaptersAndLore: true });
    try {
      const response = await fetch(`/api/universes/${universeId}/characters`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        set({ characters: data });
      }
    } catch (err) {
      console.error('Error fetching characters:', err);
    } finally {
      set({ loadingChaptersAndLore: false });
    }
  },

  createCharacter: async (universeId, charData) => {
    const { token } = get();
    if (!token) return;

    try {
      const response = await fetch(`/api/universes/${universeId}/characters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(charData)
      });

      if (response.ok) {
        const newChar = await response.json();
        set((state) => ({ characters: [...state.characters, newChar] }));
      }
    } catch (err) {
      console.error('Error creating character:', err);
    }
  },

  updateCharacter: async (universeId, charId, charData) => {
    const { token } = get();
    if (!token) return;

    try {
      const response = await fetch(`/api/universes/${universeId}/characters/${charId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(charData)
      });

      if (response.ok) {
        const updated = await response.json();
        set((state) => ({
          characters: state.characters.map((c) => c.id === charId ? updated : c)
        }));
      }
    } catch (err) {
      console.error('Error updating character:', err);
    }
  },

  deleteCharacter: async (universeId, charId) => {
    const { token } = get();
    if (!token) return;

    try {
      const response = await fetch(`/api/universes/${universeId}/characters/${charId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        set((state) => ({
          characters: state.characters.filter((c) => c.id !== charId)
        }));
      }
    } catch (err) {
      console.error('Error deleting character:', err);
    }
  },

  // ==========================================
  // CHAPTER ACTIONS
  // ==========================================
  fetchChapters: async (universeId) => {
    const { token } = get();
    if (!token) return;

    set({ loadingChaptersAndLore: true });
    try {
      const response = await fetch(`/api/universes/${universeId}/chapters`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        set({ chapters: data });
      }
    } catch (err) {
      console.error('Error fetching chapters:', err);
    } finally {
      set({ loadingChaptersAndLore: false });
    }
  },

  createChapter: async (universeId, title, content = '') => {
    const { token } = get();
    if (!token) return null;

    try {
      const response = await fetch(`/api/universes/${universeId}/chapters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, content, isPublished: false })
      });

      if (response.ok) {
        const newChap = await response.json();
        set((state) => ({
          chapters: [...state.chapters, newChap].sort((a, b) => a.orderIndex - b.orderIndex)
        }));
        return newChap;
      }
    } catch (err) {
      console.error('Error creating chapter:', err);
    }
    return null;
  },

  updateChapter: async (universeId, chapterId, chapterData, silent = false) => {
    const { token } = get();
    if (!token) return;

    if (!silent) {
      set({ saveStatus: 'saving' });
    }

    try {
      const response = await fetch(`/api/universes/${universeId}/chapters/${chapterId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(chapterData)
      });

      if (response.ok) {
        const updated = await response.json();
        set((state) => ({
          chapters: state.chapters.map((ch) => ch.id === chapterId ? updated : ch),
          saveStatus: 'saved'
        }));
        
        // Return to idle status after 3 seconds
        setTimeout(() => {
          if (get().saveStatus === 'saved') {
            set({ saveStatus: 'idle' });
          }
        }, 3000);
      } else {
        if (!silent) set({ saveStatus: 'error' });
      }
    } catch (err) {
      console.error('Error updating chapter:', err);
      if (!silent) set({ saveStatus: 'error' });
    }
  },

  reorderChapters: async (universeId, orderedIds) => {
    const { token } = get();
    if (!token) return;

    // Optimistically update the UI orderIndexes immediately
    set((state) => {
      const reordered = state.chapters.map((chap) => {
        const newIdx = orderedIds.indexOf(chap.id);
        if (newIdx !== -1) {
          return { ...chap, orderIndex: newIdx };
        }
        return chap;
      }).sort((a, b) => a.orderIndex - b.orderIndex);

      return { chapters: reordered };
    });

    try {
      const response = await fetch(`/api/universes/${universeId}/chapters/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ order: orderedIds })
      });

      if (!response.ok) {
        // Revert or refresh on failure
        get().fetchChapters(universeId);
      }
    } catch (err) {
      console.error('Error reordering chapters:', err);
      get().fetchChapters(universeId);
    }
  },

  deleteChapter: async (universeId, chapterId) => {
    const { token } = get();
    if (!token) return;

    try {
      const response = await fetch(`/api/universes/${universeId}/chapters/${chapterId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        set((state) => {
          const nextChapterId = state.selectedChapterId === chapterId ? null : state.selectedChapterId;
          if (typeof window !== 'undefined') {
            if (nextChapterId) {
              localStorage.setItem('authr_selected_chapter_id', nextChapterId);
            } else {
              localStorage.removeItem('authr_selected_chapter_id');
            }
          }
          return {
            chapters: state.chapters
              .filter((c) => c.id !== chapterId)
              // Re-index locally to mirror backend re-indexing
              .map((c, idx) => ({ ...c, orderIndex: idx })),
            selectedChapterId: nextChapterId
          };
        });
      }
    } catch (err) {
      console.error('Error deleting chapter:', err);
    }
  },

  selectChapter: (id) => {
    if (typeof window !== 'undefined') {
      if (id) {
        localStorage.setItem('authr_selected_chapter_id', id);
      } else {
        localStorage.removeItem('authr_selected_chapter_id');
      }
    }
    set({ selectedChapterId: id });
  },

  setActiveTab: (tab) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('authr_active_tab', tab);
    }
    set({ activeTab: tab });
  },

  toggleTheme: () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
    if (typeof window !== 'undefined') {
      localStorage.setItem('authr_theme', nextTheme);
    }
    set({ theme: nextTheme });
  }
}));
