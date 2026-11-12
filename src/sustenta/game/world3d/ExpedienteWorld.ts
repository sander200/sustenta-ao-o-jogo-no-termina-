import * as THREE from 'three';
import type { NPCData } from '../types.ts';
import type { InteractiveTarget } from '../three/OfficeScene.ts';
import {
  createSapMonitorTexture,
  createServerRackTexture,
  createWoodParquetTexture,
} from '../three/textures.ts';
import {
  createStylizedAvatar,
  type StylizedAvatarHandle,
} from '../three/StylizedAvatar.ts';

type Solid = { minX: number; maxX: number; minZ: number; maxZ: number };

const NPC_STYLES: Record<
  string,
  {
    hairStyle?: 'short' | 'long' | 'curly' | 'bun' | 'parted';
    hasGlasses?: boolean;
    hairColor?: string | number;
    shirtColor?: string | number;
  }
> = {
  npc_bruna_folha: { hairStyle: 'long', hairColor: '#451a03', shirtColor: '#8b5cf6' },
  npc_carlos_beneficios: { hairStyle: 'short', hairColor: '#172554', shirtColor: '#06b6d4' },
  npc_juliana_cadastro: { hairStyle: 'bun', hairColor: '#78350f', shirtColor: '#10b981' },
  npc_roberto_contabil: { hairStyle: 'parted', hairColor: '#334155', shirtColor: '#f59e0b', hasGlasses: true },
  npc_mariana_funcional: { hairStyle: 'long', hairColor: '#831843', shirtColor: '#ec4899' },
  npc_lucas_abap: { hairStyle: 'short', hairColor: '#0f172a', shirtColor: '#3b82f6' },
  npc_fabio_basis: { hairStyle: 'short', hairColor: '#1e1b4b', shirtColor: '#6366f1' },
  npc_gestor_marcos: { hairStyle: 'parted', hairColor: '#64748b', shirtColor: '#dc2626', hasGlasses: true },
  npc_tania_cafe: { hairStyle: 'curly', hairColor: '#92400e', shirtColor: '#f43f5e' },
};

const NPC_SPOTS: Record<string, { x: number; z: number }> = {
  npc_bruna_folha: { x: -6.2, z: -1.2 },
  npc_carlos_beneficios: { x: -2.2, z: -1.2 },
  npc_juliana_cadastro: { x: -6.2, z: -5.2 },
  npc_roberto_contabil: { x: -2.2, z: -5.2 },
  npc_mariana_funcional: { x: 9.2, z: -2.2 },
  npc_lucas_abap: { x: 12.4, z: -2.2 },
  npc_fabio_basis: { x: 13.2, z: -9.2 },
  npc_gestor_marcos: { x: -13.2, z: -8.4 },
  npc_tania_cafe: { x: 10.5, z: 10.4 },
};

export class ExpedienteWorld {
  public active = true;
  public suspended = false;
  public onProximityChange: ((target: InteractiveTarget | null) => void) | null = null;
  public onRoomChange: ((room: string) => void) | null = null;
  public onStepSound: (() => void) | null = null;

  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(55, 1, 0.1, 180);
  private player = new THREE.Group();
  private playerAvatar: StylizedAvatarHandle | null = null;
  private npcAvatars = new Map<string, StylizedAvatarHandle>();
  private isWalking = false;
  private plumbob: THREE.Mesh;
  private solids: Solid[] = [];
  private targets: InteractiveTarget[] = [];
  private npcGroups: THREE.Group[] = [];
  private keys = new Set<string>();
  private yaw = 0.15;
  private pitch = -0.28;
  private dragging = false;
  private clock = new THREE.Clock();
  private frame = 0;
  private step = 0;
  private nearId: string | null = null;
  private room = '';
  private pos = new THREE.Vector3(0, 0, 5);

  private onKeyDown = (e: KeyboardEvent) => {
    if (this.suspended || !this.active) return;
    this.keys.add(e.key.toLowerCase());
  };
  private onKeyUp = (e: KeyboardEvent) => this.keys.delete(e.key.toLowerCase());
  private onMouseDown = (e: MouseEvent) => {
    if (e.button === 0 || e.button === 2) this.dragging = true;
  };
  private onMouseUp = () => {
    this.dragging = false;
  };
  private onMouseMove = (e: MouseEvent) => {
    if (!this.dragging || this.suspended) return;
    this.yaw -= e.movementX * 0.004;
    this.pitch = THREE.MathUtils.clamp(this.pitch - e.movementY * 0.0025, -0.7, 0.2);
  };
  private onResize = () => this.resize();

  constructor(private root: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.display = 'block';
    root.appendChild(this.renderer.domElement);

    this.scene.background = new THREE.Color('#b7d4ea');
    this.scene.fog = new THREE.Fog('#b7d4ea', 22, 62);
    this.scene.add(new THREE.HemisphereLight('#e7f4ff', '#6d5844', 1.35));
    const sun = new THREE.DirectionalLight('#fff4e0', 2.2);
    sun.position.set(-14, 22, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 60;
    sun.shadow.camera.left = -24;
    sun.shadow.camera.right = 24;
    sun.shadow.camera.top = 24;
    sun.shadow.camera.bottom = -24;
    this.scene.add(sun);

    this.buildOffice();
    this.plumbob = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.16),
      new THREE.MeshStandardMaterial({ color: '#34d399', emissive: '#059669', roughness: 0.3 }),
    );
    this.plumbob.scale.set(0.55, 0.7, 0.55);
    this.plumbob.position.y = 2.7;
    this.player.add(this.plumbob);
    this.buildPlayer();
    this.placeStaticTargets();
    this.resize();

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    this.renderer.domElement.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('mousemove', this.onMouseMove);
    this.renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('resize', this.onResize);
    this.animate();
  }

  populateNPCs(npcs: NPCData[]) {
    for (const [, avatar] of this.npcAvatars) {
      this.scene.remove(avatar.group);
      avatar.destroy();
    }
    this.npcAvatars.clear();
    for (const group of this.npcGroups) this.scene.remove(group);
    this.npcGroups = [];
    this.targets = this.targets.filter((target) => target.type !== 'npc');

    for (const npc of npcs) {
      const spot = NPC_SPOTS[npc.id] ?? { x: npc.deskX, z: npc.deskZ };
      const style = NPC_STYLES[npc.id] ?? {};

      const avatar = createStylizedAvatar({
        name: npc.name.split(' ')[0],
        role: npc.role,
        hairColor: style.hairColor ?? npc.hairColor ?? 0x222222,
        shirtColor: style.shirtColor ?? npc.color ?? 0x1d4ed8,
        pantsColor: 0x1e293b,
        hairStyle: style.hairStyle ?? 'short',
        hasGlasses: style.hasGlasses ?? false,
        hasBadge: true,
        hasTicket: Boolean(npc.currentTicketId),
        isPlayer: false,
      });

      avatar.group.position.set(spot.x, 0, spot.z);
      avatar.group.rotation.y = spot.z < 0 ? 0 : Math.PI;

      this.scene.add(avatar.group);
      this.npcAvatars.set(npc.id, avatar);
      this.npcGroups.push(avatar.group);

      this.targets.push({
        id: npc.id,
        name: npc.name,
        type: 'npc',
        x: spot.x,
        z: spot.z,
        radius: 1.8,
        label: npc.role,
        npcData: npc,
      });
    }
  }

  setPlumbobMood(energy: number, stress: number) {
    const color = stress > 70 ? '#f43f5e' : energy < 30 ? '#f59e0b' : '#34d399';
    (this.plumbob.material as THREE.MeshStandardMaterial).color.set(color);
    (this.plumbob.material as THREE.MeshStandardMaterial).emissive.set(color);
  }

  teleportPlayer(x: number, z: number) {
    this.pos.set(x, 0, z);
    this.player.position.copy(this.pos);
  }

  destroy() {
    cancelAnimationFrame(this.frame);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('resize', this.onResize);
    this.playerAvatar?.destroy();
    for (const [, a] of this.npcAvatars) a.destroy();
    this.npcAvatars.clear();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private mat(color: string, roughness = 0.72) {
    return new THREE.MeshStandardMaterial({ color, roughness });
  }

  private solid(x: number, y: number, z: number, w: number, h: number, d: number, material: THREE.Material, collide = true) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    if (collide) this.solids.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 });
    return mesh;
  }

  private sign(text: string, bg: string, fg: string) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 160;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 512, 160);
    ctx.fillStyle = fg;
    ctx.font = text.length > 8 ? 'bold 40px sans-serif' : 'bold 72px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 80);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  private buildOffice() {
    const carpet = new THREE.MeshStandardMaterial({ color: '#c5c8ce', roughness: 0.92 });
    this.solid(0, -0.2, 0, 36, 0.3, 30, carpet, false);

    const wood = this.mat('#c4a574');
    wood.map = createWoodParquetTexture();
    this.solid(11, 0.02, 8.5, 12, 0.05, 8, wood, false);
    this.solid(-12, 0.02, -8, 8, 0.05, 7, this.mat('#8aa0b4'), false);
    this.solid(12, 0.02, -8.5, 8, 0.05, 7, this.mat('#4b5568'), false);

    this.solid(0, 2.2, -14.2, 36, 4.4, 0.35, this.mat('#e7eef4'));
    this.solid(-17.6, 2.2, 0, 0.35, 4.4, 30, this.mat('#e7eef4'));
    this.solid(17.6, 2.2, 0, 0.35, 4.4, 30, this.mat('#e7eef4'));
    this.solid(0, 2.2, 14.2, 36, 4.4, 0.35, this.mat('#e7eef4'));

    const glass = new THREE.MeshStandardMaterial({
      color: '#d7eefe',
      transparent: true,
      opacity: 0.28,
      roughness: 0.05,
    });
    this.solid(7.2, 1.4, -1, 0.12, 2.6, 8, glass, false);
    this.solid(-9.2, 1.4, -8, 6, 2.6, 0.12, glass, false);

    for (let i = 0; i < 4; i++) {
      const x = -6.2 + (i % 2) * 4;
      const z = i < 2 ? -2.4 : -6.4;
      this.workstation(x, z, i % 2 === 0 ? 'sap' : 'chart');
    }
    this.workstation(0, 7.4, 'code');
    this.workstation(9.2, -3.4, 'sap');
    this.workstation(12.4, -3.4, 'code');

    this.solid(12, 0.72, 5.2, 4.4, 0.14, 2, wood);
    const sap = new THREE.Mesh(
      new THREE.PlaneGeometry(2.6, 0.85),
      new THREE.MeshBasicMaterial({ map: this.sign('SAP', '#0070f2', '#ffffff') }),
    );
    sap.position.set(4.2, 2.55, -13.85);
    this.scene.add(sap);
    const centro = new THREE.Mesh(
      new THREE.PlaneGeometry(2.6, 0.38),
      new THREE.MeshBasicMaterial({ map: this.sign('CENTRO DE SOPORTE', '#f8fafc', '#0f172a') }),
    );
    centro.position.set(4.2, 1.95, -13.85);
    this.scene.add(centro);
    const reception = new THREE.Mesh(
      new THREE.CylinderGeometry(2.1, 2.1, 1.05, 28, 1, true, 0.4, Math.PI * 1.15),
      this.mat('#1d4ed8', 0.4),
    );
    reception.position.set(3.2, 0.55, -10.4);
    reception.castShadow = true;
    this.scene.add(reception);
    this.solids.push({ minX: 1.2, maxX: 5.4, minZ: -12.2, maxZ: -8.6 });

    this.solid(8.2, 0.7, 11.2, 3.2, 1.05, 0.9, this.mat('#5b4636'));
    this.solid(12.6, 0.7, 11.2, 2.4, 0.9, 0.9, this.mat('#9a3412'));
    this.solid(13.2, 1.35, -8.6, 0.9, 2.4, 0.7, new THREE.MeshStandardMaterial({ map: createServerRackTexture(), roughness: 0.45 }));
    this.solid(14.4, 1.35, -8.6, 0.9, 2.4, 0.7, new THREE.MeshStandardMaterial({ map: createServerRackTexture(), roughness: 0.45 }));
    this.solid(-14.2, 0.8, 8.2, 1.4, 1.5, 1.2, this.mat('#cbd5e1'));
    this.solid(6.2, 0.55, 10.6, 1.8, 0.8, 1, this.mat('#166534'));

    for (const [x, z] of [[-14, -4], [14, 2], [-4, 11]] as const) {
      this.solid(x, 0.35, z, 0.25, 0.7, 0.25, this.mat('#7c5a3a'), false);
      this.solid(x, 1.15, z, 0.9, 0.8, 0.9, this.mat('#3f8f4a'), false);
    }
    for (let x = -12; x <= 12; x += 6) {
      this.solid(x, 3.85, -4, 2.2, 0.06, 0.25, new THREE.MeshStandardMaterial({ color: '#f8fbff', emissive: '#dbeafe', emissiveIntensity: 0.6 }), false);
    }
  }

  private workstation(x: number, z: number, screen: 'sap' | 'code' | 'chart') {
    this.solid(x, 0.74, z, 2.2, 0.12, 1.05, this.mat('#d6d3d1'));
    const monitor = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.58, 0.06),
      new THREE.MeshStandardMaterial({ map: createSapMonitorTexture(screen), roughness: 0.35, emissive: '#0ea5e9', emissiveIntensity: 0.18 }),
    );
    monitor.position.set(x, 1.25, z - 0.35);
    monitor.castShadow = true;
    this.scene.add(monitor);
    this.solid(x, 0.48, z + 0.85, 0.55, 0.7, 0.55, this.mat('#334155'));
  }

  private buildPlayer() {
    this.playerAvatar = createStylizedAvatar({
      name: 'Marcelo',
      role: 'Key User SAP',
      hairColor: 0x241711,
      shirtColor: 0x1d4ed8, // Royal blue corporate shirt as requested
      pantsColor: 0x1e293b,
      skinTone: 0xf5d0b1,
      hairStyle: 'short',
      hasGlasses: true,
      hasBadge: true,
      isPlayer: true,
    });
    this.player.add(this.playerAvatar.group);
    this.player.position.copy(this.pos);
    this.scene.add(this.player);
  }

  private placeStaticTargets() {
    const add = (id: string, name: string, type: InteractiveTarget['type'], x: number, z: number, label: string) => {
      this.targets.push({ id, name, type, x, z, radius: 1.8, label });
    };
    add('desk', 'Estação do Key User', 'desk', 0, 6.2, 'Fila de chamados');
    add('academy', 'IA Avaliadora', 'academy', -3.2, 6.2, 'Enviar evidências da missão');
    add('coffee', 'Copa', 'coffee', 8.2, 10.2, 'Tomar café');
    add('restaurant', 'Refeitório', 'restaurant', 12.6, 10.2, 'Almoçar');
    add('restroom', 'Banheiro', 'restroom', -14.2, 7.2, 'Pausa');
    add('server', 'Servidores', 'server', 13.6, -7.4, 'Auditar jobs');
    add('meeting', 'Sala de reunião', 'meeting', 12, 4.2, 'Kanban do expediente');
    add('pool', 'Mesa de descompressão', 'pool_table', 6.2, 9.6, 'Descontrair');
    this.solid(-3.2, 0.85, 7.2, 0.7, 1.1, 0.5, new THREE.MeshStandardMaterial({ color: '#082f49', emissive: '#0284c7', emissiveIntensity: 0.35 }));
  }

  private blocked(x: number, z: number) {
    if (x < -16.4 || x > 16.4 || z < -13.2 || z > 13.2) return true;
    const r = 0.42;
    return this.solids.some((box) => x > box.minX - r && x < box.maxX + r && z > box.minZ - r && z < box.maxZ + r);
  }

  private roomAt(x: number, z: number) {
    if (x > 9 && z < -5) return 'Infra / TI';
    if (x > 7 && z < 1) return 'Consultoria SAP';
    if (x > 8 && z > 2 && z < 8) return 'Sala de Reunião';
    if (z > 8) return 'Café & Descompressão';
    if (x < -9 && z < -4) return 'Sala do Chefe';
    if (x < -10 && z > 4) return 'Banheiros / Pausa';
    return 'Sala Principal';
  }

  private move(dt: number) {
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(forward.z, 0, -forward.x);
    const dir = new THREE.Vector3();
    if (this.keys.has('w') || this.keys.has('arrowup')) dir.add(forward);
    if (this.keys.has('s') || this.keys.has('arrowdown')) dir.add(forward.clone().negate());
    if (this.keys.has('a') || this.keys.has('arrowleft')) dir.add(right.clone().negate());
    if (this.keys.has('d') || this.keys.has('arrowright')) dir.add(right);

    if (dir.lengthSq() === 0) {
      this.player.position.y = 0;
      this.isWalking = false;
      return;
    }

    this.isWalking = true;
    dir.normalize();
    const speed = this.keys.has('shift') ? 7.2 : 4.4;
    const next = this.pos.clone().addScaledVector(dir, speed * dt);
    if (!this.blocked(next.x, this.pos.z)) this.pos.x = next.x;
    if (!this.blocked(this.pos.x, next.z)) this.pos.z = next.z;
    this.player.position.set(this.pos.x, Math.sin(this.clock.elapsedTime * 10) * 0.03, this.pos.z);

    // Smoothly orient 3D player model in walking direction
    const angle = Math.atan2(dir.x, dir.z);
    if (this.playerAvatar) {
      this.playerAvatar.group.rotation.set(0, angle, 0);
    }

    this.step += dt;
    if (this.step > 0.38) {
      this.step = 0;
      this.onStepSound?.();
    }
  }

  private updateCamera() {
    const look = this.pos.clone().add(new THREE.Vector3(0, 1.15, 0));
    const offset = new THREE.Vector3(Math.sin(this.yaw) * 5.4, 2.35, Math.cos(this.yaw) * 5.4);
    this.camera.position.lerp(look.clone().add(offset), 0.14);
    this.camera.lookAt(look);
  }

  private updateProximity() {
    let nearest: InteractiveTarget | null = null;
    let best = Infinity;
    for (const target of this.targets) {
      const dx = target.x - this.pos.x;
      const dz = target.z - this.pos.z;
      const dist = Math.hypot(dx, dz);
      if (dist < target.radius && dist < best) {
        best = dist;
        nearest = target;
      }
    }
    const id = nearest?.id ?? null;
    if (id !== this.nearId) {
      this.nearId = id;
      this.onProximityChange?.(nearest);
    }
    const room = this.roomAt(this.pos.x, this.pos.z);
    if (room !== this.room) {
      this.room = room;
      this.onRoomChange?.(room);
    }
  }

  private resize() {
    const width = this.root.clientWidth || 1;
    const height = this.root.clientHeight || 1;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  private animate = () => {
    this.frame = requestAnimationFrame(this.animate);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    if (!this.active) return;
    if (!this.suspended) this.move(dt);

    const time = this.clock.elapsedTime;
    this.plumbob.rotation.y += dt * 2;
    this.plumbob.position.y = 2.7 + Math.sin(time * 3) * 0.05;

    // Update 3D avatar animations (walking legs & arms swing, idle breathing & floating bubbles)
    this.playerAvatar?.updateAnimation(time, this.isWalking, this.keys.has('shift') ? 1.35 : 1.0);
    for (const [, avatar] of this.npcAvatars) {
      avatar.updateAnimation(time, false);
    }

    this.updateCamera();
    this.updateProximity();
    this.renderer.render(this.scene, this.camera);
  };
}
