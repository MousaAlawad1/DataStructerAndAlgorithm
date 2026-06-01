import React from 'react';
import { ListOrdered, Terminal, Github, Send, GraduationCap, Code2, Sparkles, ExternalLink } from 'lucide-react';
import { BTreeSnapshot } from '../types/btree';

interface EducationPanelProps {
  currentStepData: BTreeSnapshot | null;
  steps: BTreeSnapshot[];
  currentStepIndex: number;
  onSelectStep: (index: number) => void;
}

// ── Inline SVG icons for social links (no lucide dependency issues) ──────────
const InstagramIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <circle cx="12" cy="12" r="4.5"/>
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
  </svg>
);

const GitHubIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.167 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
  </svg>
);

const TelegramIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

// ── Social links data ─────────────────────────────────────────────────────────
const SOCIAL_LINKS = [
  {
    label: 'GitHub',
    handle: '@MousaAlawad1',
    href: 'https://github.com/MousaAlawad1',
    icon: <GitHubIcon />,
    gradient: 'from-slate-800 to-slate-900',
    border: 'border-slate-700/60 hover:border-slate-500',
    text: 'text-slate-200',
    sub: 'text-slate-500',
    glow: '',
  },
  {
    label: 'Instagram',
    handle: '@1mousa_alawad',
    href: 'https://instagram.com/1mousa_alawad',
    icon: <InstagramIcon />,
    gradient: 'from-pink-950/70 to-purple-950/70',
    border: 'border-pink-800/40 hover:border-pink-500/70',
    text: 'text-pink-300',
    sub: 'text-pink-500/60',
    glow: 'shadow-pink-500/5',
  },
  {
    label: 'Telegram',
    handle: '@Mousa_Alawad',
    href: 'https://t.me/Mousa_Alawad',
    icon: <TelegramIcon />,
    gradient: 'from-sky-950/70 to-cyan-950/70',
    border: 'border-sky-800/40 hover:border-sky-400/70',
    text: 'text-sky-300',
    sub: 'text-sky-500/60',
    glow: 'shadow-sky-500/5',
  },
];

const SKILLS = ['React', 'TypeScript', 'Algorithms', 'Data Structures', 'SVG', 'Next.js'];

export const EducationPanel: React.FC<EducationPanelProps> = ({
  currentStepData,
  steps,
  currentStepIndex,
  onSelectStep,
}) => {
  return (
    <div className="w-full flex flex-col gap-4 text-xs">

      {/* ── DEVELOPER CARD (always visible, static) ─────────────────────── */}
      <div className="relative bg-slate-950/80 border border-slate-800/70 rounded-2xl overflow-hidden backdrop-blur-sm">
        {/* Top accent bar */}
        <div className="h-0.5 w-full bg-gradient-to-r from-cyan-500 via-violet-500 to-pink-500" />

        {/* Ambient glow */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative p-5 space-y-4">

          {/* Identity row */}
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 via-violet-500 to-pink-500 flex items-center justify-center text-xl font-black text-white shadow-lg shadow-cyan-500/20">
                M
              </div>
              {/* Online dot */}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-950 flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              </div>
            </div>

            {/* Name + role */}
            <div className="min-w-0">
              <h2 className="text-sm font-black text-white tracking-tight leading-tight">Mousa Alawad</h2>
              <div className="flex items-center gap-1 mt-1">
                <GraduationCap className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                <span className="text-[10px] text-slate-400 truncate">Info Engineering · Year 3</span>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <Code2 className="w-3 h-3 text-violet-400 flex-shrink-0" />
                <span className="text-[10px] text-violet-300 font-semibold">Full-Stack Developer</span>
              </div>
            </div>
          </div>

          {/* Bio */}
          <p className="text-[10.5px] text-slate-400 leading-relaxed border-l-2 border-cyan-500/30 pl-3">
            Passionate about <span className="text-cyan-300">algorithms</span> & interactive visual experiences. Building projects that bridge education and modern software engineering.
          </p>

          {/* Project badge */}
          <div className="flex items-start gap-2.5 bg-slate-900/60 border border-slate-800/60 rounded-xl px-3 py-2.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-slate-500 leading-relaxed">
              <span className="text-slate-300 font-semibold">B-Tree Lab</span> — University showcase & portfolio project. Demonstrates algorithm visualisation, SVG rendering & React architecture.
            </p>
          </div>

          {/* Skills */}
          <div className="flex flex-wrap gap-1.5">
            {SKILLS.map((s) => (
              <span key={s} className="px-2 py-0.5 bg-slate-800/60 border border-slate-700/50 text-slate-400 text-[9px] font-mono rounded-md">
                {s}
              </span>
            ))}
          </div>

          {/* Social links */}
          <div className="space-y-2">
            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Connect</p>
            {SOCIAL_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-between px-3 py-2.5 bg-gradient-to-r ${link.gradient} border ${link.border} rounded-xl transition-all duration-200 group shadow-sm ${link.glow}`}
              >
                <div className="flex items-center gap-3">
                  <span className={link.text}>{link.icon}</span>
                  <div>
                    <p className={`text-[11px] font-semibold ${link.text} leading-tight`}>{link.label}</p>
                    <p className={`text-[9px] font-mono ${link.sub}`}>{link.handle}</p>
                  </div>
                </div>
                <ExternalLink className="w-3 h-3 text-slate-700 group-hover:text-slate-400 transition-colors" />
              </a>
            ))}
          </div>

          {/* Quote */}
          <p className="text-center text-[9px] text-slate-700 italic font-mono pt-1 border-t border-slate-900">
            "Making algorithms visible, one node at a time."
          </p>
        </div>
      </div>

      {/* ── STEP TIMELINE (only shows when operation is running) ────────── */}
      {steps.length > 1 && (
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-sm space-y-2">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <ListOrdered className="w-3.5 h-3.5 text-pink-400" />
            Step Timeline
            <span className="ml-auto font-mono text-[9px] text-slate-600">
              {currentStepIndex + 1} / {steps.length}
            </span>
          </h3>
          <div className="max-h-44 overflow-y-auto bg-slate-900 border border-slate-800 rounded-xl p-2 space-y-1 font-mono text-[10px]">
            {steps.map((step, idx) => {
              const isCurrent = idx === currentStepIndex;
              const dot =
                step.actionType === 'success'
                  ? 'bg-emerald-400'
                  : step.actionType === 'error'
                  ? 'bg-rose-400'
                  : step.actionType.includes('split') || step.actionType.includes('promote')
                  ? 'bg-amber-400'
                  : 'bg-cyan-400';
              return (
                <button
                  key={idx}
                  onClick={() => onSelectStep(idx)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg border flex items-center gap-2 transition-all duration-150 cursor-pointer ${
                    isCurrent
                      ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300 font-bold'
                      : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${dot}`} />
                  <span className="w-5 shrink-0 text-slate-500">#{idx + 1}</span>
                  <span className="truncate flex-1">{step.description}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state when no steps */}
      {(!currentStepData || steps.length <= 1) && (
        <div className="bg-slate-950/40 border border-slate-800/40 rounded-2xl p-4 flex items-center gap-2 text-slate-600">
          <Terminal className="w-4 h-4 flex-shrink-0" />
          <span className="text-[10px] font-mono">Run an operation to see step-by-step animation.</span>
        </div>
      )}
    </div>
  );
};
