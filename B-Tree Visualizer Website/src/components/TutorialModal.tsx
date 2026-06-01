import React, { useState } from 'react';
import { BookOpen, ChevronRight, ChevronLeft, X, Database, Layers, Share2, Sparkles, GitPullRequest } from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: 'Welcome to B-Tree Lab',
      subtitle: 'High-Performance Self-Balancing Search Tree Platform',
      icon: <Database className="w-12 h-12 text-cyan-400 animate-pulse" />,
      content: (
        <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
          <p>
            A <strong>B-Tree</strong> is a self-balancing tree data structure that maintains sorted data and allows searches, sequential access, insertions, and deletions in logarithmic time.
          </p>
          <p className="bg-slate-950/60 p-3 border border-slate-800 rounded-lg text-xs text-cyan-300 font-mono">
            Unlike binary search trees, B-Trees are optimized for systems that read and write large blocks of data. They are commonly used in <strong>databases</strong> (e.g., indexes) and <strong>file systems</strong> (e.g., NTFS, ext4).
          </p>
          <p>
            In this laboratory, you can visualize B-Tree operations, step through splits and merges, and understand database indexing concepts in real time.
          </p>
        </div>
      ),
    },
    {
      title: 'Anatomy of a B-Tree Node',
      subtitle: 'Understanding Keys, Children & Degree (t)',
      icon: <Layers className="w-12 h-12 text-purple-400" />,
      content: (
        <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
          <p>
            A B-Tree is defined by its <strong>Minimum Degree (t)</strong>:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-slate-300">
            <li>Every node (except root) must have at least <code className="text-purple-300 font-mono bg-purple-950 px-1 rounded">t - 1</code> keys.</li>
            <li>Every node can contain at most <code className="text-purple-300 font-mono bg-purple-950 px-1 rounded">2t - 1</code> keys.</li>
            <li>An internal node with <code className="text-purple-300 font-mono">n</code> keys always has exactly <code className="text-purple-300 font-mono">n + 1</code> children.</li>
            <li>All leaf nodes must reside at the <strong>exact same depth</strong> (perfect balance!).</li>
          </ul>
          <div className="bg-purple-950/40 p-3 border border-purple-800/50 rounded-lg text-xs">
            <span className="text-purple-400 font-semibold">💡 Tech Insight:</span> Storing many keys per node (high branching factor) results in a very short, wide tree, drastically reducing the number of disk reads to find a record!
          </div>
        </div>
      ),
    },
    {
      title: 'Preemptive Splitting (Insertion)',
      subtitle: 'Ensuring Single-Pass Insert',
      icon: <Sparkles className="w-12 h-12 text-amber-400" />,
      content: (
        <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
          <p>
            When inserting a key, if we encounter a <strong>full node</strong> (having <code className="text-amber-300 font-mono">2t - 1</code> keys), we split it <em>preemptively</em> before descending into it:
          </p>
          <ol className="list-decimal pl-5 space-y-1 text-xs text-slate-300">
            <li>The node is split in half into a left and right sibling, each getting <code className="text-amber-300 font-mono">t - 1</code> keys.</li>
            <li>The <strong>median key</strong> is promoted up to the parent node.</li>
            <li>This guarantees we never need to backtrack or split parent nodes on the way back up!</li>
          </ol>
          <p className="text-xs text-slate-400">
            Watch the insertion process step-by-step using the playback controls to see this split and promotion highlight in neon gold.
          </p>
        </div>
      ),
    },
    {
      title: 'Borrowing & Merging (Deletion)',
      subtitle: 'Preventing Underflow and Maintaining Height Balance',
      icon: <GitPullRequest className="w-12 h-12 text-emerald-400" />,
      content: (
        <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
          <p>
            When deleting a key, nodes must not drop below <code className="text-emerald-300 font-mono">t - 1</code> keys. If a target child has only <code className="text-emerald-300 font-mono">t - 1</code> keys, we must proactively rebalance:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-slate-300">
            <li><strong>Borrow Left/Right:</strong> If an adjacent sibling has at least <code className="text-emerald-300 font-mono">t</code> keys, we rotate a key from the sibling, through the parent, down into the child.</li>
            <li><strong>Merge:</strong> If both adjacent siblings have only <code className="text-emerald-300 font-mono">t - 1</code> keys, we merge the child, a key pulled down from the parent, and the sibling into a single node of size <code className="text-emerald-300 font-mono">2t - 2</code>.</li>
          </ul>
          <p className="text-xs text-slate-400">
            Merging can occasionally empty the root node entirely, in which case the tree height shrinks by 1.
          </p>
        </div>
      ),
    },
    {
      title: 'Platform Controls & Features',
      subtitle: 'How to Interact and Simulate Like a DB Engineer',
      icon: <Share2 className="w-12 h-12 text-pink-400" />,
      content: (
        <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
          <p>
            The platform is split into three main sections:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-slate-300">
            <li><strong>Left Panel:</strong> Execute Operations (Insert, Delete, Search), change minimum degree `t`, trigger stress tests, or import/export states.</li>
            <li><strong>Center Visualizer:</strong> Supports zoom (scroll) and pan (click and drag). Hover over any node slot to inspect its indices.</li>
            <li><strong>Right Terminal:</strong> Displays simulated disk I/O, branching statistics, execution pseudocode highlighting, and action history!</li>
          </ul>
          <div className="bg-pink-950/30 p-2.5 border border-pink-900/40 rounded text-xs text-pink-300">
            ✨ <strong>Try Undo/Redo:</strong> Step backwards in history to re-examine splits, rotations, or merges!
          </div>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-all duration-300">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Glowing Accent Header line */}
        <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500" />
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 md:p-8 space-y-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs">
              <BookOpen className="w-4 h-4" />
              <span>ONBOARDING MODULE // STEP {step + 1} OF {steps.length}</span>
            </div>
            <div className="flex gap-1">
              {steps.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-1.5 w-6 rounded-full transition-all duration-300 ${idx === step ? 'bg-cyan-400' : 'bg-slate-700'}`}
                />
              ))}
            </div>
          </div>

          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl shadow-inner">
              {steps[step].icon}
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white tracking-tight">{steps[step].title}</h2>
              <p className="text-xs text-slate-400">{steps[step].subtitle}</p>
            </div>
          </div>

          {/* Content */}
          <div className="min-h-[180px] py-2">
            {steps[step].content}
          </div>

          {/* Footer Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              onClick={handlePrev}
              disabled={step === 0}
              className={`flex items-center gap-1 px-4 py-2 rounded-lg font-medium text-xs transition-all duration-200 ${
                step === 0 
                  ? 'text-slate-600 cursor-not-allowed' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg font-semibold text-xs shadow-lg shadow-cyan-900/30 hover:shadow-cyan-900/50 transition-all duration-200"
            >
              {step === steps.length - 1 ? 'Get Started' : 'Continue'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
