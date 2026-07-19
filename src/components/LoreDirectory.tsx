/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAppStore } from '../store';
import { 
  Plus, 
  Search, 
  Trash2, 
  UserPlus, 
  Edit2, 
  ShieldAlert, 
  Eye, 
  Tag,
  UserCheck
} from 'lucide-react';
import { Character } from '../types';

const EMOJIS = ['👤', '👑', '🗡️', '🛡️', '🏹', '🔮', '🧪', '🧭', '⌛', '🦅', '🦁', '🐉', '💀', '🔥', '💧', '🌿'];

export default function LoreDirectory() {
  const selectedUniverseId = useAppStore((state) => state.selectedUniverseId);
  const characters = useAppStore((state) => state.characters);
  const createCharacter = useAppStore((state) => state.createCharacter);
  const updateCharacter = useAppStore((state) => state.updateCharacter);
  const deleteCharacter = useAppStore((state) => state.deleteCharacter);
  const theme = useAppStore((state) => state.theme);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  
  // Modal & form states
  const [isOpenForm, setIsOpenForm] = useState(false);
  const [editingCharId, setEditingCharId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [role, setRole] = useState('Supporting');
  const [personality, setPersonality] = useState('');
  const [appearance, setAppearance] = useState('');
  const [abilities, setAbilities] = useState('');
  const [avatar, setAvatar] = useState('👤');

  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);

  const selectedChar = characters.find(c => c.id === selectedCharacterId);

  const handleOpenCreate = () => {
    setEditingCharId(null);
    setName('');
    setBio('');
    setRole('Supporting');
    setPersonality('');
    setAppearance('');
    setAbilities('');
    setAvatar('👤');
    setIsOpenForm(true);
  };

  const handleOpenEdit = (char: Character) => {
    setEditingCharId(char.id);
    setName(char.name);
    setBio(char.bio);
    setRole(char.traits.role);
    setPersonality(char.traits.personality);
    setAppearance(char.traits.appearance);
    setAbilities(char.traits.abilities);
    setAvatar(char.avatar);
    setIsOpenForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedUniverseId) return;

    const charData = {
      name: name.trim(),
      bio: bio.trim(),
      avatar,
      traits: {
        role,
        personality: personality.trim(),
        appearance: appearance.trim(),
        abilities: abilities.trim()
      }
    };

    if (editingCharId) {
      await updateCharacter(selectedUniverseId, editingCharId, charData);
    } else {
      await createCharacter(selectedUniverseId, charData);
    }

    setIsOpenForm(false);
  };

  const handleDelete = (charId: string) => {
    if (confirm('Are you sure you want to remove this character from your universe lore database?')) {
      if (selectedUniverseId) {
        deleteCharacter(selectedUniverseId, charId);
        if (selectedCharacterId === charId) {
          setSelectedCharacterId(null);
        }
      }
    }
  };

  // Filtered lists
  const filteredCharacters = characters.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                          c.bio.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || c.traits.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className={`flex-1 flex h-full overflow-hidden transition-colors duration-200 ${
      theme === 'dark' ? 'bg-[#0A0A0A] text-gray-300' : 'bg-white text-gray-800'
    }`}>
      
      {/* List Panel */}
      <div className={`w-80 border-r flex flex-col h-full shrink-0 select-none transition-colors duration-200 ${
        theme === 'dark' ? 'border-white/10 bg-[#0E0E0E]' : 'border-gray-200 bg-white'
      }`}>
        
        {/* Search header */}
        <div className={`p-4 border-b space-y-3 shrink-0 transition-colors duration-200 ${
          theme === 'dark' ? 'border-white/10 bg-[#111111]' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cast of Characters</h3>
              <p className="text-[10px] text-indigo-500 font-mono mt-0.5">{characters.length} characters registered</p>
            </div>
            <button
              onClick={handleOpenCreate}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded transition-all cursor-pointer flex items-center gap-1"
            >
              <UserPlus size={13} /> Add Hero
            </button>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={13} />
              <input
                type="text"
                placeholder="Search lore ledger..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full border rounded-md pl-9 pr-4 py-1.5 text-xs focus:border-indigo-500/50 focus:outline-none ${
                  theme === 'dark' ? 'bg-[#151515] border-white/10 text-white placeholder-gray-600' : 'bg-white border-gray-200 text-gray-850 placeholder-gray-400'
                }`}
              />
            </div>
            
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className={`border rounded-md px-2 py-1.5 text-xs focus:border-indigo-500/50 focus:outline-none cursor-pointer ${
                theme === 'dark' ? 'bg-[#151515] border-white/10 text-gray-400' : 'bg-white border-gray-200 text-gray-600'
              }`}
            >
              <option value="all">All Roles</option>
              <option value="Protagonist">Protagonist</option>
              <option value="Antagonist">Antagonist</option>
              <option value="Supporting">Supporting</option>
              <option value="Deuteragonist">Deuteragonist</option>
              <option value="Mentor">Mentor</option>
            </select>
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
          {filteredCharacters.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <ShieldAlert size={24} className="text-gray-400 mb-2" />
              <p className="text-xs text-gray-500 leading-relaxed">
                No characters found. Search a different keyword or create a new hero!
              </p>
            </div>
          ) : (
            filteredCharacters.map((char) => {
              const isSelected = selectedCharacterId === char.id;
              const roleColors: Record<string, string> = {
                Protagonist: 'text-indigo-550 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-500/20',
                Antagonist: 'text-red-550 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-500/20',
                Supporting: theme === 'dark' ? 'text-gray-400 bg-white/5 border border-white/5' : 'text-gray-600 bg-gray-100 border border-gray-200',
                Deuteragonist: 'text-purple-550 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border border-purple-500/20',
                Mentor: 'text-amber-600 dark:text-amber-500/80 bg-amber-50 dark:bg-amber-950/40 border border-amber-500/20'
              };
              const tagStyle = roleColors[char.traits.role] || 'text-gray-500 bg-white/5';

              return (
                <div
                  key={char.id}
                  onClick={() => setSelectedCharacterId(char.id)}
                  className={`relative flex items-center gap-3 p-2 rounded border transition-all duration-150 cursor-pointer ${
                    isSelected 
                      ? 'border-indigo-500/50 bg-indigo-500/5 text-indigo-650 dark:text-indigo-400' 
                      : theme === 'dark'
                        ? 'bg-[#151515]/20 border-transparent hover:border-white/5 hover:bg-white/5 text-gray-400'
                        : 'bg-transparent border-transparent hover:border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className={`w-9 h-9 rounded border flex items-center justify-center text-base shadow-inner shrink-0 ${
                    theme === 'dark' ? 'bg-[#111111] border-white/10' : 'bg-gray-100 border-gray-250'
                  }`}>
                    {char.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-xs font-semibold truncate ${isSelected ? 'text-indigo-600 dark:text-indigo-300' : theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>{char.name}</h4>
                    <span className={`inline-block text-[8px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mt-1 ${tagStyle}`}>
                      {char.traits.role}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Detail Panel */}
      <div className={`flex-1 overflow-y-auto p-8 flex justify-center scrollbar-thin transition-colors duration-200 ${
        theme === 'dark' ? 'bg-[#0A0A0A]' : 'bg-[#FAFAFA]'
      }`}>
        {selectedChar ? (
          <div className={`w-full max-w-2xl border rounded-lg shadow-xl overflow-hidden flex flex-col h-fit transition-colors duration-200 ${
            theme === 'dark' ? 'bg-[#151515] border-white/10 text-gray-300 shadow-2xl' : 'bg-white border-gray-200 text-gray-700'
          }`}>
            
            {/* Banner details */}
            <div className={`relative px-8 py-8 border-b flex items-center gap-6 shrink-0 transition-colors duration-200 ${
              theme === 'dark' ? 'bg-[#111111] border-white/10' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className={`w-16 h-16 rounded border-2 flex items-center justify-center text-3xl shadow-sm transition-colors duration-200 ${
                theme === 'dark' ? 'bg-[#151515] border-indigo-500/30' : 'bg-white border-indigo-200'
              }`}>
                {selectedChar.avatar}
              </div>
              <div className="min-w-0">
                <h2 className={`text-xl font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-gray-950'}`}>{selectedChar.name}</h2>
                <span className="inline-flex items-center gap-1 text-[10px] text-indigo-500 font-mono font-bold uppercase tracking-wider mt-1.5">
                  <Tag size={10} /> {selectedChar.traits.role}
                </span>
              </div>

              <div className="absolute right-6 top-6 flex gap-2">
                <button
                  onClick={() => handleOpenEdit(selectedChar)}
                  className={`w-8 h-8 rounded border flex items-center justify-center transition-all cursor-pointer ${
                    theme === 'dark'
                      ? 'hover:bg-white/5 text-gray-500 hover:text-white border-white/10'
                      : 'hover:bg-gray-100 text-gray-400 hover:text-gray-800 border-gray-200'
                  }`}
                  title="Edit Character Sheet"
                >
                  <Edit2 size={13} />
                </button>
                <button
                  onClick={() => handleDelete(selectedChar.id)}
                  className={`w-8 h-8 rounded border flex items-center justify-center transition-all cursor-pointer ${
                    theme === 'dark'
                      ? 'hover:bg-white/5 text-gray-500 hover:text-red-400 border-white/10'
                      : 'hover:bg-gray-100 text-gray-400 hover:text-red-500 border-gray-200'
                  }`}
                  title="Remove Character"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {/* Content Details */}
            <div className="p-6 space-y-6 flex-1">
              {/* Biography block */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-mono font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1">
                  <UserCheck size={12} /> Biography & Origin
                </h4>
                <div className={`border rounded p-4 text-xs leading-relaxed whitespace-pre-wrap font-serif transition-colors duration-200 ${
                  theme === 'dark' ? 'bg-[#0A0A0A] border-white/5 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'
                }`}>
                  {selectedChar.bio || 'This character currently has no biography outlined.'}
                </div>
              </div>

              {/* Traits breakdown */}
              <div className="grid grid-cols-2 gap-4">
                <div className={`border rounded p-4 space-y-1.5 transition-colors duration-200 ${
                  theme === 'dark' ? 'bg-[#0A0A0A] border-white/5' : 'bg-gray-50 border-gray-200'
                }`}>
                  <span className={`text-[9px] font-mono font-bold uppercase tracking-wider block ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Personality</span>
                  <p className={`text-xs leading-relaxed whitespace-pre-wrap font-serif ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{selectedChar.traits.personality || 'Undetermined'}</p>
                </div>

                <div className={`border rounded p-4 space-y-1.5 transition-colors duration-200 ${
                  theme === 'dark' ? 'bg-[#0A0A0A] border-white/5' : 'bg-gray-50 border-gray-200'
                }`}>
                  <span className={`text-[9px] font-mono font-bold uppercase tracking-wider block ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Abilities & Talents</span>
                  <p className={`text-xs leading-relaxed whitespace-pre-wrap font-serif ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{selectedChar.traits.abilities || 'None'}</p>
                </div>
              </div>

              <div className={`border rounded p-4 space-y-1.5 transition-colors duration-200 ${
                theme === 'dark' ? 'bg-[#0A0A0A] border-white/5' : 'bg-gray-50 border-gray-200'
              }`}>
                <span className={`text-[9px] font-mono font-bold uppercase tracking-wider block ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Physical Appearance</span>
                <p className={`text-xs leading-relaxed whitespace-pre-wrap font-serif ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{selectedChar.traits.appearance || 'Undetermined'}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center max-w-sm m-auto">
            <Eye size={36} className={`${theme === 'dark' ? 'text-gray-850' : 'text-gray-300'} mb-3 stroke-[1.5]`} />
            <h3 className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-gray-950'}`}>Inspect Character File</h3>
            <p className={`text-xs leading-relaxed mt-1.5 font-serif ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
              Select a protagonist, antagonist, or mentor from the directory to review their traits, motives, and physical dossier.
            </p>
          </div>
        )}
      </div>

      {/* Hero / Character Creation Form Overlay Modal */}
      {isOpenForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className={`border rounded-lg w-full max-w-lg p-6 my-8 shadow-2xl flex flex-col max-h-[90vh] transition-colors duration-200 ${
            theme === 'dark' ? 'bg-[#111111] border-white/10 text-gray-300' : 'bg-white border-gray-200 text-gray-800'
          }`}>
            <h2 className={`text-md font-semibold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-950'}`}>
              {editingCharId ? 'Update Dossier' : 'Register Hero / Ally'}
            </h2>
            <p className="text-xs text-gray-500 mb-4 font-mono">
              Build lore parameters, role designations, and custom traits.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1 scrollbar-thin">
              {/* Name & Avatar */}
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-3 space-y-1.5">
                  <label className="text-[10px] font-mono text-indigo-500 uppercase tracking-wider block">Character Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Gandalf the Grey"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full border rounded-md px-4 py-2.5 text-sm focus:border-indigo-500/50 focus:outline-none transition-colors duration-200 ${
                      theme === 'dark' ? 'bg-[#151515] border-white/10 text-white placeholder-gray-700' : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400'
                    }`}
                    autoFocus
                  />
                </div>

                <div className="col-span-1 space-y-1.5">
                  <label className="text-[10px] font-mono text-indigo-500 uppercase tracking-wider block">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className={`w-full border rounded-md px-2 py-2.5 text-xs focus:border-indigo-500/50 focus:outline-none cursor-pointer transition-colors duration-200 ${
                      theme === 'dark' ? 'bg-[#151515] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-750'
                    }`}
                  >
                    <option value="Protagonist">Protagonist</option>
                    <option value="Antagonist">Antagonist</option>
                    <option value="Supporting">Supporting</option>
                    <option value="Deuteragonist">Deuteragonist</option>
                    <option value="Mentor">Mentor</option>
                  </select>
                </div>
              </div>

              {/* Avatar Emoji Select */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-indigo-500 uppercase tracking-wider block">Dossier Icon / Emblem</label>
                <div className={`flex flex-wrap gap-2 border rounded-md p-3 transition-colors duration-200 ${
                  theme === 'dark' ? 'bg-[#151515] border-white/10' : 'bg-gray-50 border-gray-200'
                }`}>
                  {EMOJIS.map((e) => (
                    <button
                      type="button"
                      key={e}
                      onClick={() => setAvatar(e)}
                      className={`w-9 h-9 rounded flex items-center justify-center text-lg border transition-all hover:scale-110 cursor-pointer ${
                        avatar === e 
                          ? 'bg-indigo-600/20 border-indigo-500 text-white' 
                          : theme === 'dark'
                            ? 'bg-[#111111] border-transparent hover:border-white/10' 
                            : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-indigo-500 uppercase tracking-wider block">Origin & Biography</label>
                <textarea
                  rows={3}
                  placeholder="Where do they come from? What are their core goals or fatal flaws?"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className={`w-full border rounded-md px-4 py-2 text-sm focus:border-indigo-500/50 focus:outline-none resize-none transition-colors duration-200 ${
                    theme === 'dark' ? 'bg-[#151515] border-white/10 text-white placeholder-gray-700' : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400'
                  }`}
                />
              </div>

              {/* Personality traits */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-indigo-500 uppercase tracking-wider block">Personality Quirks & Trait Profile</label>
                <input
                  type="text"
                  placeholder="e.g. Sarcastic, fiercely loyal, deeply regretful of past timeline edits"
                  value={personality}
                  onChange={(e) => setPersonality(e.target.value)}
                  className={`w-full border rounded-md px-4 py-2 text-sm focus:border-indigo-500/50 focus:outline-none transition-colors duration-200 ${
                    theme === 'dark' ? 'bg-[#151515] border-white/10 text-white placeholder-gray-700' : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400'
                  }`}
                />
              </div>

              {/* Abilities */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-indigo-500 uppercase tracking-wider block">Abilities, Traits & Special Talents</label>
                <input
                  type="text"
                  placeholder="e.g. Fire magic, master swordsmanship, chronostorm memorization"
                  value={abilities}
                  onChange={(e) => setAbilities(e.target.value)}
                  className={`w-full border rounded-md px-4 py-2 text-sm focus:border-indigo-500/50 focus:outline-none transition-colors duration-200 ${
                    theme === 'dark' ? 'bg-[#151515] border-white/10 text-white placeholder-gray-700' : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400'
                  }`}
                />
              </div>

              {/* Appearance */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-indigo-500 uppercase tracking-wider block">Visual Dress / Physical Appearance</label>
                <input
                  type="text"
                  placeholder="e.g. Silver hair, cybernetic eye, weathered brown wizard cloak"
                  value={appearance}
                  onChange={(e) => setAppearance(e.target.value)}
                  className={`w-full border rounded-md px-4 py-2 text-sm focus:border-indigo-500/50 focus:outline-none transition-colors duration-200 ${
                    theme === 'dark' ? 'bg-[#151515] border-white/10 text-white placeholder-gray-700' : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400'
                  }`}
                />
              </div>

              {/* Actions footer */}
              <div className={`flex justify-end gap-3 pt-4 border-t shrink-0 ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
                <button
                  type="button"
                  onClick={() => setIsOpenForm(false)}
                  className={`px-4 py-2 rounded text-xs font-medium border transition-all cursor-pointer ${
                    theme === 'dark' ? 'border-white/10 hover:bg-white/5 text-gray-400' : 'border-gray-200 hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  Discard Ledger
                </button>
                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="px-4 py-2 rounded text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all disabled:opacity-40 cursor-pointer"
                >
                  {editingCharId ? 'Seal Updates' : 'Commit Lore Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
