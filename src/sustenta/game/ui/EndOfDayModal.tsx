import React from 'react';
import { PlayerStats, Ticket } from '../types.ts';
import { sound } from '../audio.ts';
import { Award, BookOpen, CheckCircle, Clock, ShieldAlert, Sparkles, Zap, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface EndOfDayModalProps {
  stats: PlayerStats;
  tickets: Ticket[];
  onStartNextDay: () => void;
}

export const EndOfDayModal: React.FC<EndOfDayModalProps> = ({ stats, tickets, onStartNextDay }) => {
  const solvedToday = tickets.filter((t) => t.status === 'closed').length;
  const inProgress = tickets.filter((t) => t.status !== 'closed').length;
  const criticalStabilized = tickets.filter(
    (t) => (t.assignedPriority === 'P1' || t.suggestedPriority === 'P1') && t.status === 'closed'
  ).length;

  const handleNextDay = () => {
    sound.playSuccess();
    confetti({
      particleCount: 80,
      spread: 90,
      origin: { y: 0.6 },
    });
    onStartNextDay();
  };

  const getDayName = (d: number) => {
    const days = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira'];
    return days[(d - 1) % days.length];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="bg-slate-900 border-2 border-blue-500/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden font-tech animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-950 px-6 py-5 border-b border-blue-500/50 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 text-xs font-mono-code mb-2">
            <Clock className="w-3.5 h-3.5" />
            <span>EXPEDIENTE ENCERRADO · 18:00</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wide">
            Resumo do Dia {stats.day} · {getDayName(stats.day)}
          </h2>
          <p className="text-xs text-blue-200 mt-1">
            "A vitória não significa zerar a fila; significa conduzir bem o expediente e as pessoas."
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Main Score Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/80 text-center">
              <div className="text-xs text-slate-400 uppercase font-semibold">Resolvidos</div>
              <div className="text-2xl font-bold text-emerald-400 font-mono-code mt-1">{solvedToday}</div>
              <div className="text-[10px] text-slate-400">tickets encerrados</div>
            </div>

            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/80 text-center">
              <div className="text-xs text-slate-400 uppercase font-semibold">Pendentes</div>
              <div className="text-2xl font-bold text-amber-400 font-mono-code mt-1">{inProgress}</div>
              <div className="text-[10px] text-slate-400">com responsável</div>
            </div>

            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/80 text-center">
              <div className="text-xs text-slate-400 uppercase font-semibold">P1 Tratados</div>
              <div className="text-2xl font-bold text-red-400 font-mono-code mt-1">{criticalStabilized}</div>
              <div className="text-[10px] text-slate-400">sem colapso em PRD</div>
            </div>

            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/80 text-center">
              <div className="text-xs text-slate-400 uppercase font-semibold">Reputação</div>
              <div className="text-2xl font-bold text-sky-400 font-mono-code mt-1">{stats.reputation}/100</div>
              <div className="text-[10px] text-slate-400">confiança da equipe</div>
            </div>
          </div>

          {/* Feedback do Gestor */}
          <div className="bg-slate-800/40 border border-slate-700/80 rounded-xl p-4 text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-300 font-bold">
              <span className="flex items-center gap-1.5 text-blue-400">
                <Sparkles className="w-4 h-4" />
                Avaliação do Gestor (Dr. Marcos)
              </span>
              <span className="font-mono-code text-emerald-400">Conceito: ÓTIMO</span>
            </div>
            <p className="text-slate-300 leading-relaxed italic">
              "Excelente trabalho, Marcelo! Como sempre, a sua liderança e a parceria da C2C garantiram que a folha fechasse sem sustos. As evidências foram bem triadas, os testes foram feitos em QAS antes de subir para Produção e a equipe manteve o foco. Descanse um pouco e nos vemos amanhã!"
            </p>
          </div>

          {/* Estado de Saúde no Fim do Expediente */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="text-xs uppercase font-semibold text-slate-400">Sustentabilidade do Expediente</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Energia restante:</span>
                  <span className="font-mono-code font-bold">{Math.round(stats.energy)}%</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500"
                    style={{ width: `${Math.max(0, Math.min(100, stats.energy))}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Nível de estresse:</span>
                  <span className="font-mono-code font-bold">{Math.round(stats.stress)}%</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500"
                    style={{ width: `${Math.max(0, Math.min(100, stats.stress))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CTA Next Day */}
          <button
            onClick={handleNextDay}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 active:scale-98 transition-all text-white font-bold rounded-xl text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Iniciar Próximo Dia de Trabalho (Dia {stats.day + 1})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
