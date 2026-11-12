import React from 'react';
import { sound } from '../audio.ts';
import { HelpCircle, CheckCircle, ShieldAlert, Zap, Coffee, X } from 'lucide-react';

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-tech">
        {/* Header */}
        <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Manual do Key User · Guia de Sustentação</h2>
              <p className="text-xs text-slate-400">Regras de jogo e boas práticas corporativas SAP</p>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm text-slate-200">
          {/* Controles */}
          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/80">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              Controles de Movimentação & Interação
            </h3>
            <ul className="text-xs text-slate-300 space-y-1.5 font-mono-code">
              <li>• <strong>W, A, S, D</strong> ou <strong>Setas</strong>: Caminhar pelo escritório 2.5D</li>
              <li>• <strong>Clique do Mouse / Toque</strong>: Andar até o ponto indicado</li>
              <li>• <strong>Tecla E</strong> ou <strong>Barra de Espaço</strong>: Interagir com pessoas e objetos</li>
              <li>• <strong>Botão Interagir</strong>: Aparece automaticamente quando próximo de uma mesa ou colega</li>
            </ul>
          </div>

          {/* 5 Princípios de Suporte */}
          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/80 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              As 5 Regras de Ouro da Sustentação
            </h3>

            <div className="text-xs text-slate-300 space-y-2.5 leading-relaxed">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>1. Priorizar com responsabilidade:</strong> Nem tudo que vem escrito "URGENTE" é P1. P1 é apenas processo crítico parado sem alternativa contorno. Classificar tudo como P1 causa pânico na equipe!
                </span>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>2. Evidências antes de escalar:</strong> Colete logs, matrículas, períodos e prints. Os consultores funcionais e ABAP precisam de dados objetivos para reproduzir o erro.
                </span>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>3. NUNCA testar em Produção (PRD):</strong> Toda correção deve ser homologada em QAS com roteiro de testes antes de ser transportada para PRD.
                </span>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>4. Gestão de Energia e Estresse:</strong> Tome café na copa (+10 Energia), almoce no refeitório (+30 Energia) e faça pausas no banheiro para aliviar o estresse acumulado.
                </span>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>5. Projetos de Melhoria no Kanban:</strong> Não viva apenas de apagar incêndios. Dedique esforço a projetos preventivos para diminuir incidentes futuros!
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-5 py-3 border-t border-slate-800 text-right">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            Entendido! Voltar ao Jogo
          </button>
        </div>
      </div>
    </div>
  );
};
