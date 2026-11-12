import React, { useState } from 'react';
import { Priority, SpecialistType, Ticket } from '../types.ts';
import { sound } from '../audio.ts';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Database,
  FileSearch,
  FileText,
  Play,
  RotateCcw,
  Send,
  ShieldAlert,
  Terminal,
  UserCheck,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SapTicketModalProps {
  ticket: Ticket;
  playerEnergy: number;
  sapKnowledge: number;
  onClose: () => void;
  onUpdateTicket: (updated: Ticket) => void;
  onConsumeEnergy: (amount: number) => void;
  onAddKnowledge: (amount: number) => void;
  onAddReputation: (amount: number) => void;
  onAdjustStress: (amount: number) => void;
  onAdvanceTime: (minutes: number) => void;
}

export const SapTicketModal: React.FC<SapTicketModalProps> = ({
  ticket,
  playerEnergy,
  sapKnowledge,
  onClose,
  onUpdateTicket,
  onConsumeEnergy,
  onAddKnowledge,
  onAddReputation,
  onAdjustStress,
  onAdvanceTime,
}) => {
  const [activeTab, setActiveTab] = useState<'geral' | 'evidencias' | 'diagnostico' | 'especialista' | 'qas' | 'implantacao'>('geral');
  const [selectedPriority, setSelectedPriority] = useState<Priority>(ticket.assignedPriority || ticket.suggestedPriority);
  const [priorityFeedback, setPriorityFeedback] = useState<string | null>(null);
  const [simulatedLog, setSimulatedLog] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Collect evidence
  const handleCollectEvidence = (evidenceId: string) => {
    sound.playClick();
    onConsumeEnergy(5);
    onAdvanceTime(15);
    onAddKnowledge(5);

    const updatedEvidences = ticket.evidences.map((ev) =>
      ev.id === evidenceId ? { ...ev, collected: true } : ev
    );

    const updated = {
      ...ticket,
      evidences: updatedEvidences,
      logs: [
        ...ticket.logs,
        {
          timestamp: 'Agora',
          author: 'Marcelo (C2C)',
          action: 'Coleta de Evidência',
          note: `Evidência "${updatedEvidences.find((e) => e.id === evidenceId)?.label}" coletada e anexada.`,
        },
      ],
    };
    onUpdateTicket(updated);
  };

  // Classify priority
  const handleConfirmPriority = () => {
    sound.playClick();
    if (selectedPriority === 'P1' && ticket.suggestedPriority !== 'P1') {
      setPriorityFeedback('Atenção: Classificar como P1 chamados sem impacto operacional generalizado eleva o estresse da equipe desnecessariamente.');
      onAdjustStress(10);
    } else if (selectedPriority === ticket.suggestedPriority) {
      setPriorityFeedback('Ótima análise! Prioridade alinhada com o impacto real do negócio.');
      onAddReputation(5);
    } else {
      setPriorityFeedback(`Prioridade registrada como ${selectedPriority}.`);
    }

    const updated: Ticket = {
      ...ticket,
      assignedPriority: selectedPriority,
      status: ticket.status === 'new' ? 'triaged' : ticket.status,
      logs: [
        ...ticket.logs,
        {
          timestamp: 'Agora',
          author: 'Marcelo (C2C)',
          action: 'Classificação de Prioridade',
          note: `Prioridade definida como ${selectedPriority}.`,
        },
      ],
    };
    onUpdateTicket(updated);
  };

  // Run SAP Transaction Simulation
  const handleRunSimulation = () => {
    sound.playClick();
    setIsSimulating(true);
    onConsumeEnergy(10);
    onAdvanceTime(25);

    setTimeout(() => {
      setIsSimulating(false);
      sound.playNotification();

      let logText = '';
      if (ticket.sapTransaction.includes('PC00')) {
        logText = `[SAP HCM EXECUÇÃO ${ticket.sapTransaction}]\nStatus: Concluído com avisos.\nTabela RT: Rubrica 1025 ausente.\nDiagnóstico: Regra de cálculo PCR ZBR1 não ativada para a variante de folha M1.`;
      } else if (ticket.sapTransaction.includes('PA30')) {
        logText = `[SAP HCM PA30]\nColaborador possui Infotipo 0014 (Desconto manual) e Infotipo 0377 (Benefício automático).\nConflito de duplicidade verificado com sucesso!`;
      } else if (ticket.sapTransaction.includes('PA40')) {
        logText = `[SAP HCM PA40 / SU53]\nFalha de autorização: Objeto P_ORGIN campo AUTHC=W, PERSG=D não autorizado para o usuário.`;
      } else {
        logText = `[SAP TERMINAL ${ticket.sapTransaction}]\nExecução concluída. Detalhes técnicos verificados no log de sistema.`;
      }

      setSimulatedLog(logText);
      const updated: Ticket = {
        ...ticket,
        diagnosisCompleted: true,
        status: 'in_investigation',
        logs: [
          ...ticket.logs,
          {
            timestamp: 'Agora',
            author: 'Marcelo (C2C)',
            action: 'Simulação SAP',
            note: `Transação ${ticket.sapTransaction} simulada com sucesso. Causa raiz diagnosticada.`,
          },
        ],
      };
      onUpdateTicket(updated);
      onAddKnowledge(10);
    }, 700);
  };

  // Resolve Directly (if advice possible)
  const handleResolveDirectly = () => {
    sound.playSuccess();
    onConsumeEnergy(15);
    onAdvanceTime(30);
    onAddReputation(15);
    onAddKnowledge(15);
    onAdjustStress(-10);

    const updated: Ticket = {
      ...ticket,
      status: 'validated',
      feedbackFromUser: 'Perfeito! Segui a orientação, delimitei o registro no Infotipo e o desconto regularizou na hora! Muito obrigado!',
      logs: [
        ...ticket.logs,
        {
          timestamp: 'Agora',
          author: 'Marcelo (C2C)',
          action: 'Resolução Direta pelo Key User',
          note: ticket.directResolutionAdvice || 'Resolvido mediante orientação funcional de dados mestres.',
        },
      ],
    };
    onUpdateTicket(updated);
    setActiveTab('implantacao');
  };

  // Dispatch to Specialist
  const handleDispatchToSpecialist = (type: SpecialistType) => {
    sound.playClick();
    onConsumeEnergy(10);
    onAdvanceTime(30);

    const specialistName =
      type === 'functional'
        ? 'Mariana Duarte (Funcional HCM)'
        : type === 'abap'
        ? 'Lucas Ferreira (ABAP)'
        : 'Fábio Alencar (Basis / Infra)';

    const updated: Ticket = {
      ...ticket,
      specialistAssigned: specialistName,
      status: 'with_specialist',
      specialistProgress: 35,
      logs: [
        ...ticket.logs,
        {
          timestamp: 'Agora',
          author: 'Marcelo (C2C)',
          action: 'Encaminhamento',
          note: `Chamado enviado para ${specialistName} com todas as evidências coletadas.`,
        },
      ],
    };
    onUpdateTicket(updated);
  };

  // Advance Specialist Development to QAS
  const handleSpecialistAdvance = () => {
    sound.playNotification();
    onAdvanceTime(40);

    const updated: Ticket = {
      ...ticket,
      specialistProgress: 100,
      status: 'ready_for_qas',
      logs: [
        ...ticket.logs,
        {
          timestamp: 'Agora',
          author: ticket.specialistAssigned || 'Especialista',
          action: 'Correção Disponível em DEV',
          note: 'Request de transporte gerada e importada no ambiente de qualidade (QAS). Liberado para testes do Key User.',
        },
      ],
    };
    onUpdateTicket(updated);
    setActiveTab('qas');
  };

  // Test Routine in QAS
  const handleTestInQAS = (routineId: string) => {
    sound.playClick();
    onConsumeEnergy(10);
    onAdvanceTime(30);
    onAddKnowledge(10);

    const updatedRoutines = ticket.qasTestRoutines.map((r) =>
      r.id === routineId ? { ...r, passed: true } : r
    );

    const allPassed = updatedRoutines.every((r) => r.passed);

    const updated: Ticket = {
      ...ticket,
      qasTestRoutines: updatedRoutines,
      qasApproved: allPassed,
      status: allPassed ? 'tested_qas' : 'ready_for_qas',
      logs: [
        ...ticket.logs,
        {
          timestamp: 'Agora',
          author: 'Marcelo (C2C)',
          action: 'Teste em QAS',
          note: `Roteiro executado no ambiente QAS: ${allPassed ? 'Aprovado 100%' : 'Em andamento'}.`,
        },
      ],
    };
    onUpdateTicket(updated);
  };

  // Deploy to PRD (Production)
  const handleDeployToPRD = () => {
    sound.playSuccess();
    onConsumeEnergy(10);
    onAdvanceTime(20);
    onAddReputation(10);

    const updated: Ticket = {
      ...ticket,
      prdChangeAuthorized: true,
      status: 'deployed_prd',
      logs: [
        ...ticket.logs,
        {
          timestamp: 'Agora',
          author: 'Marcelo (C2C) / Basis',
          action: 'Transporte para PRD',
          note: 'Mudança autorizada e transportada para o ambiente de Produção.',
        },
      ],
    };
    onUpdateTicket(updated);
  };

  // Final Close Ticket
  const handleCloseTicket = () => {
    sound.playSuccess();
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
    });

    onAddReputation(ticket.reward.reputation);
    onAddKnowledge(ticket.reward.knowledge);
    onAdjustStress(-15);

    const updated: Ticket = {
      ...ticket,
      status: 'closed',
      logs: [
        ...ticket.logs,
        {
          timestamp: 'Agora',
          author: 'Marcelo (C2C)',
          action: 'Encerramento com Sucesso',
          note: 'Chamado homologado, validado com o solicitante e encerrado com sucesso.',
        },
      ],
    };
    onUpdateTicket(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border-2 border-blue-600/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-tech">
        {/* SAP GUI Header Bar */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-slate-900 px-4 py-2.5 flex items-center justify-between border-b border-blue-600/50">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow">
              SAP
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>{ticket.id}</span>
                <span className="text-blue-300 font-normal">· {ticket.systemModule}</span>
              </div>
              <div className="text-[11px] text-blue-200 truncate max-w-md">{ticket.title}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950/60 border border-blue-400/30 text-xs font-mono-code text-blue-200">
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              <span>/n{ticket.sapTransaction}</span>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-red-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-950/90 px-4 py-2 border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab('geral')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'geral' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>1. Visão Geral</span>
          </button>

          <button
            onClick={() => setActiveTab('evidencias')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'evidencias' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileSearch className="w-3.5 h-3.5" />
            <span>2. Evidências</span>
            {ticket.evidences.some((e) => !e.collected) && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('diagnostico')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'diagnostico' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>3. Simulação SAP</span>
          </button>

          <button
            onClick={() => setActiveTab('especialista')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'especialista' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>4. Especialistas</span>
          </button>

          <button
            onClick={() => setActiveTab('qas')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'qas' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>5. Testes em QAS</span>
          </button>

          <button
            onClick={() => setActiveTab('implantacao')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'implantacao' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>6. PRD & Validação</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-5 text-slate-200 text-sm space-y-4">
          {/* TAB 1: GERAL */}
          {activeTab === 'geral' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/80">
                  <div className="text-xs text-slate-400 uppercase font-semibold mb-1">Solicitante</div>
                  <div className="text-base font-bold text-white">{ticket.requesterName}</div>
                  <div className="text-xs text-blue-400">{ticket.requesterRole}</div>
                  <div className="mt-3 text-xs text-slate-400 uppercase font-semibold mb-1">Impacto no Negócio</div>
                  <div className="text-sm text-slate-200">{ticket.impactDescription}</div>
                </div>

                <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/80">
                  <div className="text-xs text-slate-400 uppercase font-semibold mb-1">Urgência Declarada</div>
                  <div className="text-sm text-amber-300 font-medium">{ticket.urgencyReason}</div>
                  <div className="mt-3 text-xs text-slate-400 uppercase font-semibold mb-1">Recompensa ao Concluir</div>
                  <div className="text-xs font-mono-code text-emerald-400">
                    +{ticket.reward.reputation} Reputação · +{ticket.reward.knowledge} Conhecimento SAP
                  </div>
                </div>
              </div>

              {/* Descrição detalhada */}
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/70">
                <div className="text-xs text-slate-400 uppercase font-semibold mb-1">Descrição do Problema</div>
                <div className="text-sm leading-relaxed text-slate-200">{ticket.description}</div>
              </div>

              {/* Classificação de Prioridade & SLA */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-blue-500/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-blue-400" />
                    <span>Classificação de Prioridade & SLA</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono-code">
                    Sugerido pelo sistema: <strong className="text-amber-400">{ticket.suggestedPriority}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                  {(['P1', 'P2', 'P3', 'P4'] as Priority[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setSelectedPriority(p)}
                      className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                        selectedPriority === p
                          ? 'bg-blue-600 border-blue-400 text-white font-bold shadow-lg'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-sm font-bold font-mono-code">{p}</div>
                      <div className="text-[10px] text-slate-300">
                        {p === 'P1' ? 'Crítico (Folha parada)' : p === 'P2' ? 'Alto (Impacto amplo)' : p === 'P3' ? 'Médio (Existe contorno)' : 'Baixo (Dúvida/Ajuste)'}
                      </div>
                    </button>
                  ))}
                </div>

                {priorityFeedback && (
                  <div className="p-3 mb-3 rounded-lg bg-blue-950/60 border border-blue-500/40 text-xs text-blue-200">
                    {priorityFeedback}
                  </div>
                )}

                <button
                  onClick={handleConfirmPriority}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 active:scale-98 transition-all text-white font-bold rounded-lg text-xs shadow-md cursor-pointer"
                >
                  Confirmar Classificação de Prioridade
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: EVIDÊNCIAS */}
          {activeTab === 'evidencias' && (
            <div className="space-y-4">
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
                <div className="text-sm font-bold text-white mb-2">Checklist de Coleta de Evidências</div>
                <p className="text-xs text-slate-400 mb-4">
                  Antes de escalar para os consultores ABAP ou Funcionais, você como Key User precisa coletar dados confiáveis. Sem evidências, o chamado é devolvido!
                </p>

                <div className="space-y-3">
                  {ticket.evidences.map((ev) => (
                    <div
                      key={ev.id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                        ev.collected
                          ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                          : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-sm flex items-center gap-2">
                          {ev.collected ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-amber-400" />}
                          <span>{ev.label}</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">{ev.description}</div>
                      </div>

                      {ev.collected ? (
                        <span className="text-xs font-mono-code font-bold text-emerald-400 bg-emerald-900/40 px-2.5 py-1 rounded">
                          ANEXADA
                        </span>
                      ) : (
                        <button
                          onClick={() => handleCollectEvidence(ev.id)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow cursor-pointer whitespace-nowrap"
                        >
                          Coletar (-5 E)
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DIAGNÓSTICO & SIMULAÇÃO SAP */}
          {activeTab === 'diagnostico' && (
            <div className="space-y-4">
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
                <div className="text-sm font-bold text-white mb-2">Reprodução de Cenário no Terminal SAP</div>
                <p className="text-xs text-slate-400 mb-3">
                  Transação SAP designada: <strong className="text-blue-400 font-mono-code">{ticket.sapTransaction}</strong>.
                  Simule a execução para identificar a causa raiz antes de mobilizar a equipe técnica.
                </p>

                <button
                  onClick={handleRunSimulation}
                  disabled={isSimulating}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold rounded-lg text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-4 h-4" />
                  <span>{isSimulating ? 'Executando Transação SAP...' : `Executar Simulação ${ticket.sapTransaction} (-10 Energia)`}</span>
                </button>

                {simulatedLog && (
                  <div className="mt-4 bg-black/90 p-4 rounded-xl border border-emerald-500/40 font-mono-code text-xs text-emerald-400 whitespace-pre-wrap leading-relaxed shadow-inner">
                    {simulatedLog}
                  </div>
                )}
              </div>

              {/* Opção de Resolução Direta (se for caso simples de cadastro / dados mestres) */}
              {ticket.canResolveDirectly && (
                <div className="bg-gradient-to-r from-emerald-950/60 to-slate-900 p-4 rounded-xl border border-emerald-500/50">
                  <div className="text-sm font-bold text-emerald-300 flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Solução Direta pelo Key User Possível!</span>
                  </div>
                  <p className="text-xs text-slate-300 mb-3">
                    Este chamado não requer desenvolvimento ou transporte de programa. É um conflito de dados mestres que você pode orientar o analista solicitante a resolver imediatamente!
                  </p>
                  <button
                    onClick={handleResolveDirectly}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-lg text-xs transition-all shadow-md cursor-pointer"
                  >
                    Orientar Solicitante & Concluir Chamado
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ESPECIALISTAS */}
          {activeTab === 'especialista' && (
            <div className="space-y-4">
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
                <div className="text-sm font-bold text-white mb-2">Encaminhamento da Demanda</div>
                <p className="text-xs text-slate-400 mb-4">
                  Selecione o especialista correto com base no diagnóstico. Escolher o especialista errado gera retrabalho e atrasos no SLA!
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                    <div className="font-bold text-pink-400 text-sm">Consultoria Funcional HCM</div>
                    <div className="text-xs text-slate-400 mt-1 mb-3">Mariana Duarte · Regras de cálculo, parametrização de rubricas e customizing.</div>
                    <button
                      onClick={() => handleDispatchToSpecialist('functional')}
                      className="w-full py-1.5 bg-pink-700 hover:bg-pink-600 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      Acionar Funcional
                    </button>
                  </div>

                  <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                    <div className="font-bold text-blue-400 text-sm">Desenvolvimento ABAP</div>
                    <div className="text-xs text-slate-400 mt-1 mb-3">Lucas Ferreira · Dumps ST22, programas Z, rotinas de cálculo customizadas.</div>
                    <button
                      onClick={() => handleDispatchToSpecialist('abap')}
                      className="w-full py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      Acionar ABAP
                    </button>
                  </div>

                  <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                    <div className="font-bold text-indigo-400 text-sm">Basis & Infraestrutura</div>
                    <div className="text-xs text-slate-400 mt-1 mb-3">Fábio Alencar · Perfis de autorização, filas de job SM37 e ambientes.</div>
                    <button
                      onClick={() => handleDispatchToSpecialist('basis')}
                      className="w-full py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      Acionar Basis
                    </button>
                  </div>
                </div>

                {ticket.specialistAssigned && (
                  <div className="mt-4 p-4 rounded-xl bg-blue-950/40 border border-blue-500/40">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-blue-300">
                        Atendimento com: {ticket.specialistAssigned}
                      </span>
                      <span className="text-xs font-mono-code text-blue-400">{ticket.specialistProgress}% Concluído</span>
                    </div>

                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-3">
                      <div
                        className="h-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${ticket.specialistProgress}%` }}
                      />
                    </div>

                    {ticket.specialistProgress < 100 ? (
                      <button
                        onClick={handleSpecialistAdvance}
                        className="py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Acompanhar Análise & Liberar para QAS
                      </button>
                    ) : (
                      <div className="text-xs text-emerald-400 font-bold">
                        Correção concluída em DEV e enviada para o ambiente QAS!
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: TESTES EM QAS */}
          {activeTab === 'qas' && (
            <div className="space-y-4">
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
                <div className="text-sm font-bold text-white mb-1">Roteiro de Testes Homologação em QAS</div>
                <p className="text-xs text-slate-400 mb-4">
                  Regra de ouro de Sustentação: <strong>NUNCA aplique direto em Produção (PRD)</strong> sem evidenciar o teste em QAS!
                </p>

                <div className="space-y-3">
                  {ticket.qasTestRoutines.map((routine) => (
                    <div
                      key={routine.id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                        routine.passed
                          ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                          : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-sm">{routine.description}</div>
                        <div className="text-xs text-slate-400 mt-1">Resultado esperado: {routine.expectedResult}</div>
                      </div>

                      {routine.passed ? (
                        <span className="text-xs font-mono-code font-bold text-emerald-400 bg-emerald-900/40 px-2.5 py-1 rounded">
                          APROVADO EM QAS
                        </span>
                      ) : (
                        <button
                          onClick={() => handleTestInQAS(routine.id)}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow cursor-pointer whitespace-nowrap"
                        >
                          Executar Teste (-10 E)
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {ticket.qasApproved && (
                  <div className="mt-4 p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-bold">
                    Todos os testes em QAS foram aprovados com sucesso! Liberado para subida para PRD.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: IMPLANTAÇÃO EM PRD & VALIDAÇÃO */}
          {activeTab === 'implantacao' && (
            <div className="space-y-4">
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
                <div className="text-sm font-bold text-white mb-2">Transporte para Produção (PRD) & Validação</div>

                {!ticket.prdChangeAuthorized ? (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-400">
                      Após o teste aprovado em QAS, solicite o transporte da ordem de customizing/workbench para PRD junto ao time de Basis.
                    </p>
                    <button
                      onClick={handleDeployToPRD}
                      disabled={!ticket.qasApproved && !ticket.canResolveDirectly}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-lg text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
                    >
                      Autorizar Transporte para Produção (PRD)
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300">
                      Transporte executado em Produção! O analista solicitante ({ticket.requesterName}) confirmou o resultado satisfatório.
                    </div>

                    <button
                      onClick={handleCloseTicket}
                      className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 active:scale-98 text-white font-bold rounded-xl text-sm shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span>Encerrar Chamado com Sucesso (+{ticket.reward.reputation} Reputação)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Histórico do chamado */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400 uppercase font-semibold mb-2">Histórico & Auditoria</div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {ticket.logs.map((log, i) => (
                    <div key={i} className="text-xs font-mono-code text-slate-300 border-l-2 border-blue-500 pl-2">
                      <span className="text-blue-400 font-bold">[{log.timestamp}]</span> {log.author}: {log.action} - {log.note}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 px-5 py-3 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400 font-mono-code">
            Status: <span className="text-blue-400 font-bold uppercase">{ticket.status}</span>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
          >
            Fechar Janela
          </button>
        </div>
      </div>
    </div>
  );
};
