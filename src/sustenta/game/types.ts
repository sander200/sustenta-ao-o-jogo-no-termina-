export type Priority = 'P1' | 'P2' | 'P3' | 'P4';

export type TicketArea = 'payroll' | 'benefits' | 'master_data' | 'accounting' | 'infra';

export type TicketStatus =
  | 'new'
  | 'triaged'
  | 'in_investigation'
  | 'with_specialist'
  | 'ready_for_qas'
  | 'tested_qas'
  | 'deployed_prd'
  | 'validated'
  | 'closed';

export type SpecialistType = 'functional' | 'abap' | 'basis' | 'none';

export interface EvidenceItem {
  id: string;
  label: string;
  description: string;
  collected: boolean;
}

export interface TicketLog {
  timestamp: string;
  author: string;
  action: string;
  note: string;
}

export interface Ticket {
  id: string;
  title: string;
  area: TicketArea;
  requesterId: string;
  requesterName: string;
  requesterRole: string;
  systemModule: string; // e.g. "SAP HCM - Folha", "SAP FI/CO"
  impactDescription: string;
  urgencyReason: string;
  suggestedPriority: Priority;
  assignedPriority?: Priority;
  status: TicketStatus;
  description: string;
  sapTransaction: string; // e.g. "PC00_M37_CALC", "ST22", "SM37"
  technicalDetail: string;
  specialistRequired: SpecialistType;
  specialistAssigned?: string;
  evidences: EvidenceItem[];
  diagnosisCompleted: boolean;
  canResolveDirectly: boolean; // if true, key user can give advice without specialist
  directResolutionAdvice?: string;
  specialistProgress: number; // 0 to 100
  qasTestRoutines: {
    id: string;
    description: string;
    expectedResult: string;
    passed?: boolean;
  }[];
  qasApproved?: boolean;
  prdChangeAuthorized?: boolean;
  deadlineMinutes: number; // minutes from 08:00 (e.g. 720 = 12:00)
  reward: {
    xp: number;
    reputation: number;
    knowledge: number;
  };
  logs: TicketLog[];
  feedbackFromUser?: string;
}

export interface NPCData {
  id: string;
  name: string;
  role: string;
  area: string;
  room: string;
  deskX: number;
  deskZ: number;
  color: string;
  hairColor: string;
  dialogueGreeting: string;
  currentTicketId?: string;
  idleLines: string[];
}

export interface ProjectCard {
  id: string;
  title: string;
  description: string;
  stage: 'ideias' | 'planejado' | 'em_execucao' | 'em_teste' | 'concluido';
  effortCostEnergy: number;
  knowledgeRequired: number;
  progress: number; // 0 to 100
  benefit: string;
}

export interface CorporateEmail {
  id: string;
  fromName: string;
  fromRole: string;
  subject: string;
  timestamp: string;
  body: string;
  read: boolean;
  urgent?: boolean;
  actionType?: 'meeting' | 'urgent_ticket' | 'info';
  actionPayload?: string;
}

export interface PlayerStats {
  energy: number; // 0 - 100
  stress: number; // 0 - 100
  reputation: number; // 0 - 100
  sapKnowledge: number; // 0 - 100
  day: number; // 1 to 5
  timeMinutes: number; // 480 (08:00) to 1080 (18:00)
  isDayFinished: boolean;
  totalTicketsResolved: number;
  totalQasTested: number;
  totalP1Solved: number;
  totalCoffeeDrunk: number;
}

export interface GameNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'critical';
  time: string;
}

export interface Achievement {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
}
