/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store';
import { 
  Save, 
  Sparkles, 
  Maximize2, 
  Minimize2, 
  Volume2, 
  VolumeX, 
  Bold, 
  Italic, 
  Heading1, 
  Heading2, 
  List, 
  Quote, 
  Undo, 
  Redo, 
  Eye, 
  EyeOff,
  Clock,
  BookOpen
} from 'lucide-react';
import { typewriterSound } from '../utils/sound';
import DOMPurify from 'dompurify';

export default function Editor() {
  const selectedUniverseId = useAppStore((state) => state.selectedUniverseId);
  const selectedChapterId = useAppStore((state) => state.selectedChapterId);
  const chapters = useAppStore((state) => state.chapters);
  const updateChapter = useAppStore((state) => state.updateChapter);
  const saveStatus = useAppStore((state) => state.saveStatus);
  const theme = useAppStore((state) => state.theme);

  const activeChapter = chapters.find(c => c.id === selectedChapterId);

  // Editor states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  // Active formatting state
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    h2: false,
    h3: false,
    list: false,
    quote: false
  });

  const contentRef = useRef<HTMLDivElement>(null);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const updateActiveFormats = () => {
    if (typeof document === 'undefined') return;
    const selection = window.getSelection();
    
    const formats = {
      bold: false,
      italic: false,
      h2: false,
      h3: false,
      list: false,
      quote: false
    };

    try {
      if (document.queryCommandState('bold')) formats.bold = true;
      if (document.queryCommandState('italic')) formats.italic = true;
      if (document.queryCommandState('insertUnorderedList')) formats.list = true;
    } catch (e) {}

    if (selection && selection.rangeCount > 0) {
      let node: Node | null = selection.anchorNode;
      if (contentRef.current && contentRef.current.contains(node)) {
        while (node && node !== contentRef.current) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const tagName = (node as Element).tagName.toLowerCase();
            if (tagName === 'h2') formats.h2 = true;
            if (tagName === 'h3') formats.h3 = true;
            if (tagName === 'blockquote') formats.quote = true;
            if (tagName === 'ul') formats.list = true;
            if (tagName === 'strong' || tagName === 'b') formats.bold = true;
            if (tagName === 'em' || tagName === 'i') formats.italic = true;
          }
          node = node.parentNode;
        }
      }
    }

    setActiveFormats(formats);
  };

  // Sync editor with active chapter selection
  useEffect(() => {
    if (activeChapter) {
      setTitle(activeChapter.title);
      setContent(activeChapter.content);
      
      // Calculate word count
      const textOnly = activeChapter.content.replace(/<[^>]*>/g, ' ');
      setWordCount(textOnly.trim().split(/\s+/).filter(Boolean).length);

      if (contentRef.current) {
        contentRef.current.innerHTML = activeChapter.content;
      }

      setActiveFormats({
        bold: false,
        italic: false,
        h2: false,
        h3: false,
        list: false,
        quote: false
      });
    } else {
      setTitle('');
      setContent('');
      setWordCount(0);
      if (contentRef.current) {
        contentRef.current.innerHTML = '';
      }
    }
  }, [selectedChapterId]);

  // Clean timer on unmount
  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, []);

  if (!activeChapter) {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center text-center p-8 transition-colors duration-200 ${
        theme === 'dark' ? 'bg-[#0A0A0A] text-gray-400' : 'bg-[#FAFAFA] text-gray-600'
      }`}>
        <BookOpen size={40} className={`${theme === 'dark' ? 'text-gray-800' : 'text-gray-300'} mb-4 stroke-[1.5]`} />
        <h2 className={`text-sm font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-gray-950'}`}>No Chapter Selected</h2>
        <p className={`text-xs max-w-sm mt-2 leading-relaxed font-serif ${theme === 'dark' ? 'text-gray-500' : 'text-gray-650'}`}>
          Choose a chapter from the sequence timeline or draft a brand-new chapter to open the writing ledger.
        </p>
      </div>
    );
  }

  // ==========================================
  // AUTOSAVE DEBOUNCE LOGIC
  // ==========================================
  const triggerAutosave = (newTitle: string, newContent: string) => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    // Sanitize with DOMPurify on the client before saving!
    const sanitizedHTML = DOMPurify.sanitize(newContent);

    autosaveTimerRef.current = setTimeout(() => {
      if (selectedUniverseId && selectedChapterId) {
        updateChapter(selectedUniverseId, selectedChapterId, {
          title: newTitle.trim() || 'Untitled Chapter',
          content: sanitizedHTML
        }, true); // silent flag as true to not trigger heavy block overlays
      }
    }, 1500); // 1.5 second debounce for writing comfort
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    triggerAutosave(val, content);
  };

  const handleContentInput = () => {
    if (contentRef.current) {
      const html = contentRef.current.innerHTML;
      setContent(html);

      // Extract raw text to calculate word counts
      const textOnly = contentRef.current.innerText || '';
      setWordCount(textOnly.trim().split(/\s+/).filter(Boolean).length);

      triggerAutosave(title, html);
    }
  };

  // ==========================================
  // TEXT FORMATTING COMMANDS
  // ==========================================
  const handleFormat = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    handleContentInput();
    // Return focus to content editable
    contentRef.current?.focus();
    updateActiveFormats();
  };

  // ==========================================
  // SOUND INTEGRATION FOR KEYPRESSES
  // ==========================================
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isSoundOn) return;

    if (e.key === 'Enter') {
      typewriterSound.playReturn();
    } else if (e.key === ' ') {
      typewriterSound.playSpace();
    } else if (e.key.length === 1) {
      typewriterSound.playKey();
    }
  };

  const handleSoundToggle = () => {
    const nextState = !isSoundOn;
    setIsSoundOn(nextState);
    typewriterSound.toggle(nextState);
  };

  const togglePublishState = () => {
    if (selectedUniverseId && selectedChapterId) {
      updateChapter(selectedUniverseId, selectedChapterId, {
        isPublished: !activeChapter.isPublished
      });
    }
  };

  const forceSave = () => {
    if (selectedUniverseId && selectedChapterId) {
      const html = contentRef.current ? contentRef.current.innerHTML : content;
      const sanitizedHTML = DOMPurify.sanitize(html);
      
      updateChapter(selectedUniverseId, selectedChapterId, {
        title: title.trim() || 'Untitled Chapter',
        content: sanitizedHTML
      });
    }
  };

  const calculateReadingTime = () => {
    const minutes = Math.max(1, Math.ceil(wordCount / 200));
    return `${minutes} mins`;
  };

  return (
    <div className={`flex-1 flex flex-col h-full transition-all duration-300 ${
      isFocusMode ? 'z-50 fixed inset-0' : 'relative'
    } ${theme === 'dark' ? 'bg-[#0A0A0A]' : 'bg-white'}`}>
      
      {/* Editor Control Header */}
      <div className={`h-14 border-b px-6 flex items-center justify-between shrink-0 transition-colors duration-200 ${
        theme === 'dark' ? 'border-white/10 bg-[#111111]' : 'border-gray-200 bg-gray-50'
      }`}>
        
        {/* Left Side: Chapter Detail & Auto-save Status */}
        <div className="flex items-center gap-3">
          <button
            onClick={togglePublishState}
            className={`px-3 py-1 rounded text-[10px] font-mono font-medium flex items-center gap-1 cursor-pointer transition-colors ${
              activeChapter.isPublished 
                ? 'bg-emerald-950/40 text-emerald-500 border border-emerald-500/20' 
                : theme === 'dark'
                  ? 'bg-[#151515] text-gray-400 border border-white/10 hover:border-indigo-500/50'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-500/50 hover:bg-gray-50'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${activeChapter.isPublished ? 'bg-emerald-400' : 'bg-gray-400'}`}></span>
            {activeChapter.isPublished ? 'Published' : 'Draft'}
          </button>

          {/* Sync badge info */}
          <div className="text-[10px] font-mono">
            {saveStatus === 'saving' && (
              <span className="text-indigo-400 flex items-center gap-1.5 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> saving draft...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> saved to cloud
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-red-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> sync failed
              </span>
            )}
            {saveStatus === 'idle' && (
              <span className={`${theme === 'dark' ? 'text-gray-500' : 'text-gray-405'} flex items-center gap-1.5`}>
                <span className={`w-1.5 h-1.5 rounded-full ${theme === 'dark' ? 'bg-gray-500' : 'bg-gray-400'}`}></span> synced
              </span>
            )}
          </div>
        </div>

        {/* Right Side: Environment Settings */}
        <div className="flex items-center gap-2">
          {/* Mechanical sound engine */}
          <button
            onClick={handleSoundToggle}
            className={`w-8 h-8 rounded flex items-center justify-center transition-all border cursor-pointer ${
              isSoundOn 
                ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/40 shadow-lg' 
                : theme === 'dark'
                  ? 'bg-[#151515] text-gray-500 hover:text-white border-white/10'
                  : 'bg-white text-gray-500 hover:text-gray-800 border-gray-200 hover:bg-gray-50'
            }`}
            title={isSoundOn ? "Mute typewriter sound effects" : "Turn on mechanical typewriter feedback sound"}
          >
            {isSoundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>

          {/* Focus Mode */}
          <button
            onClick={() => setIsFocusMode(!isFocusMode)}
            className={`w-8 h-8 rounded flex items-center justify-center transition-all border cursor-pointer ${
              isFocusMode 
                ? 'bg-indigo-600 text-white border-indigo-500' 
                : theme === 'dark'
                  ? 'bg-[#151515] text-gray-500 hover:text-white border-white/10'
                  : 'bg-white text-gray-500 hover:text-gray-800 border-gray-200 hover:bg-gray-50'
            }`}
            title={isFocusMode ? "Exit Fullscreen Focus" : "Enter Serene Focus Mode"}
          >
            {isFocusMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>

          {/* Save Action */}
          <button
            onClick={forceSave}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3 py-1.5 rounded transition-all shadow-md cursor-pointer"
            title="Save Chapter Manually"
          >
            <Save size={13} />
            <span>Save Ledger</span>
          </button>
        </div>
      </div>

      {/* Elegant floating formatting toolbar */}
      <div className={`h-11 border-b px-6 flex items-center gap-1 shrink-0 select-none transition-colors duration-200 ${
        theme === 'dark' ? 'border-white/5 bg-[#111111]' : 'border-gray-200 bg-gray-50'
      }`}>
        <button
          onClick={() => handleFormat('bold')}
          className={`w-7 h-7 rounded flex items-center justify-center transition-all cursor-pointer border ${
            activeFormats.bold
              ? theme === 'dark'
                ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                : 'bg-indigo-100 text-indigo-600 border-indigo-200'
              : theme === 'dark'
                ? 'hover:bg-white/5 text-gray-400 hover:text-white border-transparent'
                : 'hover:bg-gray-200/50 text-gray-600 hover:text-black border-transparent'
          }`}
          title="Bold (Ctrl+B)"
        >
          <Bold size={13} />
        </button>
        <button
          onClick={() => handleFormat('italic')}
          className={`w-7 h-7 rounded flex items-center justify-center transition-all cursor-pointer border ${
            activeFormats.italic
              ? theme === 'dark'
                ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                : 'bg-indigo-100 text-indigo-600 border-indigo-200'
              : theme === 'dark'
                ? 'hover:bg-white/5 text-gray-400 hover:text-white border-transparent'
                : 'hover:bg-gray-200/50 text-gray-600 hover:text-black border-transparent'
          }`}
          title="Italic (Ctrl+I)"
        >
          <Italic size={13} />
        </button>
        <div className={`w-px h-4 mx-1.5 ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`}></div>
        <button
          onClick={() => handleFormat('formatBlock', '<h2>')}
          className={`w-7 h-7 rounded flex items-center justify-center transition-all cursor-pointer text-xs font-bold border ${
            activeFormats.h2
              ? theme === 'dark'
                ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                : 'bg-indigo-100 text-indigo-600 border-indigo-200'
              : theme === 'dark'
                ? 'hover:bg-white/5 text-gray-400 hover:text-white border-transparent'
                : 'hover:bg-gray-200/50 text-gray-600 hover:text-black border-transparent'
          }`}
          title="Header 2"
        >
          H2
        </button>
        <button
          onClick={() => handleFormat('formatBlock', '<h3>')}
          className={`w-7 h-7 rounded flex items-center justify-center transition-all cursor-pointer text-xs font-bold border ${
            activeFormats.h3
              ? theme === 'dark'
                ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                : 'bg-indigo-100 text-indigo-600 border-indigo-200'
              : theme === 'dark'
                ? 'hover:bg-white/5 text-gray-400 hover:text-white border-transparent'
                : 'hover:bg-gray-200/50 text-gray-600 hover:text-black border-transparent'
          }`}
          title="Header 3"
        >
          H3
        </button>
        <div className={`w-px h-4 mx-1.5 ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`}></div>
        <button
          onClick={() => handleFormat('insertUnorderedList')}
          className={`w-7 h-7 rounded flex items-center justify-center transition-all cursor-pointer border ${
            activeFormats.list
              ? theme === 'dark'
                ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                : 'bg-indigo-100 text-indigo-600 border-indigo-200'
              : theme === 'dark'
                ? 'hover:bg-white/5 text-gray-400 hover:text-white border-transparent'
                : 'hover:bg-gray-200/50 text-gray-600 hover:text-black border-transparent'
          }`}
          title="Bullet List"
        >
          <List size={13} />
        </button>
        <button
          onClick={() => handleFormat('formatBlock', '<blockquote>')}
          className={`w-7 h-7 rounded flex items-center justify-center transition-all cursor-pointer border ${
            activeFormats.quote
              ? theme === 'dark'
                ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                : 'bg-indigo-100 text-indigo-600 border-indigo-200'
              : theme === 'dark'
                ? 'hover:bg-white/5 text-gray-400 hover:text-white border-transparent'
                : 'hover:bg-gray-200/50 text-gray-600 hover:text-black border-transparent'
          }`}
          title="Blockquote"
        >
          <Quote size={13} />
        </button>
        <div className={`w-px h-4 mx-1.5 ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`}></div>
        <button
          onClick={() => handleFormat('undo')}
          className={`w-7 h-7 rounded flex items-center justify-center transition-colors cursor-pointer ${
            theme === 'dark' ? 'hover:bg-white/5 text-gray-400 hover:text-white' : 'hover:bg-gray-200/50 text-gray-600 hover:text-black'
          }`}
          title="Undo"
        >
          <Undo size={13} />
        </button>
        <button
          onClick={() => handleFormat('redo')}
          className={`w-7 h-7 rounded flex items-center justify-center transition-colors cursor-pointer ${
            theme === 'dark' ? 'hover:bg-white/5 text-gray-400 hover:text-white' : 'hover:bg-gray-200/50 text-gray-600 hover:text-black'
          }`}
          title="Redo"
        >
          <Redo size={13} />
        </button>
      </div>

      {/* Editor Main Canvas */}
      <div className={`flex-1 overflow-y-auto px-12 py-10 flex justify-center scrollbar-thin relative transition-colors duration-200 ${
        theme === 'dark' ? 'bg-[#0A0A0A]' : 'bg-white'
      }`}>
        <div className="w-full max-w-2xl flex flex-col h-full relative">
          
          {/* Title Input */}
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            onKeyDown={handleKeyDown}
            placeholder="Name your chapter..."
            className={`w-full bg-transparent border-none text-4xl font-serif font-bold mb-8 focus:ring-0 focus:outline-none transition-all ${
              theme === 'dark' ? 'text-white placeholder-gray-800' : 'text-gray-950 placeholder-gray-300'
            }`}
          />

          {/* Content Editable Area (Faux Chapter Sheet) */}
          <div
            ref={contentRef}
            contentEditable
            onInput={handleContentInput}
            onKeyDown={handleKeyDown}
            onKeyUp={updateActiveFormats}
            onMouseUp={updateActiveFormats}
            onFocus={updateActiveFormats}
            className={`flex-1 w-full bg-transparent focus:outline-none prose max-w-none text-lg leading-relaxed font-serif space-y-6 ${
              theme === 'dark' ? 'text-gray-300 prose-invert prose-indigo' : 'text-gray-800 prose-indigo'
            }`}
            style={{ minHeight: '350px' }}
          ></div>
        </div>
      </div>

      {/* Floating Bottom UI */}
      <div className={`absolute bottom-6 right-8 flex items-center gap-2 px-3 py-1.5 rounded-full shadow-2xl text-[11px] font-medium z-10 transition-colors duration-200 ${
        theme === 'dark' ? 'bg-[#151515] border border-white/10' : 'bg-white border border-gray-200'
      }`}>
        <span className="text-gray-500 uppercase tracking-tighter">Reading Time:</span>
        <span className="text-indigo-500 font-mono">{calculateReadingTime()}</span>
        <span className={`mx-2 text-xs ${theme === 'dark' ? 'text-gray-700' : 'text-gray-300'}`}>|</span>
        <span className="text-gray-500 uppercase tracking-tighter">Word Count:</span>
        <span className="text-indigo-500 font-mono">{wordCount.toLocaleString()}</span>
      </div>
    </div>
  );
}
