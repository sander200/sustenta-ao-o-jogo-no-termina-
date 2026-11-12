import * as THREE from 'three';
import { CollisionSystem } from '../physics/Pathfinding.ts';
import { NPCData } from '../types.ts';
import {
  createCarpetTexture,
  createCeramicTileTexture,
  createGlassDecalTexture,
  createMarceloBillboard,
  createC2CBadgeTexture,
  createSapMonitorTexture,
  createServerRackTexture,
  createSimsPlumbob,
  createWoodParquetTexture,
} from './textures.ts';
import { createDetailedHumanAvatar } from './StylizedAvatar.ts';

export interface InteractiveTarget {
  id: string;
  name: string;
  type: 'npc' | 'desk' | 'coffee' | 'restaurant' | 'restroom' | 'server' | 'meeting' | 'pool_table' | 'academy';
  x: number;
  z: number;
  radius: number;
  label: string;
  npcData?: NPCData;
}

export class OfficeScene {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private isSoftwareGl: boolean = false;
  private frameId: number = 0;
  private clock: THREE.Clock;

  // Physics & Collision
  public collisionSystem: CollisionSystem;
  private playerRadius: number = 0.38;

  // Sabastian Player (The Sims Style)
  private playerGroup: THREE.Group;
  private plumbob: THREE.Mesh;
  private nametagSprite: THREE.Sprite;
  private playerLegLeft: THREE.Mesh;
  private playerLegRight: THREE.Mesh;
  private playerArmLeft: THREE.Mesh;
  private playerArmRight: THREE.Mesh;
  private playerPos: THREE.Vector3 = new THREE.Vector3(0, 0, 1.2);
  private playerSpeed: number = 8.5;
  private isMoving: boolean = false;
  private walkTime: number = 0;

  // Navigation & Pathfinding
  private activePath: { x: number; z: number }[] = [];
  private currentPathTargetIdx: number = 0;
  private pathLine: THREE.Line | null = null;

  // Controls
  private keysHeld: { [key: string]: boolean } = {};
  private joystickVector: { x: number; y: number } = { x: 0, y: 0 };

  // Camera follow (True 2.5D Isometric)
  private camTarget: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private readonly isoOffset: THREE.Vector3 = new THREE.Vector3(26, 26, 26);

  // Entities & Props
  private npcs: Map<string, { group: THREE.Group; data: NPCData; bubble: THREE.Sprite }> = new Map();
  private interactiveTargets: InteractiveTarget[] = [];
  private currentNearTarget: InteractiveTarget | null = null;
  private proximityRing: THREE.Mesh;
  private serverLeds: THREE.PointLight[] = [];

  // Callbacks
  public onProximityChange: ((target: InteractiveTarget | null) => void) | null = null;
  public onStepSound: (() => void) | null = null;
  private stepAccumulator: number = 0;

  constructor(container: HTMLElement) {
    this.container = container;
    this.collisionSystem = new CollisionSystem();

    // Software WebGL probe
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

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0c1322);
    this.scene.fog = new THREE.Fog(0x121820, 55, 110);

    // Camera (True 2.5D Isometric Orthographic)
    const aspect = container.clientWidth / (container.clientHeight || 1);
    const d = 16;
    this.camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 0.1, 500);
    this.camera.position.copy(this.isoOffset);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);
    this.clock = new THREE.Clock();

    // Lighting
    this.setupLighting();

    // Build World with Realistic Textures and Collision Boundaries
    this.buildTheSimsOfficeWorld();

    // Build Marcelo (Key User / SAP - Protagonista C2C)
    const marcelo = this.buildMarcelo();
    this.playerGroup = marcelo.group;
    this.plumbob = marcelo.plumbob;
    this.nametagSprite = marcelo.nametag;
    this.playerLegLeft = marcelo.legLeft;
    this.playerLegRight = marcelo.legRight;
    this.playerArmLeft = marcelo.armLeft;
    this.playerArmRight = marcelo.armRight;
    this.scene.add(this.playerGroup);

    // Proximity indicator
    const ringGeo = new THREE.RingGeometry(0.75, 0.9, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    });
    this.proximityRing = new THREE.Mesh(ringGeo, ringMat);
    this.proximityRing.position.set(0, 0.03, 0);
    this.proximityRing.visible = false;
    this.scene.add(this.proximityRing);

    // Inputs & Resize
    this.setupInputs();
    window.addEventListener('resize', this.onResize);

    // Render loop
    this.tick();
  }

  private setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xf4f7fb, 1.05);
    this.scene.add(ambientLight);

    // Hemisphere light
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 0.55);
    this.scene.add(hemiLight);

    // Warm Sun Directional Light with Soft Shadows
    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.35);
    dirLight.position.set(28, 42, 24);
    if (!this.isSoftwareGl) {
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = 2048;
      dirLight.shadow.mapSize.height = 2048;
      dirLight.shadow.camera.near = 0.5;
      dirLight.shadow.camera.far = 120;
      const d = 28;
      dirLight.shadow.camera.left = -d;
      dirLight.shadow.camera.right = d;
      dirLight.shadow.camera.top = d;
      dirLight.shadow.camera.bottom = -d;
      dirLight.shadow.bias = -0.0005;
      dirLight.shadow.normalBias = 0.02;
    }
    this.scene.add(dirLight);

    // Cool fill light for architectural depth
    const coolFill = new THREE.DirectionalLight(0x60a5fa, 0.45);
    coolFill.position.set(-24, 25, -20);
    this.scene.add(coolFill);

    // Warm Downlights in Executive Office & Meeting Room
    const spotMeeting = new THREE.SpotLight(0xfef08a, 1.2, 16, Math.PI / 4, 0.4);
    spotMeeting.position.set(-13, 7, 7);
    this.scene.add(spotMeeting);

    const spotManager = new THREE.SpotLight(0xfef08a, 1.0, 16, Math.PI / 4, 0.4);
    spotManager.position.set(-13, 7, -10);
    this.scene.add(spotManager);
  }

  private buildTheSimsOfficeWorld() {
    // Procedural Textures
    const carpetTex = createCarpetTexture();
    const woodTex = createWoodParquetTexture();
    const tileTex = createCeramicTileTexture();
    const glassDecal = createGlassDecalTexture();

    // Floor Materials
    const carpetMat = new THREE.MeshStandardMaterial({
      map: carpetTex,
      roughness: 0.85,
      metalness: 0.05,
    });
    const woodMat = new THREE.MeshStandardMaterial({
      map: woodTex,
      roughness: 0.45,
      metalness: 0.1,
    });
    const tileMat = new THREE.MeshStandardMaterial({
      map: tileTex,
      roughness: 0.35,
      metalness: 0.15,
    });

    // 1. Base Flooring
    // Main Open-Space Carpet
    const groundGeo = new THREE.BoxGeometry(60, 0.2, 50);
    const ground = new THREE.Mesh(groundGeo, carpetMat);
    ground.position.set(0, -0.1, 0);
    ground.receiveShadow = !this.isSoftwareGl;
    this.scene.add(ground);

    // Cafeteria / Lounge Wood Parquet Floor
    const cafeFloorGeo = new THREE.BoxGeometry(20, 0.22, 16);
    const cafeFloor = new THREE.Mesh(cafeFloorGeo, woodMat);
    cafeFloor.position.set(11, -0.09, 8);
    cafeFloor.receiveShadow = !this.isSoftwareGl;
    this.scene.add(cafeFloor);

    // Server Room High-Tech Floor
    const serverFloorGeo = new THREE.BoxGeometry(10, 0.22, 12);
    const serverFloor = new THREE.Mesh(serverFloorGeo, tileMat);
    serverFloor.position.set(12, -0.09, -7);
    serverFloor.receiveShadow = !this.isSoftwareGl;
    this.scene.add(serverFloor);

    // Executive Office Floor
    const execFloorGeo = new THREE.BoxGeometry(12, 0.22, 14);
    const execFloor = new THREE.Mesh(execFloorGeo, woodMat);
    execFloor.position.set(-13, -0.09, -8);
    execFloor.receiveShadow = !this.isSoftwareGl;
    this.scene.add(execFloor);

    // 2. Solid & Glass Architectural Walls with Collision
    const solidWallMat = new THREE.MeshStandardMaterial({
      color: 0x3e4856,
      roughness: 0.7,
      metalness: 0.1,
    });
    const glassWallMat = new THREE.MeshPhysicalMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.45,
      roughness: 0.15,
      metalness: 0.1,
      map: glassDecal,
    });

    // Outer Perimeter Walls
    this.createSolidWall(0, -17.5, 50, 0.5, 3.0, solidWallMat, 'Parede Traseira');
    this.createSolidWall(0, 17.5, 50, 0.5, 1.2, solidWallMat, 'Parede Frontal Baixa');
    this.createSolidWall(-21.5, 0, 0.5, 35, 3.0, solidWallMat, 'Parede Esquerda');
    this.createSolidWall(21.5, 0, 0.5, 35, 3.0, solidWallMat, 'Parede Direita');

    // Internal Partitions with Doorways for Navigation
    // Partition: Manager Office & Meeting Room (left)
    // Left segment with door opening at x = -6, z from -1 to 1
    this.createSolidWall(-13, -1, 12, 0.4, 2.4, glassWallMat, 'Divisória Sala Chefe');
    this.createSolidWall(-6, -11, 0.4, 11, 2.4, glassWallMat, 'Divisória Lateral Reunião');
    // Doorway between meeting room and open-space left clear at z = -4 to -2!

    // Partition: Server Room & Consultoria (right)
    this.createSolidWall(6, -8, 0.4, 14, 2.5, solidWallMat, 'Parede Servidores');
    this.createSolidWall(14, -1, 14, 0.4, 2.4, glassWallMat, 'Divisória Consultoria');
    // Doorway into server room at x = 6, z = 0 to 1

    // Partition: Cafeteria & Lounge (bottom right)
    this.createSolidWall(3, 11, 0.4, 13, 1.4, glassWallMat, 'Divisória Copa');
    // Walkway opening at x = 3, z = 3 to 5

    // 3. Reception Counter with Curvilinear Mesh & Illuminated SAP Sign
    this.buildReceptionWithCollision();

    // 4. Detailed Corporate Workstations
    this.buildDetailedDesks();

    // 5. Server Room with Perforated Cabinets & Blinking Lights
    this.buildServerRoomWithCollision();

    // 6. Cafeteria with Coffee Bar, Espresso Machine & Pool Table
    this.buildCafeteriaWithCollision();

    // 7. Executive Office & Boardroom
    this.buildMeetingAndManagerWithCollision();

    // 8. Register Interactive Targets
    this.setupInteractiveSpots();
  }

  private createSolidWall(
    x: number,
    z: number,
    w: number,
    d: number,
    h: number,
    mat: THREE.Material,
    name?: string
  ) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const wall = new THREE.Mesh(geo, mat);
    wall.position.set(x, h / 2, z);
    wall.castShadow = !this.isSoftwareGl;
    wall.receiveShadow = !this.isSoftwareGl;
    this.scene.add(wall);

    // Register collision box in physics system
    this.collisionSystem.addBox(x - w / 2, x + w / 2, z - d / 2, z + d / 2, name);
  }

  private buildReceptionWithCollision() {
    // Curved Reception Desk (The Sims signature entrance)
    const deskGroup = new THREE.Group();
    const deskGeo = new THREE.CylinderGeometry(2.5, 2.5, 1.15, 32, 1, false, 0, Math.PI);
    const deskMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.3,
      metalness: 0.25,
    });
    const desk = new THREE.Mesh(deskGeo, deskMat);
    desk.rotation.y = -Math.PI / 2;
    desk.position.set(0, 0.58, -9);
    desk.castShadow = !this.isSoftwareGl;
    deskGroup.add(desk);

    // Reception inner desk surface
    const innerSurface = new THREE.Mesh(
      new THREE.BoxGeometry(2.8, 0.08, 1.2),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
    );
    innerSurface.position.set(0, 0.85, -9.5);
    deskGroup.add(innerSurface);

    this.scene.add(deskGroup);

    // Register Reception Desk Collision
    this.collisionSystem.addBox(-2.5, 2.5, -10.5, -8.0, 'Balcão de Recepção');

    // Illuminated SAP Billboard
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = '#0070c0';
    ctx.beginPath();
    ctx.roundRect(36, 48, 150, 150, 18);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 72px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SAP', 111, 145);
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('CENTRO DE', 210, 112);
    ctx.fillText('SOPORTE', 210, 150);

    const logoTexture = new THREE.CanvasTexture(canvas);
    logoTexture.colorSpace = THREE.SRGBColorSpace;
    const logoMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(4.2, 2.1),
      new THREE.MeshBasicMaterial({ map: logoTexture })
    );
    logoMesh.position.set(0, 2.8, -17.2);
    this.scene.add(logoMesh);

    // Glass Turnstiles with collision
    [-2.6, 2.6].forEach((tx) => {
      const turnstile = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 1.0, 1.0),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.2 })
      );
      turnstile.position.set(tx, 0.5, -5);
      turnstile.castShadow = !this.isSoftwareGl;
      this.scene.add(turnstile);

      this.collisionSystem.addBox(tx - 0.25, tx + 0.25, -5.6, -4.4, 'Catraca');
    });
  }

  private buildDetailedDesks() {
    // Marcelo's Key User Desk (Center)
    this.createTheSimsDesk(0, 2, 'Mesa do Marcelo (Key User · C2C)', '#0284c7', true, 'sap');

    // Analyst Desks with Collision
    this.createTheSimsDesk(-8, 2, 'Mesa Bruna (Folha)', '#8b5cf6', false, 'sap');
    this.createTheSimsDesk(-3, 2, 'Mesa Carlos (Benefícios)', '#06b6d4', false, 'chart');
    this.createTheSimsDesk(-8, -3, 'Mesa Juliana (Cadastro)', '#10b981', false, 'sap');
    this.createTheSimsDesk(-3, -3, 'Mesa Roberto (Contábil)', '#f59e0b', false, 'chart');

    // Consultant Desks (Right side)
    this.createTheSimsDesk(10, -4, 'Mesa Mariana (Funcional HCM)', '#ec4899', false, 'sap');
    this.createTheSimsDesk(14, -4, 'Mesa Lucas (ABAP)', '#3b82f6', false, 'code');
  }

  private createTheSimsDesk(
    x: number,
    z: number,
    name: string,
    chairColor: string,
    isKeyUser: boolean,
    screenType: 'sap' | 'code' | 'chart'
  ) {
    const group = new THREE.Group();

    // Tabletop with beveled finish
    const topGeo = new THREE.BoxGeometry(2.5, 0.1, 1.3);
    const topMat = new THREE.MeshStandardMaterial({
      color: 0xe7d3b0,
      roughness: 0.35,
      metalness: 0.1,
    });
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.set(0, 0.8, 0);
    top.castShadow = !this.isSoftwareGl;
    top.receiveShadow = !this.isSoftwareGl;
    group.add(top);

    // Sleek Metal Legs
    const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 12);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.25 });
    [[-1.15, -0.55], [1.15, -0.55], [-1.15, 0.55], [1.15, 0.55]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(lx, 0.4, lz);
      leg.castShadow = !this.isSoftwareGl;
      group.add(leg);
    });

    // Dual Monitors on Key User Desk, single monitor on others
    const monitorCount = isKeyUser ? 2 : 1;
    const screenTex = createSapMonitorTexture(screenType);
    const screenMat = new THREE.MeshBasicMaterial({ map: screenTex });

    for (let i = 0; i < monitorCount; i++) {
      const offsetX = monitorCount === 2 ? (i === 0 ? -0.45 : 0.45) : 0;

      // Monitor Stand
      const stand = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.3, 0.06), legMat);
      stand.position.set(offsetX, 0.95, -0.38);
      group.add(stand);

      // Frame
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(0.74, 0.48, 0.04),
        new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.4 })
      );
      frame.position.set(offsetX, 1.2, -0.38);
      frame.castShadow = !this.isSoftwareGl;
      group.add(frame);

      // Screen Display
      const display = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 0.42), screenMat);
      display.position.set(offsetX, 1.2, -0.35);
      group.add(display);
    }

    // Keyboard & Mousepad
    const pad = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.015, 0.35),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 })
    );
    pad.position.set(0, 0.855, 0.1);
    group.add(pad);

    const kb = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.02, 0.16),
      new THREE.MeshStandardMaterial({ color: 0x475569 })
    );
    kb.position.set(-0.06, 0.865, 0.1);
    group.add(kb);

    // Ergonomic Chair (The Sims Style)
    const chairGroup = new THREE.Group();
    const seatMat = new THREE.MeshStandardMaterial({ color: chairColor, roughness: 0.55 });
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.1, 0.65), seatMat);
    seat.position.set(0, 0.5, 0.65);
    seat.castShadow = !this.isSoftwareGl;
    chairGroup.add(seat);

    const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 0.1), seatMat);
    backrest.position.set(0, 0.85, 0.92);
    chairGroup.add(backrest);

    const chairLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8), legMat);
    chairLeg.position.set(0, 0.25, 0.65);
    chairGroup.add(chairLeg);

    group.add(chairGroup);

    group.position.set(x, 0, z);
    this.scene.add(group);

    // Register Desk and Chair Collision (prevents walking through)
    this.collisionSystem.addBox(x - 1.35, x + 1.35, z - 0.75, z + 0.95, name);
  }

  private buildServerRoomWithCollision() {
    const rackGeo = new THREE.BoxGeometry(1.3, 2.5, 0.9);
    const rackTex = createServerRackTexture();
    const rackMat = new THREE.MeshStandardMaterial({
      map: rackTex,
      roughness: 0.35,
      metalness: 0.7,
    });

    [-2.2, 0, 2.2].forEach((offset, idx) => {
      const rack = new THREE.Mesh(rackGeo, rackMat);
      rack.position.set(12 + offset, 1.25, -9);
      rack.castShadow = !this.isSoftwareGl;
      this.scene.add(rack);

      // Register rack collision
      this.collisionSystem.addBox(12 + offset - 0.7, 12 + offset + 0.7, -9.5, -8.5, 'Rack de Servidor');

      // Point Light with blinking LEDs
      const ledLight = new THREE.PointLight(idx === 1 ? 0x06b6d4 : 0x22c55e, 1.5, 3.5);
      ledLight.position.set(12 + offset, 1.6, -8.4);
      this.scene.add(ledLight);
      this.serverLeds.push(ledLight);
    });

    // Basis Desk
    this.createTheSimsDesk(12, 4, 'Mesa Fábio (Basis / Infra)', '#6366f1', false, 'code');
  }

  private buildCafeteriaWithCollision() {
    // Solid Coffee Counter
    const counterGeo = new THREE.BoxGeometry(4.8, 1.15, 1.2);
    const counterMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.4 });
    const counter = new THREE.Mesh(counterGeo, counterMat);
    counter.position.set(10, 0.58, 14);
    counter.castShadow = !this.isSoftwareGl;
    this.scene.add(counter);
    this.collisionSystem.addBox(7.5, 12.5, 13.3, 14.7, 'Balcão de Café');

    // Espresso Machine (Stainless steel)
    const machineGeo = new THREE.BoxGeometry(1.0, 0.75, 0.65);
    const machineMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.15 });
    const machine = new THREE.Mesh(machineGeo, machineMat);
    machine.position.set(10, 1.5, 14);
    this.scene.add(machine);

    // Dining Tables with Collision
    [[6, 6], [10, 6], [14, 6], [6, 10]].forEach(([rx, rz]) => {
      const tableTop = new THREE.Mesh(
        new THREE.CylinderGeometry(1.0, 1.0, 0.08, 24),
        new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.5 })
      );
      tableTop.position.set(rx, 0.8, rz);
      tableTop.castShadow = !this.isSoftwareGl;
      this.scene.add(tableTop);

      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.8, 8),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 })
      );
      pole.position.set(rx, 0.4, rz);
      this.scene.add(pole);

      this.collisionSystem.addBox(rx - 1.0, rx + 1.0, rz - 1.0, rz + 1.0, 'Mesa de Refeição');
    });

    // Billiard / Pool Table with Collision
    const poolGroup = new THREE.Group();
    const poolBody = new THREE.Mesh(
      new THREE.BoxGeometry(3.4, 0.4, 1.9),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6 })
    );
    poolBody.position.set(0, 0.7, 0);
    poolGroup.add(poolBody);

    const felt = new THREE.Mesh(
      new THREE.BoxGeometry(3.1, 0.05, 1.6),
      new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.95 })
    );
    felt.position.set(0, 0.92, 0);
    poolGroup.add(felt);

    [[-1.5, -0.75], [1.5, -0.75], [-1.5, 0.75], [1.5, 0.75]].forEach(([px, pz]) => {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 0.7, 8),
        new THREE.MeshStandardMaterial({ color: 0x451a03 })
      );
      leg.position.set(px, 0.35, pz);
      poolGroup.add(leg);
    });
    poolGroup.position.set(16, 0, 11);
    this.scene.add(poolGroup);
    this.collisionSystem.addBox(14.2, 17.8, 10.0, 12.0, 'Mesa de Sinuca');
  }

  private buildMeetingAndManagerWithCollision() {
    // Conference Table & TV Screen
    const tableGeo = new THREE.BoxGeometry(4.4, 0.1, 2.2);
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.35 });
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.position.set(-13, 0.8, 7);
    table.castShadow = !this.isSoftwareGl;
    this.scene.add(table);
    this.collisionSystem.addBox(-15.3, -10.7, 5.8, 8.2, 'Mesa de Reunião');

    const tvScreen = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 1.8, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.2 })
    );
    tvScreen.position.set(-13, 2.2, 11.8);
    this.scene.add(tvScreen);

    // Manager Desk in Private Office
    this.createTheSimsDesk(-13, -10, 'Mesa Dr. Marcos (Gestor)', '#dc2626', false, 'chart');

    // Decorative Planters with Collision
    [[-18, 12], [2, 12], [18, -14], [-18, -14], [-6, 6]].forEach(([px, pz]) => {
      const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.3, 0.65, 14),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
      );
      pot.position.set(px, 0.32, pz);
      this.scene.add(pot);

      const plantLeaves = new THREE.Mesh(
        new THREE.SphereGeometry(0.6, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.85 })
      );
      plantLeaves.position.set(px, 0.85, pz);
      plantLeaves.scale.set(1, 1.4, 1);
      plantLeaves.castShadow = !this.isSoftwareGl;
      this.scene.add(plantLeaves);

      this.collisionSystem.addBox(px - 0.45, px + 0.45, pz - 0.45, pz + 0.45, 'Vaso de Planta');
    });
  }

  private setupInteractiveSpots() {
    this.interactiveTargets.push({
      id: 'desk_keyuser',
      name: 'Mesa do Marcelo (C2C)',
      type: 'desk',
      x: 0,
      z: 2.6,
      radius: 1.8,
      label: 'Terminal SAP / Chamados (Marcelo · C2C)',
    });

    this.interactiveTargets.push({
      id: 'coffee_machine',
      name: 'Cafeteira Expresso',
      type: 'coffee',
      x: 10,
      z: 12.8,
      radius: 1.8,
      label: 'Tomar Café (+10 Energia)',
    });

    this.interactiveTargets.push({
      id: 'restaurant_lunch',
      name: 'Refeitório / Almoço',
      type: 'restaurant',
      x: 10,
      z: 6,
      radius: 2.2,
      label: 'Almoçar (+30 Energia)',
    });

    this.interactiveTargets.push({
      id: 'restroom_pause',
      name: 'Banheiros / Pausa',
      type: 'restroom',
      x: 18,
      z: -14,
      radius: 2.0,
      label: 'Pausa Rápida (-15 Estresse)',
    });

    this.interactiveTargets.push({
      id: 'server_racks',
      name: 'Racks de Servidores',
      type: 'server',
      x: 12,
      z: -7.5,
      radius: 2.2,
      label: 'Status dos Servidores (SM37/ST22)',
    });

    this.interactiveTargets.push({
      id: 'meeting_screen',
      name: 'Sala de Reunião',
      type: 'meeting',
      x: -13,
      z: 7,
      radius: 2.4,
      label: 'Painel de Inovação & Projetos',
    });

    this.interactiveTargets.push({
      id: 'pool_table',
      name: 'Mesa de Sinuca',
      type: 'pool_table',
      x: 16,
      z: 11,
      radius: 2.2,
      label: 'Jogar Sinuca (-10 Estresse)',
    });
  }

  /**
   * Build Marcelo (Player) with C2C Lanyard Badge, The Sims Plumbob & Floating Nametag
   */
  private buildMarcelo(): {
    group: THREE.Group;
    plumbob: THREE.Mesh;
    nametag: THREE.Sprite;
    legLeft: THREE.Mesh;
    legRight: THREE.Mesh;
    armLeft: THREE.Mesh;
    armRight: THREE.Mesh;
  } {
    const group = new THREE.Group();

    // Contact shadow
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.38, 20),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45 })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    group.add(shadow);

    // Legs with Slacks & Polished Shoes
    const legGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.48, 10);
    const slacksMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
    const legLeft = new THREE.Mesh(legGeo, slacksMat);
    legLeft.position.set(-0.12, 0.26, 0);
    group.add(legLeft);

    const legRight = new THREE.Mesh(legGeo, slacksMat);
    legRight.position.set(0.12, 0.26, 0);
    group.add(legRight);

    // Shoes
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });
    const shoeGeo = new THREE.BoxGeometry(0.14, 0.08, 0.22);
    const shoeL = new THREE.Mesh(shoeGeo, shoeMat);
    shoeL.position.set(-0.12, 0.04, 0.04);
    group.add(shoeL);
    const shoeR = new THREE.Mesh(shoeGeo, shoeMat);
    shoeR.position.set(0.12, 0.04, 0.04);
    group.add(shoeR);

    // Torso (Corporate Royal Blue Button-down shirt with collar)
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0x5b6573, roughness: 0.55 });
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.62, 0.32), shirtMat);
    torso.position.y = 0.78;
    torso.castShadow = !this.isSoftwareGl;
    group.add(torso);

    // C2C Corporate Lanyard & Photo ID Badge
    const c2cBadgeTex = createC2CBadgeTexture();
    const c2cBadgeMat = new THREE.MeshStandardMaterial({
      map: c2cBadgeTex,
      roughness: 0.2,
      metalness: 0.1,
    });
    const badge = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.2, 0.02), c2cBadgeMat);
    badge.position.set(0.1, 0.74, 0.18);
    group.add(badge);

    // Orange C2C Lanyard ribbon
    const lanyardMat = new THREE.MeshBasicMaterial({ color: 0xea580c });
    const ribbonL = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.3, 6), lanyardMat);
    ribbonL.position.set(0.06, 0.92, 0.15);
    ribbonL.rotation.z = 0.3;
    group.add(ribbonL);

    const ribbonR = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.3, 6), lanyardMat);
    ribbonR.position.set(0.14, 0.92, 0.15);
    ribbonR.rotation.z = -0.3;
    group.add(ribbonR);

    // Arms & Watch (Marcelo's corporate watch)
    const armGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.48, 8);
    const armLeft = new THREE.Mesh(armGeo, shirtMat);
    armLeft.position.set(-0.34, 0.72, 0);
    group.add(armLeft);

    // Silver wristwatch on left arm
    const watchMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
    const watch = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.04, 12), watchMat);
    watch.position.set(-0.34, 0.54, 0);
    group.add(watch);

    const armRight = new THREE.Mesh(armGeo, shirtMat);
    armRight.position.set(0.34, 0.72, 0);
    group.add(armRight);

    // Head (Marcelo's charismatic face)
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xe0b48a, roughness: 0.45 });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 16), skinMat);
    head.position.y = 1.34;
    head.castShadow = !this.isSoftwareGl;
    group.add(head);

    // Modern styled haircut
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x291d17, roughness: 0.8 });
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 14), hairMat);
    hair.position.set(0, 1.4, -0.04);
    hair.scale.set(1.02, 0.58, 1.05);
    group.add(hair);

    // Stylish Glasses (Intellectual Key User Look)
    const glassesMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const glassRimL = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 8, 16), glassesMat);
    glassRimL.position.set(-0.09, 1.35, 0.23);
    group.add(glassRimL);

    const glassRimR = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 8, 16), glassesMat);
    glassRimR.position.set(0.09, 1.35, 0.23);
    group.add(glassRimR);

    const glassBridge = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.012, 0.01), glassesMat);
    glassBridge.position.set(0, 1.35, 0.24);
    group.add(glassBridge);

    // The Sims Plumbob (Rotating Green Diamond)
    const plumbob = createSimsPlumbob();
    plumbob.position.set(0, 2.3, 0);
    group.add(plumbob);

    const nametag = createMarceloBillboard('SABASTIAN');
    nametag.position.set(0, 1.85, 0);
    group.add(nametag);

    plumbob.visible = false;

    group.position.copy(this.playerPos);
    this.camTarget.copy(this.playerPos);

    return { group, plumbob, nametag, legLeft, legRight, armLeft, armRight };
  }

  private buildSabastian() {
    return this.buildMarcelo();
  }

  public populateNPCs(npcList: NPCData[]) {
    this.npcs.forEach((npcObj) => {
      this.scene.remove(npcObj.group);
    });
    this.npcs.clear();
    this.interactiveTargets = this.interactiveTargets.filter((t) => t.type !== 'npc');

    npcList.forEach((npc) => {
      const isFemale = ['npc_bruna_folha', 'npc_juliana_cadastro', 'npc_mariana_funcional', 'npc_tania_cafe'].includes(npc.id);
      const group = createDetailedHumanAvatar(
        npc.name.split(' ')[0],
        npc.role,
        isFemale,
        npc.hairColor,
        npc.color,
        Boolean(npc.currentTicketId)
      );

      const bubble = (group.userData.bubble as THREE.Sprite) || this.createNPCSpeechBubble(Boolean(npc.currentTicketId));

      group.position.set(npc.deskX, 0, npc.deskZ + 0.8);
      group.rotation.y = npc.deskZ < 0 ? 0 : Math.PI;
      this.scene.add(group);

      this.npcs.set(npc.id, { group, data: npc, bubble });

      this.interactiveTargets.push({
        id: npc.id,
        name: npc.name,
        type: 'npc',
        x: npc.deskX,
        z: npc.deskZ + 0.8,
        radius: 1.8,
        label: `Falar com ${npc.name} (${npc.role})`,
        npcData: npc,
      });
    });
  }

  private createNPCSpeechBubble(hasTicket: boolean): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    if (hasTicket) {
      ctx.fillStyle = '#f5c518';
      ctx.beginPath();
      ctx.moveTo(64, 14);
      ctx.lineTo(108, 58);
      ctx.lineTo(64, 102);
      ctx.lineTo(20, 58);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 48px "Chakra Petch", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('!', 64, 62);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(14, 28, 100, 52, 18);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(46, 78);
      ctx.lineTo(58, 104);
      ctx.lineTo(72, 78);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(46, 54, 8, 0, Math.PI * 2);
      ctx.arc(70, 54, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(0.75, 0.75, 1);
    return sprite;
  }

  private setupInputs() {
    window.addEventListener('keydown', (e) => {
      if (!this.active) return;
      this.keysHeld[e.code] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keysHeld[e.code] = false;
    });

    window.addEventListener('blur', () => {
      this.keysHeld = {};
    });

    // Click/Touch with A* Pathfinding (Smart Navigation around walls)
    this.renderer.domElement.addEventListener('pointerdown', (e) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersectPoint = new THREE.Vector3();

      if (raycaster.ray.intersectPlane(groundPlane, intersectPoint)) {
        // Calculate path using A* that navigates around walls and furniture!
        const path = this.collisionSystem.findPath(
          this.playerPos.x,
          this.playerPos.z,
          intersectPoint.x,
          intersectPoint.z
        );

        if (path && path.length > 0) {
          this.activePath = path;
          this.currentPathTargetIdx = 0;
          this.drawPathLine(path);
        }
      }
    });
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
      linewidth: 2,
    });
    this.pathLine = new THREE.Line(geo, mat);
    this.pathLine.computeLineDistances();
    this.scene.add(this.pathLine);
  }

  public setPlumbobMood(energy: number, stress: number) {
    if (!this.plumbob) return;
    const mat = this.plumbob.material as THREE.MeshStandardMaterial;
    if (stress > 70 || energy < 25) {
      // Red Plumbob
      mat.color.setHex(0xef4444);
      mat.emissive.setHex(0xb91c1c);
    } else if (energy < 55) {
      // Yellow Plumbob
      mat.color.setHex(0xf59e0b);
      mat.emissive.setHex(0xb45309);
    } else {
      // Vibrant Green Sims Plumbob
      mat.color.setHex(0x22c55e);
      mat.emissive.setHex(0x15803d);
    }
  }

  public teleportPlayer(x: number, z: number) {
    this.playerPos.set(x, 0, z);
    this.playerGroup.position.copy(this.playerPos);
    this.camTarget.copy(this.playerPos);
    this.activePath = [];
    if (this.pathLine) {
      this.scene.remove(this.pathLine);
      this.pathLine = null;
    }
  }

  public getNearTarget(): InteractiveTarget | null {
    return this.currentNearTarget;
  }

  private updateMovement(dt: number) {
    let dx = 0;
    let dz = 0;

    // 1. Keyboard Controls (WASD / Setas) with Wall Sliding Collision
    if (this.keysHeld['KeyW'] || this.keysHeld['ArrowUp']) {
      dx -= 1;
      dz -= 1;
    }
    if (this.keysHeld['KeyS'] || this.keysHeld['ArrowDown']) {
      dx += 1;
      dz += 1;
    }
    if (this.keysHeld['KeyA'] || this.keysHeld['ArrowLeft']) {
      dx -= 1;
      dz += 1;
    }
    if (this.keysHeld['KeyD'] || this.keysHeld['ArrowRight']) {
      dx += 1;
      dz += 1;
    }

    const hasKeyboardInput = Math.abs(dx) > 0.1 || Math.abs(dz) > 0.1;
    if (hasKeyboardInput) {
      // Clear pathfinding if manual keyboard is used
      this.activePath = [];
      if (this.pathLine) {
        this.scene.remove(this.pathLine);
        this.pathLine = null;
      }
    }

    // 2. A* Pathfinding Following (When ground clicked)
    if (!hasKeyboardInput && this.activePath.length > 0 && this.currentPathTargetIdx < this.activePath.length) {
      const targetPoint = this.activePath[this.currentPathTargetIdx];
      const diffX = targetPoint.x - this.playerPos.x;
      const diffZ = targetPoint.z - this.playerPos.z;
      const dist = Math.sqrt(diffX * diffX + diffZ * diffZ);

      if (dist > 0.25) {
        dx = diffX / dist;
        dz = diffZ / dist;
      } else {
        this.currentPathTargetIdx++;
        if (this.currentPathTargetIdx >= this.activePath.length) {
          this.activePath = [];
          if (this.pathLine) {
            this.scene.remove(this.pathLine);
            this.pathLine = null;
          }
        }
      }
    }

    const length = Math.sqrt(dx * dx + dz * dz);
    if (length > 0.05) {
      this.isMoving = true;
      dx /= length;
      dz /= length;

      const nextX = this.playerPos.x + dx * this.playerSpeed * dt;
      const nextZ = this.playerPos.z + dz * this.playerSpeed * dt;

      // PHYSICS & COLLISION RESOLUTION: Sabastian NEVER walks through walls or furniture!
      const resolved = this.collisionSystem.resolveMovement(
        this.playerPos.x,
        this.playerPos.z,
        nextX,
        nextZ,
        this.playerRadius
      );

      this.playerPos.x = resolved.x;
      this.playerPos.z = resolved.z;

      // Turn Sabastian towards movement direction
      this.playerGroup.rotation.y = Math.atan2(dx, dz);

      // Walk cycle animation (Legs and arms swing)
      this.walkTime += dt * 14;
      const swing = Math.sin(this.walkTime);
      this.playerLegLeft.rotation.x = swing * 0.6;
      this.playerLegRight.rotation.x = -swing * 0.6;
      this.playerArmLeft.rotation.x = -swing * 0.5;
      this.playerArmRight.rotation.x = swing * 0.5;

      // Footstep sound trigger
      this.stepAccumulator += dt;
      if (this.stepAccumulator > 0.32) {
        this.stepAccumulator = 0;
        if (this.onStepSound) this.onStepSound();
      }
    } else {
      this.isMoving = false;
      this.playerLegLeft.rotation.x = 0;
      this.playerLegRight.rotation.x = 0;
      this.playerArmLeft.rotation.x = 0;
      this.playerArmRight.rotation.x = 0;
    }

    this.playerGroup.position.copy(this.playerPos);

    // Smooth Camera Follow
    this.camTarget.lerp(this.playerPos, Math.min(dt * 5.0, 1.0));
    this.camera.position.set(
      this.camTarget.x + this.isoOffset.x,
      this.camTarget.y + this.isoOffset.y,
      this.camTarget.z + this.isoOffset.z
    );
    this.camera.lookAt(this.camTarget);
  }

  private checkProximity() {
    let nearest: InteractiveTarget | null = null;
    let minDist = Infinity;

    for (const target of this.interactiveTargets) {
      const dx = target.x - this.playerPos.x;
      const dz = target.z - this.playerPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < target.radius && dist < minDist) {
        minDist = dist;
        nearest = target;
      }
    }

    if (nearest !== this.currentNearTarget) {
      this.currentNearTarget = nearest;
      if (nearest) {
        this.proximityRing.position.set(nearest.x, 0.03, nearest.z);
        this.proximityRing.visible = true;
      } else {
        this.proximityRing.visible = false;
      }
      if (this.onProximityChange) {
        this.onProximityChange(nearest);
      }
    }

    if (this.proximityRing.visible) {
      const s = 1.0 + Math.sin(Date.now() * 0.006) * 0.08;
      this.proximityRing.scale.set(s, s, s);
    }
  }

  private animateEnvironment(time: number) {
    // Rotate and bob The Sims Plumbob above Sabastian's head
    if (this.plumbob) {
      this.plumbob.rotation.y = time * 2.5;
      this.plumbob.position.y = 2.3 + Math.sin(time * 3) * 0.08;
    }

    // Blinking Server LEDs
    this.serverLeds.forEach((light, i) => {
      const blink = Math.sin(time * 6 + i * 2.3) > 0.1;
      light.intensity = blink ? 1.5 : 0.25;
    });

    // NPC Floating Bubbles
    this.npcs.forEach((npcObj) => {
      npcObj.bubble.position.y = 2.8 + Math.sin(time * 3 + npcObj.data.deskX) * 0.06;
    });
  }

  public active = true;

  private tick = () => {
    this.frameId = requestAnimationFrame(this.tick);
    const rawDt = this.clock.getDelta();
    if (!this.active) return;
    const dt = Math.min(rawDt, 0.05);

    this.updateMovement(dt);
    this.checkProximity();
    this.animateEnvironment(this.clock.getElapsedTime());

    this.renderer.render(this.scene, this.camera);
  };

  private onResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const aspect = width / (height || 1);
    const d = 11.5;

    this.camera.left = -d * aspect;
    this.camera.right = d * aspect;
    this.camera.top = d;
    this.camera.bottom = -d;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  };

  public destroy() {
    cancelAnimationFrame(this.frameId);
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
