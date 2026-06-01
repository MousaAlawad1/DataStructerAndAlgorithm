import React from 'react';
import { Cpu, HardDrive, Database, Layers, Activity, Disc } from 'lucide-react';
import { BTreeStats } from '../types/btree';

interface StatsPanelProps {
  stats: BTreeStats;
  activeDiskAccessCount: number;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ stats, activeDiskAccessCount }) => {
  // Calculate standard AVL / BST worst-case height for comparison
  // AVL tree height with N keys is roughly 1.44 * log2(N)
  const n = stats.keyCount;
  const avlHeight = n > 0 ? Math.ceil(1.44 * Math.log2(n + 1)) : 0;
  // B-Tree height is stats.height

  return (
    <div className="w-full bg-slate-950/70 p-5 border border-slate-800/80 rounded-2xl backdrop-blur-sm space-y-4 text-xs">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
        <Activity className="w-3.5 h-3.5 text-purple-400" />
        DBMS Diagnostics Console
      </h3>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Height */}
        <div className="bg-slate-900/50 p-3 border border-slate-850 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span>Tree Height</span>
            <Layers className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono text-white">{stats.height}</span>
            <span className="text-[10px] text-slate-400 font-mono">levels</span>
          </div>
        </div>

        {/* Key Density */}
        <div className="bg-slate-900/50 p-3 border border-slate-850 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span>Total Keys</span>
            <Database className="w-3.5 h-3.5 text-pink-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono text-white">{stats.keyCount}</span>
            <span className="text-[10px] text-slate-400 font-mono">records</span>
          </div>
        </div>

        {/* Total Nodes */}
        <div className="bg-slate-900/50 p-3 border border-slate-850 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span>Allocated Nodes</span>
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-black font-mono text-white">{stats.nodeCount}</span>
            <span className="text-[10px] text-slate-400 font-mono">({stats.leafCount} leaves)</span>
          </div>
        </div>

        {/* Max Keys / Capacity */}
        <div className="bg-slate-900/50 p-3 border border-slate-850 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span>Branching Factor</span>
            <Disc className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-2 flex flex-col">
            <span className="text-sm font-black font-mono text-white">M = {stats.maxKeys + 1} ways</span>
            <span className="text-[9px] text-slate-500">Max keys per node: {stats.maxKeys}</span>
          </div>
        </div>
      </div>

      {/* Disk I/O Simulation Meter */}
      <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
          <span className="flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            SIMULATED DISK ACCESSIBILITY
          </span>
          <span className="font-mono text-emerald-400">{activeDiskAccessCount} reads</span>
        </div>

        {/* Horizontal representation of node page loading */}
        <div className="flex gap-1">
          {Array.from({ length: Math.max(stats.height, 4) }).map((_, i) => {
            const isAccessed = i < activeDiskAccessCount;
            return (
              <div
                key={i}
                className={`h-2 flex-1 rounded-md transition-all duration-300 ${
                  isAccessed
                    ? 'bg-emerald-400 shadow-glow shadow-emerald-500/20'
                    : i < stats.height
                    ? 'bg-slate-800 border border-slate-700'
                    : 'bg-slate-900/30 border border-dashed border-slate-800/50'
                }`}
                title={
                  isAccessed
                    ? `Disk block ${i + 1} loaded into cache`
                    : i < stats.height
                    ? `Disk block ${i + 1} not accessed`
                    : 'Block unallocated'
                }
              />
            );
          })}
        </div>
        <p className="text-[10px] text-slate-500 italic leading-tight">
          In real databases, visiting each level in the tree represents 1 separate Disk Block I/O operation. The lower the height, the faster queries execute!
        </p>
      </div>

      {/* Page Occupancy Ratio Gauge */}
      <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-3.5 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold text-slate-400">AVG PAGE STORAGE DENSITY</span>
          <span className="font-mono text-cyan-400 font-bold">{stats.avgOccupancy}%</span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-slate-950 rounded-full h-2.5 border border-slate-850 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-cyan-500 to-purple-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${stats.avgOccupancy}%` }}
          />
        </div>

        <div className="flex justify-between text-[9px] text-slate-500">
          <span>0% (Empty Leaf)</span>
          <span>50% (Min occupancy t-1)</span>
          <span>100% (Split Triggered)</span>
        </div>
      </div>

      {/* Comparison Dashboard */}
      <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 space-y-2 font-mono">
        <span className="text-[10px] text-slate-400 font-bold">INDEX EFFICIENCY COMPARISON</span>
        <div className="space-y-1.5 text-[10px]">
          <div className="flex justify-between">
            <span className="text-slate-500">B-Tree Worst-case Height:</span>
            <span className="text-cyan-300 font-bold">{stats.height} reads</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">AVL / BST Worst-case Height:</span>
            <span className="text-red-400/80 font-bold">{avlHeight} reads</span>
          </div>
          <div className="flex justify-between border-t border-slate-850 pt-1.5 text-[9px] text-emerald-400 font-sans">
            <span>🚀 B-Tree saves approx. {Math.max(0, avlHeight - stats.height)} disk reads per query!</span>
          </div>
        </div>
      </div>
    </div>
  );
};
