import * as THREE from 'three';

export interface StylizedAvatarOptions {
  name: string;
  hairColor?: number | string;
  shirtColor?: number | string;
  pantsColor?: number | string;
  skinTone?: number | string;
  hairStyle?: 'short' | 'long' | 'curly' | 'bun' | 'parted';
  hasGlasses?: boolean;
  hasBadge?: boolean;
  hasTicket?: boolean;
  role?: string;
  isPlayer?: boolean;
}

export interface StylizedAvatarHandle {
  group: THREE.Group;
  head: THREE.Mesh;
  body: THREE.Mesh;
  hair: THREE.Mesh;
  armLeft: THREE.Mesh;
  armRight: THREE.Mesh;
  legLeft: THREE.Mesh;
  legRight: THREE.Mesh;
  nametagSprite?: THREE.Sprite;
  bubbleSprite?: THREE.Sprite;
  updateAnimation: (time: number, isWalking: boolean, speedMultiplier?: number) => void;
  setBubbleState: (hasTicket: boolean) => void;
  destroy: () => void;
}

/**
 * Parses color safely into THREE.Color
 */
function parseColor(c: number | string | undefined, defaultHex: number): THREE.Color {
  if (c === undefined) return new THREE.Color(defaultHex);
  if (typeof c === 'number') return new THREE.Color(c);
  return new THREE.Color(c);
}

/**
 * Generates an ultra-crisp floating dialogue / attention bubble
 * Yellow diamond with '!' for urgent tickets, or white rounded bubble with '...' for chat
 */
export function createSpeechBubbleTexture(hasTicket: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 128, 128);

  if (hasTicket) {
    // Glowing diamond with alert exclamation
    ctx.shadowColor = 'rgba(245, 158, 11, 0.7)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#f59e0b'; // Amber yellow
    ctx.beginPath();
    ctx.moveTo(64, 16);
    ctx.lineTo(110, 62);
    ctx.lineTo(64, 108);
    ctx.lineTo(18, 62);
    ctx.closePath();
    ctx.fill();

    // Dark diamond border
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Bold exclamation mark
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 46px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', 64, 65);
  } else {
    // Friendly rounded speech bubble with 3 dots
    ctx.shadowColor = 'rgba(15, 23, 42, 0.35)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(16, 26, 96, 56, 18);
    ctx.fill();

    // Small tail pointing down
    ctx.beginPath();
    ctx.moveTo(52, 82);
    ctx.lineTo(64, 102);
    ctx.lineTo(76, 82);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 3 animated speech dots
    ctx.fillStyle = '#475569';
    [-22, 0, 22].forEach((offset) => {
      ctx.beginPath();
      ctx.arc(64 + offset, 54, 5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates floating nametag sprite
 */
export function createNametagTexture(name: string, role?: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 96;
  const ctx = canvas.getContext('2d')!;

  // Translucent dark pill container
  ctx.fillStyle = 'rgba(12, 18, 30, 0.88)';
  ctx.beginPath();
  ctx.roundRect(16, 12, 352, 72, 20);
  ctx.fill();

  ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Name
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const displayName = name.toUpperCase();
  ctx.fillText(displayName, 192, role ? 38 : 48);

  // Subtitle (role) if present
  if (role) {
    ctx.fillStyle = '#38bdf8';
    ctx.font = '600 18px "Chakra Petch", sans-serif';
    ctx.fillText(role.slice(0, 24), 192, 64);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Função para criar o avatar humano 3D detalhado (estilo anime/cartoon corporativo)
 */
export function createDetailedHumanAvatar(
  name: string,
  role?: string,
  isFemale = false,
  hairColor: number | string = 0x2b1d0c,
  shirtColor: number | string = 0x1d4ed8,
  hasTicket = false
): THREE.Group {
  const group = new THREE.Group();
  group.name = `avatar_${name}`;

  const shirtColorObj = parseColor(shirtColor, 0x1d4ed8);
  const hairColorObj = parseColor(hairColor, 0x2b1d0c);

  // 1. Pernas e Calça de Alfaiataria
  const legGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 12);
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });

  const leftLeg = new THREE.Mesh(legGeo, pantsMat);
  leftLeg.position.set(0.12, 0.4, 0);
  leftLeg.castShadow = true;
  group.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, pantsMat);
  rightLeg.position.set(-0.12, 0.4, 0);
  rightLeg.castShadow = true;
  group.add(rightLeg);

  // Sapatos engraxados
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });
  const shoeGeo = new THREE.BoxGeometry(0.13, 0.08, 0.22);
  const shoeL = new THREE.Mesh(shoeGeo, shoeMat);
  shoeL.position.set(0.12, 0.04, 0.03);
  group.add(shoeL);
  const shoeR = new THREE.Mesh(shoeGeo, shoeMat);
  shoeR.position.set(-0.12, 0.04, 0.03);
  group.add(shoeR);

  // 2. Tronco / Camisa Corporativa
  const torsoGeo = new THREE.CylinderGeometry(0.25, 0.28, 0.9, 16);
  const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColorObj, roughness: 0.6 });
  const torso = new THREE.Mesh(torsoGeo, shirtMat);
  torso.position.y = 1.15;
  torso.castShadow = true;
  group.add(torso);

  // Braços Corporativos
  const armGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.55, 10);
  const armL = new THREE.Mesh(armGeo, shirtMat);
  armL.position.set(0.32, 1.15, 0);
  armL.castShadow = true;
  group.add(armL);

  const armR = new THREE.Mesh(armGeo, shirtMat);
  armR.position.set(-0.32, 1.15, 0);
  armR.castShadow = true;
  group.add(armR);

  // Crachá Corporativo SAP / C2C
  const badgeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 });
  const badge = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.02), badgeMat);
  badge.position.set(0.08, 1.15, 0.22);
  group.add(badge);

  // 3. Cabeça 3D Modelada (Tom de pele natural)
  const headGeo = new THREE.SphereGeometry(0.26, 32, 32);
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xf5d0b1, roughness: 0.4 });
  const head = new THREE.Mesh(headGeo, skinMat);
  head.position.y = 1.82;
  head.castShadow = true;
  group.add(head);

  // 4. Cabelo Volumoso Estilizado (Anime/Cartoon)
  const hairGeo = new THREE.SphereGeometry(0.28, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.65);
  const hairMat = new THREE.MeshStandardMaterial({ color: hairColorObj, roughness: 0.8 });
  const hair = new THREE.Mesh(hairGeo, hairMat);
  hair.position.set(0, 1.88, 0.02);
  hair.rotation.x = -0.15;
  group.add(hair);

  if (isFemale) {
    // Mechas longas / laterais para avatares femininos (Bruna, Juliana, Mariana, Tânia)
    const sideL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.45, 10), hairMat);
    sideL.position.set(0.22, 1.62, 0.05);
    group.add(sideL);
    const sideR = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.45, 10), hairMat);
    sideR.position.set(-0.22, 1.62, 0.05);
    group.add(sideR);
  }

  // 5. Olhos Expressivos
  const eyeGeo = new THREE.SphereGeometry(0.035, 16, 16);
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });

  const lEye = new THREE.Mesh(eyeGeo, eyeMat);
  lEye.position.set(0.08, 1.83, 0.23);
  group.add(lEye);

  const rEye = new THREE.Mesh(eyeGeo, eyeMat);
  rEye.position.set(-0.08, 1.83, 0.23);
  group.add(rEye);

  // Brilho / catchlight cartoon nos olhos
  const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const glintGeo = new THREE.SphereGeometry(0.012, 8, 8);
  const glintL = new THREE.Mesh(glintGeo, glintMat);
  glintL.position.set(-0.01, 0.01, 0.028);
  lEye.add(glintL);
  const glintR = new THREE.Mesh(glintGeo, glintMat);
  glintR.position.set(-0.01, 0.01, 0.028);
  rEye.add(glintR);

  // 6. Nametag Flutuante
  const nametagTex = createNametagTexture(name, role);
  const nametagSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: nametagTex, transparent: true }));
  nametagSprite.position.set(0, 2.38, 0);
  nametagSprite.scale.set(1.5, 0.38, 1);
  group.add(nametagSprite);

  // 7. Balão de Notificação / Fala
  const bubbleTex = createSpeechBubbleTexture(hasTicket);
  const bubbleSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: bubbleTex, transparent: true }));
  bubbleSprite.position.set(0, 2.8, 0);
  bubbleSprite.scale.set(0.55, 0.55, 1);
  group.add(bubbleSprite);
  group.userData.bubble = bubbleSprite;
  return group;
}

/**
 * Creates a stylized cartoon 3D character (boneco animado 3D)
 * Built with modular Three.js primitives for optimal performance and charming aesthetics.
 */
export function createStylizedAvatar(options: StylizedAvatarOptions): StylizedAvatarHandle {
  const {
    name,
    hairColor = 0x222222,
    shirtColor = 0x1d4ed8,
    pantsColor = 0x1e293b,
    skinTone = 0xf5d0b1,
    hairStyle = 'short',
    hasGlasses = false,
    hasBadge = true,
    hasTicket = false,
    role,
    isPlayer = false,
  } = options;

  const group = new THREE.Group();
  group.name = `avatar_${name}`;

  const shirtMat = new THREE.MeshStandardMaterial({
    color: parseColor(shirtColor, 0x1d4ed8),
    roughness: 0.55,
  });
  const skinMat = new THREE.MeshStandardMaterial({
    color: parseColor(skinTone, 0xf5d0b1),
    roughness: 0.45,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: parseColor(hairColor, 0x222222),
    roughness: 0.75,
  });
  const pantsMat = new THREE.MeshStandardMaterial({
    color: parseColor(pantsColor, 0x1e293b),
    roughness: 0.65,
  });
  const shoesMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.4,
  });

  // 0. Contact Soft Shadow
  const shadowGeo = new THREE.CircleGeometry(0.38, 24);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x090d16,
    transparent: true,
    opacity: 0.45,
  });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  group.add(shadow);

  // 1. Pernas & Sapatos (Pants & Polished Shoes)
  const legGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 12);
  const legLeft = new THREE.Mesh(legGeo, pantsMat);
  legLeft.position.set(-0.12, 0.4, 0);
  legLeft.castShadow = true;
  group.add(legLeft);

  const legRight = new THREE.Mesh(legGeo, pantsMat);
  legRight.position.set(0.12, 0.4, 0);
  legRight.castShadow = true;
  group.add(legRight);

  // Sapatos
  const shoeGeo = new THREE.BoxGeometry(0.13, 0.08, 0.22);
  const shoeL = new THREE.Mesh(shoeGeo, shoesMat);
  shoeL.position.set(-0.12, 0.04, 0.03);
  group.add(shoeL);

  const shoeR = new THREE.Mesh(shoeGeo, shoesMat);
  shoeR.position.set(0.12, 0.04, 0.03);
  group.add(shoeR);

  // 2. Corpo / Tronco (Cylinder styled torso)
  const bodyGeometry = new THREE.CylinderGeometry(0.25, 0.28, 0.9, 16);
  const body = new THREE.Mesh(bodyGeometry, shirtMat);
  body.position.y = 1.15;
  body.castShadow = true;
  group.add(body);

  // 2b. Braços (Arms with corporate sleeves and hands)
  const armGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.55, 10);
  const armLeft = new THREE.Mesh(armGeo, shirtMat);
  armLeft.position.set(-0.32, 1.15, 0);
  armLeft.castShadow = true;
  group.add(armLeft);

  // Hand left
  const handGeo = new THREE.SphereGeometry(0.065, 12, 12);
  const handL = new THREE.Mesh(handGeo, skinMat);
  handL.position.set(0, -0.28, 0);
  armLeft.add(handL);

  const armRight = new THREE.Mesh(armGeo, shirtMat);
  armRight.position.set(0.32, 1.15, 0);
  armRight.castShadow = true;
  group.add(armRight);

  // Hand right
  const handR = new THREE.Mesh(handGeo, skinMat);
  handR.position.set(0, -0.28, 0);
  armRight.add(handR);

  // 2c. Crachá corporativo C2C / SAP (Lanyard & Badge)
  if (hasBadge) {
    const badgeMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.2,
      metalness: 0.1,
    });
    const badge = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.02), badgeMat);
    badge.position.set(0.08, 1.15, 0.22);
    group.add(badge);

    // Orange/Blue ribbon
    const ribbonMat = new THREE.MeshBasicMaterial({ color: isPlayer ? 0xea580c : 0x0284c7 });
    const ribbonL = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.28, 6), ribbonMat);
    ribbonL.position.set(0.04, 1.32, 0.18);
    ribbonL.rotation.z = 0.35;
    group.add(ribbonL);

    const ribbonR = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.28, 6), ribbonMat);
    ribbonR.position.set(0.12, 1.32, 0.18);
    ribbonR.rotation.z = -0.35;
    group.add(ribbonR);
  }

  // 3. Cabeça 3D (Smooth Sphere)
  const headGeometry = new THREE.SphereGeometry(0.26, 32, 32);
  const head = new THREE.Mesh(headGeometry, skinMat);
  head.position.y = 1.82;
  head.castShadow = true;
  group.add(head);

  // 4. Cabelo 3D volumoso (substitui completamente a foto chapada)
  const hairGroup = new THREE.Group();
  if (hairStyle === 'long' || hairStyle === 'curly') {
    // Cabelo volumoso feminino/longo (Bruna, Juliana, Mariana, Tânia)
    const hairTopGeo = new THREE.SphereGeometry(0.28, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.65);
    const hairTop = new THREE.Mesh(hairTopGeo, hairMat);
    hairTop.position.set(0, 1.88, 0.02);
    hairTop.rotation.x = -0.15;
    hairGroup.add(hairTop);

    // Laterais volumosas
    const hairSideGeo = new THREE.CylinderGeometry(0.1, 0.14, 0.45, 10);
    const sideL = new THREE.Mesh(hairSideGeo, hairMat);
    sideL.position.set(-0.22, 1.62, 0.05);
    sideL.rotation.z = 0.1;
    hairGroup.add(sideL);

    const sideR = new THREE.Mesh(hairSideGeo, hairMat);
    sideR.position.set(0.22, 1.62, 0.05);
    sideR.rotation.z = -0.1;
    hairGroup.add(sideR);

    // Costas do cabelo
    const hairBack = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.45, 0.12), hairMat);
    hairBack.position.set(0, 1.58, -0.18);
    hairGroup.add(hairBack);
  } else if (hairStyle === 'bun') {
    // Coque elegante (Juliana)
    const hairTopGeo = new THREE.SphereGeometry(0.28, 18, 18, 0, Math.PI * 2, 0, Math.PI * 0.65);
    const hairTop = new THREE.Mesh(hairTopGeo, hairMat);
    hairTop.position.set(0, 1.88, 0.02);
    hairTop.rotation.x = -0.15;
    hairGroup.add(hairTop);

    const bunGeo = new THREE.SphereGeometry(0.14, 14, 14);
    const bun = new THREE.Mesh(bunGeo, hairMat);
    bun.position.set(0, 2.05, -0.15);
    hairGroup.add(bun);
  } else {
    // Corte executivo moderno / topete volumoso (Marcelo, Carlos, Lucas, Fabio, Marcos)
    const hairGeometry = new THREE.SphereGeometry(0.28, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.65);
    const hairMesh = new THREE.Mesh(hairGeometry, hairMat);
    hairMesh.position.set(0, 1.88, 0.02);
    hairMesh.rotation.x = -0.15;
    hairGroup.add(hairMesh);

    // Topete frontal estilizado
    const quiffGeo = new THREE.BoxGeometry(0.24, 0.12, 0.16);
    const quiff = new THREE.Mesh(quiffGeo, hairMat);
    quiff.position.set(0, 2.0, 0.12);
    quiff.rotation.x = 0.25;
    hairGroup.add(quiff);
  }
  group.add(hairGroup);

  // 5. Olhos estilizados com brilho cartunesco
  const eyeGeometry = new THREE.SphereGeometry(0.035, 16, 16);
  const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1 });

  const pupilGeo = new THREE.SphereGeometry(0.012, 8, 8);
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  // Left Eye
  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  leftEye.position.set(-0.08, 1.83, 0.23);
  group.add(leftEye);

  const glintL = new THREE.Mesh(pupilGeo, pupilMat);
  glintL.position.set(-0.01, 0.01, 0.028);
  leftEye.add(glintL);

  // Right Eye
  const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  rightEye.position.set(0.08, 1.83, 0.23);
  group.add(rightEye);

  const glintR = new THREE.Mesh(pupilGeo, pupilMat);
  glintR.position.set(-0.01, 0.01, 0.028);
  rightEye.add(glintR);

  // Sobrancelhas sutis
  const browMat = new THREE.MeshBasicMaterial({ color: parseColor(hairColor, 0x222222) });
  const browGeo = new THREE.BoxGeometry(0.07, 0.018, 0.018);

  const browL = new THREE.Mesh(browGeo, browMat);
  browL.position.set(-0.08, 1.89, 0.24);
  browL.rotation.z = -0.05;
  group.add(browL);

  const browR = new THREE.Mesh(browGeo, browMat);
  browR.position.set(0.08, 1.89, 0.24);
  browR.rotation.z = 0.05;
  group.add(browR);

  // 6. Óculos intelectuais / SAP (Key User, Contábil, Gestão)
  if (hasGlasses) {
    const glassesMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const glassRimL = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.01, 8, 16), glassesMat);
    glassRimL.position.set(-0.08, 1.83, 0.24);
    group.add(glassRimL);

    const glassRimR = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.01, 8, 16), glassesMat);
    glassRimR.position.set(0.08, 1.83, 0.24);
    group.add(glassRimR);

    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.01, 0.01), glassesMat);
    bridge.position.set(0, 1.83, 0.25);
    group.add(bridge);
  }

  // 7. Floating Nametag Sprite ("MARCELO", "BRUNA", etc.)
  const nametagTex = createNametagTexture(name, role);
  const nametagMat = new THREE.SpriteMaterial({ map: nametagTex, transparent: true });
  const nametagSprite = new THREE.Sprite(nametagMat);
  nametagSprite.position.set(0, 2.38, 0);
  nametagSprite.scale.set(1.5, 0.38, 1);
  group.add(nametagSprite);

  // 8. Floating Speech / Attention Bubble
  let currentTicketState = hasTicket;
  let bubbleSprite: THREE.Sprite | undefined;
  if (!isPlayer) {
    const bubbleTex = createSpeechBubbleTexture(hasTicket);
    const bubbleMat = new THREE.SpriteMaterial({ map: bubbleTex, transparent: true });
    bubbleSprite = new THREE.Sprite(bubbleMat);
    bubbleSprite.position.set(0, 2.8, 0);
    bubbleSprite.scale.set(0.55, 0.55, 1);
    group.add(bubbleSprite);
  }

  // Animation handler
  const updateAnimation = (time: number, isWalking: boolean, speedMultiplier = 1) => {
    if (isWalking) {
      // Natural walking swing cycle
      const cycle = time * 8.5 * speedMultiplier;
      legLeft.rotation.x = Math.sin(cycle) * 0.55;
      legRight.rotation.x = -Math.sin(cycle) * 0.55;
      shoeL.position.z = 0.03 + Math.sin(cycle) * 0.12;
      shoeR.position.z = 0.03 - Math.sin(cycle) * 0.12;

      armLeft.rotation.x = -Math.sin(cycle) * 0.45;
      armRight.rotation.x = Math.sin(cycle) * 0.45;

      body.position.y = 1.15 + Math.abs(Math.sin(cycle)) * 0.035;
      head.position.y = 1.82 + Math.abs(Math.sin(cycle)) * 0.035;
    } else {
      // Subtle idle breathing & posture
      const breath = Math.sin(time * 2.2 + (options.name.charCodeAt(0) % 5)) * 0.015;
      body.scale.set(1 + breath * 0.3, 1 + breath, 1 + breath * 0.3);
      head.position.y = 1.82 + breath * 0.6;
      legLeft.rotation.x = 0;
      legRight.rotation.x = 0;
      armLeft.rotation.x = Math.sin(time * 1.5) * 0.04;
      armRight.rotation.x = -Math.sin(time * 1.5) * 0.04;
    }

    // Gentle float on attention bubble
    if (bubbleSprite) {
      bubbleSprite.position.y = 2.8 + Math.sin(time * 3.5 + 1) * 0.05;
    }
  };

  const setBubbleState = (nextTicketState: boolean) => {
    if (currentTicketState === nextTicketState || !bubbleSprite) return;
    currentTicketState = nextTicketState;
    const oldMat = bubbleSprite.material;
    const newTex = createSpeechBubbleTexture(nextTicketState);
    bubbleSprite.material = new THREE.SpriteMaterial({ map: newTex, transparent: true });
    oldMat.dispose();
  };

  const destroy = () => {
    group.clear();
    nametagTex.dispose();
  };

  return {
    group,
    head,
    body,
    hair: hairGroup.children[0] as THREE.Mesh,
    armLeft,
    armRight,
    legLeft,
    legRight,
    nametagSprite,
    bubbleSprite,
    updateAnimation,
    setBubbleState,
    destroy,
  };
}
