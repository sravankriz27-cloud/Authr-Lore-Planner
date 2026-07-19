/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { Save, Trash2, ShieldAlert, CheckCircle, Sliders } from 'lucide-react';

export default function UniverseSettings() {
  const selectedUniverseId = useAppStore((state) => state.selectedUniverseId);
  const universes = useAppStore((state) => state.universes);
  const updateUniverse = useAppStore((state) => state.updateUniverse);
  const deleteUniverse = useAppStore((state) => state.deleteUniverse);
  const selectUniverse = useAppStore((state) => state.selectUniverse);
  const theme = useAppStore((state) => state.theme);

  const activeUniverse = universes.find(u => u.id === selectedUniverseId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    if (activeUniverse) {
      setTitle(activeUniverse.title);
      setDescription(activeUniverse.description);
    }
  }, [selectedUniverseId, activeUniverse]);

  if (!activeUniverse) return null;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedUniverseId) return;

    setSaveStatus('saving');
    try {
      await updateUniverse(selectedUniverseId, title.trim(), description.trim());
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
    }
  };

  const handleDelete = async () => {
    if (confirm(`CRITICAL WARNING: Are you sure you want to completely erase the universe "${activeUniverse.title}"? \nThis action is irreversible and will delete all chapters, characters, and timelines associated with it.`)) {
      if (selectedUniverseId) {
        await deleteUniverse(selectedUniverseId);
        selectUniverse(null); // Return to default splash
      }
    }
  };

  return (
    <div className={`flex-1 p-8 flex justify-center overflow-y-auto scrollbar-thin transition-colors duration-200 ${
      theme === 'dark' ? 'bg-[#0A0A0A] text-gray-300' : 'bg-[#FAFAFA] text-gray-700'
    }`}>
      <div className={`w-full max-w-2xl border rounded-lg shadow-xl p-8 flex flex-col gap-6 h-fit transition-colors duration-200 ${
        theme === 'dark' ? 'bg-[#151515] border-white/10 shadow-2xl' : 'bg-white border-gray-200'
      }`}>
        
        {/* Header */}
        <div className={`border-b pb-4 flex items-center gap-3 transition-colors duration-200 ${
          theme === 'dark' ? 'border-white/10' : 'border-gray-200'
        }`}>
          <div className={`w-10 h-10 rounded border flex items-center justify-center text-indigo-500 transition-colors duration-200 ${
            theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
          }`}>
            <Sliders size={16} />
          </div>
          <div>
            <h2 className={`text-md font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-950'}`}>Universe Properties</h2>
            <p className="text-[10px] text-indigo-500 font-mono mt-0.5">Manage details of "{activeUniverse.title}"</p>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleUpdate} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-indigo-500 uppercase tracking-wider block">Universe Name / Novel Series</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full border rounded px-4 py-2.5 text-sm transition-colors duration-200 ${
                theme === 'dark' ? 'bg-[#0A0A0A] border-white/10 text-white focus:border-indigo-500/50 focus:outline-none' : 'bg-white border-gray-200 text-gray-800 focus:border-indigo-400'
              }`}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-indigo-500 uppercase tracking-wider block">Overview & Theme Statement</label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full border rounded px-4 py-2.5 text-sm transition-colors duration-200 resize-none leading-relaxed font-serif ${
                theme === 'dark' ? 'bg-[#0A0A0A] border-white/10 text-white focus:border-indigo-500/50 focus:outline-none' : 'bg-white border-gray-200 text-gray-800 focus:border-indigo-400'
              }`}
              placeholder="Outline the core rules, settings, or narrative themes of this fictional world..."
            />
          </div>

          <div className="flex justify-between items-center pt-2">
            <div>
              {saveStatus === 'saving' && (
                <span className="text-xs font-mono text-indigo-500 animate-pulse">Saving settings...</span>
              )}
              {saveStatus === 'saved' && (
                <span className="text-xs font-mono text-emerald-500 flex items-center gap-1">
                  <CheckCircle size={12} /> Settings updated successfully
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="text-xs font-mono text-red-500">Failed to save changes.</span>
              )}
            </div>

            <button
              type="submit"
              disabled={!title.trim() || saveStatus === 'saving'}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Save size={13} /> Update Ledger
            </button>
          </div>
        </form>

        {/* Danger zone line separation */}
        <div className={`border-t pt-6 mt-4 space-y-4 transition-colors duration-200 ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2 text-red-500">
            <ShieldAlert size={14} />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Danger Zone</span>
          </div>

          <div className={`rounded p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border transition-colors duration-200 ${
            theme === 'dark' ? 'bg-red-950/10 border-red-500/20' : 'bg-red-50 border-red-200'
          }`}>
            <div className="max-w-md">
              <h4 className="text-xs font-bold text-red-500">Erase Universe and Associated Timelines</h4>
              <p className={`text-[11px] mt-1 leading-relaxed font-serif transition-colors duration-200 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                Deleting this universe will completely scrub all of its characters, timelines, and chapter drafts. This action is final and can never be undone.
              </p>
            </div>

            <button
              type="button"
              onClick={handleDelete}
              className={`border text-[11px] font-mono py-2 px-4 rounded flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                theme === 'dark'
                  ? 'bg-red-950/40 border-red-500/30 hover:bg-red-900/40 text-red-400'
                  : 'bg-red-100 border-red-200 hover:bg-red-200 text-red-700'
              }`}
            >
              <Trash2 size={13} /> Terminate Universe
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
