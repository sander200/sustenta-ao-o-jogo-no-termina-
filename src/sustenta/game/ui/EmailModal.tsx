import React, { useState } from 'react';
import { CorporateEmail } from '../types.ts';
import { sound } from '../audio.ts';
import { Mail, AlertCircle, Check, Inbox, Send, X, ArrowRight } from 'lucide-react';

interface EmailModalProps {
  emails: CorporateEmail[];
  onMarkRead: (emailId: string) => void;
  onOpenTicketById?: (ticketId: string) => void;
  onClose: () => void;
}

export const EmailModal: React.FC<EmailModalProps> = ({
  emails,
  onMarkRead,
  onOpenTicketById,
  onClose,
}) => {
  const [selectedEmail, setSelectedEmail] = useState<CorporateEmail>(emails[0] || null);

  const handleSelect = (email: CorporateEmail) => {
    sound.playClick();
    setSelectedEmail(email);
    if (!email.read) {
      onMarkRead(email.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden font-tech">
        {/* Header */}
        <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-600/30 border border-sky-500/40 text-sky-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Correio Corporativo (Outlook Web)</h2>
              <p className="text-xs text-slate-400">Comunicações internas da sustentação de TI</p>
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

        {/* Content Layout: Left Inbox, Right Email View */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Inbox List */}
          <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-800 overflow-y-auto bg-slate-950/40 p-3 space-y-2">
            <div className="flex items-center justify-between px-2 py-1 text-xs text-slate-400 font-semibold uppercase">
              <span>Caixa de Entrada</span>
              <span>{emails.length} mensagens</span>
            </div>

            {emails.map((mail) => (
              <button
                key={mail.id}
                onClick={() => handleSelect(mail)}
                className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer border ${
                  selectedEmail?.id === mail.id
                    ? 'bg-blue-600/20 border-blue-500/60 shadow-md'
                    : mail.read
                    ? 'bg-slate-900/40 border-slate-800/60 hover:bg-slate-800/40'
                    : 'bg-slate-800/80 border-slate-700/80 hover:bg-slate-700/80'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className={`font-bold ${mail.read ? 'text-slate-300' : 'text-white'}`}>
                    {mail.fromName}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono-code">{mail.timestamp}</span>
                </div>
                <div className={`text-xs truncate ${mail.read ? 'text-slate-400' : 'text-blue-300 font-semibold'}`}>
                  {mail.subject}
                </div>
                {mail.urgent && (
                  <span className="mt-1.5 inline-block text-[10px] px-1.5 py-0.5 rounded bg-red-950 text-red-400 border border-red-500/40 font-mono-code font-bold">
                    ALTA PRIORIDADE
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Email Reader View */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-900/60 flex flex-col justify-between">
            {selectedEmail ? (
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-white">{selectedEmail.subject}</h3>
                    <span className="text-xs text-slate-400 font-mono-code">{selectedEmail.timestamp}</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    De: <strong className="text-slate-200">{selectedEmail.fromName}</strong> ({selectedEmail.fromRole})
                  </div>
                </div>

                <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-line py-2">
                  {selectedEmail.body}
                </div>

                {selectedEmail.actionType === 'urgent_ticket' && selectedEmail.actionPayload && (
                  <div className="mt-4 p-4 rounded-xl bg-blue-950/40 border border-blue-500/40">
                    <div className="text-xs text-blue-300 font-semibold mb-2">
                      Ação rápida associada ao chamado:
                    </div>
                    <button
                      onClick={() => {
                        sound.playClick();
                        if (onOpenTicketById && selectedEmail.actionPayload) {
                          onOpenTicketById(selectedEmail.actionPayload);
                          onClose();
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-2"
                    >
                      <span>Abrir Chamado {selectedEmail.actionPayload}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16 text-slate-500 text-sm">
                Selecione um e-mail para ler.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
