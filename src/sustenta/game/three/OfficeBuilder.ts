import * as THREE from 'three';
import { CollisionSystem } from '../physics/Pathfinding.ts';
import { OfficeMaterialLibrary } from './materials.ts';
import {
  createCafeTileTexture,
  createCarpetBumpTexture,
  createCarpetTexture,
  createCeramicTileTexture,
  createCitySkylineTexture,
  createKeyboardTexture,
  createMotivationalPosterTexture,
  createSapCentroSuporteTexture,
  createSapMonitorTexture,
  createServerRackTexture,
  createWallPlasterTexture,
  createWoodParquetTexture,
  createWoodSlatWallTexture,
} from './textures.ts';

export interface OfficeBuildResult {
  serverLeds: THREE.PointLight[];
  cameraOccluders: THREE.Object3D[];
  disposables: { geometries: THREE.BufferGeometry[]; materials: THREE.Material[]; textures: THREE.Texture[] };
}

export function buildCorporateOffice(
  scene: THREE.Scene,
  collisionSystem: CollisionSystem,
  mats: OfficeMaterialLibrary,
  isSoftwareGl: boolean
): OfficeBuildResult {
  const serverLeds: THREE.PointLight[] = [];
  const cameraOccluders: THREE.Object3D[] = [];
  const geometries: THREE.BufferGeometry[] = [];
  const extraMaterials: THREE.Material[] = [];
  const textures: THREE.Texture[] = [];

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    extraMaterials.push(m);
    return m;
  };
  const trackTex = <T extends THREE.Texture>(t: T): T => {
    textures.push(t);
    return t;
  };

  // --- 1. PROCEDURAL PBR FLOOR & WALL TEXTURES ---
  const carpetTex = trackTex(createCarpetTexture());
  const carpetBump = trackTex(createCarpetBumpTexture());
  const oakWoodTex = trackTex(createWoodParquetTexture('oak'));
  const walnutWoodTex = trackTex(createWoodParquetTexture('walnut'));
  const serverTileTex = trackTex(createCeramicTileTexture());
  const cafeTileTex = trackTex(createCafeTileTexture());
  const plasterTex = trackTex(createWallPlasterTexture());
  const woodSlatTex = trackTex(createWoodSlatWallTexture());
  const keyboardTex = trackTex(createKeyboardTexture());

  const carpetMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: carpetTex,
      bumpMap: carpetBump,
      bumpScale: 0.015,
      roughness: 0.88,
      metalness: 0.02,
    })
  );
  const oakFloorMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: oakWoodTex,
      roughness: 0.44,
      metalness: 0.06,
    })
  );
  const walnutFloorMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: walnutWoodTex,
      roughness: 0.38,
      metalness: 0.08,
    })
  );
  const serverFloorMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: serverTileTex,
      roughness: 0.34,
      metalness: 0.2,
    })
  );
  const cafeFloorMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: cafeTileTex,
      roughness: 0.38,
      metalness: 0.05,
    })
  );
  const plasterWallMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: plasterTex,
      roughness: 0.72,
      metalness: 0.03,
    })
  );
  const darkWallMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x1e2532,
      roughness: 0.65,
      metalness: 0.12,
    })
  );
  const woodSlatMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: woodSlatTex,
      roughness: 0.52,
      metalness: 0.05,
    })
  );

  const cast = !isSoftwareGl;

  // --- 2. MULTI-ZONE ARCHITECTURAL FLOORING (Y-offset >= 0.02 to prevent Z-fighting) ---
  const addFloorZone = (x: number, z: number, w: number, d: number, y: number, mat: THREE.Material) => {
    const mesh = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(w, 0.16, d)), mat);
    mesh.position.set(x, y - 0.08, z);
    mesh.receiveShadow = cast;
    scene.add(mesh);
  };

  // Main Open Space Carpet (48 x 38m)
  addFloorZone(0, 0, 48, 38, 0.0, carpetMat);
  // Sala do Gestor (Walnut Parquet)
  addFloorZone(-17.0, -11.75, 13.0, 12.5, 0.02, walnutFloorMat);
  // Sala de Reuniões (Oak Parquet)
  addFloorZone(-17.0, 0.5, 13.0, 11.8, 0.02, oakFloorMat);
  // Infraestrutura e Servidores (Raised Anti-static Slate Tile)
  addFloorZone(14.75, -12.5, 17.5, 11.0, 0.02, serverFloorMat);
  // Consultoria SAP / ABAP (Oak Parquet)
  addFloorZone(14.75, -0.75, 17.5, 12.2, 0.02, oakFloorMat);
  // Restaurante & Área de Café (Warm Ceramic Tile)
  addFloorZone(14.5, 12.0, 18.0, 12.2, 0.02, cafeFloorMat);

  // Exterior City Skyline Panorama outside Curtain-Wall Windows
  const skyTex = trackTex(createCitySkylineTexture());
  const skyMat = trackMat(new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.DoubleSide }));
  const skyWest = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(54, 14)), skyMat);
  skyWest.position.set(-34, 3.2, 0);
  skyWest.rotation.y = Math.PI / 2;
  scene.add(skyWest);

  const skyNorth = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(62, 14)), skyMat);
  skyNorth.position.set(0, 3.2, -29);
  scene.add(skyNorth);

  const skyEast = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(54, 14)), skyMat);
  skyEast.position.set(34, 3.2, 0);
  skyEast.rotation.y = -Math.PI / 2;
  scene.add(skyEast);

  // --- 3. PERIMETER WALLS, BASEBOARDS, CURTAIN-WALL WINDOWS & CEILING ---
  const WALL_H = 3.7;

  const createArchitecturalWall = (
    x: number,
    z: number,
    w: number,
    d: number,
    h: number,
    mat: THREE.Material,
    name: string,
    registerCollision = true,
    registerCameraBlock = true
  ) => {
    const wall = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(w, h, d)), mat);
    wall.position.set(x, h / 2, z);
    wall.castShadow = cast;
    wall.receiveShadow = cast;
    scene.add(wall);
    if (registerCameraBlock) cameraOccluders.push(wall);

    // Architectural Baseboard (Rodapé)
    const baseH = 0.14;
    const base = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(w + 0.04, baseH, d + 0.04)),
      mats.baseboardMat
    );
    base.position.set(x, baseH / 2, z);
    scene.add(base);

    if (registerCollision) {
      collisionSystem.addBox(x - w / 2, x + w / 2, z - d / 2, z + d / 2, name);
    }
  };

  // Curtain-Wall Window Bay builder (low sill + full panoramic glass + aluminum mullions + header)
  const createWindowWall = (
    x1: number,
    z1: number,
    x2: number,
    z2: number,
    name: string
  ) => {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const len = Math.sqrt(dx * dx + dz * dz);
    const angle = Math.atan2(dx, dz);
    const cx = (x1 + x2) / 2;
    const cz = (z1 + z2) / 2;

    const grp = new THREE.Group();
    grp.position.set(cx, 0, cz);
    grp.rotation.y = angle;

    // Low sill wall (0.55m)
    const sill = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.28, 0.55, len)), darkWallMat);
    sill.position.y = 0.275;
    sill.receiveShadow = cast;
    grp.add(sill);

    // Top lintel header (0.35m)
    const header = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.32, 0.35, len)), darkWallMat);
    header.position.y = WALL_H - 0.175;
    grp.add(header);

    // Panoramic Glass Pane
    const glass = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.05, WALL_H - 0.9, len - 0.1)), mats.glassWindow);
    glass.position.y = 0.55 + (WALL_H - 0.9) / 2;
    grp.add(glass);

    // Aluminum Mullions every 2.2m
    const count = Math.max(2, Math.floor(len / 2.2));
    for (let i = 0; i <= count; i++) {
      const mz = -len / 2 + (i / count) * len;
      const mullion = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.14, WALL_H - 0.9, 0.08)),
        mats.blackAnodized
      );
      mullion.position.set(0, 0.55 + (WALL_H - 0.9) / 2, mz);
      mullion.castShadow = cast;
      grp.add(mullion);
    }

    scene.add(grp);

    // Axis-aligned collision box
    const minX = Math.min(x1, x2) - 0.25;
    const maxX = Math.max(x1, x2) + 0.25;
    const minZ = Math.min(z1, z2) - 0.25;
    const maxZ = Math.max(z1, z2) + 0.25;
    collisionSystem.addBox(minX, maxX, minZ, maxZ, name);
  };

  // North Wall: Window bays flanking the central SAP wood-slat reception wall
  createWindowWall(-23.5, -18.5, -6.5, -18.5, 'Janela Norte Oeste');
  createArchitecturalWall(0, -18.5, 13.0, 0.45, WALL_H, woodSlatMat, 'Parede Recepção SAP');
  createWindowWall(6.5, -18.5, 23.5, -18.5, 'Janela Norte Leste');

  // West Wall: Full panoramic curtain-wall overlooking city skyline
  createWindowWall(-23.5, -18.5, -23.5, 18.5, 'Fachada Panorâmica Oeste');

  // East Wall: Solid architectural wall with window bay in Café
  createArchitecturalWall(23.5, -6.0, 0.45, 25.0, WALL_H, plasterWallMat, 'Parede Leste');
  createWindowWall(23.5, 6.5, 23.5, 18.5, 'Janela Leste Café');

  // South Wall: Low architectural glass balustrade (doesn't occlude 3rd-person view from south)
  createArchitecturalWall(0, 18.5, 47.2, 0.35, 1.05, darkWallMat, 'Mureta Frontal Sul', true, false);
  const southRail = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(47.2, 0.06, 0.14)), mats.brushedAluminum);
  southRail.position.set(0, 1.12, 18.5);
  scene.add(southRail);

  // --- 4. ARCHITECTURAL GLASS PARTITIONS WITH ALUMINUM MULLIONS & DOORS ---
  const createGlassPartition = (
    x1: number,
    z1: number,
    x2: number,
    z2: number,
    name: string,
    height = 3.2
  ) => {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const len = Math.sqrt(dx * dx + dz * dz);
    const angle = Math.atan2(dx, dz);
    const cx = (x1 + x2) / 2;
    const cz = (z1 + z2) / 2;

    const grp = new THREE.Group();
    grp.position.set(cx, 0, cz);
    grp.rotation.y = angle;

    // Bottom & Top aluminum tracks
    const trackBot = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.09, 0.07, len)), mats.blackAnodized);
    trackBot.position.y = 0.035;
    grp.add(trackBot);

    const trackTop = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.11, 0.09, len)), mats.blackAnodized);
    trackTop.position.y = height - 0.045;
    grp.add(trackTop);

    // Tempered Glass Pane
    const pane = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.04, height - 0.16, len - 0.04)), mats.glassPartition);
    pane.position.y = height / 2;
    grp.add(pane);

    // Vertical black mullions
    const bays = Math.max(1, Math.round(len / 2.2));
    for (let i = 0; i <= bays; i++) {
      const mz = -len / 2 + (i / bays) * len;
      const post = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.09, height, 0.06)), mats.blackAnodized);
      post.position.set(0, height / 2, mz);
      post.castShadow = cast;
      grp.add(post);
    }

    scene.add(grp);

    const minX = Math.min(x1, x2) - 0.18;
    const maxX = Math.max(x1, x2) + 0.18;
    const minZ = Math.min(z1, z2) - 0.18;
    const maxZ = Math.max(z1, z2) + 0.18;
    collisionSystem.addBox(minX, maxX, minZ, maxZ, name);
  };

  // Architectural Open Glass Door (visual accent at doorways — non-blocking!)
  const createOpenGlassDoor = (hingeX: number, hingeZ: number, baseRotY: number, swingAngle: number) => {
    const doorGrp = new THREE.Group();
    doorGrp.position.set(hingeX, 0, hingeZ);
    doorGrp.rotation.y = baseRotY + swingAngle;

    const frame = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.05, 2.35, 1.05)), mats.blackAnodized);
    frame.position.set(0, 1.18, 0.525);
    // Cutout visual: use glass leaf + outer stiles
    const leaf = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.035, 2.3, 0.98)), mats.glassPartition);
    leaf.position.set(0, 1.16, 0.525);
    doorGrp.add(leaf);

    const topRail = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.06, 0.07, 1.04)), mats.blackAnodized);
    topRail.position.set(0, 2.32, 0.525);
    doorGrp.add(topRail);

    const botRail = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.06, 0.08, 1.04)), mats.blackAnodized);
    botRail.position.set(0, 0.04, 0.525);
    doorGrp.add(botRail);

    // Stainless pull handles
    [-0.06, 0.06].forEach((ox) => {
      const handle = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.014, 0.014, 0.45, 8)), mats.chromeSteel);
      handle.position.set(ox, 1.05, 0.88);
      doorGrp.add(handle);
    });

    void frame;
    scene.add(doorGrp);
  };

  // --- Room Partitions with >= 2.4m Clear Doorways ---
  // 1. Sala do Gestor (x: -23.5..-10.5, z: -18.5..-5.5)
  createGlassPartition(-23.5, -5.5, -10.5, -5.5, 'Divisória Sul Sala Gestor');
  createGlassPartition(-10.5, -18.5, -10.5, -13.2, 'Divisória Sala Gestor Norte');
  // Doorway at x = -10.5, z: -13.2 to -10.4 (2.8m wide!)
  createOpenGlassDoor(-10.5, -13.2, 0, 0.65);
  createGlassPartition(-10.5, -10.4, -10.5, -5.5, 'Divisória Sala Gestor Sul');

  // 2. Sala de Reuniões (x: -23.5..-10.5, z: -5.5..6.5)
  createGlassPartition(-23.5, 6.5, -10.5, 6.5, 'Divisória Sul Sala Reuniões');
  createGlassPartition(-10.5, -5.5, -10.5, -1.2, 'Divisória Reunião Norte');
  // Doorway at x = -10.5, z: -1.2 to 1.6 (2.8m wide!)
  createOpenGlassDoor(-10.5, -1.2, 0, 0.55);
  createGlassPartition(-10.5, 1.6, -10.5, 6.5, 'Divisória Reunião Sul');

  // 3. Infraestrutura e Servidores (x: 6.0..23.5, z: -18.5..-7.0)
  createArchitecturalWall(6.0, -15.5, 0.3, 6.0, 3.2, darkWallMat, 'Parede Servidores Norte');
  // Doorway at x = 6.0, z: -12.5 to -9.8 (2.7m wide!)
  createOpenGlassDoor(6.0, -12.5, 0, -0.65);
  createGlassPartition(6.0, -9.8, 6.0, -7.0, 'Divisória Servidores Sul');
  createGlassPartition(6.0, -7.0, 10.5, -7.0, 'Divisória Servidores Base Oeste');
  // Doorway at z = -7.0, x: 10.5 to 13.5 (3.0m wide!)
  createGlassPartition(13.5, -7.0, 23.5, -7.0, 'Divisória Servidores Base Leste');

  // 4. Consultoria SAP / ABAP (x: 6.0..23.5, z: -7.0..5.5)
  createGlassPartition(6.0, -7.0, 6.0, -3.2, 'Divisória Consultoria Norte');
  // Doorway at x = 6.0, z: -3.2 to -0.4 (2.8m wide!)
  createOpenGlassDoor(6.0, -3.2, 0, -0.55);
  createGlassPartition(6.0, -0.4, 6.0, 5.5, 'Divisória Consultoria Sul');

  // 5. Restaurante & Café Divider (x: 5.5, z: 6.0..18.5 with wide opening z: 6..9.5)
  createGlassPartition(5.5, 10.5, 5.5, 18.5, 'Divisória Restaurante / Copa');

  // --- 5. SUSPENDED CORPORATE CEILING WITH INSTANCED LINEAR LED LIGHTS ---
  // Single-sided downward-facing ceiling plane (FrontSide facing -Y, so camera looking down sees inside!)
  const ceilingPlane = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(47.2, 37.2)),
    mats.ceilingPanelMat
  );
  ceilingPlane.position.set(0, WALL_H, 0);
  ceilingPlane.rotation.x = Math.PI / 2;
  scene.add(ceilingPlane);

  // Instanced Recessed Linear LED Ceiling Strips (visible at ceiling height without blocking view)
  const ledGeo = trackGeo(new THREE.BoxGeometry(3.8, 0.05, 0.14));
  const ledPositions: [number, number, number][] = [];
  for (let lx = -18; lx <= 18; lx += 9) {
    for (let lz = -14; lz <= 14; lz += 7) {
      ledPositions.push([lx, WALL_H - 0.05, lz]);
    }
  }
  const ledInstanced = new THREE.InstancedMesh(ledGeo, mats.ledEmitMat, ledPositions.length);
  const dummy = new THREE.Object3D();
  ledPositions.forEach(([lx, ly, lz], i) => {
    dummy.position.set(lx, ly, lz);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    ledInstanced.setMatrixAt(i, dummy.matrix);
  });
  ledInstanced.instanceMatrix.needsUpdate = true;
  ledInstanced.computeBoundingSphere();
  scene.add(ledInstanced);

  // --- 6. RECEPTION, TURNSTILES & SAP CENTRO DE SUPORTE SIGN ---
  buildReceptionArea(scene, collisionSystem, mats, trackGeo, trackMat, trackTex, cast);

  // --- 7. WORKSTATIONS & LIVING MOSS PLANTER DIVIDERS ---
  const sapTex = trackTex(createSapMonitorTexture('sap'));
  const codeTex = trackTex(createSapMonitorTexture('code'));
  const chartTex = trackTex(createSapMonitorTexture('chart'));
  const screenMats = {
    sap: trackMat(new THREE.MeshBasicMaterial({ map: sapTex })),
    code: trackMat(new THREE.MeshBasicMaterial({ map: codeTex })),
    chart: trackMat(new THREE.MeshBasicMaterial({ map: chartTex })),
  };
  const kbMat = trackMat(new THREE.MeshStandardMaterial({ map: keyboardTex, roughness: 0.6 }));

  const createDetailedWorkstation = (
    x: number,
    z: number,
    name: string,
    chairAccentColor: number,
    isExecutiveOrKey: boolean,
    screenType: 'sap' | 'code' | 'chart',
    deskTopMat: THREE.Material = mats.matteDeskOak
  ) => {
    const grp = new THREE.Group();
    grp.position.set(x, 0, z);

    const w = isExecutiveOrKey ? 2.6 : 2.3;
    const d = isExecutiveOrKey ? 1.25 : 1.15;

    // Tabletop with chamfered underside frame
    const tabletop = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(w, 0.06, d)), deskTopMat);
    tabletop.position.set(0, 0.75, 0);
    tabletop.castShadow = cast;
    tabletop.receiveShadow = cast;
    grp.add(tabletop);

    const apron = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(w - 0.14, 0.05, d - 0.14)), mats.blackAnodized);
    apron.position.set(0, 0.7, 0);
    grp.add(apron);

    // Sleek A-Frame Steel Desk Legs + Horizontal Foot Rails
    [-w / 2 + 0.12, w / 2 - 0.12].forEach((lx) => {
      [-d / 2 + 0.1, d / 2 - 0.1].forEach((lz) => {
        const leg = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.05, 0.72, 0.05)), mats.blackAnodized);
        leg.position.set(lx, 0.36, lz);
        leg.castShadow = cast;
        grp.add(leg);
      });
      const foot = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.06, 0.03, d - 0.1)), mats.brushedAluminum);
      foot.position.set(lx, 0.015, 0);
      grp.add(foot);
    });

    // Under-desk 3-Drawer Rolling Pedestal
    const ped = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.46, 0.58, 0.62)), mats.matteDeskWhite);
    ped.position.set(w / 2 - 0.38, 0.32, 0.05);
    ped.castShadow = cast;
    grp.add(ped);
    for (let dr = 0; dr < 3; dr++) {
      const handle = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.14, 0.018, 0.025)), mats.chromeSteel);
      handle.position.set(w / 2 - 0.38, 0.16 + dr * 0.17, 0.37);
      grp.add(handle);
    }

    // Dual Monitors (for Key User / Executive / ABAP) or Single Ultrawide
    const monitorCount = isExecutiveOrKey || screenType === 'code' ? 2 : 1;
    for (let m = 0; m < monitorCount; m++) {
      const ox = monitorCount === 2 ? (m === 0 ? -0.42 : 0.42) : 0;
      const yaw = monitorCount === 2 ? (m === 0 ? 0.14 : -0.14) : 0;
      const monGrp = new THREE.Group();
      monGrp.position.set(ox, 0.78, -0.34);
      monGrp.rotation.y = yaw;

      // Monitor Base & Articulated Arm
      const basePlate = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.11, 0.12, 0.016, 16)), mats.brushedAluminum);
      basePlate.position.y = 0.008;
      monGrp.add(basePlate);

      const stem = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.024, 0.028, 0.28, 12)), mats.blackAnodized);
      stem.position.set(0, 0.15, -0.02);
      monGrp.add(stem);

      // Slim-bezel Monitor Housing
      const frameW = monitorCount === 2 ? 0.72 : 0.88;
      const frameH = 0.44;
      const housing = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(frameW, frameH, 0.03)), mats.blackAnodized);
      housing.position.set(0, 0.36, 0.01);
      housing.castShadow = cast;
      monGrp.add(housing);

      // Glowing Display Panel
      const display = new THREE.Mesh(
        trackGeo(new THREE.PlaneGeometry(frameW - 0.035, frameH - 0.035)),
        m === 1 ? screenMats.chart : screenMats[screenType]
      );
      display.position.set(0, 0.36, 0.027);
      monGrp.add(display);

      grp.add(monGrp);
    }

    // Stitched Desk Mat, Keyboard & Ergonomic Mouse
    const matPad = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.84, 0.008, 0.36)),
      trackMat(new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 }))
    );
    matPad.position.set(-0.04, 0.784, 0.14);
    grp.add(matPad);

    const kb = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.46, 0.018, 0.16)), kbMat);
    kb.position.set(-0.14, 0.795, 0.13);
    kb.rotation.x = 0.05;
    grp.add(kb);

    const mouse = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.045, 12, 10)), mats.blackAnodized);
    mouse.scale.set(0.72, 0.48, 1.2);
    mouse.position.set(0.24, 0.798, 0.14);
    grp.add(mouse);

    // Ceramic Coffee Mug + Notebook & Pen
    const mug = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.042, 0.038, 0.095, 14)), mats.ceramicWhite);
    mug.position.set(-0.72, 0.825, 0.16);
    grp.add(mug);

    const notebook = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.22, 0.018, 0.28)),
      trackMat(new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.65 }))
    );
    notebook.position.set(0.58, 0.789, 0.12);
    notebook.rotation.y = -0.18;
    grp.add(notebook);

    // Desk Task Lamp (on Key User & Executive desks)
    if (isExecutiveOrKey) {
      const lampBase = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.08, 0.09, 0.02, 14)), mats.blackAnodized);
      lampBase.position.set(-0.92, 0.79, -0.28);
      grp.add(lampBase);

      const lampNeck = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.012, 0.012, 0.42, 8)), mats.brushedAluminum);
      lampNeck.position.set(-0.92, 0.99, -0.26);
      lampNeck.rotation.z = -0.25;
      grp.add(lampNeck);

      const lampHead = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.24, 0.025, 0.06)), mats.blackAnodized);
      lampHead.position.set(-0.82, 1.18, -0.22);
      grp.add(lampHead);
    }

    // Detailed Ergonomic Mesh Task Chair (5-star base, casters, gas lift, contoured cushion, lumbar mesh back, armrests)
    const chair = buildErgonomicChair(chairAccentColor, mats, trackGeo, trackMat, cast);
    chair.position.set(0, 0, 0.72);
    grp.add(chair);

    scene.add(grp);
    collisionSystem.addBox(x - w / 2 - 0.08, x + w / 2 + 0.08, z - d / 2 - 0.1, z + 1.05, name);
  };

  // Main Open Space Desks
  createDetailedWorkstation(0, 2, 'Mesa do Marcelo (Key User · C2C)', 0x0284c7, true, 'sap', mats.matteDeskOak);
  createDetailedWorkstation(-8, 2, 'Mesa Bruna (Folha)', 0x7c3aed, false, 'sap');
  createDetailedWorkstation(-3, 2, 'Mesa Carlos (Benefícios)', 0x06b6d4, false, 'chart');
  createDetailedWorkstation(-8, -3, 'Mesa Juliana (Cadastro)', 0x10b981, false, 'sap');
  createDetailedWorkstation(-3, -3, 'Mesa Roberto (Contábil)', 0xf59e0b, false, 'chart');

  // Consultoria SAP / ABAP Desks
  createDetailedWorkstation(10, -4, 'Mesa Mariana (Funcional HCM)', 0xec4899, false, 'sap', mats.matteDeskOak);
  createDetailedWorkstation(14, -4, 'Mesa Lucas (ABAP)', 0x3b82f6, true, 'code', mats.matteDeskOak);

  // Basis NOC Monitoring Desk
  createDetailedWorkstation(12, 4, 'Mesa Fábio (Basis / Infra)', 0x6366f1, true, 'chart', mats.matteDeskWhite);

  // Manager Executive Desk (Dr. Marcos Salles — matched to (-12, -10) NPC position)
  createDetailedWorkstation(-12.2, -10.65, 'Mesa Dr. Marcos (Gestor)', 0x991b1b, true, 'chart', mats.executiveWalnut);

  // Green Living Moss Planter Dividers (matching attached photo image_96b1ee5a.png)
  buildLivingPlanterDivider(scene, collisionSystem, mats, trackGeo, -5.5, -0.5, 6.2, cast);
  buildLivingPlanterDivider(scene, collisionSystem, mats, trackGeo, 12.0, -1.2, 6.0, cast);

  // --- 8. SALA DO GESTOR (BOOKSHELF, POSTERS, WHITEBOARD, VISITOR CHAIRS) ---
  buildManagerOfficeProps(scene, collisionSystem, mats, trackGeo, trackMat, trackTex, cast);

  // --- 9. SALA DE REUNIÕES (CONFERENCE TABLE, 6 CHAIRS, 75" DISPLAY, CREDENZA) ---
  buildMeetingRoom(scene, collisionSystem, mats, trackGeo, trackMat, screenMats.chart, cast);

  // --- 10. LOUNGE SOFA (SW OPEN SPACE, ZERO OVERLAP!) ---
  buildCurvedLoungeSofa(scene, collisionSystem, mats, trackGeo, trackMat, -5.5, 12.8, cast);

  // --- 11. INFRAESTRUTURA E SERVIDORES & RESTROOM ---
  buildServerRoom(scene, collisionSystem, mats, trackGeo, trackMat, trackTex, serverLeds, cast);
  buildRestroomAlcove(scene, collisionSystem, mats, trackGeo, trackMat, cast);

  // --- 12. RESTAURANTE / REFEITÓRIO & ÁREA DE CAFÉ / SINUCA ---
  buildRestaurantAndCafe(scene, collisionSystem, mats, trackGeo, trackMat, cast);

  // --- 13. DECORATIVE POTTED TROPICAL PLANTS ---
  const plantCoords: [number, number][] = [
    [-21.2, -16.2],
    [-21.2, 4.5],
    [-9.2, 13.0],
    [-1.8, 13.0],
    [-4.3, -10.5],
    [4.3, -10.5],
    [4.5, 3.8],
    [19.5, -4.5],
    [21.5, 8.2],
  ];
  plantCoords.forEach(([px, pz]) => {
    buildIndoorPlant(scene, collisionSystem, mats, trackGeo, px, pz, cast);
  });

  return {
    serverLeds,
    cameraOccluders,
    disposables: { geometries, materials: extraMaterials, textures },
  };
}

function buildErgonomicChair(
  accentHex: number,
  mats: OfficeMaterialLibrary,
  trackGeo: <T extends THREE.BufferGeometry>(g: T) => T,
  trackMat: <T extends THREE.Material>(m: T) => T,
  cast: boolean
): THREE.Group {
  const grp = new THREE.Group();
  const cushionMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: accentHex,
      roughness: 0.72,
      sheen: 0.4,
      sheenRoughness: 0.75,
    })
  );

  // 5-Star Base + Casters
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const arm = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.04, 0.03, 0.30)), mats.blackAnodized);
    arm.position.set(Math.sin(a) * 0.14, 0.06, Math.cos(a) * 0.14);
    arm.rotation.y = a;
    grp.add(arm);

    const wheel = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.025, 0.025, 0.025, 10)), mats.blackAnodized);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(Math.sin(a) * 0.27, 0.025, Math.cos(a) * 0.27);
    grp.add(wheel);
  }

  // Pneumatic Cylinder
  const cyl = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.028, 0.032, 0.38, 12)), mats.chromeSteel);
  cyl.position.y = 0.25;
  grp.add(cyl);

  // Contoured Seat Cushion
  const seat = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.50, 0.08, 0.48)), cushionMat);
  seat.position.set(0, 0.46, 0);
  seat.castShadow = cast;
  grp.add(seat);

  // Spine Support Stem + Ergonomic Mesh Backrest
  const backStem = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.06, 0.38, 0.04)), mats.blackAnodized);
  backStem.position.set(0, 0.63, 0.24);
  backStem.rotation.x = 0.12;
  grp.add(backStem);

  const backFrame = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.46, 0.56, 0.045)), mats.fabricMeshChair);
  backFrame.position.set(0, 0.85, 0.26);
  backFrame.rotation.x = 0.1;
  backFrame.castShadow = cast;
  grp.add(backFrame);

  // Accent Lumbar Strip
  const lumbar = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.42, 0.1, 0.055)), cushionMat);
  lumbar.position.set(0, 0.68, 0.245);
  grp.add(lumbar);

  // Adjustable T-Armrests
  [-0.27, 0.27].forEach((ax) => {
    const post = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.03, 0.2, 0.04)), mats.blackAnodized);
    post.position.set(ax, 0.56, 0.02);
    grp.add(post);

    const pad = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.06, 0.028, 0.26)), mats.leatherDark);
    pad.position.set(ax, 0.67, 0.02);
    grp.add(pad);
  });

  return grp;
}

function buildLivingPlanterDivider(
  scene: THREE.Scene,
  collisionSystem: CollisionSystem,
  mats: OfficeMaterialLibrary,
  trackGeo: <T extends THREE.BufferGeometry>(g: T) => T,
  x: number,
  z: number,
  width: number,
  cast: boolean
) {
  const grp = new THREE.Group();
  grp.position.set(x, 0, z);

  // Sleek white architectural cabinet trough
  const trough = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(width, 0.72, 0.44)), mats.matteDeskWhite);
  trough.position.y = 0.36;
  trough.castShadow = cast;
  trough.receiveShadow = cast;
  grp.add(trough);

  const soil = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(width - 0.1, 0.05, 0.34)), mats.soilDark);
  soil.position.y = 0.71;
  grp.add(soil);

  // Lush foliage clusters along the top of the trough
  const bushCount = Math.floor(width * 2.4);
  for (let i = 0; i < bushCount; i++) {
    const bx = -width / 2 + 0.35 + (i / (bushCount - 1)) * (width - 0.7);
    const foliage = new THREE.Mesh(
      trackGeo(new THREE.DodecahedronGeometry(0.22 + (i % 3) * 0.04, 1)),
      i % 2 === 0 ? mats.foliageGreen : mats.foliageDarkGreen
    );
    foliage.scale.set(1.1, 0.95, 0.9);
    foliage.position.set(bx, 0.86 + (i % 2) * 0.04, (i % 2 === 0 ? 1 : -1) * 0.04);
    foliage.castShadow = cast;
    grp.add(foliage);
  }

  scene.add(grp);
  collisionSystem.addBox(x - width / 2, x + width / 2, z - 0.28, z + 0.28, 'Divisória Verde');
}

function buildReceptionArea(
  scene: THREE.Scene,
  collisionSystem: CollisionSystem,
  mats: OfficeMaterialLibrary,
  trackGeo: <T extends THREE.BufferGeometry>(g: T) => T,
  trackMat: <T extends THREE.Material>(m: T) => T,
  trackTex: <T extends THREE.Texture>(t: T) => T,
  cast: boolean
) {
  const recGroup = new THREE.Group();
  const royalBlueMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0x1d4ed8,
      roughness: 0.28,
      metalness: 0.15,
      clearcoat: 0.5,
    })
  );

  // Curved Royal Blue Reception Counter at (0, -11.5)
  const frontArc = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(2.6, 2.6, 1.08, 36, 1, false, -Math.PI * 0.45, Math.PI * 0.9)),
    royalBlueMat
  );
  frontArc.position.set(0, 0.54, -11.5);
  frontArc.castShadow = cast;
  recGroup.add(frontArc);

  // White Corian Transaction Counter Top
  const topCap = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(2.72, 2.72, 0.08, 36, 1, false, -Math.PI * 0.45, Math.PI * 0.9)),
    mats.ceramicWhite
  );
  topCap.position.set(0, 1.1, -11.5);
  recGroup.add(topCap);

  // Inner Work Desk + Reception Monitor
  const innerDesk = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(3.1, 0.06, 1.1)), mats.matteDeskWhite);
  innerDesk.position.set(0, 0.78, -12.1);
  recGroup.add(innerDesk);

  const recMon = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.7, 0.42, 0.03)), mats.blackAnodized);
  recMon.position.set(0, 1.08, -11.8);
  recGroup.add(recMon);

  scene.add(recGroup);
  collisionSystem.addBox(-2.7, 2.7, -13.2, -9.8, 'Balcão de Recepção');

  // Official Backlit SAP CENTRO DE SUPORTE Plaque on Wood-Slat Wall
  const signTex = trackTex(createSapCentroSuporteTexture());
  const signFrame = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(4.8, 2.35, 0.12)), mats.brushedAluminum);
  signFrame.position.set(0, 2.35, -18.2);
  scene.add(signFrame);

  const signFace = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(4.55, 2.15)),
    trackMat(new THREE.MeshBasicMaterial({ map: signTex }))
  );
  signFace.position.set(0, 2.35, -18.12);
  scene.add(signFace);

  // Sleek Security Glass Turnstiles
  [-2.8, 2.8].forEach((tx) => {
    const body = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.28, 0.96, 1.25)), mats.brushedAluminum);
    body.position.set(tx, 0.48, -6.5);
    body.castShadow = cast;
    scene.add(body);

    const glassWing = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.85, 0.65, 0.03)), mats.glassPartition);
    glassWing.position.set(tx > 0 ? tx - 0.55 : tx + 0.55, 0.55, -6.5);
    scene.add(glassWing);

    const ledStrip = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.18, 0.03, 0.4)),
      trackMat(new THREE.MeshBasicMaterial({ color: 0x22c55e }))
    );
    ledStrip.position.set(tx, 0.97, -6.5);
    scene.add(ledStrip);

    collisionSystem.addBox(tx - 0.25, tx + 0.25, -7.2, -5.8, 'Catraca de Acesso');
  });
}

function buildManagerOfficeProps(
  scene: THREE.Scene,
  collisionSystem: CollisionSystem,
  mats: OfficeMaterialLibrary,
  trackGeo: <T extends THREE.BufferGeometry>(g: T) => T,
  trackMat: <T extends THREE.Material>(m: T) => T,
  trackTex: <T extends THREE.Texture>(t: T) => T,
  cast: boolean
) {
  // Executive Credenza / Bookshelf along North-West Wall (x: -17, z: -17.6)
  const credenza = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(4.6, 1.45, 0.65)), mats.executiveWalnut);
  credenza.position.set(-16.5, 0.725, -17.6);
  credenza.castShadow = cast;
  scene.add(credenza);
  collisionSystem.addBox(-18.9, -14.1, -18.1, -17.1, 'Armário do Gestor');

  // Books & Corporate Binders on Credenza
  const bookColors = [0x1d4ed8, 0xdc2626, 0x059669, 0xd97706, 0x4338ca];
  for (let b = 0; b < 10; b++) {
    const book = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.08, 0.28 + (b % 3) * 0.04, 0.22)),
      trackMat(new THREE.MeshStandardMaterial({ color: bookColors[b % bookColors.length], roughness: 0.6 }))
    );
    book.position.set(-18.2 + b * 0.14, 1.6, -17.6);
    scene.add(book);
  }

  // Framed Poster: DISCIPLINA · FOCO · CONSTÂNCIA · SUCESSO
  const posterTex = trackTex(createMotivationalPosterTexture('disciplina'));
  const poster = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(1.4, 1.75)),
    trackMat(new THREE.MeshBasicMaterial({ map: posterTex }))
  );
  poster.position.set(-19.8, 2.2, -18.2);
  scene.add(poster);

  // Whiteboard: PLANO DE AÇÃO
  const wbTex = trackTex(createMotivationalPosterTexture('plano'));
  const wb = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(1.7, 2.0)),
    trackMat(new THREE.MeshBasicMaterial({ map: wbTex }))
  );
  wb.position.set(-13.5, 2.1, -18.2);
  scene.add(wb);

  // Two Visitor Chairs facing Dr. Marcos's desk
  [-13.4, -11.4].forEach((vx) => {
    const vChair = buildErgonomicChair(0x334155, mats, trackGeo, trackMat, cast);
    vChair.position.set(vx, 0, -12.3);
    vChair.rotation.y = Math.PI;
    scene.add(vChair);
  });
}

function buildMeetingRoom(
  scene: THREE.Scene,
  collisionSystem: CollisionSystem,
  mats: OfficeMaterialLibrary,
  trackGeo: <T extends THREE.BufferGeometry>(g: T) => T,
  trackMat: <T extends THREE.Material>(m: T) => T,
  chartMat: THREE.Material,
  cast: boolean
) {
  const cx = -16.8;
  const cz = 0.5;

  // Boat-shaped Walnut Conference Table
  const tableTop = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.3, 0.08, 5.2)), mats.executiveWalnut);
  tableTop.position.set(cx, 0.76, cz);
  tableTop.castShadow = cast;
  tableTop.receiveShadow = cast;
  scene.add(tableTop);

  // Table Pedestal Bases
  [-1.5, 1.5].forEach((tz) => {
    const base = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.18, 0.34, 0.72, 16)), mats.brushedAluminum);
    base.position.set(cx, 0.36, cz + tz);
    scene.add(base);
  });

  // 6 Ergonomic Conference Chairs around the table
  [-1.6, 0, 1.6].forEach((oz) => {
    const leftC = buildErgonomicChair(0x0284c7, mats, trackGeo, trackMat, cast);
    leftC.position.set(cx - 1.45, 0, cz + oz);
    leftC.rotation.y = -Math.PI / 2;
    scene.add(leftC);

    const rightC = buildErgonomicChair(0x0284c7, mats, trackGeo, trackMat, cast);
    rightC.position.set(cx + 1.45, 0, cz + oz);
    rightC.rotation.y = Math.PI / 2;
    scene.add(rightC);
  });

  collisionSystem.addBox(cx - 1.65, cx + 1.65, cz - 2.75, cz + 2.75, 'Mesa de Reunião');

  // 75" Wall-Mounted 4K Presentation Display on West Side
  const tvMount = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.14, 1.85, 3.2)), mats.blackAnodized);
  tvMount.position.set(-22.9, 2.0, cz);
  tvMount.castShadow = cast;
  scene.add(tvMount);

  const tvDisplay = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(3.05, 1.7)), chartMat);
  tvDisplay.position.set(-22.81, 2.0, cz);
  tvDisplay.rotation.y = Math.PI / 2;
  scene.add(tvDisplay);
}

function buildCurvedLoungeSofa(
  scene: THREE.Scene,
  collisionSystem: CollisionSystem,
  mats: OfficeMaterialLibrary,
  trackGeo: <T extends THREE.BufferGeometry>(g: T) => T,
  trackMat: <T extends THREE.Material>(m: T) => T,
  cx: number,
  cz: number,
  cast: boolean
) {
  const grp = new THREE.Group();
  grp.position.set(cx, 0, cz);

  const sofaMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0x1d4ed8,
      roughness: 0.68,
      sheen: 0.45,
      sheenRoughness: 0.7,
    })
  );

  // Base + Padded Seat + Curved Backrest
  const base = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(2.3, 2.3, 0.44, 32, 1, false, 0, Math.PI * 1.45)),
    sofaMat
  );
  base.position.y = 0.22;
  base.rotation.y = -Math.PI * 0.22;
  base.castShadow = cast;
  grp.add(base);

  const backrest = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(2.35, 2.35, 0.78, 32, 1, true, 0, Math.PI * 1.45)),
    sofaMat
  );
  backrest.position.y = 0.56;
  backrest.rotation.y = -Math.PI * 0.22;
  grp.add(backrest);

  // Round Glass Coffee Table in Center
  const coffeeTop = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.82, 0.82, 0.05, 24)), mats.leatherDark);
  coffeeTop.position.y = 0.38;
  grp.add(coffeeTop);

  const coffeeLeg = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.08, 0.16, 0.36, 12)), mats.chromeSteel);
  coffeeLeg.position.y = 0.18;
  grp.add(coffeeLeg);

  scene.add(grp);
  collisionSystem.addBox(cx - 2.45, cx + 2.45, cz - 2.45, cz + 2.45, 'Sofá Circular do Lounge');
}

function buildServerRoom(
  scene: THREE.Scene,
  collisionSystem: CollisionSystem,
  mats: OfficeMaterialLibrary,
  trackGeo: <T extends THREE.BufferGeometry>(g: T) => T,
  trackMat: <T extends THREE.Material>(m: T) => T,
  trackTex: <T extends THREE.Texture>(t: T) => T,
  serverLeds: THREE.PointLight[],
  cast: boolean
) {
  const rackTex = trackTex(createServerRackTexture());
  const rackFaceMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: rackTex,
      roughness: 0.32,
      metalness: 0.75,
    })
  );

  // 4 Detailed 42U Server Racks along North Infra Wall (x: 9, 11.4, 13.8, 16.2; z: -14.8)
  [9.0, 11.4, 13.8, 16.2].forEach((rx, idx) => {
    const rack = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.35, 2.6, 0.95)), rackFaceMat);
    rack.position.set(rx, 1.3, -14.8);
    rack.castShadow = cast;
    scene.add(rack);

    // Top Cable Tray
    const tray = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.4, 0.08, 1.1)), mats.blackAnodized);
    tray.position.set(rx, 2.66, -14.8);
    scene.add(tray);

    collisionSystem.addBox(rx - 0.75, rx + 0.75, -15.4, -14.2, 'Rack de Servidor SAP');

    const led = new THREE.PointLight(idx % 2 === 0 ? 0x22c55e : 0x06b6d4, 1.3, 4.2);
    led.position.set(rx, 1.8, -14.1);
    scene.add(led);
    serverLeds.push(led);
  });

  // Overhead Illuminated Blue Cable Ladder spanning racks
  const cableTray = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(9.2, 0.08, 0.45)), mats.brushedAluminum);
  cableTray.position.set(12.6, 2.95, -14.8);
  scene.add(cableTray);
}

function buildRestroomAlcove(
  scene: THREE.Scene,
  collisionSystem: CollisionSystem,
  mats: OfficeMaterialLibrary,
  trackGeo: <T extends THREE.BufferGeometry>(g: T) => T,
  trackMat: <T extends THREE.Material>(m: T) => T,
  cast: boolean
) {
  // Restroom Privacy Screen Wall & Vanity Sink at (x: 20.5, z: -15.5)
  const wall = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.24, 3.0, 4.2)), mats.executiveWalnut);
  wall.position.set(19.2, 1.5, -15.6);
  wall.castShadow = cast;
  scene.add(wall);
  collisionSystem.addBox(19.0, 19.4, -17.8, -13.4, 'Parede Banheiros');

  // Floating Marble Vanity & Mirror
  const vanity = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.75, 0.22, 2.2)), mats.ceramicWhite);
  vanity.position.set(22.7, 0.82, -15.4);
  scene.add(vanity);

  const mirror = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.06, 1.1, 2.0)),
    trackMat(new THREE.MeshStandardMaterial({ color: 0xe0f2fe, metalness: 0.95, roughness: 0.05 }))
  );
  mirror.position.set(23.18, 1.75, -15.4);
  scene.add(mirror);
}

function buildRestaurantAndCafe(
  scene: THREE.Scene,
  collisionSystem: CollisionSystem,
  mats: OfficeMaterialLibrary,
  trackGeo: <T extends THREE.BufferGeometry>(g: T) => T,
  trackMat: <T extends THREE.Material>(m: T) => T,
  cast: boolean
) {
  // 1. Restaurante Self-Service Buffet Counter at (9.5, 16.4)
  const buffet = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(5.2, 0.96, 1.25)), mats.executiveWalnut);
  buffet.position.set(9.5, 0.48, 16.4);
  buffet.castShadow = cast;
  scene.add(buffet);

  const buffetTop = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(5.3, 0.08, 1.35)), mats.ceramicWhite);
  buffetTop.position.set(9.5, 0.98, 16.4);
  scene.add(buffetTop);

  const sneezeGuard = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(4.8, 0.42, 0.05)), mats.glassPartition);
  sneezeGuard.position.set(9.5, 1.24, 15.95);
  scene.add(sneezeGuard);
  collisionSystem.addBox(6.8, 12.2, 15.6, 17.2, 'Buffet Restaurante');

  // 2. Bistro Dining Tables + 4 Chairs each
  [
    [8.2, 8.2],
    [12.2, 8.2],
    [11.8, 12.6],
  ].forEach(([tx, tz]) => {
    const top = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.95, 0.95, 0.06, 24)), mats.matteDeskOak);
    top.position.set(tx, 0.76, tz);
    top.castShadow = cast;
    scene.add(top);

    const pole = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.06, 0.08, 0.74, 12)), mats.blackAnodized);
    pole.position.set(tx, 0.37, tz);
    scene.add(pole);

    const base = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.42, 0.44, 0.04, 16)), mats.blackAnodized);
    base.position.set(tx, 0.02, tz);
    scene.add(base);

    // 4 Compact Bistro Chairs
    [0, Math.PI / 2, Math.PI, -Math.PI / 2].forEach((a) => {
      const cx = tx + Math.cos(a) * 1.15;
      const cz = tz + Math.sin(a) * 1.15;
      const cSeat = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.22, 0.22, 0.06, 14)), mats.leatherDark);
      cSeat.position.set(cx, 0.46, cz);
      scene.add(cSeat);

      const cLeg = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.03, 0.04, 0.45, 8)), mats.chromeSteel);
      cLeg.position.set(cx, 0.225, cz);
      scene.add(cLeg);
    });

    collisionSystem.addBox(tx - 1.1, tx + 1.1, tz - 1.1, tz + 1.1, 'Mesa de Refeitório');
  });

  // 3. Espresso Coffee Bar Counter at (18.2, 16.2)
  const bar = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(5.0, 1.06, 1.25)), mats.executiveWalnut);
  bar.position.set(18.2, 0.53, 16.2);
  bar.castShadow = cast;
  scene.add(bar);

  const barMarble = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(5.15, 0.08, 1.38)), mats.ceramicWhite);
  barMarble.position.set(18.2, 1.08, 16.2);
  scene.add(barMarble);

  // Detailed Dual-Group Stainless Steel Espresso Machine
  const espBody = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.05, 0.58, 0.62)), mats.chromeSteel);
  espBody.position.set(17.5, 1.4, 16.2);
  espBody.castShadow = cast;
  scene.add(espBody);

  const espTray = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.0, 0.08, 0.2)), mats.blackAnodized);
  espTray.position.set(17.5, 1.16, 15.85);
  scene.add(espTray);

  // Espresso Cups on Warmers
  [-0.25, 0, 0.25].forEach((ox) => {
    const cup = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.045, 0.035, 0.08, 12)), mats.ceramicWhite);
    cup.position.set(17.5 + ox, 1.73, 16.2);
    scene.add(cup);
  });

  // Coffee Grinder & Pastry Display Case
  const grinder = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.14, 0.16, 0.45, 14)), mats.blackAnodized);
  grinder.position.set(18.4, 1.34, 16.2);
  scene.add(grinder);

  const pastryCase = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.1, 0.46, 0.56)), mats.glassPartition);
  pastryCase.position.set(19.6, 1.35, 16.2);
  scene.add(pastryCase);

  collisionSystem.addBox(15.6, 20.8, 15.4, 17.0, 'Balcão de Café Expresso');

  // 4. Billiard / Pool Table at (18.5, 10.2)
  const poolGrp = new THREE.Group();
  poolGrp.position.set(18.5, 0, 10.2);

  const poolFrame = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(3.4, 0.28, 1.9)), mats.executiveWalnut);
  poolFrame.position.y = 0.78;
  poolFrame.castShadow = cast;
  poolGrp.add(poolFrame);

  const feltMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.92 }));
  const felt = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(3.05, 0.04, 1.55)), feltMat);
  felt.position.y = 0.93;
  poolGrp.add(felt);

  [
    [-1.4, -0.72],
    [1.4, -0.72],
    [-1.4, 0.72],
    [1.4, 0.72],
  ].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.16, 0.7, 0.16)), mats.executiveWalnut);
    leg.position.set(lx, 0.35, lz);
    poolGrp.add(leg);
  });

  // Billiard balls cluster
  const ballColors = [0xfef08a, 0x2563eb, 0xdc2626, 0x7c3aed, 0xf97316, 0x111827, 0xf8fafc];
  ballColors.forEach((bc, bi) => {
    const ball = new THREE.Mesh(
      trackGeo(new THREE.SphereGeometry(0.045, 10, 8)),
      trackMat(new THREE.MeshPhysicalMaterial({ color: bc, roughness: 0.12, clearcoat: 1.0 }))
    );
    const angle = (bi / ballColors.length) * Math.PI * 2;
    ball.position.set(bi === 6 ? -0.9 : 0.65 + Math.cos(angle) * 0.12, 0.99, bi === 6 ? 0 : Math.sin(angle) * 0.12);
    poolGrp.add(ball);
  });

  scene.add(poolGrp);
  collisionSystem.addBox(16.7, 20.3, 9.1, 11.3, 'Mesa de Sinuca');
}

function buildIndoorPlant(
  scene: THREE.Scene,
  collisionSystem: CollisionSystem,
  mats: OfficeMaterialLibrary,
  trackGeo: <T extends THREE.BufferGeometry>(g: T) => T,
  x: number,
  z: number,
  cast: boolean
) {
  const grp = new THREE.Group();
  grp.position.set(x, 0, z);

  // Tapered White Ceramic Planter
  const potPts = [
    new THREE.Vector2(0.01, 0),
    new THREE.Vector2(0.22, 0),
    new THREE.Vector2(0.30, 0.56),
    new THREE.Vector2(0.27, 0.58),
    new THREE.Vector2(0.01, 0.55),
  ];
  const pot = new THREE.Mesh(trackGeo(new THREE.LatheGeometry(potPts, 18)), mats.ceramicWhite);
  pot.castShadow = cast;
  grp.add(pot);

  const soil = new THREE.Mesh(trackGeo(new THREE.CircleGeometry(0.26, 16)), mats.soilDark);
  soil.rotation.x = -Math.PI / 2;
  soil.position.y = 0.54;
  grp.add(soil);

  // Multi-tiered Tropical Leaves
  for (let i = 0; i < 9; i++) {
    const angle = (i / 9) * Math.PI * 2;
    const tilt = 0.35 + (i % 3) * 0.22;
    const stemCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.52, 0),
      new THREE.Vector3(Math.cos(angle) * 0.15, 0.85, Math.sin(angle) * 0.15),
      new THREE.Vector3(Math.cos(angle) * (0.28 + tilt * 0.25), 1.05 - (i % 3) * 0.12, Math.sin(angle) * (0.28 + tilt * 0.25)),
    ]);
    const stem = new THREE.Mesh(trackGeo(new THREE.TubeGeometry(stemCurve, 8, 0.012, 5, false)), mats.foliageDarkGreen);
    grp.add(stem);

    const leaf = new THREE.Mesh(
      trackGeo(new THREE.SphereGeometry(0.16, 8, 6)),
      i % 2 === 0 ? mats.foliageGreen : mats.foliageDarkGreen
    );
    leaf.scale.set(1.4, 0.22, 0.72);
    const tip = stemCurve.getPoint(1);
    leaf.position.copy(tip);
    leaf.rotation.y = -angle;
    leaf.rotation.z = -0.35;
    leaf.castShadow = cast;
    grp.add(leaf);
  }

  scene.add(grp);
  collisionSystem.addBox(x - 0.35, x + 0.35, z - 0.35, z + 0.35, 'Planta Decorativa');
}
