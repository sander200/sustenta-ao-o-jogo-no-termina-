import * as THREE from 'three';
import { MissionSystem } from './MissionSystem.ts';

export type DialogAction = { id: string; label: string };
export type DialogState = { title: string; body: string; actions: DialogAction[] } | null;
export type HudState = {
  clock: string;
  energy: number;
  stress: number;
  reputation: number;
  xp: number;
  missionDone: number;
  missionTotal: number;
  approved: boolean;
};

type Solid = { minX: number; maxX: number; minZ: number; maxZ: number };
type Interactable = { object: THREE.Object3D; name: string; open: () => void };

export class OfficeWorld {
  readonly mission = new MissionSystem();
  onDialog: (dialog: DialogState) => void = () => {};
  onHud: (hud: HudState) => void = () => {};
  onPrompt: (label: string | null) => void = () => {};

  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(60, 1, 0.1, 200);
  private renderer: THREE.WebGLRenderer;
  private player = new THREE.Group();
  private keys = new Set<string>();
  private solids: Solid[] = [];
  private interactables: Interactable[] = [];
  private clock = new THREE.Clock();
  private yaw = 0;
  private pitch = -0.2;
  private energy = 85;
  private stress = 20;
  private reputation = 60;
  private xp = 45;
  private minutes = 8 * 60 + 14;
  private frame = 0;
  private lastHud = '';
  private lastPrompt: string | null = null;
  private dragging = false;
  private onKeyDown: (e: KeyboardEvent) => void;
  private onKeyUp: (e: KeyboardEvent) => void;
  private onMouseDown: (e: MouseEvent) => void;
  private onMouseUp: () => void;
  private onMouseMove: (e: MouseEvent) => void;
  private onResize: () => void;

  constructor(private root: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.display = 'block';
    root.appendChild(this.renderer.domElement);

    this.scene.background = new THREE.Color('#8fb4cc');
    this.scene.fog = new THREE.Fog('#8fb4cc', 28, 70);
    this.scene.add(new THREE.HemisphereLight(0xd9efff, 0x52606c, 1.6));
    const sun = new THREE.DirectionalLight(0xffffff, 2.1);
    sun.position.set(-10, 18, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    this.scene.add(sun);

    this.buildOffice();
    this.buildPlayer();
    this.resize();

    this.onKeyDown = (e) => {
      this.keys.add(e.key.toLowerCase());
      if (e.key.toLowerCase() === 'e') this.tryInteract();
      if (e.key === 'Escape') this.onDialog(null);
    };
    this.onKeyUp = (e) => this.keys.delete(e.key.toLowerCase());
    this.onMouseDown = (e) => {
      if (e.button === 0 || e.button === 2) this.dragging = true;
    };
    this.onMouseUp = () => {
      this.dragging = false;
    };
    this.onMouseMove = (e) => {
      const locked = document.pointerLockElement === this.renderer.domElement;
      if (!locked && !this.dragging) return;
      this.yaw -= e.movementX * 0.003;
      this.pitch = THREE.MathUtils.clamp(this.pitch - e.movementY * 0.002, -0.6, 0.25);
    };
    this.onResize = () => this.resize();

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    this.renderer.domElement.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('mousemove', this.onMouseMove);
    this.renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
    this.renderer.domElement.addEventListener('click', () => {
      this.renderer.domElement.requestPointerLock?.();
    });
    window.addEventListener('resize', this.onResize);
    this.animate();
    this.pushHud(true);
  }

  applyEvaluation(approvedIds: string[]) {
    const wasApproved = this.mission.isApproved();
    for (const criterion of this.mission.criteria) {
      criterion.completed = approvedIds.includes(criterion.id);
    }
    if (this.mission.isApproved() && !wasApproved) {
      this.reputation = Math.min(100, this.reputation + 4);
    }
    this.pushHud(true);
  }
  choose(actionId: string) {
    if (actionId === 'coffee') {
      this.energy = Math.min(100, this.energy + 12);
      this.stress = Math.max(0, this.stress - 8);
    }
    if (actionId === 'reward' && this.mission.isApproved()) {
      this.xp = Math.min(100, this.xp + 15);
    }
    this.onDialog(null);
    this.pushHud(true);
  }

  destroy() {
    cancelAnimationFrame(this.frame);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private mat(color: string) {
    return new THREE.MeshStandardMaterial({ color, roughness: 0.75 });
  }

  private solid(x: number, y: number, z: number, w: number, h: number, d: number, color: string, collide = true) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), this.mat(color));
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    if (collide) {
      this.solids.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 });
    }
    return mesh;
  }

  private buildOffice() {
    this.solid(0, -0.15, 0, 34, 0.3, 26, '#b7c3cc', false);
    this.solid(-6, 0.02, -2, 16, 0.04, 14, '#9aa7b2', false);
    this.solid(11, 0.02, 6, 10, 0.04, 8, '#8d6b4a', false);
    this.solid(12, 0.02, -8, 8, 0.04, 6, '#5c6b78', false);

    this.solid(0, 2, -12.6, 34, 4, 0.3, '#d5e2ea');
    this.solid(-16.8, 2, 0, 0.3, 4, 26, '#d5e2ea');
    this.solid(16.8, 2, 0, 0.3, 4, 26, '#d5e2ea');
    this.solid(0, 2, 12.6, 34, 4, 0.3, '#d5e2ea');

    for (let col = 0; col < 3; col++) {
      const x = -9 + col * 4.5;
      this.solid(x, 0.75, -4, 2.4, 0.16, 1.2, '#c4a574');
      this.solid(x, 1.35, -4.45, 0.9, 0.55, 0.08, '#168bd0', false);
      this.solid(x, 0.5, -2.7, 0.7, 0.7, 0.7, '#31536d');
    }

    this.solid(11.5, 0.7, 6, 4.2, 0.16, 2.2, '#75543b');
    this.solid(-12.2, 0.7, 8.2, 3.4, 1.1, 1.1, '#57483d');
    for (let i = 0; i < 3; i++) {
      this.solid(11 + i * 1.15, 1.2, -8.2, 0.8, 2.3, 0.7, '#1c2d40');
    }

    const bruna = this.person('#244d72', '#e1a16d');
    bruna.position.set(-4.2, 0, -1.2);
    this.scene.add(bruna);
    this.interactables.push({ object: bruna, name: 'Bruna · Folha', open: () => this.openAnalyst() });

    const gestor = this.person('#243344', '#d3a17e');
    gestor.position.set(10.2, 0, 3.2);
    this.scene.add(gestor);
    this.interactables.push({ object: gestor, name: 'Gestor', open: () => this.openManager() });

    const desk = this.solid(0, 0.75, 8.2, 2.8, 0.16, 1.3, '#634a37');
    this.interactables.push({ object: desk, name: 'Estação do Key User', open: () => this.openDesk() });

    const coffee = this.solid(-12.2, 1.45, 8.2, 0.55, 0.4, 0.45, '#202a35');
    this.interactables.push({ object: coffee, name: 'Café', open: () => this.openCoffee() });
  }

  private person(shirt: string, skin: string) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.7, 4, 8), this.mat(shirt));
    body.position.y = 0.95;
    body.castShadow = true;
    group.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 12), this.mat(skin));
    head.position.y = 1.6;
    head.castShadow = true;
    group.add(head);
    return group;
  }

  private buildPlayer() {
    const shirt = this.mat('#6b7280');
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.85, 0.42), shirt);
    torso.position.y = 1.05;
    torso.castShadow = true;
    this.player.add(torso);
    const skin = this.mat('#c68642');
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), skin);
    head.position.y = 1.72;
    head.castShadow = true;
    this.player.add(head);
    const hair = this.mat('#1f2937');
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.29, 16, 12), hair);
    cap.position.set(0, 1.82, -0.02);
    cap.scale.set(1, 0.55, 1);
    this.player.add(cap);
    const beard = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.1, 0.08), hair);
    beard.position.set(0, 1.58, 0.24);
    this.player.add(beard);
    const legs = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 0.32), this.mat('#1e293b'));
    legs.position.y = 0.32;
    this.player.add(legs);
    this.player.position.set(0, 0, 3);
    this.scene.add(this.player);
  }

  private blocked(x: number, z: number) {
    if (x < -15.6 || x > 15.6 || z < -11.6 || z > 11.6) return true;
    const r = 0.42;
    return this.solids.some((b) => x > b.minX - r && x < b.maxX + r && z > b.minZ - r && z < b.maxZ + r);
  }

  private move(dt: number) {
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(forward.z, 0, -forward.x);
    const dir = new THREE.Vector3();
    if (this.keys.has('w') || this.keys.has('arrowup')) dir.add(forward);
    if (this.keys.has('s') || this.keys.has('arrowdown')) dir.add(forward.clone().negate());
    if (this.keys.has('a') || this.keys.has('arrowleft')) dir.add(right.clone().negate());
    if (this.keys.has('d') || this.keys.has('arrowright')) dir.add(right);
    if (dir.lengthSq() === 0) return;
    dir.normalize();
    const speed = this.keys.has('shift') ? 6.4 : 3.8;
    const next = this.player.position.clone().addScaledVector(dir, speed * dt);
    if (!this.blocked(next.x, this.player.position.z)) this.player.position.x = next.x;
    if (!this.blocked(this.player.position.x, next.z)) this.player.position.z = next.z;
    this.player.rotation.y = Math.atan2(dir.x, dir.z);
    this.energy = Math.max(8, this.energy - dt * 0.15);
  }

  private updateCamera() {
    const offset = new THREE.Vector3(Math.sin(this.yaw) * 6.2, 2.6 + this.pitch * 2, Math.cos(this.yaw) * 6.2);
    const look = this.player.position.clone().add(new THREE.Vector3(0, 1.3, 0));
    this.camera.position.lerp(look.clone().add(offset), 0.12);
    this.camera.lookAt(look);
  }

  private nearest() {
    let best: Interactable | undefined;
    let min = 2.6;
    for (const item of this.interactables) {
      const d = item.object.position.distanceTo(this.player.position);
      if (d < min) {
        min = d;
        best = item;
      }
    }
    return best;
  }

  private tryInteract() {
    this.nearest()?.open();
  }

  private openAnalyst() {
    this.onDialog({
      title: 'Bruna · Analista de Folha',
      body: 'A rubrica 1025 não entrou na folha deste período. A IA Avaliadora na sua estação só aceita impacto, período, passos, log, especialista, QAS e documentação. Um clique em concluir não fecha a missão.',
      actions: [{ id: 'close', label: 'Vou reunir as evidências' }],
    });
  }

  private openManager() {
    this.onDialog({
      title: 'Gestor da Sustentação',
      body: 'Não vá para produção sem responsável, teste em QAS e documentação. O critério não se completa só porque o chamado foi clicado.',
      actions: [{ id: 'close', label: 'Entendido' }],
    });
  }

  private openDesk() {
    this.onDialog({
      title: 'Estação · IA Avaliadora',
      body: this.mission.isApproved()
        ? 'A avaliação do servidor já aprovou os cinco critérios. Você pode registrar a evolução.'
        : 'Envie as evidências. O servidor avalia cada critério. Texto livre, print sem log ou teste em produção não aprovam.',
      actions: this.mission.isApproved()
        ? [
            { id: 'reward', label: 'Registrar evolução (+SAP XP)' },
            { id: 'close', label: 'Fechar' },
          ]
        : [
            { id: 'open-evaluator', label: 'Abrir IA Avaliadora' },
            { id: 'close', label: 'Fechar' },
          ],
    });
  }

  private openCoffee() {
    this.onDialog({
      title: 'Café',
      body: 'Uma pausa curta recupera energia e baixa o estresse. O expediente continua.',
      actions: [
        { id: 'coffee', label: 'Tomar café' },
        { id: 'close', label: 'Agora não' },
      ],
    });
  }

  private pushHud(force = false) {
    const p = this.mission.progress();
    const hh = String(Math.floor(this.minutes / 60) % 24).padStart(2, '0');
    const mm = String(Math.floor(this.minutes % 60)).padStart(2, '0');
    const hud: HudState = {
      clock: `${hh}:${mm}`,
      energy: Math.round(this.energy),
      stress: Math.round(this.stress),
      reputation: Math.round(this.reputation),
      xp: Math.round(this.xp),
      missionDone: p.done,
      missionTotal: p.total,
      approved: this.mission.isApproved(),
    };
    const key = JSON.stringify(hud);
    if (!force && key === this.lastHud) return;
    this.lastHud = key;
    this.onHud(hud);
  }

  private resize() {
    const w = this.root.clientWidth || 1;
    const h = this.root.clientHeight || 1;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  private animate = () => {
    this.frame = requestAnimationFrame(this.animate);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.move(dt);
    this.updateCamera();
    this.minutes += dt * 0.8;
    const near = this.nearest();
    const label = near ? `${near.name} · E` : null;
    if (label !== this.lastPrompt) {
      this.lastPrompt = label;
      this.onPrompt(label);
    }
    this.pushHud();
    this.renderer.render(this.scene, this.camera);
  };
}
