/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAppStore } from '../store';
import { BookOpen, KeyRound, PenTool, UserPlus } from 'lucide-react';
import { motion } from 'motion/react';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const login = useAppStore((state) => state.login);
  const signup = useAppStore((state) => state.signup);
  const authLoading = useAppStore((state) => state.authLoading);
  const authError = useAppStore((state) => state.authError);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (isLogin) {
      const success = await login(username, password);
      if (!success) {
        setError(authError || 'Invalid credentials');
      }
    } else {
      if (!name) {
        setError('Please provide your writer pen name.');
        return;
      }
      const success = await signup(username, password, name);
      if (!success) {
        setError(authError || 'Registration failed');
      }
    }
  };

  const handleUseDemo = async () => {
    setUsername('demo');
    setPassword('demo123');
    const success = await login('demo', 'demo123');
    if (!success) {
      setError('Demo login failed. Please register a new account.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#D8D4CF] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Decorative background grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1B202D_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none"></div>

      {/* Floating dust/stars */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#3B3023] rounded-full blur-[128px] opacity-20 pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#1A2635] rounded-full blur-[128px] opacity-20 pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-[#161920]/90 backdrop-blur-md border border-[#2D3343] p-8 rounded-2xl shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-[#8E795B] to-[#5C4C36] rounded-2xl flex items-center justify-center shadow-lg mb-4 text-[#FFFFFF]">
            <PenTool size={30} className="stroke-[1.75]" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#FAF8F5] font-serif">
            Authr
          </h1>
          <p className="text-sm text-[#8D92A3] mt-1.5 font-mono">
            the novelist's digital sanctuary
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-xs font-mono text-[#8E795B] uppercase tracking-wider">
                Pen Name / Author Name
              </label>
              <div className="relative">
                <input
                  id="name"
                  type="text"
                  placeholder="e.g. J.R.R. Tolkien"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#1A1E29] border border-[#2D3343] rounded-xl px-4 py-3 text-sm focus:border-[#8E795B] focus:outline-none focus:ring-1 focus:ring-[#8E795B]/40 text-[#FAF8F5] placeholder-[#4F5466] transition-all"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="username" className="text-xs font-mono text-[#8E795B] uppercase tracking-wider">
              Writer Username
            </label>
            <input
              id="username"
              type="text"
              placeholder="choose_your_handle"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#1A1E29] border border-[#2D3343] rounded-xl px-4 py-3 text-sm focus:border-[#8E795B] focus:outline-none focus:ring-1 focus:ring-[#8E795B]/40 text-[#FAF8F5] placeholder-[#4F5466] transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="password" className="text-xs font-mono text-[#8E795B] uppercase tracking-wider">
                Access Code / Password
              </label>
            </div>
            <input
              id="password"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1A1E29] border border-[#2D3343] rounded-xl px-4 py-3 text-sm focus:border-[#8E795B] focus:outline-none focus:ring-1 focus:ring-[#8E795B]/40 text-[#FAF8F5] placeholder-[#4F5466] transition-all"
            />
          </div>

          {(error || authError) && (
            <div className="p-3 bg-[#3A1E1E] border border-[#632929] rounded-xl text-xs text-[#FC8181] font-mono leading-relaxed">
              {error || authError}
            </div>
          )}

          <button
            type="submit"
            disabled={authLoading}
            className="w-full bg-[#8E795B] hover:bg-[#A38D6C] active:bg-[#78644A] text-[#13161C] font-semibold py-3 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#8E795B]/10 disabled:opacity-50 cursor-pointer"
          >
            {authLoading ? (
              <span className="w-5 h-5 border-2 border-[#13161C] border-t-transparent rounded-full animate-spin"></span>
            ) : isLogin ? (
              <>
                <BookOpen size={16} /> Enter Sanctuary
              </>
            ) : (
              <>
                <UserPlus size={16} /> Establish Pen Profile
              </>
            )}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-3 items-center text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-xs text-[#8D92A3] hover:text-[#FAF8F5] font-mono transition-all cursor-pointer hover:underline"
          >
            {isLogin ? "New author? Draft a new profile profile" : "Already registered? Unlock current profile"}
          </button>

          <div className="w-full flex items-center gap-2 my-1">
            <div className="h-px bg-[#2D3343] flex-1"></div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#4F5466]">Or Quick Trial</span>
            <div className="h-px bg-[#2D3343] flex-1"></div>
          </div>

          <button
            onClick={handleUseDemo}
            className="w-full bg-transparent border border-dashed border-[#2D3343] hover:border-[#8E795B] text-[#8D92A3] hover:text-[#FAF8F5] py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 font-mono cursor-pointer"
          >
            <KeyRound size={14} className="text-[#8E795B]" /> Use Demo Author Account
          </button>
        </div>
      </motion.div>
    </div>
  );
}
