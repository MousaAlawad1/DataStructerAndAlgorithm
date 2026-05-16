import { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { Controls } from './components/Controls';
import { TreeView } from './components/TreeView';
import { StatsPanel } from './components/StatsPanel';
import { EducationPanel } from './components/EducationPanel';
import { TutorialModal } from './components/TutorialModal';
import { BTreeEngine, cloneTree, getTreeStats, generateRandomTree, exportTreeToJson, importTreeFromJson } from './algorithms/btree';
import { BTreeSnapshot, BTreeHistoryItem, BTreeNode, BTreeStats } from './types/btree';
import { Sparkles, AlertCircle, Check, Info } from 'lucide-react';

export default function App() {
  const [degree, setDegree] = useState<number>(3);
  const [engine, setEngine] = useState<BTreeEngine>(() => new BTreeEngine(3));
  const [steps, setSteps] = useState<BTreeSnapshot[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(750);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const [historyStack, setHistoryStack] = useState<BTreeHistoryItem[]>([]);
  const [historyPointer, setHistoryPointer] = useState<number>(-1);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  const triggerToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const hasVisited = localStorage.getItem('btree_lab_onboarded');
    if (!hasVisited) {
      setIsTutorialOpen(true);
      localStorage.setItem('btree_lab_onboarded', 'true');
    }
  }, []);

  useEffect(() => {
    const initialSnap: BTreeSnapshot = {
      tree: cloneTree(engine.root),
      activeNodeId: null,
      activeKeyIndex: null,
      highlightedNodeIds: [],
      actionType: 'info',
      description: 'Engine ready. Insert keys to begin.',
      highlightedCodeLines: [],
      operation: 'Init',
      val: null,
      diskAccessCount: 0,
    };
    setSteps([initialSnap]);
    setCurrentStepIndex(0);
    setIsPlaying(false);
  }, [engine]);

  const currentStepData = steps[currentStepIndex] || null;
  const currentTreeState = currentStepData ? currentStepData.tree : engine.root;
  const currentStats: BTreeStats = getTreeStats(currentTreeState, degree);

  useEffect(() => {
    let timer: any;
    if (isPlaying && steps.length > 1) {
      if (currentStepIndex < steps.length - 1) {
        timer = setTimeout(() => setCurrentStepIndex((p) => p + 1), playbackSpeed);
      } else {
        setIsPlaying(false);
        triggerToast('Animation complete.', 'success');
      }
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, steps, playbackSpeed]);

  const triggerConfetti = (label: string) => {
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 }, colors: ['#06b6d4', '#3b82f6', '#a855f7', '#eab308'] });
    triggerToast(`🎉 ${label}`, 'success');
  };

  const pushHistory = (treeState: BTreeNode | null, deg: number, label: string) => {
    const newItem: BTreeHistoryItem = {
      tree: cloneTree(treeState),
      degree: deg,
      label,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    const newStack = historyStack.slice(0, historyPointer + 1);
    newStack.push(newItem);
    setHistoryStack(newStack);
    setHistoryPointer(newStack.length - 1);
  };

  useEffect(() => {
    const defaultKeys = [20, 10, 30, 40, 50, 15, 25, 35];
    const newEngine = new BTreeEngine(3);
    defaultKeys.forEach((k) => newEngine.insert(k));
    setEngine(newEngine);
    setHistoryStack([{ tree: cloneTree(newEngine.root), degree: 3, label: 'Default tree loaded', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }]);
    setHistoryPointer(0);
  }, []);

  const handleInsert = (val: number) => {
    const searchEngine = new BTreeEngine(degree);
    searchEngine.root = cloneTree(engine.root);
    const testSearch = searchEngine.search(val);
    if (testSearch.length > 0 && testSearch[testSearch.length - 1].actionType === 'success') {
      triggerToast(`Key ${val} already exists in the tree.`, 'error');
      return;
    }
    const prevHeight = currentStats.height;
    const insertSteps = engine.insert(val);
    setSteps(insertSteps);
    setCurrentStepIndex(0);
    setIsPlaying(true);
    pushHistory(engine.root, degree, `Insert ${val}`);
    const postStats = getTreeStats(engine.root, degree);
    if (postStats.height > prevHeight && prevHeight > 0) {
      setTimeout(() => triggerConfetti(`Tree grew to height ${postStats.height}!`), 800);
    } else {
      triggerToast(`Inserting key ${val}…`, 'info');
    }
  };

  const handleDelete = (val: number) => {
    const searchEngine = new BTreeEngine(degree);
    searchEngine.root = cloneTree(engine.root);
    const testSearch = searchEngine.search(val);
    if (!(testSearch.length > 0 && testSearch[testSearch.length - 1].actionType === 'success')) {
      triggerToast(`Key ${val} not found in the tree.`, 'error');
      return;
    }
    const prevHeight = currentStats.height;
    const deleteSteps = engine.delete(val);
    setSteps(deleteSteps);
    setCurrentStepIndex(0);
    setIsPlaying(true);
    pushHistory(engine.root, degree, `Delete ${val}`);
    const postStats = getTreeStats(engine.root, degree);
    if (postStats.height < prevHeight && prevHeight > 1) {
      setTimeout(() => triggerConfetti(`Tree height reduced to ${postStats.height}.`), 800);
    } else {
      triggerToast(`Deleting key ${val}…`, 'info');
    }
  };

  const handleSearch = (val: number) => {
    const searchSteps = engine.search(val);
    setSteps(searchSteps);
    setCurrentStepIndex(0);
    setIsPlaying(true);
    const isFound = searchSteps[searchSteps.length - 1]?.actionType === 'success';
    triggerToast(`Searching for ${val}… ${isFound ? 'Key found!' : 'Traversal started.'}`, 'info');
  };

  const handleDegreeChange = (newDeg: number) => {
    if (confirm(`Changing degree to t=${newDeg} will clear the tree. Continue?`)) {
      setDegree(newDeg);
      const newEngine = new BTreeEngine(newDeg);
      setEngine(newEngine);
      setHistoryStack([{ tree: cloneTree(newEngine.root), degree: newDeg, label: `New tree t=${newDeg}`, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }]);
      setHistoryPointer(0);
      triggerToast(`Degree updated to t=${newDeg}.`, 'success');
    }
  };

  const handleGenerateRandom = (count: number) => {
    const newEngine = generateRandomTree(degree, count);
    setEngine(newEngine);
    pushHistory(newEngine.root, degree, `Random tree (${count} keys)`);
    triggerToast(`Generated tree with ${count} random keys.`, 'success');
  };

  const handleReset = () => {
    const newEngine = new BTreeEngine(degree);
    setEngine(newEngine);
    pushHistory(newEngine.root, degree, 'Reset tree');
    triggerToast('Tree reset.', 'info');
  };

  const handleExportJSON = () => {
    const jsonStr = exportTreeToJson(engine.root);
    navigator.clipboard.writeText(jsonStr).then(
      () => triggerToast('Tree JSON copied to clipboard.', 'success'),
      () => triggerToast('Failed to copy JSON.', 'error'),
    );
  };

  const handleImportJSON = (jsonString: string) => {
    const importedNode = importTreeFromJson(jsonString);
    if (importedNode) {
      const newEngine = new BTreeEngine(degree);
      newEngine.root = importedNode;
      setEngine(newEngine);
      pushHistory(importedNode, degree, 'Imported from JSON');
      triggerToast('Tree imported successfully.', 'success');
    } else {
      triggerToast('Invalid B-Tree JSON format.', 'error');
    }
  };

  const handleUndo = () => {
    if (historyPointer > 0) {
      const prev = historyStack[historyPointer - 1];
      setDegree(prev.degree);
      const newEngine = new BTreeEngine(prev.degree);
      newEngine.root = cloneTree(prev.tree);
      setEngine(newEngine);
      setHistoryPointer(historyPointer - 1);
      triggerToast(`Undone: ${prev.label}`, 'info');
    }
  };

  const handleRedo = () => {
    if (historyPointer < historyStack.length - 1) {
      const next = historyStack[historyPointer + 1];
      setDegree(next.degree);
      const newEngine = new BTreeEngine(next.degree);
      newEngine.root = cloneTree(next.tree);
      setEngine(newEngine);
      setHistoryPointer(historyPointer + 1);
      triggerToast(`Redone: ${next.label}`, 'info');
    }
  };

  const handleSelectStep = (idx: number) => {
    setIsPlaying(false);
    setCurrentStepIndex(idx);
  };

  const handleNodeClick = (node: BTreeNode) => {
    triggerToast(`Node [${node.keys.join(', ')}] — ${node.isLeaf ? 'Leaf' : 'Internal'}, ${node.children.length} children`, 'info');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden">
      
      <Header
        onOpenTutorial={() => setIsTutorialOpen(true)}
        degree={degree}
        totalKeys={currentStats.keyCount}
        height={currentStats.height}
        isDarkMode={true}
        onToggleDarkMode={() => {}}
      />

      <main className="flex-1 p-5 max-w-[1600px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* LEFT — Controls + Stats */}
        <section className="col-span-1 lg:col-span-4 flex flex-col gap-5">
          <Controls
            degree={degree}
            onDegreeChange={handleDegreeChange}
            onInsert={handleInsert}
            onDelete={handleDelete}
            onSearch={handleSearch}
            onGenerateRandom={handleGenerateRandom}
            onReset={handleReset}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={historyPointer > 0}
            canRedo={historyPointer < historyStack.length - 1}
            playbackSpeed={playbackSpeed}
            onPlaybackSpeedChange={setPlaybackSpeed}
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying(!isPlaying)}
            onStepForward={() => setCurrentStepIndex((p) => Math.min(steps.length - 1, p + 1))}
            onStepBackward={() => setCurrentStepIndex((p) => Math.max(0, p - 1))}
            currentStep={currentStepIndex}
            totalSteps={steps.length}
            onExportJSON={handleExportJSON}
            onImportJSON={handleImportJSON}
          />
          <StatsPanel
            stats={currentStats}
            activeDiskAccessCount={currentStepData ? currentStepData.diskAccessCount : currentStats.height}
          />
        </section>

        {/* CENTER — Tree Canvas */}
        <section className="col-span-1 lg:col-span-5 flex flex-col gap-5">
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-1 backdrop-blur-sm flex flex-col flex-1 min-h-[480px]">
            <div className="px-4 py-2.5 border-b border-slate-900 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                Live SVG Rendering
              </span>
              {currentStepData && (
                <span className="px-2.5 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-800/50 rounded-full font-mono text-[10px]">
                  {currentStepData.operation.toUpperCase()}
                  {currentStepData.val !== null ? ` · ${currentStepData.val}` : ''}
                </span>
              )}
            </div>
            <div className="flex-1 min-h-[440px]">
              <TreeView currentStepData={currentStepData} onNodeClick={handleNodeClick} />
            </div>
          </div>
        </section>

        {/* RIGHT — Education Panel */}
        <section className="col-span-1 lg:col-span-3">
          <EducationPanel
            currentStepData={currentStepData}
            steps={steps}
            currentStepIndex={currentStepIndex}
            onSelectStep={handleSelectStep}
          />
        </section>

      </main>

      <TutorialModal isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-slate-900 border border-slate-800 text-slate-200 px-4 py-3 rounded-xl shadow-2xl flex items-start gap-3 animate-slideIn">
          <div className="mt-0.5 shrink-0">
            {toast.type === 'success' && <Check className="w-4 h-4 text-emerald-400" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-cyan-400" />}
          </div>
          <p className="text-xs leading-normal font-medium">{toast.message}</p>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 py-4 px-6 flex items-center justify-between text-[10.5px] text-slate-600 font-mono">
        <span>B-TREE LAB v3.0 // BUILT WITH REACT + TYPESCRIPT + SVG</span>
        <span className="text-slate-700">
          Developed by{' '}
          <span className="text-cyan-600 font-semibold">Mousa Alawad</span>
          {' '}· Information Engineering · 2026
        </span>
      </footer>
    </div>
  );
}
