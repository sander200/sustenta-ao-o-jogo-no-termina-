import React from 'react';
import { sound } from '../audio.ts';
import { Play, RotateCcw, HelpCircle, Briefcase, Zap, ShieldAlert, Sparkles } from 'lucide-react';

interface TitleScreenProps {
  hasSavedGame: boolean;
  onNewGame: () => void;
  onResumeGame: () => void;
  onOpenHelp: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  hasSavedGame,
  onNewGame,
  onResumeGame,
  onOpenHelp,
}) => {
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-between p-6 sm:p-12 bg-gradient-to-b from-slate-950/90 via-slate-900/80 to-slate-950/95 backdrop-blur-sm select-none font-tech">
      {/* Top Bar with Enterprise Pill */}
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-900/40 border border-blue-500/30 text-blue-300 text-xs font-mono-code">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>SAP ENTERPRISE SUPPORT SIMULATOR 3D</span>
        </div>

        <div className="text-xs text-slate-400 font-mono-code hidden sm:block">
          v1.0.0 · Versão Oficial
        </div>
      </div>

      {/* Center Hero Lockup with Bespoke SVG Title */}
      <div className="max-w-3xl mx-auto text-center space-y-6 my-auto">
        {/* SVG Title Lockup */}
        <div className="flex justify-center">
          <svg className="w-full max-w-xl h-auto drop-shadow-2xl" viewBox="0 0 600 130">
            <defs>
              <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#818cf8" />
              </linearGradient>
              <linearGradient id="subGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#fbbf24" />
              </linearGradient>
            </defs>
            <text
              x="50%"
              y="55"
              textAnchor="middle"
              fill="url(#titleGrad)"
              className="font-tech font-extrabold tracking-wider"
              style={{ fontSize: '46px', letterSpacing: '4px' }}
            >
              SUSTENTAÇÃO
            </text>
            <text
              x="50%"
              y="105"
              textAnchor="middle"
              fill="url(#subGrad)"
              className="font-tech font-bold"
              style={{ fontSize: '28px', letterSpacing: '8px' }}
            >
              O DIA NUNCA TERMINA
            </text>
          </svg>
        </div>

        <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto leading-relaxed font-normal">
          Assuma o papel de <strong className="text-white">Marcelo</strong>, Key User de referência da <strong className="text-amber-400">C2C</strong> no comando da sustentação SAP.
          Gerencie incidentes de folha, atenda analistas, oriente a equipe e conduza com maestria o expediente corporativo!
        </p>

        {/* Feature Badges */}
        <div className="flex flex-wrap justify-center gap-3 text-xs text-slate-300">
          <span className="px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-blue-400" />
            Incidentes & Ciclo DEV → QAS → PRD
          </span>
          <span className="px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Gestão de Energia & Estresse
          </span>
          <span className="px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Quadro Kanban & Melhorias
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={() => {
              sound.playSuccess();
              onNewGame();
            }}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-white font-bold text-base shadow-xl shadow-blue-500/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Novo Expediente</span>
          </button>

          {hasSavedGame && (
            <button
              onClick={() => {
                sound.playClick();
                onResumeGame();
              }}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-sm border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-emerald-400" />
              <span>Continuar Jogo Salvo</span>
            </button>
          )}

          <button
            onClick={() => {
              sound.playClick();
              onOpenHelp();
            }}
            className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 active:scale-95 text-slate-300 hover:text-white font-semibold text-sm border border-slate-800 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-sky-400" />
            <span>Como Jogar</span>
          </button>
        </div>
      </div>

      {/* Flat Control-hint line at footer */}
      <div className="text-center text-xs text-slate-400 font-mono-code pt-4">
        <span>WASD: Mover</span>
        <span className="mx-2">·</span>
        <span>Arraste o mouse: Câmera</span>
        <span className="mx-2">·</span>
        <span>E: Interagir</span>
      </div>
    </div>
  );
};
