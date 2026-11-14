import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CollisionSystem } from '../physics/Pathfinding.ts';
import { NPCData } from '../types.ts';
import {
  buildHumanCharacter,
  CharacterInstance,
  getMarceloAppearance,
  getNPCAppearance,
} from './CharacterBuilder.ts';
import { createOfficeMaterialLibrary, OfficeMaterialLibrary } from './materials.ts';
import { buildCorporateOffice, OfficeBuildResult } from './OfficeBuilder.ts';
import {
  CREW_SPRITES,
  CutoutSprite,
  type CutoutMode,
} from './CutoutSprite.ts';
import { MarceloSprite, MarceloMove } from './MarceloSprite.ts';
import { createGlassDecalTexture, createSimsPlumbob } from './textures.ts';

export interface InteractiveTarget {
  id: string;
  name: string;
  type: 'npc' | 'desk' | 'coffee' | 'restaurant' | 'restroom' | 'server' | 'meeting' | 'pool_table';
  x: number;
  z: number;
  radius: number;
  label: string;
  npcData?: NPCData;
}

export type NPCFSMState = 'idle' | 'walking' | 'talking';
export type NPCTaskType = 'desk_work' | 'meeting' | 'coffee' | 'infra_check' | 'colleague_visit';
export type NPCWalkPhase = 'stepping_out' | 'pathing' | 'stepping_in';

export interface NPCSpot {
  x: number;
  z: number;
  yaw: number;
  anim: 'talking' | 'coffee' | 'idle' | 'interacting';
  holdCoffee: boolean;
}

const MEETING_ROOM_CENTER = { x: -16.8, z: 0.5 };

const MEETING_SPOTS: NPCSpot[] = [
  { x: -14.4, z: -0.6, yaw: -Math.PI * 0.55, anim: 'talking', holdCoffee: false },
  { x: -14.4, z: 1.6, yaw: -Math.PI * 0.45, anim: 'idle', holdCoffee: false },
  { x: -19.2, z: 0.4, yaw: Math.PI * 0.5, anim: 'talking', holdCoffee: false },
  { x: -16.8, z: 4.1, yaw: Math.PI, anim: 'talking', holdCoffee: false },
];

const COFFEE_SPOTS: NPCSpot[] = [
  { x: 16.6, z: 14.3, yaw: 0.15, anim: 'coffee', holdCoffee: true },
  { x: 18.8, z: 14.2, yaw: -0.4, anim: 'coffee', holdCoffee: true },
  { x: 14.4, z: 13.4, yaw: 0.85, anim: 'talking', holdCoffee: true },
  { x: 15.2, z: 11.4, yaw: 1.15, anim: 'coffee', holdCoffee: true },
  { x: 10.2, z: 13.8, yaw: -0.55, anim: 'coffee', holdCoffee: true },
];

const VISIT_SPOTS: NPCSpot[] = [
  { x: -1.6, z: -8.2, yaw: Math.PI, anim: 'idle', holdCoffee: false },
  { x: 1.8, z: 4.5, yaw: -Math.PI * 0.35, anim: 'talking', holdCoffee: true },
  { x: -5.6, z: 9.2, yaw: 0.2, anim: 'coffee', holdCoffee: true },
  { x: 8.2, z: -1.8, yaw: Math.PI * 0.5, anim: 'talking', holdCoffee: false },
  { x: -14.2, z: -12.4, yaw: Math.PI * 0.25, anim: 'talking', holdCoffee: false },
];

const INFRA_SPOTS: NPCSpot[] = [
  { x: 11.5, z: -12.6, yaw: Math.PI, anim: 'interacting', holdCoffee: false },
  { x: 14.0, z: -12.6, yaw: Math.PI, anim: 'idle', holdCoffee: false },
];

function createSpeechBubbleTexture(hasTicket: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 140;
  canvas.height = 140;
  const ctx = canvas.getContext('2d')!;

  const bColor = hasTicket ? '#facc15' : '#ffffff';
  const bBorder = hasTicket ? '#ca8a04' : '#94a3b8';

  ctx.fillStyle = bColor;
  ctx.strokeStyle = bBorder;
  ctx.lineWidth = 4;

  ctx.beginPath();
  ctx.roundRect(14, 14, 112, 84, 18);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(56, 98);
  ctx.lineTo(70, 124);
  ctx.lineTo(84, 98);
  ctx.closePath();
  ctx.fillStyle = bColor;
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = bColor;
  ctx.fillRect(54, 94, 32, 6);

  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'center';
  if (hasTicket) {
    ctx.font = 'bold 56px "Chakra Petch", sans-serif';
    ctx.fillText('!', 70, 74);
  } else {
    ctx.font = 'bold 40px "Chakra Petch", sans-serif';
    ctx.fillText('···', 70, 68);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export class NPCStateMachine {
  public state: NPCFSMState = 'idle';
  public task: NPCTaskType = 'desk_work';
  public walkPhase: NPCWalkPhase = 'pathing';
  public stateTimer: number;
  public talkToggleTimer: number;
  public destination: NPCSpot | null = null;
  public path: { x: number; z: number }[] = [];
  public pathIdx: number = 0;

  constructor(initialIdleSec: number) {
    this.stateTimer = initialIdleSec;
    this.talkToggleTimer = 3 + Math.random() * 3;
  }

  public transitionTo(next: NPCFSMState) {
    if (this.state === next) return;
    this.state = next;
    this.talkToggleTimer = 2.6 + Math.random() * 3.4;
  }

  public isAtHomeSeat(isDeskSeated: boolean): boolean {
    return (
      isDeskSeated &&
      this.task === 'desk_work' &&
      this.state !== 'walking'
    );
  }
}

export interface ManagedNPC {
  char: CharacterInstance;
  data: NPCData;
  bubble: THREE.Sprite;
  hasTicketBubble: boolean;
  nameTagEl: HTMLDivElement;
  nameBadgeEl: HTMLSpanElement;
  interactiveTarget: InteractiveTarget;
  isDeskSeated: boolean;
  homeX: number;
  homeZ: number;
  homeYaw: number;
  aisleX: number;
  aisleZ: number;
  walkSpeed: number;
  calmSpeed: number;
  fleeing: boolean;
  fleeRetarget: number;
  stuckTime: number;
  fsm: NPCStateMachine;
  cutout?: CutoutSprite;
}

export class NPCCharacterManager {
  private npcs: Map<string, ManagedNPC> = new Map();
  private groupMeetingCooldown: number = 3.2;
  private gameTimeMinutes: number = 540;
  private lastScheduledSlot: number = -1;

  constructor(
    private scene: THREE.Scene,
    private collisionSystem: CollisionSystem,
    private nameTagLayer: HTMLDivElement
  ) {}

  public setGameTime(timeMinutes: number) {
    this.gameTimeMinutes = timeMinutes;
    const slot = Math.floor(timeMinutes / 10);

    if (this.lastScheduledSlot === -1) {
      this.lastScheduledSlot = slot;
      return;
    }

    if (slot > this.lastScheduledSlot) {
      this.lastScheduledSlot = slot;
      if (slot % 2 === 0) {
        this.scheduleAutonomousGroupMeeting();
      } else {
        this.scheduleCoffeeBreakWave();
      }
    }
  }

  private createNameTagElement(npc: NPCData): {
    el: HTMLDivElement;
    badge: HTMLSpanElement;
  } {
    const el = document.createElement('div');
    el.className = 'name-tag';

    const nameSpan = document.createElement('span');
    nameSpan.textContent = npc.name;

    const shortRole = npc.role.split(/[·(/]/)[0].trim();
    const roleSpan = document.createElement('span');
    roleSpan.className = 'name-tag__role';
    roleSpan.textContent = shortRole;

    const badge = document.createElement('span');
    badge.className = 'name-tag__badge';
    badge.textContent = '!';
    badge.style.display = npc.currentTicketId ? 'inline-flex' : 'none';

    el.appendChild(nameSpan);
    el.appendChild(roleSpan);
    el.appendChild(badge);
    this.nameTagLayer.appendChild(el);
    return { el, badge };
  }

  private createNPCSpeechBubble(hasTicket: boolean): THREE.Sprite {
    const texture = createSpeechBubbleTexture(hasTicket);
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: true,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(0.36, 0.36, 1);
    return sprite;
  }

  public syncNPCs(
    npcList: NPCData[],
    existingTargets: InteractiveTarget[],
    isSoftwareGl: boolean
  ): InteractiveTarget[] {
    const incomingIds = new Set(npcList.map((n) => n.id));

    // Remove NPCs no longer present
    this.npcs.forEach((managed, id) => {
      if (!incomingIds.has(id)) {
        this.scene.remove(managed.char.rig.root);
        managed.cutout?.dispose();
        managed.nameTagEl.remove();
        (managed.bubble.material as THREE.SpriteMaterial).map?.dispose();
        (managed.bubble.material as THREE.SpriteMaterial).dispose();
        this.npcs.delete(id);
      }
    });

    const nonNpcTargets = existingTargets.filter((t) => t.type !== 'npc');
    const updatedNpcTargets: InteractiveTarget[] = [];

    npcList.forEach((npc, idx) => {
      const existing = this.npcs.get(npc.id);
      const hasTicket = Boolean(npc.currentTicketId);

      if (existing) {
        // Preserve live 3D rig & FSM state across React ticket state updates
        existing.data = npc;
        existing.interactiveTarget.npcData = npc;
        existing.interactiveTarget.label = `Falar com ${npc.name} (${npc.role})`;
        existing.nameBadgeEl.style.display = hasTicket ? 'inline-flex' : 'none';

        if (existing.hasTicketBubble !== hasTicket) {
          const mat = existing.bubble.material as THREE.SpriteMaterial;
          mat.map?.dispose();
          mat.map = createSpeechBubbleTexture(hasTicket);
          mat.needsUpdate = true;
          existing.hasTicketBubble = hasTicket;
        }

        updatedNpcTargets.push(existing.interactiveTarget);
        return;
      }

      const appearance = getNPCAppearance(npc.id, npc.color, npc.hairColor);
      if (!CREW_SPRITES[npc.id]) {
        appearance.heightScale = appearance.gender === 'female' ? 0.88 : 0.9;
      }
      const char = buildHumanCharacter(appearance, !isSoftwareGl);

      const isRoaming = npc.id === 'npc_tania_cafe' || Boolean(CREW_SPRITES[npc.id]);
      const isManager = npc.id === 'npc_gestor_marcos';

      const posX = isManager ? -12.2 : npc.deskX;
      const posZ = isRoaming ? npc.deskZ : isManager ? -9.93 : npc.deskZ + 0.72;
      const baseYaw = isRoaming ? -Math.PI * 0.25 : Math.PI;
      const aisleAnchor = this.collisionSystem.findNearestWalkable(
        posX,
        isRoaming ? posZ : posZ + 0.85
      );

      const spawnX = isRoaming ? aisleAnchor.x : posX;
      const spawnZ = isRoaming ? aisleAnchor.z : posZ;
      char.rig.root.position.set(spawnX, 0, spawnZ);
      char.rig.root.rotation.y = baseYaw;

      const initialAnim = isRoaming ? 'idle' : idx % 3 === 0 ? 'sit' : 'typing';
      char.setAnimation(initialAnim, 0.01);
      char.mixer.setTime(idx * 0.43);

      // Subtle speech/alert icon offset to upper-right so it never collides with the billboarded .name-tag
      const bubble = this.createNPCSpeechBubble(hasTicket);
      bubble.position.set(0.4, isRoaming ? 2.02 : 1.72, 0);
      char.rig.root.add(bubble);

      this.scene.add(char.rig.root);

      const { el: nameTagEl, badge: nameBadgeEl } = this.createNameTagElement(npc);

      const interactiveTarget: InteractiveTarget = {
        id: npc.id,
        name: npc.name,
        type: 'npc',
        x: posX,
        z: posZ + 0.4,
        radius: 2.1,
        label: `Falar com ${npc.name} (${npc.role})`,
        npcData: npc,
      };

      let initialTimer = 9 + (idx % 5) * 4.2;
      if (npc.id === 'npc_carlos_beneficios') initialTimer = 1.8;
      else if (npc.id === 'npc_fabio_basis') initialTimer = 4.6;
      else if (npc.id === 'npc_tania_cafe') initialTimer = 3.5;
      else if (npc.id === 'npc_bruna_folha') initialTimer = 18.0;
      else if (CREW_SPRITES[npc.id]) initialTimer = 2.2 + (idx % 4) * 1.4;

      const crewFrames = CREW_SPRITES[npc.id];
      let cutout: CutoutSprite | undefined;
      if (crewFrames) {
        char.rig.root.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (mesh.isMesh) mesh.visible = false;
        });
        cutout = new CutoutSprite(crewFrames, () => {
          char.rig.root.traverse((obj) => {
            const mesh = obj as THREE.Mesh;
            if (mesh.isMesh) mesh.visible = false;
          });
        });
        cutout.group.position.set(posX, 0, posZ);
        this.scene.add(cutout.group);
        cutout.load(8);
      }

      const managed: ManagedNPC = {
        char,
        data: npc,
        bubble,
        hasTicketBubble: hasTicket,
        nameTagEl,
        nameBadgeEl,
        interactiveTarget,
        isDeskSeated: !isRoaming,
        homeX: posX,
        homeZ: posZ,
        homeYaw: baseYaw,
        aisleX: aisleAnchor.x,
        aisleZ: aisleAnchor.z,
        walkSpeed: npc.id === 'npc_sand' ? 2.55 : 1.78 + (idx % 3) * 0.16,
        calmSpeed: npc.id === 'npc_sand' ? 2.55 : 1.78 + (idx % 3) * 0.16,
        fleeing: false,
        fleeRetarget: 0,
        stuckTime: 0,
        fsm: new NPCStateMachine(initialTimer),
        cutout,
      };

      this.npcs.set(npc.id, managed);
      updatedNpcTargets.push(interactiveTarget);
    });

    return [...nonNpcTargets, ...updatedNpcTargets];
  }

  private assignTaskToNpc(
    managed: ManagedNPC,
    task: NPCTaskType,
    spot: NPCSpot | null,
    durationSec: number
  ) {
    const fsm = managed.fsm;
    const prevTask = fsm.task;
    const wasAtHomeSeat = fsm.isAtHomeSeat(managed.isDeskSeated);
    fsm.task = task;
    fsm.stateTimer = durationSec;

    if (task === 'desk_work') {
      fsm.destination = {
        x: managed.homeX,
        z: managed.homeZ,
        yaw: managed.homeYaw,
        anim: 'idle',
        holdCoffee: false,
      };
      if (prevTask !== 'desk_work' || !wasAtHomeSeat) {
        const curr = managed.char.rig.root.position;
        const start = this.collisionSystem.findNearestWalkable(curr.x, curr.z);
        fsm.path = this.collisionSystem.findPath(start.x, start.z, managed.aisleX, managed.aisleZ);
        fsm.pathIdx = 0;
        fsm.walkPhase = 'pathing';
        fsm.transitionTo('walking');
      }
      return;
    }

    if (!spot) return;
    const safeSpot = this.collisionSystem.findNearestWalkable(spot.x, spot.z);
    fsm.destination = { ...spot, x: safeSpot.x, z: safeSpot.z };
    managed.char.setHoldingCoffee(false);

    if (wasAtHomeSeat) {
      // Smoothly step out from ergonomic chair to corridor before A* pathing
      fsm.walkPhase = 'stepping_out';
      fsm.path = [];
      fsm.pathIdx = 0;
      fsm.transitionTo('walking');
    } else {
      // Fluidly transition from current room (e.g. Sala de Reuniões -> Área de Café) directly!
      const curr = managed.char.rig.root.position;
      const start = this.collisionSystem.findNearestWalkable(curr.x, curr.z);
      fsm.path = this.collisionSystem.findPath(start.x, start.z, safeSpot.x, safeSpot.z);
      fsm.pathIdx = 0;
      fsm.walkPhase = 'pathing';
      fsm.transitionTo('walking');
    }
  }

  private scheduleAutonomousGroupMeeting() {
    const candidates = Array.from(this.npcs.values()).filter(
      (m) => m.fsm.state !== 'walking' && m.fsm.task !== 'meeting' && m.data.id !== 'npc_tania_cafe'
    );
    if (candidates.length < 2) return;

    const shuffled = [...candidates].sort(() => Math.random() - 0.5);
    const attendees = shuffled.slice(0, Math.min(3, shuffled.length));
    const meetingDuration = 18 + Math.random() * 8;

    attendees.forEach((managed, idx) => {
      const spot = MEETING_SPOTS[idx % MEETING_SPOTS.length];
      this.assignTaskToNpc(managed, 'meeting', spot, meetingDuration + idx * 1.5);
    });
  }

  private scheduleCoffeeBreakWave() {
    // Move colleagues from Sala de Reunião or desks directly to Área de Café based on game time
    const meetingAttendees = Array.from(this.npcs.values()).filter(
      (m) => m.fsm.state !== 'walking' && m.fsm.task === 'meeting'
    );
    const deskWorkers = Array.from(this.npcs.values()).filter(
      (m) => m.fsm.state !== 'walking' && m.fsm.task === 'desk_work' && m.data.id !== 'npc_tania_cafe'
    );

    const pool = [...meetingAttendees, ...deskWorkers.sort(() => Math.random() - 0.5)].slice(0, 3);
    pool.forEach((managed, idx) => {
      const spot = COFFEE_SPOTS[idx % COFFEE_SPOTS.length];
      this.assignTaskToNpc(managed, 'coffee', spot, 14 + Math.random() * 7);
    });
  }

  private routeSpriteCrew(managed: ManagedNPC): boolean {
    const id = managed.data.id;
    if (!CREW_SPRITES[id]) return false;
    const roll = Math.random();
    const coffee = () => COFFEE_SPOTS[Math.floor(Math.random() * COFFEE_SPOTS.length)];
    const visit = () => VISIT_SPOTS[Math.floor(Math.random() * VISIT_SPOTS.length)];
    const meeting = () => MEETING_SPOTS[Math.floor(Math.random() * MEETING_SPOTS.length)];

    if (id === 'npc_wbiondi' || id === 'npc_vanesa') {
      if (roll < 0.72) this.assignTaskToNpc(managed, 'coffee', coffee(), 14 + Math.random() * 10);
      else this.assignTaskToNpc(managed, 'colleague_visit', visit(), 10 + Math.random() * 8);
      return true;
    }
    if (id === 'npc_gustavo') {
      if (roll < 0.5) this.assignTaskToNpc(managed, 'coffee', coffee(), 16 + Math.random() * 10);
      else if (roll < 0.85) this.assignTaskToNpc(managed, 'colleague_visit', visit(), 12 + Math.random() * 8);
      else this.assignTaskToNpc(managed, 'desk_work', null, 6 + Math.random() * 5);
      return true;
    }
    if (id === 'npc_camilinha') {
      if (roll < 0.7) this.assignTaskToNpc(managed, 'colleague_visit', visit(), 8 + Math.random() * 6);
      else this.assignTaskToNpc(managed, 'meeting', meeting(), 10 + Math.random() * 6);
      return true;
    }
    if (roll < 0.4) this.assignTaskToNpc(managed, 'coffee', coffee(), 12 + Math.random() * 8);
    else if (roll < 0.75) this.assignTaskToNpc(managed, 'colleague_visit', visit(), 10 + Math.random() * 7);
    else this.assignTaskToNpc(managed, 'meeting', meeting(), 12 + Math.random() * 6);
    return true;
  }

  private pickNextTaskForNpc(managed: ManagedNPC) {
    if (this.routeSpriteCrew(managed)) return;
    const prevTask = managed.fsm.task;

    // Fluidly transition after a Meeting: ~55% go straight to Área de Café, ~45% return to desk
    if (prevTask === 'meeting') {
      if (Math.random() < 0.55) {
        const s = COFFEE_SPOTS[Math.floor(Math.random() * COFFEE_SPOTS.length)];
        this.assignTaskToNpc(managed, 'coffee', s, 14 + Math.random() * 8);
      } else {
        this.assignTaskToNpc(managed, 'desk_work', null, 20 + Math.random() * 18);
      }
      return;
    }

    // After Coffee: ~25% move directly to Meeting Room or visit a colleague, ~75% return to desk
    if (prevTask === 'coffee') {
      if (managed.data.id === 'npc_tania_cafe') {
        const pool = Math.random() < 0.65 ? COFFEE_SPOTS : VISIT_SPOTS;
        const s = pool[Math.floor(Math.random() * pool.length)];
        this.assignTaskToNpc(managed, 'coffee', s, 12 + Math.random() * 10);
        return;
      }
      const roll = Math.random();
      if (roll < 0.22) {
        const s = MEETING_SPOTS[Math.floor(Math.random() * MEETING_SPOTS.length)];
        this.assignTaskToNpc(managed, 'meeting', s, 14 + Math.random() * 8);
      } else if (roll < 0.35) {
        const s = VISIT_SPOTS[Math.floor(Math.random() * VISIT_SPOTS.length)];
        this.assignTaskToNpc(managed, 'colleague_visit', s, 10 + Math.random() * 6);
      } else {
        this.assignTaskToNpc(managed, 'desk_work', null, 22 + Math.random() * 18);
      }
      return;
    }

    // From Colleague Visit or Infra Check: return to desk or swing by Café
    if (prevTask === 'colleague_visit' || prevTask === 'infra_check') {
      if (Math.random() < 0.38) {
        const s = COFFEE_SPOTS[Math.floor(Math.random() * COFFEE_SPOTS.length)];
        this.assignTaskToNpc(managed, 'coffee', s, 12 + Math.random() * 7);
      } else {
        this.assignTaskToNpc(managed, 'desk_work', null, 20 + Math.random() * 18);
      }
      return;
    }

    // From Desk Work: pick an autonomous office activity
    if (managed.data.id === 'npc_fabio_basis' && Math.random() < 0.5) {
      const s = INFRA_SPOTS[Math.floor(Math.random() * INFRA_SPOTS.length)];
      this.assignTaskToNpc(managed, 'infra_check', s, 12 + Math.random() * 8);
      return;
    }

    if (managed.data.id === 'npc_tania_cafe') {
      const pool = Math.random() < 0.65 ? COFFEE_SPOTS : VISIT_SPOTS;
      const s = pool[Math.floor(Math.random() * pool.length)];
      this.assignTaskToNpc(managed, 'coffee', s, 12 + Math.random() * 10);
      return;
    }

    const coffeeBias = this.gameTimeMinutes >= 840 ? 0.65 : 0.56;
    const r = Math.random();
    if (r < coffeeBias) {
      const s = COFFEE_SPOTS[Math.floor(Math.random() * COFFEE_SPOTS.length)];
      this.assignTaskToNpc(managed, 'coffee', s, 13 + Math.random() * 8);
    } else if (r < 0.84) {
      const s = VISIT_SPOTS[Math.floor(Math.random() * VISIT_SPOTS.length)];
      this.assignTaskToNpc(managed, 'colleague_visit', s, 11 + Math.random() * 7);
    } else {
      const s = MEETING_SPOTS[Math.floor(Math.random() * MEETING_SPOTS.length)];
      this.assignTaskToNpc(managed, 'meeting', s, 15 + Math.random() * 8);
    }
  }

  private moveNpcAlongPoint(managed: ManagedNPC, tx: number, tz: number, dt: number, allowClip = false): boolean {
    const pos = managed.char.rig.root.position;
    const dx = tx - pos.x;
    const dz = tz - pos.z;
    const dist = Math.hypot(dx, dz);
    if (dist <= 0.16) return true;

    const step = Math.min(dist, managed.walkSpeed * dt);
    const mx = (dx / dist) * step;
    const mz = (dz / dist) * step;
    if (allowClip) {
      pos.x += mx;
      pos.z += mz;
      managed.stuckTime = 0;
    } else {
      const resolved = this.collisionSystem.moveCircle(pos.x, pos.z, mx, mz, 0.4);
      const moved = Math.hypot(resolved.x - pos.x, resolved.z - pos.z);
      pos.x = resolved.x;
      pos.z = resolved.z;
      managed.stuckTime = moved < step * 0.35 ? managed.stuckTime + dt : 0;
    }

    const targetYaw = Math.atan2(dx, dz);
    let deltaYaw = targetYaw - managed.char.rig.root.rotation.y;
    while (deltaYaw > Math.PI) deltaYaw -= Math.PI * 2;
    while (deltaYaw < -Math.PI) deltaYaw += Math.PI * 2;
    managed.char.rig.root.rotation.y += deltaYaw * Math.min(1, dt * 8);
    managed.char.setAnimation('walk', 0.18);
    return false;
  }

  private yawTowardSomeone(managed: ManagedNPC, playerPos: THREE.Vector3, fallbackYaw: number): number {
    const pos = managed.char.rig.root.position;
    let best = 3.8;
    let yaw = fallbackYaw;
    const consider = (x: number, z: number) => {
      const d = Math.hypot(x - pos.x, z - pos.z);
      if (d < best && d > 0.35) {
        best = d;
        yaw = Math.atan2(x - pos.x, z - pos.z);
      }
    };
    consider(playerPos.x, playerPos.z);
    this.npcs.forEach((other) => {
      if (other.data.id === managed.data.id) return;
      const o = other.char.rig.root.position;
      consider(o.x, o.z);
    });
    return yaw;
  }

  public nearestPerson(x: number, z: number, maxDist: number): { x: number; z: number } | null {
    let best = maxDist;
    let found: { x: number; z: number } | null = null;
    this.npcs.forEach((other) => {
      const o = other.char.rig.root.position;
      const d = Math.hypot(o.x - x, o.z - z);
      if (d < best && d > 0.35) {
        best = d;
        found = { x: o.x, z: o.z };
      }
    });
    return found;
  }

  public update(dt: number, elapsed: number, playerPos: THREE.Vector3) {
    this.groupMeetingCooldown -= dt;
    if (this.groupMeetingCooldown <= 0) {
      this.groupMeetingCooldown = 25 + Math.random() * 13;
      this.scheduleAutonomousGroupMeeting();
    }

    let idx = 0;
    this.steerSandAwayFromBiondi(dt, playerPos);
    this.npcs.forEach((managed) => {
      const fsm = managed.fsm;
      const npcPos = managed.char.rig.root.position;
      const distToPlayer = Math.hypot(npcPos.x - playerPos.x, npcPos.z - playerPos.z);
      const isPlayerClose = distToPlayer < 2.2;
      const isHomeSeat = fsm.isAtHomeSeat(managed.isDeskSeated);

      if (fsm.state === 'walking') {
        if (isPlayerClose) {
          // Pause briefly to greet / talk to Marcelo if he approaches mid-walk
          managed.char.setAnimation('talking', 0.22);
          const lookYaw = Math.atan2(playerPos.x - npcPos.x, playerPos.z - npcPos.z);
          managed.char.rig.root.rotation.y = THREE.MathUtils.damp(
            managed.char.rig.root.rotation.y,
            lookYaw,
            6,
            dt
          );
        } else if (fsm.walkPhase === 'stepping_out') {
          if (this.moveNpcAlongPoint(managed, managed.aisleX, managed.aisleZ, dt) && fsm.destination) {
            fsm.path = this.collisionSystem.findPath(
              managed.aisleX,
              managed.aisleZ,
              fsm.destination.x,
              fsm.destination.z
            );
            fsm.pathIdx = 0;
            fsm.walkPhase = 'pathing';
          }
        } else if (fsm.walkPhase === 'pathing') {
          if (fsm.pathIdx < fsm.path.length) {
            const wp = fsm.path[fsm.pathIdx];
            if (this.moveNpcAlongPoint(managed, wp.x, wp.z, dt)) {
              fsm.pathIdx++;
              managed.stuckTime = 0;
            } else if (managed.stuckTime > 0.6) {
              managed.stuckTime = 0;
              const dest = fsm.destination;
              if (!dest) {
                fsm.transitionTo('idle');
              } else {
                fsm.path = this.collisionSystem.findPath(npcPos.x, npcPos.z, dest.x, dest.z);
                fsm.pathIdx = 0;
                if (fsm.path.length === 0) {
                  fsm.transitionTo('idle');
                  this.pickNextTaskForNpc(managed);
                }
              }
            }
          } else if (fsm.task === 'desk_work' && managed.isDeskSeated) {
            managed.char.setHoldingCoffee(false);
            fsm.walkPhase = 'stepping_in';
          } else {
            // Arrived at destination (Sala de Reuniões, Área de Café, Infra, etc.)
            const dest = fsm.destination;
            managed.char.setHoldingCoffee(Boolean(dest?.holdCoffee));
            if (fsm.task === 'meeting' || fsm.task === 'colleague_visit') {
              fsm.transitionTo(dest?.anim === 'talking' ? 'talking' : 'idle');
            } else if (fsm.task === 'coffee') {
              fsm.transitionTo(Math.random() < 0.55 ? 'talking' : 'idle');
            } else {
              fsm.transitionTo('idle');
            }
          }
        } else if (fsm.walkPhase === 'stepping_in') {
          const distHome = Math.hypot(managed.homeX - npcPos.x, managed.homeZ - npcPos.z);
          if (this.moveNpcAlongPoint(managed, managed.homeX, managed.homeZ, dt, distHome < 1.25)) {
            fsm.transitionTo('idle');
          } else if (managed.stuckTime > 0.7) {
            managed.stuckTime = 0;
            fsm.transitionTo('idle');
          }
        }
      } else if (fsm.state === 'talking') {
        fsm.stateTimer -= dt;
        fsm.talkToggleTimer -= dt;

        const targetYaw = this.yawTowardSomeone(
          managed,
          playerPos,
          fsm.destination?.yaw ?? managed.homeYaw
        );

        managed.char.setAnimation('talking', 0.24);
        managed.char.rig.root.rotation.y = THREE.MathUtils.damp(
          managed.char.rig.root.rotation.y,
          targetYaw,
          5.5,
          dt
        );

        if (!isPlayerClose && fsm.talkToggleTimer <= 0) {
          // Naturally alternate between speaking ('talking') and listening/sipping ('idle')
          fsm.transitionTo('idle');
        }

        if (fsm.stateTimer <= 0 && !isPlayerClose) {
          this.pickNextTaskForNpc(managed);
        }
      } else {
        // fsm.state === 'idle'
        fsm.stateTimer -= dt;
        fsm.talkToggleTimer -= dt;

        if (isPlayerClose && !isHomeSeat) {
          fsm.transitionTo('talking');
        } else if (isHomeSeat) {
          const cycle = Math.sin(elapsed * 0.35 + idx * 1.7);
          managed.char.setAnimation(cycle > -0.35 ? 'typing' : 'sit', 0.35);
          managed.char.rig.root.rotation.y = THREE.MathUtils.damp(
            managed.char.rig.root.rotation.y,
            managed.homeYaw,
            6,
            dt
          );
        } else {
          const dest = fsm.destination;
          let idleClip: 'idle' | 'coffee' | 'interacting' = 'idle';
          if (fsm.task === 'coffee' && dest?.holdCoffee) {
            idleClip = 'coffee';
          } else if (fsm.task === 'infra_check' && dest?.anim === 'interacting') {
            idleClip = 'interacting';
          }
          managed.char.setAnimation(idleClip, 0.28);

          const targetYaw = this.yawTowardSomeone(managed, playerPos, dest?.yaw ?? managed.homeYaw);
          managed.char.rig.root.rotation.y = THREE.MathUtils.damp(
            managed.char.rig.root.rotation.y,
            targetYaw,
            4.5,
            dt
          );

          if (
            !isPlayerClose &&
            fsm.talkToggleTimer <= 0 &&
            (fsm.task === 'meeting' || fsm.task === 'coffee' || fsm.task === 'colleague_visit')
          ) {
            fsm.transitionTo('talking');
          }
        }

        if (fsm.stateTimer <= 0 && !isPlayerClose) {
          this.pickNextTaskForNpc(managed);
        }
      }

      // Keep interactive target synced with live position
      managed.interactiveTarget.x = npcPos.x;
      managed.interactiveTarget.z = isHomeSeat ? npcPos.z + 0.4 : npcPos.z;

      managed.char.update(dt);
      managed.bubble.position.y = (isHomeSeat ? 1.72 : 2.02) + Math.sin(elapsed * 2.8 + idx) * 0.04;
      idx++;
    });
  }

  public syncCutouts(camera: THREE.Camera, dt: number, playerPos: THREE.Vector3) {
    this.npcs.forEach((managed) => {
      const cutout = managed.cutout;
      if (!cutout) return;
      const state = managed.fsm.state;
      const id = managed.data.id;
      const pos = managed.char.rig.root.position;
      const nearPlayer = Math.hypot(pos.x - playerPos.x, pos.z - playerPos.z) < 2.3;
      let mode: CutoutMode = 'idle';
      if (nearPlayer || state === 'talking') mode = 'talk';
      else if (state === 'walking') mode = 'walk';
      else if (id === 'npc_wbiondi' || id === 'npc_gustavo' || id === 'npc_vanesa') mode = 'loaf';

      const yaw = managed.char.rig.root.rotation.y;
      cutout.group.position.copy(pos);
      cutout.present(dt, mode, camera, pos.x + Math.sin(yaw), pos.z + Math.cos(yaw), managed.fleeing);
    });
  }

  /** Sand is fast on ABAP and even faster leaving the room when Biondi shows up. */
  private steerSandAwayFromBiondi(dt: number, playerPos: THREE.Vector3) {
    const sand = this.npcs.get('npc_sand');
    const biondi = this.npcs.get('npc_wbiondi');
    if (!sand || !biondi) return;

    sand.fleeRetarget -= dt;
    const sp = sand.char.rig.root.position;
    const bp = biondi.char.rig.root.position;
    const dx = sp.x - bp.x;
    const dz = sp.z - bp.z;
    const dist = Math.hypot(dx, dz) || 0.001;
    const nearPlayer = Math.hypot(sp.x - playerPos.x, sp.z - playerPos.z) < 2.15;

    if (dist > 8.2 || nearPlayer) {
      if (sand.fleeing) {
        sand.fleeing = false;
        sand.walkSpeed = sand.calmSpeed;
      }
      return;
    }

    sand.fleeing = true;
    sand.walkSpeed = 3.4;
    const dest = sand.fsm.destination;
    const destClear = dest ? Math.hypot(dest.x - bp.x, dest.z - bp.z) > 8 : false;
    if (sand.fleeRetarget > 0 && sand.fsm.state === 'walking' && destClear) return;

    sand.fleeRetarget = 1.4;
    const ax = THREE.MathUtils.clamp(sp.x + (dx / dist) * 11, -18, 18);
    const az = THREE.MathUtils.clamp(sp.z + (dz / dist) * 11, -14, 15);
    this.assignTaskToNpc(
      sand,
      'colleague_visit',
      {
        x: ax,
        z: az,
        yaw: Math.atan2(dx, dz),
        anim: 'idle',
        holdCoffee: false,
      },
      5
    );
  }

  public projectNameTags(camera: THREE.PerspectiveCamera, width: number, height: number) {
    this.npcs.forEach((managed) => {
      const pos = managed.char.rig.root.position;
      const isSeated = managed.fsm.isAtHomeSeat(managed.isDeskSeated);
      const yOffset = managed.cutout ? 1.96 : isSeated ? 1.72 : 1.96;

      _projVec.set(pos.x, pos.y + yOffset, pos.z);
      const dist = camera.position.distanceTo(_projVec);
      _projVec.project(camera);

      const isBehindCamera = _projVec.z < -1 || _projVec.z > 1;
      if (isBehindCamera || dist > 25) {
        managed.nameTagEl.style.opacity = '0';
        return;
      }

      const sx = (_projVec.x * 0.5 + 0.5) * width;
      const sy = (-_projVec.y * 0.5 + 0.5) * height;
      if (sx < -120 || sx > width + 120 || sy < -60 || sy > height + 60) {
        managed.nameTagEl.style.opacity = '0';
        return;
      }

      const fade = THREE.MathUtils.clamp((25 - dist) / 6, 0, 1);
      managed.nameTagEl.style.opacity = fade.toFixed(2);
      managed.nameTagEl.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0) translate(-50%, -100%)`;
    });
  }

  public dispose() {
    this.npcs.forEach((managed) => {
      this.scene.remove(managed.char.rig.root);
      managed.cutout?.dispose();
      managed.nameTagEl.remove();
      (managed.bubble.material as THREE.SpriteMaterial).map?.dispose();
      (managed.bubble.material as THREE.SpriteMaterial).dispose();
    });
    this.npcs.clear();
  }
}

// Pre-allocated math helpers (zero GC in animation loop)
const _camForward = new THREE.Vector3();
const _camRight = new THREE.Vector3();
const _moveVec = new THREE.Vector3();
const _rayOrigin = new THREE.Vector3();
const _rayDir = new THREE.Vector3();
const _desiredCamPos = new THREE.Vector3();
const _projVec = new THREE.Vector3();

export class OfficeScene {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private isSoftwareGl: boolean = false;
  private frameId: number = 0;
  private destroyed: boolean = false;
  private clock: THREE.Clock;

  // Materials & Office World
  private mats: OfficeMaterialLibrary;
  private officeResult: OfficeBuildResult;
  private envTexture: THREE.Texture | null = null;

  // Physics & Collision
  public collisionSystem: CollisionSystem;
  private playerRadius: number = 0.4;

  // Player (Marcelo — sprite cutout; the rig only drives the anim clock)
  private playerChar: CharacterInstance;
  private marceloSprite: MarceloSprite;
  private plumbob: THREE.Mesh;
  private nameTagLayer: HTMLDivElement;
  private playerNameTagEl: HTMLDivElement;
  private playerPos: THREE.Vector3 = new THREE.Vector3(0, 0, 4.2);
  private playerYaw: number = Math.PI;
  private walkSpeed: number = 4.6;
  private runSpeed: number = 8.4;
  private interactTimer: number = 0;
  private currentRoomName: string = 'Sala Principal de Sustentação';

  // Navigation & A* Pathfinding
  private activePath: { x: number; z: number }[] = [];
  private currentPathTargetIdx: number = 0;
  private pathLine: THREE.Line | null = null;

  // Controls & Camera Orbit
  private keysHeld: { [key: string]: boolean } = {};
  private camTarget: THREE.Vector3 = new THREE.Vector3(0, 1.35, 4.2);
  private camYaw: number = 0.45;
  private targetCamYaw: number = 0.45;
  private camPitch: number = 0.68;
  private targetCamPitch: number = 0.68;
  private camDistance: number = 10.5;
  private targetCamDistance: number = 10.5;
  private camRaycaster: THREE.Raycaster = new THREE.Raycaster();

  private activePointers: Map<number, { x: number; y: number }> = new Map();
  private primaryPointerId: number | null = null;
  private pointerMovedDist: number = 0;
  private lastPointerX: number = 0;
  private lastPointerY: number = 0;
  private lastPinchDist: number | null = null;

  // Touch / Android / iPad Virtual Controls State
  private joystickVector: { x: number; y: number } = { x: 0, y: 0 };
  private touchSprint: boolean = false;

  // Entities & Interactive Targets
  private npcManager: NPCCharacterManager;
  private interactiveTargets: InteractiveTarget[] = [];
  private currentNearTarget: InteractiveTarget | null = null;
  private proximityRing: THREE.Mesh;
  private serverLeds: THREE.PointLight[] = [];

  // Callbacks
  public onProximityChange: ((target: InteractiveTarget | null) => void) | null = null;
  public onRoomChange: ((roomName: string) => void) | null = null;
  public onStepSound: (() => void) | null = null;
  private stepAccumulator: number = 0;

  // Bound event listeners for clean disposal
  private handleKeyDown: (e: KeyboardEvent) => void;
  private handleKeyUp: (e: KeyboardEvent) => void;
  private handleBlur: () => void;
  private handlePointerDown: (e: PointerEvent) => void;
  private handlePointerMove: (e: PointerEvent) => void;
  private handlePointerUp: (e: PointerEvent) => void;
  private handlePointerCancel: (e: PointerEvent) => void;
  private handleWheel: (e: WheelEvent) => void;
  private handleContextMenu: (e: MouseEvent) => void;

  constructor(container: HTMLElement) {
    this.container = container;
    this.collisionSystem = new CollisionSystem();

    // Software WebGL guard
    try {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
      if (gl) {
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        this.isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      }
    } catch {
      this.isSoftwareGl = false;
    }

    // Scene & Horizon Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0d1526);
    this.scene.fog = new THREE.Fog(0x0d1526, 48, 92);

    // Responsive 3rd-Person Perspective Camera
    const aspect = container.clientWidth / (container.clientHeight || 1);
    this.camera = new THREE.PerspectiveCamera(46, aspect, 0.25, 160);

    // Modern PBR WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // Studio Environment Reflections (PMREM RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = this.envTexture;
    pmremGenerator.dispose();

    this.clock = new THREE.Clock();

    // Lighting Rig
    this.setupLighting();

    // Shared PBR Materials & Complete 7-Zone Corporate Office
    const glassDecal = createGlassDecalTexture();
    this.mats = createOfficeMaterialLibrary(this.isSoftwareGl, glassDecal);
    this.officeResult = buildCorporateOffice(this.scene, this.collisionSystem, this.mats, this.isSoftwareGl);
    this.serverLeds = this.officeResult.serverLeds;

    // Build Articulated Human Marcelo (Protagonist)
    this.playerChar = buildHumanCharacter(getMarceloAppearance(), !this.isSoftwareGl);
    this.playerChar.rig.root.position.copy(this.playerPos);
    this.playerChar.rig.root.rotation.y = this.playerYaw;

    this.plumbob = createSimsPlumbob();
    this.plumbob.position.set(0, 1.98, 0);
    this.playerChar.rig.root.add(this.plumbob);

    this.scene.add(this.playerChar.rig.root);

    this.marceloSprite = new MarceloSprite(() => this.hideProceduralMarcelo());
    this.marceloSprite.group.position.copy(this.playerPos);
    this.scene.add(this.marceloSprite.group);
    this.marceloSprite.load(this.renderer.capabilities.getMaxAnisotropy());
    this.hideProceduralMarcelo();

    // Billboarded DOM .name-tag layer (World-to-Screen projection with backdrop-filter)
    if (getComputedStyle(this.container).position === 'static') {
      this.container.style.position = 'relative';
    }
    this.nameTagLayer = document.createElement('div');
    this.nameTagLayer.className = 'name-tag-layer';
    this.container.appendChild(this.nameTagLayer);

    this.playerNameTagEl = document.createElement('div');
    this.playerNameTagEl.className = 'name-tag name-tag--player';
    const playerNameSpan = document.createElement('span');
    playerNameSpan.textContent = 'MARCELO';
    const playerRoleSpan = document.createElement('span');
    playerRoleSpan.className = 'name-tag__role';
    playerRoleSpan.textContent = 'Key User · C2C';
    this.playerNameTagEl.appendChild(playerNameSpan);
    this.playerNameTagEl.appendChild(playerRoleSpan);
    this.nameTagLayer.appendChild(this.playerNameTagEl);

    this.npcManager = new NPCCharacterManager(this.scene, this.collisionSystem, this.nameTagLayer);

    // Proximity Indicator Ring
    const ringGeo = new THREE.RingGeometry(0.68, 0.84, 36);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.proximityRing = new THREE.Mesh(ringGeo, ringMat);
    this.proximityRing.position.set(0, 0.04, 0);
    this.proximityRing.visible = false;
    this.scene.add(this.proximityRing);

    // Setup Interactive Spots across all 7 environments
    this.setupInteractiveSpots();

    // Bind Input Handlers
    this.handleKeyDown = (e) => {
      this.keysHeld[e.code] = true;
    };
    this.handleKeyUp = (e) => {
      this.keysHeld[e.code] = false;
    };
    this.handleBlur = () => {
      this.keysHeld = {};
      this.activePointers.clear();
      this.primaryPointerId = null;
      this.lastPinchDist = null;
      this.joystickVector.x = 0;
      this.joystickVector.y = 0;
    };
    this.handleContextMenu = (e) => e.preventDefault();

    this.handlePointerDown = (e) => {
      this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.activePointers.size === 1) {
        this.primaryPointerId = e.pointerId;
        this.pointerMovedDist = 0;
        this.lastPointerX = e.clientX;
        this.lastPointerY = e.clientY;
        this.lastPinchDist = null;
      } else if (this.activePointers.size === 2) {
        const pts = Array.from(this.activePointers.values());
        this.lastPinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        this.pointerMovedDist = 999; // cancel click-to-walk on multi-touch pinch
      }
    };

    this.handlePointerMove = (e) => {
      if (!this.activePointers.has(e.pointerId)) return;
      this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (this.activePointers.size === 2) {
        const pts = Array.from(this.activePointers.values());
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (this.lastPinchDist !== null) {
          const delta = this.lastPinchDist - dist;
          this.targetCamDistance = THREE.MathUtils.clamp(
            this.targetCamDistance + delta * 0.025,
            4.8,
            17.5
          );
        }
        this.lastPinchDist = dist;
        return;
      }

      if (this.activePointers.size === 1 && e.pointerId === this.primaryPointerId) {
        const dx = e.clientX - this.lastPointerX;
        const dy = e.clientY - this.lastPointerY;
        this.lastPointerX = e.clientX;
        this.lastPointerY = e.clientY;
        this.pointerMovedDist += Math.hypot(dx, dy);

        // Smooth 3rd-person orbit camera rotation (mouse drag & single-finger touch)
        const sensitivity = e.pointerType === 'touch' ? 0.0078 : 0.0065;
        this.targetCamYaw -= dx * sensitivity;
        this.targetCamPitch = THREE.MathUtils.clamp(this.targetCamPitch + dy * 0.005, 0.24, 1.15);
      }
    };

    const endPointer = (e: PointerEvent, allowTapWalk: boolean) => {
      if (!this.activePointers.has(e.pointerId)) return;
      this.activePointers.delete(e.pointerId);

      if (this.activePointers.size < 2) {
        this.lastPinchDist = null;
      }
      if (this.activePointers.size === 1) {
        const [remId, remPt] = Array.from(this.activePointers.entries())[0];
        this.primaryPointerId = remId;
        this.lastPointerX = remPt.x;
        this.lastPointerY = remPt.y;
        return;
      }

      const wasPrimary = e.pointerId === this.primaryPointerId;
      if (this.activePointers.size === 0) {
        this.primaryPointerId = null;
      }

      // Clean click or single-finger tap navigates via A* pathfinding
      const isLeftOrTouch = e.pointerType !== 'mouse' || e.button === 0;
      if (allowTapWalk && wasPrimary && this.pointerMovedDist < 9 && isLeftOrTouch) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);
        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const hit = new THREE.Vector3();

        if (raycaster.ray.intersectPlane(groundPlane, hit)) {
          const path = this.collisionSystem.findPath(this.playerPos.x, this.playerPos.z, hit.x, hit.z);
          if (path && path.length > 0) {
            this.activePath = path;
            this.currentPathTargetIdx = 0;
            this.drawPathLine(path);
          }
        }
      }
    };

    this.handlePointerUp = (e) => endPointer(e, true);
    this.handlePointerCancel = (e) => endPointer(e, false);

    this.handleWheel = (e) => {
      e.preventDefault();
      this.targetCamDistance = THREE.MathUtils.clamp(
        this.targetCamDistance + e.deltaY * 0.008,
        4.8,
        17.5
      );
    };

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    window.addEventListener('resize', this.onResize);

    const dom = this.renderer.domElement;
    dom.style.touchAction = 'none';
    dom.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('pointercancel', this.handlePointerCancel);
    dom.addEventListener('wheel', this.handleWheel, { passive: false });
    dom.addEventListener('contextmenu', this.handleContextMenu);

    // Pre-warm shaders on GPU
    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.updateCamera(0.016);
    this.tick();
  }

  private setupLighting() {
    // Cool Sky / Warm Ground Architectural Hemisphere Fill
    const hemiLight = new THREE.HemisphereLight(0xeef6ff, 0x262e3d, 0.78);
    this.scene.add(hemiLight);

    // Main Warm Sun Key Light (Sole shadow caster for crisp performance)
    const dirLight = new THREE.DirectionalLight(0xfff4e0, 1.55);
    dirLight.position.set(-22, 34, 18);
    if (!this.isSoftwareGl) {
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = 2048;
      dirLight.shadow.mapSize.height = 2048;
      dirLight.shadow.camera.near = 2;
      dirLight.shadow.camera.far = 95;
      const d = 27;
      dirLight.shadow.camera.left = -d;
      dirLight.shadow.camera.right = d;
      dirLight.shadow.camera.top = d;
      dirLight.shadow.camera.bottom = -d;
      dirLight.shadow.bias = -0.0004;
      dirLight.shadow.normalBias = 0.02;
    }
    this.scene.add(dirLight);

    // Cool Rim / Fill Directional Light
    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.55);
    fillLight.position.set(24, 22, -20);
    this.scene.add(fillLight);

    // Warm Architectural Ceiling Downlights (no shadows for fast GPU performance)
    const accentPoints: [number, number, number, number][] = [
      [0, 3.4, -2, 0xfef3c7],     // Open space center
      [-16, 3.4, -12, 0xfde68a],  // Sala do Gestor
      [-16.8, 3.4, 0.5, 0xe0f2fe],// Sala de Reuniões
      [12, 3.4, -1, 0xeef2ff],    // Consultoria SAP/ABAP
      [14, 3.4, 12, 0xffedd5],    // Restaurante & Café
    ];
    accentPoints.forEach(([lx, ly, lz, color]) => {
      const pt = new THREE.PointLight(color, 1.8, 18, 1.4);
      pt.position.set(lx, ly, lz);
      this.scene.add(pt);
    });
  }

  private setupInteractiveSpots() {
    this.interactiveTargets.push(
      {
        id: 'desk_keyuser',
        name: 'Mesa do Marcelo (C2C)',
        type: 'desk',
        x: 0,
        z: 2.9,
        radius: 2.0,
        label: 'Terminal SAP / Chamados (Marcelo · C2C)',
      },
      {
        id: 'coffee_machine',
        name: 'Cafeteira Expresso',
        type: 'coffee',
        x: 18.0,
        z: 14.6,
        radius: 2.1,
        label: 'Tomar Café (+10 Energia)',
      },
      {
        id: 'restaurant_lunch',
        name: 'Refeitório / Almoço',
        type: 'restaurant',
        x: 9.5,
        z: 14.6,
        radius: 2.3,
        label: 'Almoçar (+30 Energia)',
      },
      {
        id: 'restroom_pause',
        name: 'Banheiros / Pausa',
        type: 'restroom',
        x: 21.0,
        z: -14.5,
        radius: 2.1,
        label: 'Pausa Rápida (-15 Estresse)',
      },
      {
        id: 'server_racks',
        name: 'Racks de Servidores',
        type: 'server',
        x: 12.6,
        z: -13.0,
        radius: 2.4,
        label: 'Status dos Servidores (SM37/ST22)',
      },
      {
        id: 'meeting_screen',
        name: 'Sala de Reunião',
        type: 'meeting',
        x: -16.8,
        z: 0.5,
        radius: 3.4,
        label: 'Painel de Inovação & Projetos',
      },
      {
        id: 'pool_table',
        name: 'Mesa de Sinuca',
        type: 'pool_table',
        x: 18.5,
        z: 10.2,
        radius: 2.4,
        label: 'Jogar Sinuca (-10 Estresse)',
      }
    );
  }

  public populateNPCs(npcList: NPCData[]) {
    this.interactiveTargets = this.npcManager.syncNPCs(
      npcList,
      this.interactiveTargets,
      this.isSoftwareGl
    );
  }

  public setGameTime(timeMinutes: number) {
    this.npcManager.setGameTime(timeMinutes);
  }

  private drawPathLine(path: { x: number; z: number }[]) {
    if (this.pathLine) {
      this.scene.remove(this.pathLine);
      this.pathLine.geometry.dispose();
      (this.pathLine.material as THREE.Material).dispose();
      this.pathLine = null;
    }

    const points = path.map((p) => new THREE.Vector3(p.x, 0.05, p.z));
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineDashedMaterial({
      color: 0x38bdf8,
      dashSize: 0.4,
      gapSize: 0.2,
    });
    this.pathLine = new THREE.Line(geo, mat);
    this.pathLine.computeLineDistances();
    this.scene.add(this.pathLine);
  }

  public setPlumbobMood(energy: number, stress: number) {
    if (!this.plumbob) return;
    const mat = this.plumbob.material as THREE.MeshStandardMaterial;
    if (stress > 70 || energy < 25) {
      mat.color.setHex(0xef4444);
      mat.emissive.setHex(0xb91c1c);
    } else if (energy < 55) {
      mat.color.setHex(0xf59e0b);
      mat.emissive.setHex(0xb45309);
    } else {
      mat.color.setHex(0x22c55e);
      mat.emissive.setHex(0x15803d);
    }
  }

  public playInteractionAnimation() {
    this.interactTimer = 0.85;
    this.playerChar.setAnimation('interacting', 0.14);
  }

  public teleportPlayer(x: number, z: number) {
    this.playerPos.set(x, 0, z);
    this.playerChar.rig.root.position.copy(this.playerPos);
    this.camTarget.set(x, 1.35, z);
    this.activePath = [];
    if (this.pathLine) {
      this.scene.remove(this.pathLine);
      this.pathLine.geometry.dispose();
      (this.pathLine.material as THREE.Material).dispose();
      this.pathLine = null;
    }
  }

  public getNearTarget(): InteractiveTarget | null {
    return this.currentNearTarget;
  }

  public setJoystickVector(x: number, y: number) {
    this.joystickVector.x = THREE.MathUtils.clamp(x, -1, 1);
    this.joystickVector.y = THREE.MathUtils.clamp(y, -1, 1);
  }

  public setTouchSprint(active: boolean) {
    this.touchSprint = active;
  }

  public getPlayerMark() {
    return { x: this.playerPos.x, z: this.playerPos.z };
  }

  public nudgeCameraYaw(deltaYaw: number) {
    this.targetCamYaw += deltaYaw;
  }

  private detectCurrentRoom(x: number, z: number): string {
    if (x < -10.5 && z < -5.5) return 'Sala do Gestor';
    if (x < -10.5 && z >= -5.5 && z <= 6.5) return 'Sala de Reuniões';
    if (x > 6.0 && z < -7.0) return 'Infraestrutura & Servidores';
    if (x > 6.0 && z >= -7.0 && z <= 5.5) return 'Consultoria SAP / ABAP';
    if (x >= 5.5 && x < 13.5 && z > 5.5) return 'Restaurante / Refeitório';
    if (x >= 13.5 && z > 5.5) return 'Área de Café & Descompressão';
    return 'Sala Principal de Sustentação';
  }

  private updateMovement(dt: number) {
    // Camera-relative horizontal forward & right vectors
    _camForward.set(-Math.sin(this.camYaw), 0, -Math.cos(this.camYaw)).normalize();
    _camRight.set(Math.cos(this.camYaw), 0, -Math.sin(this.camYaw)).normalize();
    _moveVec.set(0, 0, 0);

    let inputFwd = 0;
    let inputRight = 0;
    if (this.keysHeld['KeyW'] || this.keysHeld['ArrowUp']) inputFwd += 1;
    if (this.keysHeld['KeyS'] || this.keysHeld['ArrowDown']) inputFwd -= 1;
    if (this.keysHeld['KeyA'] || this.keysHeld['ArrowLeft']) inputRight -= 1;
    if (this.keysHeld['KeyD'] || this.keysHeld['ArrowRight']) inputRight += 1;

    inputRight += this.joystickVector.x;
    inputFwd += this.joystickVector.y;

    const hasDirectionalInput = Math.abs(inputFwd) > 0.08 || Math.abs(inputRight) > 0.08;
    if (hasDirectionalInput) {
      _moveVec.addScaledVector(_camForward, inputFwd).addScaledVector(_camRight, inputRight);
      this.activePath = [];
      if (this.pathLine) {
        this.scene.remove(this.pathLine);
        this.pathLine.geometry.dispose();
        (this.pathLine.material as THREE.Material).dispose();
        this.pathLine = null;
      }
    } else if (this.activePath.length > 0 && this.currentPathTargetIdx < this.activePath.length) {
      const tp = this.activePath[this.currentPathTargetIdx];
      const diffX = tp.x - this.playerPos.x;
      const diffZ = tp.z - this.playerPos.z;
      const dist = Math.hypot(diffX, diffZ);
      if (dist > 0.25) {
        _moveVec.set(diffX / dist, 0, diffZ / dist);
      } else {
        this.currentPathTargetIdx++;
        if (this.currentPathTargetIdx >= this.activePath.length) {
          this.activePath = [];
          if (this.pathLine) {
            this.scene.remove(this.pathLine);
            this.pathLine.geometry.dispose();
            (this.pathLine.material as THREE.Material).dispose();
            this.pathLine = null;
          }
        }
      }
    }

    const isRunning = Boolean(
      this.keysHeld['ShiftLeft'] || this.keysHeld['ShiftRight'] || this.touchSprint
    );
    const speed = isRunning ? this.runSpeed : this.walkSpeed;

    if (this.interactTimer > 0) {
      this.interactTimer -= dt;
    }

    const len = _moveVec.length();
    if (len > 0.05) {
      _moveVec.divideScalar(len);
      this.interactTimer = 0; // cancel interact anim if player starts moving

      const resolved = this.collisionSystem.moveCircle(
        this.playerPos.x,
        this.playerPos.z,
        _moveVec.x * speed * dt,
        _moveVec.z * speed * dt,
        this.playerRadius
      );
      this.playerPos.x = resolved.x;
      this.playerPos.z = resolved.z;

      // Smooth shortest-angle character yaw interpolation
      const targetYaw = Math.atan2(_moveVec.x, _moveVec.z);
      let deltaYaw = targetYaw - this.playerYaw;
      while (deltaYaw > Math.PI) deltaYaw -= Math.PI * 2;
      while (deltaYaw < -Math.PI) deltaYaw += Math.PI * 2;

      this.playerYaw += deltaYaw * Math.min(1, dt * 12);
      this.playerChar.rig.root.rotation.y = this.playerYaw;

      if (Math.abs(deltaYaw) > 1.35 && !isRunning) {
        this.playerChar.setAnimation('turning', 0.14);
      } else {
        this.playerChar.setAnimation(isRunning ? 'run' : 'walk', 0.18);
      }

      this.stepAccumulator += dt * (isRunning ? 1.55 : 1.0);
      if (this.stepAccumulator > 0.42) {
        this.stepAccumulator = 0;
        if (this.onStepSound) this.onStepSound();
      }
    } else if (this.interactTimer > 0) {
      this.playerChar.setAnimation('interacting', 0.15);
    } else {
      this.playerChar.setAnimation('idle', 0.24);
    }

    if (len <= 0.05) {
      const near = this.npcManager.nearestPerson(this.playerPos.x, this.playerPos.z, 3.6);
      if (near) {
        const faceYaw = Math.atan2(near.x - this.playerPos.x, near.z - this.playerPos.z);
        let turn = faceYaw - this.playerYaw;
        while (turn > Math.PI) turn -= Math.PI * 2;
        while (turn < -Math.PI) turn += Math.PI * 2;
        this.playerYaw += turn * Math.min(1, dt * 6);
        this.playerChar.rig.root.rotation.y = this.playerYaw;
      }
    }

    this.playerChar.rig.root.position.copy(this.playerPos);
    this.playerChar.update(dt);

    // Room transition check
    const room = this.detectCurrentRoom(this.playerPos.x, this.playerPos.z);
    if (room !== this.currentRoomName) {
      this.currentRoomName = room;
      if (this.onRoomChange) this.onRoomChange(room);
    }
  }

  private updateCamera(dt: number) {
    // Exponential damping for responsive, silky 3rd-person orbit & follow
    this.camYaw = THREE.MathUtils.damp(this.camYaw, this.targetCamYaw, 10, dt);
    this.camPitch = THREE.MathUtils.damp(this.camPitch, this.targetCamPitch, 10, dt);
    this.camDistance = THREE.MathUtils.damp(this.camDistance, this.targetCamDistance, 10, dt);

    const targetX = this.playerPos.x;
    const targetY = 1.35;
    const targetZ = this.playerPos.z;
    this.camTarget.x = THREE.MathUtils.damp(this.camTarget.x, targetX, 8, dt);
    this.camTarget.y = THREE.MathUtils.damp(this.camTarget.y, targetY, 8, dt);
    this.camTarget.z = THREE.MathUtils.damp(this.camTarget.z, targetZ, 8, dt);

    const horizDist = Math.cos(this.camPitch) * this.camDistance;
    const vertDist = Math.sin(this.camPitch) * this.camDistance;

    _desiredCamPos.set(
      this.camTarget.x + Math.sin(this.camYaw) * horizDist,
      this.camTarget.y + vertDist,
      this.camTarget.z + Math.cos(this.camYaw) * horizDist
    );

    // Wall Collision Check: prevent camera from clipping through solid office walls
    _rayOrigin.copy(this.camTarget);
    _rayDir.copy(_desiredCamPos).sub(_rayOrigin);
    const fullDist = _rayDir.length();
    if (fullDist > 0.01) {
      _rayDir.divideScalar(fullDist);
      this.camRaycaster.set(_rayOrigin, _rayDir);
      this.camRaycaster.near = 0.2;
      this.camRaycaster.far = fullDist;
      const hits = this.camRaycaster.intersectObjects(this.officeResult.cameraOccluders, false);
      if (hits.length > 0 && hits[0].distance < fullDist) {
        const safeDist = Math.max(1.8, hits[0].distance - 0.35);
        _desiredCamPos.copy(_rayOrigin).addScaledVector(_rayDir, safeDist);
      }
    }

    this.camera.position.copy(_desiredCamPos);
    this.camera.lookAt(this.camTarget);
    this.syncMarceloSprite(dt);
  }

  private hideProceduralMarcelo() {
    this.playerChar.rig.root.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh && mesh !== this.plumbob) mesh.visible = false;
    });
  }

  private syncMarceloSprite(dt: number) {
    this.marceloSprite.group.position.copy(this.playerPos);
    const state = this.playerChar.currentState;
    let mode: MarceloMove = 'idle';
    if (state === 'run') mode = 'run';
    else if (state === 'walk' || state === 'turning') mode = 'walk';
    else if (state === 'interacting' || state === 'talking' || state === 'coffee') mode = 'interact';

    const lookX = this.playerPos.x + Math.sin(this.playerYaw);
    const lookZ = this.playerPos.z + Math.cos(this.playerYaw);
    this.marceloSprite.present(dt, mode, this.interactTimer, this.camera, lookX, lookZ);
  }

  private checkProximity() {
    let nearest: InteractiveTarget | null = null;
    let minDist = Infinity;

    for (const target of this.interactiveTargets) {
      const dx = target.x - this.playerPos.x;
      const dz = target.z - this.playerPos.z;
      const dist = Math.hypot(dx, dz);

      if (dist < target.radius && dist < minDist) {
        minDist = dist;
        nearest = target;
      }
    }

    if (nearest !== this.currentNearTarget) {
      this.currentNearTarget = nearest;
      if (nearest) {
        this.proximityRing.position.set(nearest.x, 0.04, nearest.z);
        this.proximityRing.visible = true;
      } else {
        this.proximityRing.visible = false;
      }
      if (this.onProximityChange) {
        this.onProximityChange(nearest);
      }
    }

    if (this.proximityRing.visible && nearest) {
      this.proximityRing.position.set(nearest.x, 0.04, nearest.z);
      const s = 1.0 + Math.sin(performance.now() * 0.006) * 0.08;
      this.proximityRing.scale.set(s, s, s);
    }
  }

  private updatePlayerNameTag(width: number, height: number) {
    _projVec.set(this.playerPos.x, this.playerPos.y + 2.02, this.playerPos.z);
    _projVec.project(this.camera);

    if (_projVec.z < -1 || _projVec.z > 1) {
      this.playerNameTagEl.style.opacity = '0';
      return;
    }

    const sx = (_projVec.x * 0.5 + 0.5) * width;
    const sy = (-_projVec.y * 0.5 + 0.5) * height;
    if (sx < -120 || sx > width + 120 || sy < -60 || sy > height + 60) {
      this.playerNameTagEl.style.opacity = '0';
      return;
    }

    this.playerNameTagEl.style.opacity = '1';
    this.playerNameTagEl.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0) translate(-50%, -100%)`;
  }

  private animateEnvironmentAndNPCs(dt: number, time: number) {
    // Rotate and bob Plumbob cleanly above Marcelo's .name-tag
    if (this.plumbob) {
      this.plumbob.rotation.y = time * 2.4;
      this.plumbob.position.y = 1.98 + Math.sin(time * 3) * 0.04;
    }

    // Blinking Server LEDs
    this.serverLeds.forEach((light, i) => {
      const blink = Math.sin(time * 5.5 + i * 2.1) > 0.1;
      light.intensity = blink ? 1.45 : 0.25;
    });

    // Update NPCs via explicit FSM (idle / walking / talking) inside NPCCharacterManager
    this.npcManager.update(dt, time, this.playerPos);
    this.npcManager.syncCutouts(this.camera, dt, this.playerPos);
  }

  private projectAllNameTags() {
    const width = this.container.clientWidth || 1;
    const height = this.container.clientHeight || 1;
    this.updatePlayerNameTag(width, height);
    this.npcManager.projectNameTags(this.camera, width, height);
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync?.(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    if (!sync) {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    gl.flush();
    const poll = () => {
      if (this.destroyed) {
        gl.deleteSync(sync);
        return;
      }
      const state = gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private tick = () => {
    if (this.destroyed) return;
    const rawDt = this.clock.getDelta();
    const dt = Math.min(rawDt, 0.05);
    const elapsed = this.clock.getElapsedTime();

    this.updateMovement(dt);
    this.updateCamera(dt);
    this.checkProximity();
    this.animateEnvironmentAndNPCs(dt, elapsed);

    this.renderer.render(this.scene, this.camera);
    this.projectAllNameTags();

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  private onResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight || 1;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);

    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('pointercancel', this.handlePointerCancel);

    const dom = this.renderer.domElement;
    dom.removeEventListener('pointerdown', this.handlePointerDown);
    dom.removeEventListener('wheel', this.handleWheel);
    dom.removeEventListener('contextmenu', this.handleContextMenu);

    this.npcManager.dispose();
    this.marceloSprite.dispose();
    this.nameTagLayer.remove();

    this.officeResult.disposables.geometries.forEach((g) => g.dispose());
    this.officeResult.disposables.materials.forEach((m) => m.dispose());
    this.officeResult.disposables.textures.forEach((t) => t.dispose());
    this.mats.dispose();
    this.envTexture?.dispose();
    this.renderer.dispose();

    if (dom.parentElement) {
      dom.parentElement.removeChild(dom);
    }
  }
}
