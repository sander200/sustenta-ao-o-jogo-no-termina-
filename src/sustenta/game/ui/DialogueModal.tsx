import React from 'react';
import { NPCData, Ticket } from '../types.ts';
import { sound } from '../audio.ts';
import { MessageSquare, Sparkles, User, X, Briefcase, Zap } from 'lucide-react';

interface DialogueModalProps {
  npc: NPCData;
  ticket?: Ticket;
  onOpenTicket?: (ticket: Ticket) => void;
  onTalkCasual: () => void;
  onClose: () => void;
}

export const DialogueModal: React.FC<DialogueModalProps> = ({
  npc,
  ticket,
  onOpenTicket,
  onTalkCasual,
  onClose,
}) => {
  const randomIdle = npc.idleLines[Math.floor(Math.random() * npc.idleLines.length)];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border-2 border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden font-tech animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-md border-2 border-white/20"
              style={{ backgroundColor: npc.color }}
            >
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">{npc.name}</h3>
              <p className="text-xs text-blue-400 font-medium">
                {npc.role} · {npc.area}
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

        {/* Dialogue Bubble */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 text-slate-200 text-sm leading-relaxed relative">
            <p className="font-medium text-white italic">"{npc.dialogueGreeting}"</p>
            <div className="mt-2 text-xs text-slate-400">"{randomIdle}"</div>
          </div>

          {/* Action options */}
          <div className="space-y-2 pt-2">
            {ticket && ticket.status !== 'closed' && (
              <button
                onClick={() => {
                  sound.playClick();
                  if (onOpenTicket) onOpenTicket(ticket);
                  onClose();
                }}
                className="w-full p-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-98 transition-all text-white font-bold text-xs flex items-center justify-between shadow-lg shadow-blue-600/20 cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Briefcase className="w-4 h-4" />
                  <span>Tratar Chamado: {ticket.id} ({ticket.title.substring(0, 32)}...)</span>
                </div>
                <span className="text-[10px] font-mono-code bg-blue-800 px-2 py-0.5 rounded">
                  {ticket.assignedPriority || ticket.suggestedPriority}
                </span>
              </button>
            )}

            <button
              onClick={() => {
                sound.playClick();
                onTalkCasual();
              }}
              className="w-full p-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-98 transition-all text-slate-300 hover:text-white font-semibold text-xs flex items-center justify-between border border-slate-700 cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4 text-sky-400" />
                <span>Conversar sobre o dia a dia & boas práticas (-5 Estresse)</span>
              </div>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
