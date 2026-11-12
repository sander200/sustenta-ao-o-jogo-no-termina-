import React from 'react';
import { ProjectCard } from '../types.ts';
import { sound } from '../audio.ts';
import { Trello, Zap, BookOpen, CheckCircle, ArrowRight, X, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface KanbanModalProps {
  projects: ProjectCard[];
  playerEnergy: number;
  sapKnowledge: number;
  onAdvanceProject: (projectId: string) => void;
  onClose: () => void;
}

export const KanbanModal: React.FC<KanbanModalProps> = ({
  projects,
  playerEnergy,
  sapKnowledge,
  onAdvanceProject,
  onClose,
}) => {
  const columns: { key: ProjectCard['stage']; label: string; color: string }[] = [
    { key: 'ideias', label: 'Ideias', color: 'border-slate-700 bg-slate-900/40 text-slate-400' },
    { key: 'planejado', label: 'Planejado', color: 'border-blue-900 bg-blue-950/20 text-blue-400' },
    { key: 'em_execucao', label: 'Em Execução', color: 'border-amber-900 bg-amber-950/20 text-amber-400' },
    { key: 'em_teste', label: 'Em Teste', color: 'border-purple-900 bg-purple-950/20 text-purple-400' },
    { key: 'concluido', label: 'Concluído', color: 'border-emerald-900 bg-emerald-950/20 text-emerald-400' },
  ];

  const handleAdvance = (project: ProjectCard) => {
    if (playerEnergy < project.effortCostEnergy) {
      sound.playAlertCritical();
      return;
    }
    sound.playSuccess();
    if (project.stage === 'em_teste') {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.5 },
      });
    }
    onAdvanceProject(project.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden font-tech">
        {/* Header */}
        <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-600/30 border border-emerald-500/40 text-emerald-400">
              <Trello className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Quadro Kanban de Projetos & Melhorias</h2>
              <p className="text-xs text-slate-400">
                Iniciativas que reduzem reincidência de incidentes e melhoram os processos de RH/SAP
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Kanban Board Columns */}
        <div className="flex-1 overflow-x-auto p-4 flex gap-4">
          {columns.map((col) => {
            const colProjects = projects.filter((p) => p.stage === col.key);

            return (
              <div
                key={col.key}
                className="w-72 flex-shrink-0 flex flex-col bg-slate-950/50 rounded-xl border border-slate-800/80 p-3"
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className={`text-xs font-bold uppercase tracking-wider ${col.color.split(' ')[2]}`}>
                    {col.label}
                  </span>
                  <span className="text-xs font-mono-code text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full">
                    {colProjects.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3">
                  {colProjects.map((p) => (
                    <div
                      key={p.id}
                      className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 space-y-2 shadow-lg"
                    >
                      <h4 className="text-sm font-bold text-white leading-tight">{p.title}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">{p.description}</p>

                      <div className="bg-slate-900/60 p-2 rounded-lg text-[11px] text-emerald-300 border border-emerald-500/30 flex items-start gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>{p.benefit}</span>
                      </div>

                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[10px] font-mono-code text-slate-400">
                          <span>Progresso</span>
                          <span>{p.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                            style={{ width: `${p.progress}%` }}
                          />
                        </div>
                      </div>

                      {p.stage !== 'concluido' && (
                        <button
                          onClick={() => handleAdvance(p)}
                          disabled={playerEnergy < p.effortCostEnergy}
                          className="w-full mt-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 active:scale-95 transition-all text-white font-bold text-xs rounded-lg shadow flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Dedicar Esforço (-{p.effortCostEnergy} Energia)</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
