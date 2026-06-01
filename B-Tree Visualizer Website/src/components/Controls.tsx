import React, { useState } from 'react';
import { Play, Pause, SkipForward, SkipBack, Plus, Trash2, Search, RefreshCw, Database, Download, Upload, RotateCcw, FileCode, AlertTriangle, FastForward } from 'lucide-react';

interface ControlsProps {
  degree: number;
  onDegreeChange: (deg: number) => void;
  onInsert: (val: number) => void;
  onDelete: (val: number) => void;
  onSearch: (val: number) => void;
  onGenerateRandom: (count: number) => void;
  onReset: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  
  // Playback controls
  playbackSpeed: number; // ms
  onPlaybackSpeedChange: (speed: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  currentStep: number;
  totalSteps: number;

  // JSON Import/Export
  onExportJSON: () => void;
  onImportJSON: (json: string) => void;
}

export const Controls: React.FC<ControlsProps> = ({
  degree,
  onDegreeChange,
  onInsert,
  onDelete,
  onSearch,
  onGenerateRandom,
  onReset,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  playbackSpeed,
  onPlaybackSpeedChange,
  isPlaying,
  onTogglePlay,
  onStepForward,
  onStepBackward,
  currentStep,
  totalSteps,
  onExportJSON,
  onImportJSON,
}) => {
  const [insertVal, setInsertVal] = useState<string>('');
  const [deleteVal, setDeleteVal] = useState<string>('');
  const [searchVal, setSearchVal] = useState<string>('');
  const [showJsonImport, setShowJsonImport] = useState<boolean>(false);
  const [importText, setImportText] = useState<string>('');
  const [importError, setImportError] = useState<string>('');

  const handleInsertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(insertVal);
    if (!isNaN(val)) {
      onInsert(val);
      setInsertVal('');
    }
  };

  const handleDeleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(deleteVal);
    if (!isNaN(val)) {
      onDelete(val);
      setDeleteVal('');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(searchVal);
    if (!isNaN(val)) {
      onSearch(val);
      setSearchVal('');
    }
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importText.trim()) return;
    try {
      const parsed = JSON.parse(importText);
      if (parsed && typeof parsed === 'object') {
        onImportJSON(importText);
        setShowJsonImport(false);
        setImportText('');
        setImportError('');
      } else {
        setImportError('Invalid JSON: Must be a B-Tree node object.');
      }
    } catch (err) {
      setImportError('Invalid JSON format. Please check your syntax.');
    }
  };

  return (
    <div className="w-full flex flex-col gap-5 bg-slate-950/70 p-5 border border-slate-800/80 rounded-2xl backdrop-blur-sm">
      {/* Block 1: Main B-Tree Core Operations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            Core Operations
          </h3>
          {totalSteps > 1 && (
            <span className="text-[10px] font-mono bg-cyan-950 text-cyan-400 px-2 py-0.5 border border-cyan-800/50 rounded-full animate-pulse">
              Step {currentStep + 1}/{totalSteps}
            </span>
          )}
        </div>

        {/* Operation Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Insert */}
          <form onSubmit={handleInsertSubmit} className="relative flex items-center">
            <input
              type="number"
              placeholder="Insert Key"
              value={insertVal}
              onChange={(e) => setInsertVal(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 placeholder-slate-500 font-mono transition-all pr-9"
            />
            <button
              type="submit"
              className="absolute right-1 p-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg transition-all shadow cursor-pointer"
              title="Insert key into tree"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>

          {/* Delete */}
          <form onSubmit={handleDeleteSubmit} className="relative flex items-center">
            <input
              type="number"
              placeholder="Delete Key"
              value={deleteVal}
              onChange={(e) => setDeleteVal(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500 placeholder-slate-500 font-mono transition-all pr-9"
            />
            <button
              type="submit"
              className="absolute right-1 p-1.5 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white rounded-lg transition-all shadow cursor-pointer"
              title="Delete key from tree"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </form>

          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              type="number"
              placeholder="Search Key"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 placeholder-slate-500 font-mono transition-all pr-9"
            />
            <button
              type="submit"
              className="absolute right-1 p-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-lg transition-all shadow cursor-pointer"
              title="Search key in tree"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Block 2: Active Playback Controls (if operation is processing) */}
      <div className="p-3.5 bg-slate-900/60 border border-slate-800/60 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Visualization Stepper & Speed
          </h4>
          <span className="text-[10px] text-slate-500 font-mono">{playbackSpeed}ms</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Media buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onStepBackward}
              disabled={currentStep === 0 || totalSteps <= 1}
              className="p-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 text-slate-300 hover:text-white rounded-lg border border-slate-850 transition-all cursor-pointer"
              title="Step backward"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={onTogglePlay}
              disabled={totalSteps <= 1}
              className={`px-3.5 py-2 flex items-center gap-1.5 rounded-lg font-semibold text-xs shadow-sm transition-all cursor-pointer ${
                totalSteps <= 1
                  ? 'bg-slate-900 text-slate-500 border border-slate-850 cursor-not-allowed'
                  : isPlaying
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                  : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Autoplay
                </>
              )}
            </button>

            <button
              onClick={onStepForward}
              disabled={currentStep === totalSteps - 1 || totalSteps <= 1}
              className="p-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 text-slate-300 hover:text-white rounded-lg border border-slate-850 transition-all cursor-pointer"
              title="Step forward"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Speed Slider */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-[10px] text-slate-500 font-mono shrink-0">Slower</span>
            <input
              type="range"
              min="150"
              max="2000"
              step="50"
              value={2150 - playbackSpeed} // invert so right is faster
              onChange={(e) => onPlaybackSpeedChange(2150 - parseInt(e.target.value))}
              className="w-full accent-cyan-500 h-1.5 bg-slate-950 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 font-mono shrink-0">Faster</span>
          </div>
        </div>
      </div>

      {/* Block 3: Undo/Redo, Settings and Random Generators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Interactive Settings */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Tree Configuration
          </h4>

          <div className="space-y-2 bg-slate-900/40 p-3 border border-slate-850 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Min Degree (t)</span>
              <span className="text-xs font-bold font-mono text-cyan-400">t = {degree}</span>
            </div>
            <div className="flex gap-1.5">
              {[2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  onClick={() => onDegreeChange(val)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    degree === val
                      ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/40 shadow-inner shadow-cyan-500/5'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 italic leading-tight">
              t={degree} limits keys per node from {degree - 1} to {2 * degree - 1}. Changing degree resets current tree state.
            </p>
          </div>
        </div>

        {/* Randomizer & Sandbox Operations */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Simulation Templates
          </h4>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onGenerateRandom(8)}
              className="px-2.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-850 hover:border-slate-750 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3 text-cyan-400" />
              Random (8)
            </button>
            <button
              onClick={() => onGenerateRandom(18)}
              className="px-2.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-850 hover:border-slate-750 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <FastForward className="w-3.5 h-3.5 text-purple-400" />
              Standard (18)
            </button>
            <button
              onClick={() => onGenerateRandom(40)}
              className="px-2.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-850 hover:border-slate-750 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1 col-span-2 cursor-pointer"
              title="Inject 40 values to test heavy merges, splits and borrows"
            >
              <Database className="w-3.5 h-3.5 text-amber-400" />
              Stress Test Index (40 keys)
            </button>
          </div>
        </div>
      </div>

      {/* Block 4: Time Travel, Export/Import & Reset */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-850 text-xs">
        {/* Undo Redo */}
        <div className="flex items-center gap-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 text-slate-300 rounded-lg border border-slate-850 transition-all cursor-pointer"
            title="Undo operation"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Undo</span>
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 text-slate-300 rounded-lg border border-slate-850 transition-all cursor-pointer"
            title="Redo operation"
          >
            <SkipForward className="w-3 h-3" />
            <span>Redo</span>
          </button>
        </div>

        {/* JSON Tools */}
        <div className="flex items-center gap-2">
          <button
            onClick={onExportJSON}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-850 transition-all cursor-pointer"
            title="Copy tree state JSON to clipboard"
          >
            <Download className="w-3 h-3 text-indigo-400" />
            <span>Export</span>
          </button>

          <button
            onClick={() => {
              setShowJsonImport(!showJsonImport);
              setImportError('');
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-850 transition-all cursor-pointer"
            title="Import B-Tree structure from JSON"
          >
            <Upload className="w-3 h-3 text-pink-400" />
            <span>Import</span>
          </button>

          <div className="h-4 w-[1px] bg-slate-850" />

          <button
            onClick={onReset}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-red-950/40 hover:bg-red-950/70 text-red-300 rounded-lg border border-red-900/40 transition-all cursor-pointer"
            title="Reset active tree to blank state"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* JSON Import overlay box if toggled */}
      {showJsonImport && (
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-pink-400" />
              Import Tree State (JSON)
            </span>
            <button
              onClick={() => {
                setShowJsonImport(false);
                setImportError('');
              }}
              className="text-xs text-slate-500 hover:text-slate-300"
            >
              Cancel
            </button>
          </div>
          <textarea
            placeholder='Paste valid B-Tree JSON here (e.g. {"id": "node_1", "keys": [10, 20], "isLeaf": true, "children": []})'
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={5}
            className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-emerald-400 font-mono focus:outline-none focus:border-pink-500"
          />
          {importError && (
            <div className="flex items-center gap-1.5 text-[11px] text-red-400 bg-red-950/20 p-2 border border-red-900/30 rounded">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{importError}</span>
            </div>
          )}
          <button
            onClick={handleImportSubmit}
            className="w-full py-2 bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer"
          >
            Compile JSON into Engine
          </button>
        </div>
      )}
    </div>
  );
};
