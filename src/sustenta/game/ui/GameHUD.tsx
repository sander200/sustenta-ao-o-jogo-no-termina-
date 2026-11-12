import React from 'react';
import { PlayerStats, Ticket } from '../types.ts';
import { InteractiveTarget } from '../three/OfficeScene.ts';
import {
  Briefcase,
  Mail,
  Trello,
  Volume2,
  VolumeX,
  Zap,
  Activity,
  Award,
  BookOpen,
  Trophy,
} from 'lucide-react';
import { sound } from '../audio.ts';

interface GameHUDProps {
  stats: PlayerStats;
  tickets: Ticket[];
  unreadEmailCount: number;
  unlockedAchievementsCount: number;
  totalAchievementsCount: number;
  nearTarget: InteractiveTarget | null;
  currentRoom: string;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenTerminal: () => void;
  onOpenEmails: () => void;
  onOpenKanban: () => void;
  onOpenAchievements: () => void;
  onOpenHelp: () => void;
  onInteract: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  stats,
  tickets,
  unreadEmailCount,
  unlockedAchievementsCount,
  totalAchievementsCount,
  nearTarget,
  currentRoom,
  isMuted,
  onToggleMute,
  onOpenTerminal,
  onOpenEmails,
  onOpenKanban,
  onOpenAchievements,
  onOpenHelp,
  onInteract,
}) => {
  // Format time (e.g. 480 mins -> 08:00)
  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = Math.floor(minutes % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const getDayName = (day: number) => {
    const days = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira'];
    return days[(day - 1) % days.length];
  };

  const openTickets = tickets.filter((t) => t.status !== 'closed');

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2 sm:p-3 select-none">
      <header className="pointer-events-auto flex items-center gap-2 overflow-x-auto rounded-2xl border border-slate-700/70 bg-[#121826]/95 px-2 py-1.5 shadow-2xl backdrop-blur-md sm:gap-3 sm:px-3">
        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden text-[10px] font-semibold uppercase tracking-wide text-slate-300 sm:block">
            Expediente · {getDayName(stats.day)}
          </div>
          <div className="rounded-xl border border-slate-500/70 bg-[#1c2433] px-3 py-1 font-mono-code text-lg font-bold tracking-wide text-white sm:text-xl">
            {formatTime(stats.timeMinutes)}
          </div>
          <div className="rounded-lg bg-[#3b6fd8] px-3 py-1 text-xs font-semibold text-white">
            {currentRoom}
          </div>
        </div>

        <div className="mx-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <StatChip
            label="Energia"
            value={`${Math.round(stats.energy)}%`}
            width={stats.energy}
            iconBg="bg-emerald-500"
            bar="bg-gradient-to-r from-lime-400 to-emerald-500"
            icon={<Zap className="h-3.5 w-3.5 text-white" />}
          />
          <StatChip
            label="Estresse"
            value={`${Math.round(stats.stress)}%`}
            width={stats.stress}
            iconBg="bg-fuchsia-500"
            bar={stats.stress > 65 ? 'bg-red-500' : 'bg-gradient-to-r from-fuchsia-400 to-purple-500'}
            icon={<Activity className="h-3.5 w-3.5 text-white" />}
          />
          <StatChip
            label="Reputação"
            value={`${Math.round(stats.reputation)}/100`}
            width={stats.reputation}
            iconBg="bg-amber-500"
            bar="bg-gradient-to-r from-amber-300 to-amber-500"
            icon={<Award className="h-3.5 w-3.5 text-white" />}
          />
          <StatChip
            label="SAP Exp"
            value={`${Math.round(stats.sapKnowledge)}/100`}
            width={stats.sapKnowledge}
            iconBg="bg-sky-600"
            bar="bg-sky-400"
            icon={<BookOpen className="h-3.5 w-3.5 text-white" />}
          />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <button
            onClick={() => {
              sound.playClick();
              onOpenHelp();
            }}
            title="Como jogar"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-600 bg-[#1c2433] text-sm font-bold text-white"
          >
            ?
          </button>
          <button
            onClick={onToggleMute}
            title={isMuted ? 'Ativar som' : 'Silenciar'}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-600 bg-[#1c2433] text-white"
          >
            {isMuted ? <VolumeX className="h-4 w-4 text-red-400" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>
      </header>

      <div className="pointer-events-none mt-auto mb-2 flex justify-start px-1">
        {nearTarget && (
          <div className="pointer-events-auto flex max-w-sm items-center gap-2 rounded-xl border border-blue-500/80 bg-slate-950/90 px-3 py-2 text-white shadow-lg backdrop-blur-md">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold">
              E
            </div>
            <div className="min-w-0">
              <div className="truncate text-[10px] font-medium uppercase tracking-wider text-blue-300">{nearTarget.name}</div>
              <div className="truncate text-sm font-semibold">{nearTarget.label}</div>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                onInteract();
              }}
              className="shrink-0 rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white"
            >
              Interagir
            </button>
          </div>
        )}
      </div>

      {/* Bottom Collapsible Dock: Clean 0-occlusion controls */}
      <footer className="pointer-events-auto mx-auto max-w-2xl w-full flex items-center justify-between gap-2 bg-slate-900/90 border border-slate-700/80 rounded-2xl px-4 py-2.5 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-2">
          {/* Terminal SAP / Chamados */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenTerminal();
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600/90 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-lg shadow-blue-500/20 active:scale-95 cursor-pointer"
          >
            <Briefcase className="w-4 h-4" />
            <span>Fila de Chamados</span>
            <span className="px-1.5 py-0.5 rounded-full bg-blue-800 text-[10px] font-mono-code font-bold">
              {openTickets.length}
            </span>
          </button>

          {/* E-mails Corporativos */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenEmails();
            }}
            className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-all border border-slate-700 active:scale-95 cursor-pointer"
          >
            <Mail className="w-4 h-4 text-sky-400" />
            <span>E-mails</span>
            {unreadEmailCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadEmailCount}
              </span>
            )}
          </button>

          {/* Projetos / Kanban */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenKanban();
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-all border border-slate-700 active:scale-95 cursor-pointer"
          >
            <Trello className="w-4 h-4 text-emerald-400" />
            <span>Kanban</span>
          </button>

          {/* Conquistas Corporativas C2C */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenAchievements();
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 font-semibold text-xs transition-all border border-amber-600/50 active:scale-95 cursor-pointer shadow-md"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Conquistas</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-900 text-[10px] font-mono-code font-bold border border-amber-500/40">
              {unlockedAchievementsCount}
            </span>
          </button>
        </div>

        {/* Quick controls hint */}
        <div className="hidden md:flex items-center gap-3 text-xs text-slate-400 font-mono-code">
          <span>WASD / Setas: Andar</span>
          <span>·</span>
          <span>E / Espaço: Ação</span>
        </div>
      </footer>
    </div>
  );
};

function StatChip({
  label,
  value,
  width,
  iconBg,
  bar,
  icon,
}: {
  label: string;
  value: string;
  width: number;
  iconBg: string;
  bar: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`flex h-7 w-7 items-center justify-center rounded-full ${iconBg}`}>{icon}</div>
      <div className="w-[92px]">
        <div className="flex items-center justify-between text-[9px] font-semibold uppercase tracking-wide text-slate-200">
          <span>{label}</span>
          <span className="font-mono-code normal-case">{value}</span>
        </div>
        <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-slate-700">
          <div className={`h-full ${bar}`} style={{ width: `${Math.max(0, Math.min(100, width))}%` }} />
        </div>
      </div>
    </div>
  );
}
