/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import type { InteractiveTarget } from './game/three/OfficeScene.ts';
import { ExpedienteWorld } from './game/world3d/ExpedienteWorld.ts';
import { EvaluatorPanel } from './game/world3d/EvaluatorPanel.tsx';
import { sound } from './game/audio.ts';
import {
  INITIAL_EMAILS,
  INITIAL_NPCS,
  INITIAL_PROJECTS,
  INITIAL_TICKETS,
} from './game/data/initialData.ts';
import { CorporateEmail, NPCData, PlayerStats, ProjectCard, Ticket, Achievement } from './game/types.ts';
import { INITIAL_ACHIEVEMENTS } from './game/data/achievementsData.ts';
import { GameHUD } from './game/ui/GameHUD.tsx';
import { SapTicketModal } from './game/ui/SapTicketModal.tsx';
import { TicketListModal } from './game/ui/TicketListModal.tsx';
import { DialogueModal } from './game/ui/DialogueModal.tsx';
import { EmailModal } from './game/ui/EmailModal.tsx';
import { KanbanModal } from './game/ui/KanbanModal.tsx';
import { EndOfDayModal } from './game/ui/EndOfDayModal.tsx';
import { HelpModal } from './game/ui/HelpModal.tsx';
import { AchievementsModal } from './game/ui/AchievementsModal.tsx';
import { TitleScreen } from './game/ui/TitleScreen.tsx';
import confetti from 'canvas-confetti';

const SAVE_KEY = 'sustentacao_save_v1';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const officeSceneRef = useRef<ExpedienteWorld | null>(null);

  // Game flow state
  const [gameState, setGameState] = useState<'title' | 'playing'>('title');
  const [hasSavedGame, setHasSavedGame] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Player & Game entities state
  const [stats, setStats] = useState<PlayerStats>({
    energy: 85,
    stress: 25,
    reputation: 60,
    sapKnowledge: 45,
    day: 1,
    timeMinutes: 480, // 08:00
    isDayFinished: false,
    totalTicketsResolved: 0,
    totalQasTested: 0,
    totalP1Solved: 0,
    totalCoffeeDrunk: 0,
  });

  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [npcs, setNpcs] = useState<NPCData[]>(INITIAL_NPCS);
  const [emails, setEmails] = useState<CorporateEmail[]>(INITIAL_EMAILS);
  const [projects, setProjects] = useState<ProjectCard[]>(INITIAL_PROJECTS);
  const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);

  // Proximity & Interaction
  const [nearTarget, setNearTarget] = useState<InteractiveTarget | null>(null);
  const [currentRoom, setCurrentRoom] = useState<string>('Sala Principal');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [activeDialogueNPC, setActiveDialogueNPC] = useState<NPCData | null>(null);
  const [showTicketList, setShowTicketList] = useState(false);
  const [showEmails, setShowEmails] = useState(false);
  const [showKanban, setShowKanban] = useState(false);
  const [showEndOfDay, setShowEndOfDay] = useState(false);
  const [showEvaluator, setShowEvaluator] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);

  // Check saved game on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) setHasSavedGame(true);
    } catch {
      // Ignored
    }
  }, []);

  // Initialize Three.js Office Scene
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const scene = new ExpedienteWorld(canvasMountRef.current);
    officeSceneRef.current = scene;

    scene.populateNPCs(npcs);
    scene.onProximityChange = (target) => setNearTarget(target);
    scene.onRoomChange = (room) => setCurrentRoom(room);
    scene.onStepSound = () => {
      sound.playFootstep();
    };

    return () => {
      scene.destroy();
      officeSceneRef.current = null;
    };
  }, []);

  // Update NPCs in 3D scene when state changes
  useEffect(() => {
    if (officeSceneRef.current) {
      officeSceneRef.current.populateNPCs(npcs);
    }
  }, [npcs]);

  // Synchronize The Sims Plumbob color with Sabastian's stats
  useEffect(() => {
    if (officeSceneRef.current) {
      officeSceneRef.current.setPlumbobMood(stats.energy, stats.stress);
    }
  }, [stats.energy, stats.stress]);

  useEffect(() => {
    const world = officeSceneRef.current;
    if (!world) return;
    world.suspended =
      gameState !== 'playing' ||
      Boolean(selectedTicket) ||
      Boolean(activeDialogueNPC) ||
      showTicketList ||
      showEmails ||
      showKanban ||
      showEndOfDay ||
      showHelp ||
      showAchievements ||
      showEvaluator;
  }, [
    gameState,
    selectedTicket,
    activeDialogueNPC,
    showTicketList,
    showEmails,
    showKanban,
    showEndOfDay,
    showHelp,
    showAchievements,
    showEvaluator,
  ]);

  // Persistent Auto-save
  useEffect(() => {
    if (gameState === 'playing') {
      try {
        localStorage.setItem(
          SAVE_KEY,
          JSON.stringify({
            stats,
            tickets,
            emails,
            projects,
            achievements,
          })
        );
        setHasSavedGame(true);
      } catch {
        // Ignored
      }
    }
  }, [stats, tickets, emails, projects, achievements, gameState]);

  // Periodic Clock Flow (1 min every 2.5s)
  useEffect(() => {
    if (gameState !== 'playing' || showEndOfDay) return;

    const interval = setInterval(() => {
      setStats((prev) => {
        const nextTime = prev.timeMinutes + 1;
        // Check if 18:00 (1080 mins) is reached
        if (nextTime >= 1080 && !prev.isDayFinished) {
          setShowEndOfDay(true);
          sound.playNotification();
          return { ...prev, timeMinutes: 1080, isDayFinished: true };
        }
        return { ...prev, timeMinutes: nextTime };
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [gameState, showEndOfDay]);

  // Toast helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3200);
  };

  // Evaluate & Unlock Corporate Achievements dynamically
  useEffect(() => {
    if (gameState !== 'playing') return;

    const closedTickets = tickets.filter((t) => t.status === 'closed');
    const closedP1Count = closedTickets.filter(
      (t) => t.assignedPriority === 'P1' || t.suggestedPriority === 'P1'
    ).length;
    const qasPassedCount = tickets.reduce(
      (acc, t) => acc + t.qasTestRoutines.filter((r) => r.passed).length,
      0
    );
    const activeProjectsAdvanced = projects.filter((p) => p.progress > 0).length;

    setAchievements((prev) => {
      let newlyUnlockedTitle: string | null = null;

      const next = prev.map((ach) => {
        let currentProgress = ach.progress || 0;
        let shouldUnlock = ach.unlocked;

        if (ach.id === 'ach_closing_survivor') {
          currentProgress = closedP1Count;
          if (closedP1Count >= 1) shouldUnlock = true;
        } else if (ach.id === 'ach_sap_master') {
          currentProgress = stats.sapKnowledge;
          if (stats.sapKnowledge >= 75) shouldUnlock = true;
        } else if (ach.id === 'ach_c2c_legend') {
          currentProgress = closedTickets.length;
          if (closedTickets.length >= 3) shouldUnlock = true;
        } else if (ach.id === 'ach_qas_guardian') {
          currentProgress = qasPassedCount;
          if (qasPassedCount >= 2) shouldUnlock = true;
        } else if (ach.id === 'ach_coffee_faith') {
          currentProgress = stats.totalCoffeeDrunk;
          if (stats.totalCoffeeDrunk >= 3) shouldUnlock = true;
        } else if (ach.id === 'ach_firefighter') {
          currentProgress = stats.stress >= 65 ? 1 : 0;
          if (stats.stress >= 65) shouldUnlock = true;
        } else if (ach.id === 'ach_zen_corporate') {
          currentProgress = stats.stress <= 20 ? 1 : 0;
          if (stats.stress <= 20) shouldUnlock = true;
        } else if (ach.id === 'ach_kanban_value') {
          currentProgress = activeProjectsAdvanced;
          if (activeProjectsAdvanced >= 1) shouldUnlock = true;
        }

        // Just unlocked in this tick!
        if (!ach.unlocked && shouldUnlock) {
          newlyUnlockedTitle = ach.title;
          const h = Math.floor(stats.timeMinutes / 60).toString().padStart(2, '0');
          const m = (stats.timeMinutes % 60).toString().padStart(2, '0');
          return {
            ...ach,
            unlocked: true,
            progress: Math.min(ach.maxProgress || 1, currentProgress),
            unlockedAt: `Dia ${stats.day} · ${h}:${m}`,
          };
        }

        return {
          ...ach,
          progress: Math.min(ach.maxProgress || 1, currentProgress),
        };
      });

      if (newlyUnlockedTitle) {
        sound.playSuccess();
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#38bdf8', '#10b981', '#ec4899', '#ffffff'],
        });
        showToast(`🏆 Conquista Desbloqueada: ${newlyUnlockedTitle}!`);
      }

      return next;
    });
  }, [
    gameState,
    stats.sapKnowledge,
    stats.stress,
    stats.totalCoffeeDrunk,
    stats.day,
    stats.timeMinutes,
    tickets,
    projects,
  ]);

  // Global hotkeys (E or Space to interact, Esc to close modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;

      if (e.code === 'KeyE' || e.code === 'Space') {
        // If no modal open, interact with near target
        const anyModalOpen =
          Boolean(selectedTicket) ||
          Boolean(activeDialogueNPC) ||
          showTicketList ||
          showEmails ||
          showKanban ||
          showEndOfDay ||
          showHelp ||
          showAchievements ||
          showEvaluator;

        if (!anyModalOpen && nearTarget) {
          e.preventDefault();
          handleExecuteInteraction();
        }
      } else if (e.code === 'Escape') {
        setSelectedTicket(null);
        setActiveDialogueNPC(null);
        setShowTicketList(false);
        setShowEmails(false);
        setShowKanban(false);
        setShowHelp(false);
        setShowAchievements(false);
        setShowEvaluator(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    nearTarget,
    selectedTicket,
    activeDialogueNPC,
    showTicketList,
    showEmails,
    showKanban,
    showEndOfDay,
    showHelp,
    showAchievements,
    showEvaluator,
    gameState,
  ]);

  // Perform interaction with target
  const handleExecuteInteraction = () => {
    if (!nearTarget) return;

    if (nearTarget.type === 'npc' && nearTarget.npcData) {
      sound.playOpenModal();
      const relatedTicket = tickets.find((t) => t.id === nearTarget.npcData?.currentTicketId);
      setActiveDialogueNPC(nearTarget.npcData);
      if (relatedTicket) {
        // Can open dialogue
      }
    } else if (nearTarget.type === 'desk') {
      sound.playOpenModal();
      setShowTicketList(true);
    } else if (nearTarget.type === 'coffee') {
      sound.playCoffee();
      setStats((prev) => ({
        ...prev,
        energy: Math.min(100, prev.energy + 10),
        stress: Math.max(0, prev.stress - 5),
        totalCoffeeDrunk: prev.totalCoffeeDrunk + 1,
        timeMinutes: prev.timeMinutes + 10,
      }));
      showToast('☕ Café fresquinho tomado! +10 Energia e -5 Estresse.');
    } else if (nearTarget.type === 'restaurant') {
      sound.playSuccess();
      setStats((prev) => ({
        ...prev,
        energy: Math.min(100, prev.energy + 30),
        stress: Math.max(0, prev.stress - 10),
        timeMinutes: prev.timeMinutes + 45,
      }));
      showToast('🍽️ Almoço corporativo no refeitório! +30 Energia restaurada.');
    } else if (nearTarget.type === 'restroom') {
      sound.playClick();
      setStats((prev) => ({
        ...prev,
        energy: Math.min(100, prev.energy + 8),
        stress: Math.max(0, prev.stress - 15),
        timeMinutes: prev.timeMinutes + 15,
      }));
      showToast('🚹 Pausa rápida para respirar fundo! -15 Estresse.');
    } else if (nearTarget.type === 'pool_table') {
      sound.playClick();
      setStats((prev) => ({
        ...prev,
        stress: Math.max(0, prev.stress - 10),
        timeMinutes: prev.timeMinutes + 20,
      }));
      showToast('🎱 Uma partida de sinuca descontraída com a equipe! -10 Estresse.');
    } else if (nearTarget.type === 'server') {
      sound.playOpenModal();
      setStats((prev) => ({
        ...prev,
        sapKnowledge: Math.min(100, prev.sapKnowledge + 5),
        timeMinutes: prev.timeMinutes + 15,
      }));
      showToast('💻 Auditoria nos servidores de aplicação e filas de jobs. +5 Conhecimento SAP.');
    } else if (nearTarget.type === 'meeting') {
      sound.playOpenModal();
      setShowKanban(true);
    } else if (nearTarget.type === 'academy') {
      sound.playOpenModal();
      setShowEvaluator(true);
    }
  };

  // Start New Game
  const handleStartNewGame = () => {
    localStorage.removeItem(SAVE_KEY);
    setStats({
      energy: 85,
      stress: 25,
      reputation: 60,
      sapKnowledge: 45,
      day: 1,
      timeMinutes: 480,
      isDayFinished: false,
      totalTicketsResolved: 0,
      totalQasTested: 0,
      totalP1Solved: 0,
      totalCoffeeDrunk: 0,
    });
    setTickets(INITIAL_TICKETS);
    setEmails(INITIAL_EMAILS);
    setProjects(INITIAL_PROJECTS);
    setAchievements(INITIAL_ACHIEVEMENTS);
    setGameState('playing');
    if (officeSceneRef.current) {
      officeSceneRef.current.teleportPlayer(0, 1.2);
    }
  };

  // Resume Game
  const handleResumeGame = () => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.stats) setStats(data.stats);
        if (data.tickets) setTickets(data.tickets);
        if (data.emails) setEmails(data.emails);
        if (data.projects) setProjects(data.projects);
        if (data.achievements) setAchievements(data.achievements);
      }
    } catch {
      // Ignored
    }
    setGameState('playing');
  };

  // Next Day Transition
  const handleStartNextDay = () => {
    setShowEndOfDay(false);
    setStats((prev) => ({
      ...prev,
      day: prev.day + 1,
      timeMinutes: 480, // 08:00
      energy: 90,
      stress: Math.max(10, prev.stress - 30),
      isDayFinished: false,
    }));
    if (officeSceneRef.current) {
      officeSceneRef.current.teleportPlayer(0, 1.2);
    }
    showToast(`🌅 Início do Dia ${stats.day + 1}! Novo expediente com a equipe.`);
  };

  // Project advance
  const handleAdvanceProject = (projectId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const newProgress = Math.min(100, p.progress + 25);
        let nextStage = p.stage;
        if (newProgress >= 100) nextStage = 'concluido';
        else if (newProgress >= 75) nextStage = 'em_teste';
        else if (newProgress >= 40) nextStage = 'em_execucao';
        else if (newProgress >= 20) nextStage = 'planejado';

        return { ...p, progress: newProgress, stage: nextStage };
      })
    );

    const targetProject = projects.find((p) => p.id === projectId);
    if (targetProject) {
      setStats((prev) => ({
        ...prev,
        energy: Math.max(5, prev.energy - targetProject.effortCostEnergy),
        sapKnowledge: Math.min(100, prev.sapKnowledge + 10),
        reputation: Math.min(100, prev.reputation + 5),
        timeMinutes: prev.timeMinutes + 40,
      }));
    }
  };

  const unreadEmailCount = emails.filter((m) => !m.read).length;

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950 font-tech">
      {/* 3D WebGL Canvas Viewport */}
      <div ref={canvasMountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Title Screen Overlay */}
      {gameState === 'title' && (
        <TitleScreen
          hasSavedGame={hasSavedGame}
          onNewGame={handleStartNewGame}
          onResumeGame={handleResumeGame}
          onOpenHelp={() => setShowHelp(true)}
        />
      )}

      {/* Main Playing HUD */}
      {gameState === 'playing' && (
        <GameHUD
          stats={stats}
          tickets={tickets}
          unreadEmailCount={unreadEmailCount}
          unlockedAchievementsCount={achievements.filter((a) => a.unlocked).length}
          totalAchievementsCount={achievements.length}
          nearTarget={nearTarget}
          currentRoom={currentRoom}
          isMuted={isMuted}
          onToggleMute={() => {
            const nextMuted = !isMuted;
            setIsMuted(nextMuted);
            sound.setMuted(nextMuted);
          }}
          onOpenTerminal={() => setShowTicketList(true)}
          onOpenEmails={() => setShowEmails(true)}
          onOpenKanban={() => setShowKanban(true)}
          onOpenAchievements={() => setShowAchievements(true)}
          onOpenHelp={() => setShowHelp(true)}
          onInteract={handleExecuteInteraction}
          onMove={(x, y) => {
            const world = officeSceneRef.current;
            if (!world) return;
            world.stickX = x;
            world.stickY = y;
          }}
          onSprint={(active) => {
            if (officeSceneRef.current) officeSceneRef.current.sprint = active;
          }}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="pointer-events-none absolute bottom-24 left-3 z-30 max-w-sm">
          <div className="bg-slate-900/95 border-2 border-emerald-500/80 text-emerald-200 px-5 py-2.5 rounded-xl shadow-2xl font-tech text-sm font-bold flex items-center gap-2 backdrop-blur-md">
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* MODAL 1: Individual Ticket (SAP GUI) */}
      {selectedTicket && (
        <SapTicketModal
          ticket={selectedTicket}
          playerEnergy={stats.energy}
          sapKnowledge={stats.sapKnowledge}
          onClose={() => setSelectedTicket(null)}
          onUpdateTicket={(updated) => {
            setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
            setSelectedTicket(updated);
            if (updated.status === 'closed') {
              setStats((prev) => ({
                ...prev,
                totalTicketsResolved: prev.totalTicketsResolved + 1,
                totalP1Solved:
                  updated.assignedPriority === 'P1' || updated.suggestedPriority === 'P1'
                    ? prev.totalP1Solved + 1
                    : prev.totalP1Solved,
                totalQasTested: updated.qasApproved ? prev.totalQasTested + 1 : prev.totalQasTested,
              }));
            }
          }}
          onConsumeEnergy={(amt) =>
            setStats((prev) => ({ ...prev, energy: Math.max(0, prev.energy - amt) }))
          }
          onAddKnowledge={(amt) =>
            setStats((prev) => ({ ...prev, sapKnowledge: Math.min(100, prev.sapKnowledge + amt) }))
          }
          onAddReputation={(amt) =>
            setStats((prev) => ({ ...prev, reputation: Math.min(100, prev.reputation + amt) }))
          }
          onAdjustStress={(amt) =>
            setStats((prev) => ({ ...prev, stress: Math.max(0, Math.min(100, prev.stress + amt)) }))
          }
          onAdvanceTime={(mins) =>
            setStats((prev) => ({ ...prev, timeMinutes: prev.timeMinutes + mins }))
          }
        />
      )}

      {/* MODAL 2: Ticket Central / Backlog List */}
      {showTicketList && (
        <TicketListModal
          tickets={tickets}
          onSelectTicket={(t) => {
            setShowTicketList(false);
            setSelectedTicket(t);
          }}
          onClose={() => setShowTicketList(false)}
        />
      )}

      {/* MODAL 3: Dialogue with NPC */}
      {activeDialogueNPC && (
        <DialogueModal
          npc={activeDialogueNPC}
          ticket={tickets.find((t) => t.id === activeDialogueNPC.currentTicketId)}
          onOpenTicket={(t) => {
            setActiveDialogueNPC(null);
            setSelectedTicket(t);
          }}
          onTalkCasual={() => {
            setStats((prev) => ({
              ...prev,
              stress: Math.max(0, prev.stress - 5),
              timeMinutes: prev.timeMinutes + 10,
            }));
            showToast(`Conversa agradável com ${activeDialogueNPC.name}! -5 Estresse.`);
            setActiveDialogueNPC(null);
          }}
          onClose={() => setActiveDialogueNPC(null)}
        />
      )}

      {/* MODAL 4: Corporate Emails */}
      {showEmails && (
        <EmailModal
          emails={emails}
          onMarkRead={(mailId) =>
            setEmails((prev) => prev.map((m) => (m.id === mailId ? { ...m, read: true } : m)))
          }
          onOpenTicketById={(ticketId) => {
            const t = tickets.find((tk) => tk.id === ticketId);
            if (t) setSelectedTicket(t);
          }}
          onClose={() => setShowEmails(false)}
        />
      )}

      {/* MODAL 5: Kanban Projects */}
      {showKanban && (
        <KanbanModal
          projects={projects}
          playerEnergy={stats.energy}
          sapKnowledge={stats.sapKnowledge}
          onAdvanceProject={handleAdvanceProject}
          onClose={() => setShowKanban(false)}
        />
      )}

      {/* MODAL 6: End of Day Summary */}
      {showEndOfDay && (
        <EndOfDayModal
          stats={stats}
          tickets={tickets}
          onStartNextDay={handleStartNextDay}
        />
      )}

      {/* MODAL 7: How to Play / Help Guide */}
      {showEvaluator && (
        <EvaluatorPanel
          onClose={() => setShowEvaluator(false)}
          onApproved={() => {
            setStats((prev) => ({
              ...prev,
              sapKnowledge: Math.min(100, prev.sapKnowledge + 15),
              reputation: Math.min(100, prev.reputation + 6),
            }));
            showToast('Missão 001 aprovada pela IA Avaliadora. +SAP XP e reputação.');
          }}
        />
      )}

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

      {/* MODAL 8: Corporate Achievements (Conquistas C2C) */}
      {showAchievements && (
        <AchievementsModal
          achievements={achievements}
          onClose={() => setShowAchievements(false)}
        />
      )}
    </main>
  );
}
