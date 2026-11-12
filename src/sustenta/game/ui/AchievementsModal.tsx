import React from 'react';
import { Achievement } from '../types.ts';
import { sound } from '../audio.ts';
import {
  Award,
  CheckCircle,
  Coffee,
  Flame,
  Lock,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Trophy,
  AlertTriangle,
  X,
} from 'lucide-react';

interface AchievementsModalProps {
  achievements: Achievement[];
  onClose: () => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({ achievements, onClose }) => {
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const renderIcon = (iconName: string, unlocked: boolean) => {
    const props = { className: `w-6 h-6 ${unlocked ? 'text-amber-300' : 'text-slate-500'}` };
    switch (iconName) {
      case 'Flame':
        return <Flame {...props} className={`w-6 h-6 ${unlocked ? 'text-red-400' : 'text-slate-500'}`} />;
      case 'Trophy':
        return <Trophy {...props} />;
      case 'Coffee':
        return <Coffee {...props} className={`w-6 h-6 ${unlocked ? 'text-amber-400' : 'text-slate-500'}`} />;
      case 'ShieldCheck':
        return <ShieldCheck {...props} className={`w-6 h-6 ${unlocked ? 'text-emerald-400' : 'text-slate-500'}`} />;
      case 'TrendingUp':
        return <TrendingUp {...props} className={`w-6 h-6 ${unlocked ? 'text-sky-400' : 'text-slate-500'}`} />;
      case 'AlertTriangle':
        return <AlertTriangle {...props} className={`w-6 h-6 ${unlocked ? 'text-amber-400' : 'text-slate-500'}`} />;
      case 'Sparkles':
        return <Sparkles {...props} className={`w-6 h-6 ${unlocked ? 'text-teal-400' : 'text-slate-500'}`} />;
      default:
        return <Award {...props} />;
    }
  };

  const getRarityBadge = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'legendary':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50 uppercase">
            Lendária
          </span>
        );
      case 'epic':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/50 uppercase">
            Épica
          </span>
        );
      case 'rare':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/50 uppercase">
            Rara
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700/50 text-slate-300 border border-slate-600 uppercase">
            Comum
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-sm">
      <div className="bg-slate-900 border-2 border-amber-500/60 rounded-2xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden font-tech">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-slate-950 px-6 py-4 border-b border-amber-500/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 shadow-lg shadow-amber-500/10">
              <Trophy className="w-6 h-6 animate-bounce-subtle" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Conquistas Corporativas · Marcelo (C2C)</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono-code font-bold">
                  {unlockedCount} / {achievements.length} Desbloqueadas
                </span>
              </div>
              <p className="text-xs text-slate-400">Selos de excelência, sobrevivência ao fechamento e domínio de processos SAP</p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Badges Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.map((ach) => {
            const isLegendary = ach.rarity === 'legendary' && ach.unlocked;

            return (
              <div
                key={ach.id}
                className={`p-4 rounded-xl border transition-all flex items-start gap-4 relative overflow-hidden ${
                  ach.unlocked
                    ? isLegendary
                      ? 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border-amber-500/70 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-800/60 border-slate-700 hover:border-blue-500/60'
                    : 'bg-slate-950/40 border-slate-800/80 opacity-60'
                }`}
              >
                {/* Gold sweep effect on unlocked legendary */}
                {isLegendary && (
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                )}

                {/* Badge Icon Circle */}
                <div
                  className={`w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center border-2 transition-all shadow-md ${
                    ach.unlocked
                      ? ach.rarity === 'legendary'
                        ? 'bg-gradient-to-br from-amber-600/30 to-amber-900/50 border-amber-400 shadow-amber-500/20'
                        : ach.rarity === 'epic'
                        ? 'bg-purple-900/40 border-purple-400 shadow-purple-500/20'
                        : 'bg-blue-900/40 border-blue-400 shadow-blue-500/20'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  {ach.unlocked ? renderIcon(ach.icon, true) : <Lock className="w-5 h-5 text-slate-600" />}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className={`text-sm font-bold truncate ${ach.unlocked ? 'text-white' : 'text-slate-400'}`}>
                      {ach.title}
                    </h3>
                    {getRarityBadge(ach.rarity)}
                  </div>

                  <div className="text-[11px] text-amber-400/90 font-medium italic mb-1">
                    "{ach.subtitle}"
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed mb-2">
                    {ach.description}
                  </p>

                  {/* Progress or Unlocked Status */}
                  {ach.unlocked ? (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold font-mono-code">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>DESBLOQUEADO · {ach.unlockedAt || 'Expediente Atual'}</span>
                    </div>
                  ) : (
                    ach.maxProgress && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono-code text-slate-500">
                          <span>Progresso</span>
                          <span>
                            {ach.progress || 0} / {ach.maxProgress}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="h-full bg-slate-600 transition-all duration-300"
                            style={{
                              width: `${Math.min(100, (((ach.progress || 0) / ach.maxProgress) * 100))}%`,
                            }}
                          />
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Conquiste novos selos resolvendo tickets em QAS, controlando o estresse e avançando projetos no Kanban!
          </span>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer whitespace-nowrap"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
