/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAppStore } from '../store';
import { 
  FolderPlus, 
  Layers, 
  LogOut, 
  ChevronDown, 
  ChevronUp, 
  BookOpen, 
  Users, 
  Sliders, 
  PenTool,
  Check,
  Plus,
  Sun,
  Moon
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const user = useAppStore((state) => state.user);
  const universes = useAppStore((state) => state.universes);
  const selectedUniverseId = useAppStore((state) => state.selectedUniverseId);
  const selectUniverse = useAppStore((state) => state.selectUniverse);
  const createUniverse = useAppStore((state) => state.createUniverse);
  const logout = useAppStore((state) => state.logout);
  const activeTab = useAppStore((state) => state.activeTab);
  const setActiveTab = useAppStore((state) => state.setActiveTab);
  const theme = useAppStore((state) => state.theme);
  const toggleTheme = useAppStore((state) => state.toggleTheme);

  const [isOpenDropdown, setIsOpenDropdown] = useState(false);
  const [isCreatingUniv, setIsCreatingUniv] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [error, setError] = useState<string | null>(null);

  const selectedUniverse = universes.find(u => u.id === selectedUniverseId);

  const handleCreateUniverse = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!newTitle.trim()) {
      setError('Universe name is required');
      return;
    }

    const created = await createUniverse(newTitle.trim(), newDesc.trim());
    if (created) {
      selectUniverse(created.id);
      setIsCreatingUniv(false);
      setNewTitle('');
      setNewDesc('');
      if (onClose) onClose();
    } else {
      setError('Could not create. Please try again.');
    }
  };

  const handleTabClick = (tab: 'chapters' | 'lore' | 'settings') => {
    setActiveTab(tab);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300"
        />
      )}

      <aside className={`fixed inset-y-0 left-0 w-64 flex flex-col h-full shrink-0 select-none z-50 transition-transform duration-300 md:static md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } ${
        theme === 'dark' 
          ? 'bg-[#0E0E0E] border-r border-white/10 text-gray-300' 
          : 'bg-[#F4F4F5] border-r border-gray-200 text-gray-600'
      }`}>
      {/* Brand header */}
      <div className={`h-14 px-4 flex items-center justify-between transition-colors duration-200 ${
        theme === 'dark' ? 'bg-[#111111] border-b border-white/10' : 'bg-white border-b border-gray-200'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center text-white font-bold shrink-0">
            <PenTool size={16} className="stroke-[1.75]" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-indigo-500 uppercase tracking-widest font-extrabold font-serif">Authr</span>
            <span className={`text-xs font-medium font-sans truncate ${
              theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
            }`}>
              {selectedUniverse ? selectedUniverse.title : 'Select Universe'}
            </span>
          </div>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium shrink-0 ${
          theme === 'dark' ? 'bg-indigo-950/40 border border-indigo-500/30 text-indigo-400' : 'bg-indigo-50 border border-indigo-200 text-indigo-600'
        }`}>
          V2
        </span>
      </div>

      {/* Universe selector */}
      <div className={`px-4 py-4 relative border-b ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
        <label className="text-[10px] font-mono font-bold tracking-widest text-gray-500 uppercase mb-1.5 block px-1">
          active universe
        </label>
        
        {/* Toggle selector dropdown */}
        <button
          onClick={() => setIsOpenDropdown(!isOpenDropdown)}
          className={`w-full flex items-center justify-between rounded-md px-3 py-2 text-left text-xs font-medium transition-all cursor-pointer ${
            theme === 'dark'
              ? 'bg-[#111111] border border-white/10 text-gray-200 hover:border-indigo-500/50'
              : 'bg-white border border-gray-200 text-gray-700 hover:border-indigo-500'
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            <Layers size={14} className="text-indigo-400 shrink-0" />
            <span className="truncate">{selectedUniverse ? selectedUniverse.title : 'Select a Universe...'}</span>
          </div>
          {isOpenDropdown ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </button>

        {/* Dropdown panel */}
        {isOpenDropdown && (
          <div className={`absolute left-4 right-4 top-[calc(100%-8px)] rounded shadow-2xl z-40 max-h-60 overflow-y-auto mt-2 py-1.5 scrollbar-thin ${
            theme === 'dark' ? 'bg-[#151515] border border-white/10' : 'bg-white border border-gray-200'
          }`}>
            {universes.length === 0 ? (
              <div className="px-4 py-3 text-xs text-gray-500 italic text-center">
                No universes created yet.
              </div>
            ) : (
              universes.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    selectUniverse(u.id);
                    setIsOpenDropdown(false);
                    if (onClose) onClose();
                  }}
                  className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    theme === 'dark'
                      ? `hover:bg-white/5 ${u.id === selectedUniverseId ? 'bg-white/5 text-white font-medium' : 'text-gray-400'}`
                      : `hover:bg-gray-100 ${u.id === selectedUniverseId ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-gray-600'}`
                  }`}
                >
                  <span className="truncate pr-3">{u.title}</span>
                  {u.id === selectedUniverseId && <Check size={12} className="text-indigo-600 dark:text-indigo-400" />}
                </button>
              ))
            )}
            
            <div className={`h-px my-1 ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-150'}`}></div>
            
            <button
              onClick={() => {
                setIsCreatingUniv(true);
                setIsOpenDropdown(false);
              }}
              className="w-full text-left px-4 py-2 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus size={14} /> Create Universe
            </button>
          </div>
        )}
      </div>

      {/* Universe Creation Modal overlay/dialog simulation */}
      {isCreatingUniv && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-lg w-full max-w-md p-6 shadow-2xl transition-colors duration-200 ${
            theme === 'dark' ? 'bg-[#111111] border border-white/10 text-gray-300' : 'bg-white border border-gray-200 text-gray-700'
          }`}>
            <h2 className={`text-md font-semibold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Create Writer's Universe</h2>
            <p className="text-xs text-gray-500 mb-4 font-mono">The core master container for your timeline, rules, and cast.</p>
            
            <form onSubmit={handleCreateUniverse} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-indigo-500 uppercase tracking-wider block">Universe Title</label>
                <input
                  type="text"
                  placeholder="e.g. Chronicles of Aleria"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className={`w-full rounded-md px-4 py-2.5 text-sm focus:border-indigo-500/50 focus:outline-none ${
                    theme === 'dark' ? 'bg-[#151515] border border-white/10 text-white placeholder-gray-600' : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400'
                  }`}
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-indigo-500 uppercase tracking-wider block">Overview / Theme Statement</label>
                <textarea
                  rows={3}
                  placeholder="e.g. A dystopian high-fantasy universe where light has physical weight..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className={`w-full rounded-md px-4 py-2.5 text-sm focus:border-indigo-500/50 focus:outline-none resize-none ${
                    theme === 'dark' ? 'bg-[#151515] border border-white/10 text-white placeholder-gray-600' : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-950/40 border border-red-500/30 rounded text-xs text-red-400 font-mono">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingUniv(false);
                    setNewTitle('');
                    setNewDesc('');
                    setError(null);
                  }}
                  className={`px-4 py-2 rounded border text-xs font-medium transition-colors cursor-pointer ${
                    theme === 'dark' ? 'border-white/10 text-gray-300 hover:bg-white/5' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
                >
                  Initiate Universe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main navigation (Only if universe is selected) */}
      <div className="flex-1 px-2 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {selectedUniverseId ? (
          <>
            <label className="text-[10px] font-mono font-bold tracking-widest text-gray-500 uppercase mb-1.5 block px-3">
              workspace navigation
            </label>
            <button
              onClick={() => handleTabClick('chapters')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'chapters'
                  ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-l-2 border-indigo-500'
                  : 'text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <BookOpen size={14} className={activeTab === 'chapters' ? 'text-indigo-500' : 'text-gray-500'} />
              <span>Chapters & Outline</span>
            </button>
            
            <button
              onClick={() => handleTabClick('lore')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'lore'
                  ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-l-2 border-indigo-500'
                  : 'text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Users size={14} className={activeTab === 'lore' ? 'text-indigo-500' : 'text-gray-500'} />
              <span>Lore & Characters</span>
            </button>

            <button
              onClick={() => handleTabClick('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-l-2 border-indigo-500'
                  : 'text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Sliders size={14} className={activeTab === 'settings' ? 'text-indigo-500' : 'text-gray-500'} />
              <span>Universe Settings</span>
            </button>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <Layers size={32} className={`${theme === 'dark' ? 'text-gray-700' : 'text-gray-300'} mb-2.5`} />
            <p className="text-xs text-gray-500 leading-relaxed">
              Select or create a universe to begin crafting your narrative.
            </p>
            <button
              onClick={() => setIsCreatingUniv(true)}
              className={`mt-4 inline-flex items-center gap-1.5 border rounded px-3 py-1.5 text-xs font-mono font-medium transition-all cursor-pointer ${
                theme === 'dark' 
                  ? 'bg-[#111111] hover:bg-[#151515] text-indigo-400 border-white/10 hover:border-indigo-500/30' 
                  : 'bg-white hover:bg-gray-50 text-indigo-600 border-gray-200 hover:border-indigo-300'
              }`}
            >
              <FolderPlus size={13} /> Create Universe
            </button>
          </div>
        )}
      </div>

      {/* Writer User profile and logout footer */}
      <div className={`p-3 border-t transition-colors duration-200 ${
        theme === 'dark' ? 'border-white/10 bg-[#111111]' : 'border-gray-200 bg-white'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 font-mono ${
              theme === 'dark' ? 'bg-indigo-950/50 border border-indigo-500/30 text-indigo-400' : 'bg-indigo-50 border border-indigo-200 text-indigo-600'
            }`}>
              {user?.name ? user.name[0].toUpperCase() : 'W'}
            </div>
            <div className="min-w-0 leading-tight">
              <p className={`text-xs font-semibold truncate ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{user?.name || 'Writer'}</p>
              <p className="text-[10px] text-gray-500 font-mono truncate">@{user?.username || 'scribe'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className={`w-8 h-8 rounded flex items-center justify-center transition-colors cursor-pointer ${
                theme === 'dark' ? 'hover:bg-white/5 text-gray-500 hover:text-yellow-400' : 'hover:bg-gray-100 text-gray-400 hover:text-indigo-600'
              }`}
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <button
              onClick={logout}
              title="Exit Sanctuary"
              className={`w-8 h-8 rounded flex items-center justify-center transition-colors cursor-pointer ${
                theme === 'dark' ? 'hover:bg-white/5 text-gray-500 hover:text-red-400' : 'hover:bg-gray-100 text-gray-400 hover:text-red-500'
              }`}
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>
      </aside>
    </>
  );
}
