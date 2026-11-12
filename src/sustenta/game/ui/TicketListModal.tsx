import React, { useState } from 'react';
import { Priority, Ticket } from '../types.ts';
import { sound } from '../audio.ts';
import { Briefcase, CheckCircle, Clock, Filter, ShieldAlert, X } from 'lucide-react';

interface TicketListModalProps {
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
  onClose: () => void;
}

export const TicketListModal: React.FC<TicketListModalProps> = ({ tickets, onSelectTicket, onClose }) => {
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filtered = tickets.filter((t) => {
    if (filterPriority !== 'all' && (t.assignedPriority || t.suggestedPriority) !== filterPriority) {
      return false;
    }
    if (filterStatus === 'open' && t.status === 'closed') return false;
    if (filterStatus === 'closed' && t.status !== 'closed') return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden font-tech">
        {/* Header */}
        <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Central de Chamados & Demandas (SAP)</h2>
              <p className="text-xs text-slate-400">Gerenciamento de incidentes da equipe de sustentação</p>
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

        {/* Filters */}
        <div className="bg-slate-950/50 px-5 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-semibold uppercase">Prioridade:</span>
            {['all', 'P1', 'P2', 'P3', 'P4'].map((p) => (
              <button
                key={p}
                onClick={() => setFilterPriority(p)}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer font-mono-code ${
                  filterPriority === p ? 'bg-blue-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {p === 'all' ? 'Todas' : p}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold uppercase">Status:</span>
            {['all', 'open', 'closed'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  filterStatus === st ? 'bg-blue-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {st === 'all' ? 'Todos' : st === 'open' ? 'Abertos' : 'Encerrados'}
              </button>
            ))}
          </div>
        </div>

        {/* Ticket List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              Nenhum chamado encontrado com os filtros selecionados.
            </div>
          ) : (
            filtered.map((ticket) => {
              const priority = ticket.assignedPriority || ticket.suggestedPriority;
              const isClosed = ticket.status === 'closed';

              return (
                <div
                  key={ticket.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                    isClosed
                      ? 'bg-slate-900/40 border-slate-800/80 opacity-70'
                      : priority === 'P1'
                      ? 'bg-red-950/20 border-red-500/50 hover:border-red-400'
                      : 'bg-slate-800/40 border-slate-700/80 hover:border-blue-500/60'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <span
                      className={`px-2.5 py-1 rounded-md font-mono-code text-xs font-bold ${
                        priority === 'P1'
                          ? 'bg-red-600 text-white'
                          : priority === 'P2'
                          ? 'bg-amber-600 text-white'
                          : priority === 'P3'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-200'
                      }`}
                    >
                      {priority}
                    </span>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono-code text-xs text-blue-400 font-bold">{ticket.id}</span>
                        <span className="text-slate-500">·</span>
                        <span className="text-xs text-slate-400">{ticket.systemModule}</span>
                      </div>
                      <h3 className="text-sm font-bold text-white">{ticket.title}</h3>
                      <p className="text-xs text-slate-400 line-clamp-1">{ticket.description}</p>
                      <div className="text-[11px] text-slate-400">
                        Solicitante: <strong className="text-slate-300">{ticket.requesterName}</strong> ({ticket.requesterRole})
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-right">
                      <div className="text-xs uppercase font-semibold text-slate-400 font-mono-code">Status</div>
                      <div className="text-xs font-bold text-blue-300 uppercase">{ticket.status}</div>
                    </div>

                    <button
                      onClick={() => {
                        sound.playClick();
                        onSelectTicket(ticket);
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer whitespace-nowrap"
                    >
                      {isClosed ? 'Ver Detalhes' : 'Abrir no SAP GUI'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
