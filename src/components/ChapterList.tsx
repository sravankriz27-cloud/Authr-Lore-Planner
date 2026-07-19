/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAppStore } from '../store';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  BookOpen, 
  CheckCircle, 
  FileText,
  Clock
} from 'lucide-react';
import { Chapter } from '../types';

export default function ChapterList() {
  const selectedUniverseId = useAppStore((state) => state.selectedUniverseId);
  const chapters = useAppStore((state) => state.chapters);
  const selectedChapterId = useAppStore((state) => state.selectedChapterId);
  const selectChapter = useAppStore((state) => state.selectChapter);
  const createChapter = useAppStore((state) => state.createChapter);
  const deleteChapter = useAppStore((state) => state.deleteChapter);
  const reorderChapters = useAppStore((state) => state.reorderChapters);
  const theme = useAppStore((state) => state.theme);

  const [newTitle, setNewTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !selectedUniverseId) return;

    const newChap = await createChapter(selectedUniverseId, newTitle.trim());
    if (newChap) {
      selectChapter(newChap.id);
      setIsCreating(false);
      setNewTitle('');
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this chapter? This cannot be undone and will resequence remaining chapters.')) {
      if (selectedUniverseId) {
        deleteChapter(selectedUniverseId, id);
      }
    }
  };

  // ==========================================
  // HTML5 DRAG AND DROP HANDLERS
  // ==========================================
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex || !selectedUniverseId) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Clone and rearrange the chapter ID array
    const orderedIds = chapters.map((c) => c.id);
    const [draggedId] = orderedIds.splice(draggedIndex, 1);
    orderedIds.splice(dropIndex, 0, draggedId);

    // Call state action to optimistically update UI and commit to backend
    reorderChapters(selectedUniverseId, orderedIds);

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const calculateReadingTime = (content: string) => {
    // Basic word count based reading time estimation (200 wpm)
    const textOnly = content.replace(/<[^>]*>/g, ' ');
    const words = textOnly.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return `${minutes} min read`;
  };

  const getWordCount = (content: string) => {
    const textOnly = content.replace(/<[^>]*>/g, ' ');
    return textOnly.trim().split(/\s+/).filter(Boolean).length;
  };

  return (
    <div className={`w-full md:w-64 flex flex-col h-full shrink-0 select-none transition-colors duration-200 ${
      theme === 'dark' ? 'bg-[#0E0E0E] border-r border-white/10 text-gray-300' : 'bg-white border-r border-gray-200 text-gray-700'
    }`}>
      {/* Header with quick creation */}
      <div className={`p-4 flex items-center justify-between transition-colors duration-200 border-b ${
        theme === 'dark' ? 'border-white/10 bg-[#111111]' : 'border-gray-200 bg-gray-50'
      }`}>
        <div>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Chapters</h3>
          <p className="text-[10px] text-indigo-500 font-mono mt-0.5">{chapters.length} drafted</p>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className={`w-7 h-7 rounded border flex items-center justify-center transition-all cursor-pointer ${
            theme === 'dark'
              ? 'bg-[#151515] border-white/10 hover:bg-indigo-600 hover:text-white text-gray-400'
              : 'bg-white border-gray-200 hover:bg-indigo-600 hover:text-white text-gray-500'
          }`}
          title="Draft New Chapter"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Inline Chapter Creation Form */}
      {isCreating && (
        <form onSubmit={handleCreate} className={`p-4 border-b space-y-3 transition-colors duration-200 ${
          theme === 'dark' ? 'bg-[#111111] border-white/10' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-indigo-500 uppercase tracking-wider block">Chapter Title</label>
            <input
              type="text"
              placeholder="e.g. 01. The Silent Wake"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className={`w-full rounded-md px-3 py-1.5 text-xs focus:border-indigo-500/50 focus:outline-none ${
                theme === 'dark' ? 'bg-[#151515] border-white/10 text-white placeholder-gray-700' : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400'
              }`}
              autoFocus
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setNewTitle('');
              }}
              className={`px-2.5 py-1 rounded text-[10px] font-mono border ${
                theme === 'dark' ? 'border-white/10 text-gray-400 hover:bg-white/5' : 'border-gray-200 text-gray-500 hover:bg-gray-100'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newTitle.trim()}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-mono font-bold disabled:opacity-40"
            >
              Draft
            </button>
          </div>
        </form>
      )}

      {/* Chapters Scroll Area */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
        {chapters.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <BookOpen size={24} className="text-gray-400 mb-2" />
            <p className="text-xs text-gray-500 leading-relaxed">
              No chapters drafted yet. Click the plus button above to outline your first sequence.
            </p>
          </div>
        ) : (
          chapters.map((chap, idx) => {
            const isSelected = selectedChapterId === chap.id;
            const isDragOver = dragOverIndex === idx;

            return (
              <div
                key={chap.id}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, idx)}
                onClick={() => selectChapter(chap.id)}
                className={`group relative flex items-start gap-2 p-2 rounded border transition-all duration-150 cursor-pointer ${
                  isSelected 
                    ? 'border-indigo-500/50 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400' 
                    : theme === 'dark'
                      ? 'bg-transparent hover:bg-white/5 text-gray-400 border-transparent hover:border-white/5'
                      : 'bg-transparent hover:bg-gray-100 text-gray-600 border-transparent hover:border-gray-200'
                } ${isDragOver ? 'border-dashed border-indigo-500 scale-[1.01]' : ''}`}
              >
                {/* Drag handle */}
                <div 
                  className={`mt-0.5 cursor-grab active:cursor-grabbing p-0.5 opacity-40 group-hover:opacity-100 transition-opacity ${
                    theme === 'dark' ? 'text-gray-600 hover:text-white' : 'text-gray-400 hover:text-gray-800'
                  }`}
                  title="Drag to sequence chapter"
                >
                  <GripVertical size={12} />
                </div>

                {/* Main chapter node details */}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`text-[9px] font-mono px-1 py-0.5 rounded ${
                      isSelected 
                        ? 'bg-indigo-950/40 text-indigo-400 border border-indigo-500/30' 
                        : theme === 'dark'
                          ? 'bg-[#151515] text-gray-500 border border-white/5' 
                          : 'bg-gray-100 text-gray-500 border border-gray-200'
                    }`}>
                      {(idx + 1).toString().padStart(2, '0')}
                    </span>
                    {chap.isPublished ? (
                      <span className="text-[9px] font-mono text-emerald-500 flex items-center gap-0.5 bg-emerald-950/10 px-1 py-0.5 rounded border border-emerald-500/20">
                        <CheckCircle size={8} /> Published
                      </span>
                    ) : (
                      <span className={`text-[9px] font-mono flex items-center gap-0.5 px-1 py-0.5 rounded border ${
                        theme === 'dark' ? 'bg-[#151515] text-gray-500 border-white/5' : 'bg-gray-50 text-gray-500 border-gray-200'
                      }`}>
                        <FileText size={8} /> Draft
                      </span>
                    )}
                  </div>

                  <h4 className={`text-xs font-semibold truncate ${
                    isSelected 
                      ? 'text-indigo-600 dark:text-indigo-300 font-medium' 
                      : theme === 'dark' 
                        ? 'text-gray-300' 
                        : 'text-gray-800'
                  }`}>
                    {chap.title}
                  </h4>

                  {/* Micro stats */}
                  <div className="flex items-center gap-2 mt-1.5 text-[9px] text-gray-500 font-mono">
                    <span className="flex items-center gap-0.5">
                      {getWordCount(chap.content)} words
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5">
                      <Clock size={8} /> {calculateReadingTime(chap.content)}
                    </span>
                  </div>
                </div>

                {/* Delete trigger (visible on hover) */}
                <button
                  onClick={(e) => handleDelete(e, chap.id)}
                  className={`absolute right-2 top-2 opacity-0 group-hover:opacity-100 p-1 rounded transition-all cursor-pointer shrink-0 ${
                    theme === 'dark' ? 'hover:text-red-400 text-gray-500 hover:bg-white/5' : 'hover:text-red-500 text-gray-400 hover:bg-gray-100'
                  }`}
                  title="Delete Chapter"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
