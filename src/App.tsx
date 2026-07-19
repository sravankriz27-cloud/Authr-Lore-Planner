/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { useAppStore } from './store';
import AuthScreen from './components/AuthScreen';
import Sidebar from './components/Sidebar';
import ChapterList from './components/ChapterList';
import Editor from './components/Editor';
import LoreDirectory from './components/LoreDirectory';
import UniverseSettings from './components/UniverseSettings';
import { PenTool, Library, BookOpen, Quote, HelpCircle, Menu } from 'lucide-react';
import { motion } from 'motion/react';

const WRITING_QUOTES = [
  { text: "There is no greater agony than bearing an untold story inside you.", author: "Maya Angelou" },
  { text: "You must write the book that wants to be written.", author: "Madeleine L'Engle" },
  { text: "The first draft is just you telling yourself the story.", author: "Terry Pratchett" },
  { text: "A word after a word after a word is power.", author: "Margaret Atwood" },
  { text: "Let the world burn, so long as you keep writing.", author: "The Scribe's Maxim" }
];

export default function App() {
  const token = useAppStore((state) => state.token);
  const user = useAppStore((state) => state.user);
  const checkMe = useAppStore((state) => state.checkMe);
  const fetchUniverses = useAppStore((state) => state.fetchUniverses);
  const fetchChapters = useAppStore((state) => state.fetchChapters);
  const fetchCharacters = useAppStore((state) => state.fetchCharacters);
  const selectedUniverseId = useAppStore((state) => state.selectedUniverseId);
  const selectedChapterId = useAppStore((state) => state.selectedChapterId);
  const universes = useAppStore((state) => state.universes);
  const activeTab = useAppStore((state) => state.activeTab);
  const theme = useAppStore((state) => state.theme);

  const [quoteIdx, setQuoteIdx] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Initial authentication check on load
  useEffect(() => {
    checkMe();
  }, []);

  // Sync universes once user gets authenticated
  useEffect(() => {
    if (token) {
      fetchUniverses();
    }
  }, [token]);

  // Fetch chapters and characters when user is authenticated and selectedUniverseId changes
  useEffect(() => {
    if (token && selectedUniverseId) {
      fetchChapters(selectedUniverseId);
      fetchCharacters(selectedUniverseId);
    }
  }, [token, selectedUniverseId, fetchChapters, fetchCharacters]);

  // Cycle inspiration quotes on the splash screen
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIdx((prev) => (prev + 1) % WRITING_QUOTES.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!token) {
    return <AuthScreen />;
  }

  // Visual layout selection based on tab
  const renderWorkspaceContent = () => {
    switch (activeTab) {
      case 'chapters':
        return (
          <div className="flex flex-1 h-full overflow-hidden">
            <div className={`h-full shrink-0 ${selectedChapterId ? 'hidden md:block' : 'w-full md:block'}`}>
              <ChapterList />
            </div>
            <div className={`flex-1 h-full ${!selectedChapterId ? 'hidden md:block' : 'w-full md:block'}`}>
              <Editor />
            </div>
          </div>
        );
      case 'lore':
        return <LoreDirectory />;
      case 'settings':
        return <UniverseSettings />;
      default:
        return null;
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-200 ${
      theme === 'dark' ? 'bg-[#0A0A0A] text-gray-300' : 'bg-[#F4F4F5] text-gray-800'
    }`}>
      
      {/* Outer Sidebar Selector */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main workspace section */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Top Header */}
        <div className={`md:hidden h-14 px-4 flex items-center justify-between shrink-0 border-b transition-colors duration-200 ${
          theme === 'dark' ? 'bg-[#0E0E0E] border-white/10 text-gray-300' : 'bg-white border-gray-200 text-gray-800'
        }`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                theme === 'dark' ? 'hover:bg-white/5 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
              }`}
              title="Open Navigation Menu"
            >
              <Menu size={20} />
            </button>
            <span className="text-xs font-semibold uppercase tracking-wider font-sans">
              {activeTab === 'chapters' ? 'Chapters & Outline' : activeTab === 'lore' ? 'Lore & Characters' : 'Universe Settings'}
            </span>
          </div>
          
          {selectedUniverseId && (
            <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium truncate max-w-[140px] ${
              theme === 'dark' ? 'bg-indigo-950/40 border border-indigo-500/30 text-indigo-400' : 'bg-indigo-50 border border-indigo-200 text-indigo-600'
            }`}>
              {universes.find(u => u.id === selectedUniverseId)?.title || 'Universe'}
            </span>
          )}
        </div>

        {selectedUniverseId ? (
          // Active workspace rendering
          renderWorkspaceContent()
        ) : (
          // Beautiful welcome splash screen when no project is loaded
          <div className={`flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden transition-colors duration-200 ${
            theme === 'dark' ? 'bg-[#0A0A0A]' : 'bg-[#FAFAFA]'
          }`}>
            {/* Background elements */}
            <div className={`absolute inset-0 bg-[radial-gradient(rgba(${theme === 'dark' ? '255,255,255,0.015' : '0,0,0,0.03'},_1px,transparent_1px))] [background-size:24px_24px] pointer-events-none`}></div>
            <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] ${
              theme === 'dark' ? 'bg-indigo-900/5' : 'bg-indigo-500/5'
            } rounded-full blur-[100px] pointer-events-none`}></div>

            <motion.div 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-xl flex flex-col items-center relative z-10 space-y-8"
            >
              {/* Central vector sigil */}
              <div className="w-14 h-14 bg-indigo-600 rounded flex items-center justify-center shadow-2xl text-white">
                <Library size={24} className="stroke-[1.5]" />
              </div>

              <div className="space-y-2">
                <h2 className={`text-2xl font-bold tracking-tight font-serif ${
                  theme === 'dark' ? 'text-white' : 'text-gray-950'
                }`}>
                  Your Writing Ledger Awaits
                </h2>
                <p className={`text-xs max-w-xs mx-auto leading-relaxed font-serif ${
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                }`}>
                  Welcome to Authr, {user?.name || 'Writer'}. Prepare your timelines, draft your outline sequences, and register character attributes safely.
                </p>
              </div>

              {/* Cycling Inspiration Quote Panel */}
              <div className={`border rounded-md p-6 shadow-sm w-full min-h-[120px] flex flex-col justify-center relative transition-colors duration-200 ${
                theme === 'dark' ? 'bg-[#111111] border-white/10' : 'bg-white border-gray-200 shadow-sm'
              }`}>
                <Quote size={16} className={`absolute left-4 top-4 ${
                  theme === 'dark' ? 'text-gray-800' : 'text-gray-200'
                }`} />
                <p className={`text-xs italic leading-relaxed px-4 text-center font-serif ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  "{WRITING_QUOTES[quoteIdx].text}"
                </p>
                <span className="text-[10px] font-mono font-bold text-indigo-500 mt-3 block text-center uppercase tracking-widest">
                  — {WRITING_QUOTES[quoteIdx].author}
                </span>
              </div>

              {/* Quick guides */}
              <div className="grid grid-cols-2 gap-4 w-full">
                <div className={`border rounded p-4 text-left space-y-1 transition-colors duration-200 ${
                  theme === 'dark' ? 'bg-[#111111] border-white/5' : 'bg-white border-gray-100 shadow-sm'
                }`}>
                  <span className="text-[10px] font-mono text-indigo-500 uppercase tracking-wider block">NoSQL Reference System</span>
                  <p className={`text-xs leading-relaxed font-serif ${
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                  }`}>
                    Designed using separate referencing models to scale projects without limits.
                  </p>
                </div>
                <div className={`border rounded p-4 text-left space-y-1 transition-colors duration-200 ${
                  theme === 'dark' ? 'bg-[#111111] border-white/5' : 'bg-white border-gray-100 shadow-sm'
                }`}>
                  <span className="text-[10px] font-mono text-indigo-500 uppercase tracking-wider block">Focus & Micro-Sounds</span>
                  <p className={`text-xs leading-relaxed font-serif ${
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                  }`}>
                    Synthesize typewriter audio loops locally to immerse yourself completely in drafting.
                  </p>
                </div>
              </div>

              <div className={`text-[10px] font-mono flex items-center gap-1 ${
                theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
              }`}>
                <HelpCircle size={11} /> Select or initiate a Universe in the left menu to begin compiling.
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
