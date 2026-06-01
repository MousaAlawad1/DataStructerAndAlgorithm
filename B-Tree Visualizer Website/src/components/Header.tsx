import React, { useState } from 'react';
import { Database, HelpCircle, GitFork, User } from 'lucide-react';
import { DeveloperCard } from './DeveloperCard';

interface HeaderProps {
  onOpenTutorial: () => void;
  degree: number;
  totalKeys: number;
  height: number;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenTutorial,
  degree,
  totalKeys,
  height,
}) => {
  const [showDevCard, setShowDevCard] = useState(false);

  return (
    <>
      <header className="w-full border-b border-slate-800/60 bg-slate-950/90 backdrop-blur-md px-6 py-3 flex items-center justify-between z-30 relative">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-cyan-500 to-violet-600 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-white">
                B-TREE <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">LAB</span>
              </h1>
              <span className="text-[9px] font-bold font-mono px-2 py-0.5 bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 rounded-full">
                v3.0
              </span>
            </div>
            <p className="text-[10px] text-slate-500">Interactive B-Tree Visualizer & Algorithm Explorer</p>
          </div>
        </div>

        {/* Live stats pill */}
        <div className="hidden md:flex items-center gap-1 bg-slate-900/60 border border-slate-800/60 rounded-xl px-4 py-2 font-mono text-xs">
          <div className="flex flex-col items-center px-3">
            <span className="text-[9px] text-slate-500 uppercase tracking-wider">Degree t</span>
            <span className="text-cyan-400 font-bold">{degree}</span>
          </div>
          <div className="w-px h-6 bg-slate-800" />
          <div className="flex flex-col items-center px-3">
            <span className="text-[9px] text-slate-500 uppercase tracking-wider">Height</span>
            <span className="text-violet-400 font-bold">{height}</span>
          </div>
          <div className="w-px h-6 bg-slate-800" />
          <div className="flex flex-col items-center px-3">
            <span className="text-[9px] text-slate-500 uppercase tracking-wider">Keys</span>
            <span className="text-pink-400 font-bold">{totalKeys}</span>
          </div>
          <div className="w-px h-6 bg-slate-800" />
          <div className="flex flex-col items-center px-3">
            <span className="text-[9px] text-slate-500 uppercase tracking-wider">Max/Node</span>
            <span className="text-amber-400 font-bold">{2 * degree - 1}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenTutorial}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 rounded-lg text-xs font-medium transition-all cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            Guide
          </button>

          <a
            href="https://github.com/MousaAl-awad"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 rounded-lg transition-all"
            title="GitHub"
          >
            <GitFork className="w-4 h-4" />
          </a>

          <button
            onClick={() => setShowDevCard(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-500/10 to-violet-500/10 hover:from-cyan-500/20 hover:to-violet-500/20 text-cyan-300 border border-cyan-500/20 hover:border-cyan-400/40 rounded-lg text-xs font-semibold transition-all cursor-pointer"
          >
            <User className="w-3.5 h-3.5" />
            Developer
          </button>
        </div>
      </header>

      <DeveloperCard isOpen={showDevCard} onClose={() => setShowDevCard(false)} />
    </>
  );
};
