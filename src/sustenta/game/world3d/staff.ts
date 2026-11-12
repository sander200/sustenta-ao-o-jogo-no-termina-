import * as THREE from 'three';

export type StaffPose = 'idle' | 'walk' | 'type' | 'sip';

export type StaffRig = {
  root: THREE.Group;
  hips: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
};

export type StaffLook = {
  name: string;
  shirt: string;
  pants?: string;
  hair: string;
  skin?: string;
  hairStyle?: 'short' | 'long' | 'wavy' | 'quiff' | 'bald';
  beard?: boolean;
  mustache?: boolean;
  glasses?: boolean;
  receding?: boolean;
  stripes?: boolean;
  female?: boolean;
  stocky?: boolean;
  collar?: string;
  lanyard?: boolean;
  shoe?: string;
  face?: string;
};

function nameTag(label: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgba(15,23,42,0.88)';
  ctx.beginPath();
  ctx.roundRect(24, 10, 208, 44, 14);
  ctx.fill();
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 26px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label.toUpperCase(), 128, 32);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
  sprite.position.y = 2.25;
  sprite.scale.set(1.15, 0.29, 1);
  return sprite;
}

function stripedShirt(base: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = '#f8fafc';
  for (let y = 4; y < 64; y += 12) ctx.fillRect(0, y, 64, 4);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export function createStaff(look: StaffLook): StaffRig {
  const root = new THREE.Group();
  const skinMat = new THREE.MeshStandardMaterial({ color: look.skin ?? '#e7b48a', roughness: 0.48 });
  const shirtMat = new THREE.MeshStandardMaterial({
    color: look.stripes ? '#ffffff' : look.shirt,
    map: look.stripes ? stripedShirt(look.shirt) : null,
    roughness: 0.55,
  });
  const pantsMat = new THREE.MeshStandardMaterial({ color: look.pants ?? '#3d6ea8', roughness: 0.72 });
  const hairMat = new THREE.MeshStandardMaterial({ color: look.hair, roughness: 0.62 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: look.shoe ?? '#111827', roughness: 0.35 });
  const width = look.female ? 0.92 : look.stocky ? 1.16 : 1;

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.34, 16),
    new THREE.MeshBasicMaterial({ color: '#0f172a', transparent: true, opacity: 0.28 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  root.add(shadow);
  root.add(nameTag(look.name.split(' ')[0]));

  const hips = new THREE.Group();
  hips.position.y = 0.86;
  root.add(hips);

  const leg = (x: number) => {
    const pivot = new THREE.Group();
    const jean = new THREE.Mesh(new THREE.CylinderGeometry(0.085 * width, 0.07, 0.78, 10), pantsMat);
    jean.position.y = -0.4;
    jean.castShadow = true;
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.07, 0.22), shoeMat);
    shoe.position.set(0, -0.8, 0.04);
    shoe.castShadow = true;
    pivot.add(jean, shoe);
    pivot.position.x = x;
    return pivot;
  };
  const legL = leg(-0.11 * width);
  const legR = leg(0.11 * width);
  hips.add(legL, legR);

  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.32 * width, 0.06, 0.2), new THREE.MeshStandardMaterial({ color: '#3f3f46' }));
  belt.position.y = 0.04;
  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.045, 0.02), new THREE.MeshStandardMaterial({ color: '#d6d3d1', metalness: 0.6, roughness: 0.3 }));
  buckle.position.set(0, 0.04, 0.1);
  hips.add(belt, buckle);

  const torso = new THREE.Group();
  hips.add(torso);
  const chest = new THREE.Mesh(new THREE.CapsuleGeometry(0.18 * width, 0.28, 6, 12), shirtMat);
  chest.position.y = 0.28;
  chest.castShadow = true;
  torso.add(chest);
  if (look.stocky) {
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.14 * width, 12, 10), shirtMat);
    belly.position.set(0, 0.16, 0.08);
    belly.scale.set(1, 0.85, 0.7);
    torso.add(belly);
  }
  const collarColor = look.collar ?? '#f8fafc';
  const collarMat = new THREE.MeshStandardMaterial({ color: collarColor, roughness: 0.5 });
  const collarL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.04), collarMat);
  collarL.position.set(-0.06, 0.44, 0.12);
  collarL.rotation.z = 0.5;
  const collarR = collarL.clone();
  collarR.position.x = 0.06;
  collarR.rotation.z = -0.5;
  torso.add(collarL, collarR);
  if (look.lanyard) {
    const strap = new THREE.MeshStandardMaterial({ color: '#2563eb' });
    const left = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.32, 0.015), strap);
    left.position.set(-0.05, 0.28, 0.16);
    left.rotation.z = 0.15;
    const right = left.clone();
    right.position.x = 0.06;
    right.rotation.z = -0.15;
    const badge = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, 0.015), new THREE.MeshStandardMaterial({ color: '#f8fafc' }));
    badge.position.set(0, 0.1, 0.17);
    torso.add(left, right, badge);
  }

  const arm = (side: number) => {
    const pivot = new THREE.Group();
    const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.055 * width, 0.05, 0.22, 8), shirtMat);
    upper.position.y = -0.12;
    upper.castShadow = true;
    const fore = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.22, 8), skinMat);
    fore.position.y = -0.34;
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), skinMat);
    hand.position.y = -0.48;
    hand.scale.set(1, 0.8, 0.7);
    pivot.add(upper, fore, hand);
    pivot.position.set(side * 0.24 * width, 0.4, 0);
    return pivot;
  };
  const armL = arm(-1);
  const armR = arm(1);
  torso.add(armL, armR);

  const head = new THREE.Group();
  head.position.y = 0.5;
  torso.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.32, 24, 18), skinMat);
  skull.scale.set(1.05, 1.12, 0.98);
  skull.castShadow = true;
  head.add(skull);
  if (look.face) {
    const faceMat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false });
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 0.92), faceMat);
    face.position.set(0, 0.02, 0.28);
    head.add(face);
    new THREE.TextureLoader().load(look.face, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      faceMat.map = texture;
      faceMat.needsUpdate = true;
    });
  }

  if (!look.face) {
  const white = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.25 });
  const irisMat = new THREE.MeshStandardMaterial({ color: '#6b3a1f', roughness: 0.3 });
  const pupilMat = new THREE.MeshBasicMaterial({ color: '#0c0a09' });
  const catchMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  for (const x of [-0.11, 0.11]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 12), white);
    eye.scale.set(1, 1.2, 0.42);
    eye.position.set(x, 0.05, 0.28);
    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.062, 12, 8), irisMat);
    iris.position.set(x, 0.04, 0.33);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), pupilMat);
    pupil.position.set(x, 0.04, 0.36);
    const catchLight = new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 6), catchMat);
    catchLight.position.set(x + 0.022, 0.07, 0.37);
    head.add(eye, iris, pupil, catchLight);
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.022, 0.02), hairMat);
    brow.position.set(x, 0.18, 0.3);
    brow.rotation.z = x < 0 ? 0.2 : -0.2;
    head.add(brow);
  }
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), skinMat);
  nose.position.set(0, -0.02, 0.34);
  nose.scale.set(0.8, 0.9, 0.7);
  head.add(nose);
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.016, 6, 16, Math.PI), new THREE.MeshStandardMaterial({ color: '#7f1d1d' }));
  smile.position.set(0, -0.13, 0.28);
  smile.rotation.x = Math.PI / 2;
  smile.rotation.z = Math.PI;
  const teeth = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.02), white);
  teeth.position.set(0, -0.11, 0.3);
  head.add(smile, teeth);
  for (const x of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), skinMat);
    ear.position.set(x * 0.32, 0, 0);
    ear.scale.set(0.45, 1, 0.7);
    head.add(ear);
  }
  if (look.beard) {
    const beard = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), hairMat);
    beard.position.set(0, -0.18, 0.08);
    beard.scale.set(0.95, 0.55, 0.7);
    head.add(beard);
  }
  if (look.mustache || look.beard) {
    const mustache = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), hairMat);
    mustache.position.set(0, -0.07, 0.34);
    mustache.scale.set(1.6, 0.4, 0.5);
    head.add(mustache);
  }
  if (look.glasses) {
    const frame = new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.3 });
    for (const x of [-0.11, 0.11]) {
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.012, 8, 18), frame);
      rim.position.set(x, 0.05, 0.36);
      head.add(rim);
    }
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.012, 0.012), frame);
    bridge.position.set(0, 0.06, 0.36);
    head.add(bridge);
  }
  }

  const style = look.hairStyle ?? 'short';
  if (style === 'long' || style === 'wavy') {
    const drop = style === 'wavy' ? 0.42 : 0.62;
    for (const x of [-0.16, 0.16]) {
      const lock = new THREE.Mesh(new THREE.CapsuleGeometry(style === 'wavy' ? 0.09 : 0.07, drop, 4, 8), hairMat);
      lock.position.set(x, -drop * 0.35, -0.05);
      lock.rotation.z = x < 0 ? 0.15 : -0.15;
      head.add(lock);
    }
    const crown = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 10), hairMat);
    crown.position.set(0, style === 'wavy' ? 0.12 : 0.16, -0.04);
    crown.scale.set(1.15, style === 'wavy' ? 0.7 : 0.45, 1.05);
    head.add(crown);
  } else if (style === 'quiff') {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 10), hairMat);
    cap.position.set(0, 0.16, -0.02);
    cap.scale.set(1.05, 0.55, 1);
    const quiff = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), hairMat);
    quiff.position.set(0, 0.28, 0.08);
    quiff.scale.set(1.1, 0.7, 0.8);
    head.add(cap, quiff);
  } else if (style !== 'bald') {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 10), hairMat);
    cap.position.set(0, look.receding ? 0.08 : 0.16, look.receding ? -0.08 : -0.02);
    cap.scale.set(1.08, look.receding ? 0.38 : 0.5, look.receding ? 0.85 : 1);
    head.add(cap);
  }

  return { root, hips, torso, head, armL, armR, legL, legR };
}

export function poseStaff(rig: StaffRig, pose: StaffPose, time: number) {
  const { hips, torso, head, armL, armR, legL, legR } = rig;
  hips.position.y = 0.86;
  torso.rotation.set(0, 0, 0);
  head.rotation.set(0, 0, 0);
  armL.rotation.set(0.08, 0, 0.18);
  armR.rotation.set(0.08, 0, -0.18);
  legL.rotation.set(0, 0, 0);
  legR.rotation.set(0, 0, 0);

  if (pose === 'idle') {
    torso.rotation.x = Math.sin(time * 1.5) * 0.03;
    head.rotation.y = Math.sin(time * 0.7) * 0.25;
    head.rotation.z = Math.sin(time * 0.7) * 0.04;
    return;
  }
  if (pose === 'walk') {
    const step = Math.sin(time);
    legL.rotation.x = step * 0.75;
    legR.rotation.x = -step * 0.75;
    armL.rotation.x = -step * 0.65;
    armR.rotation.x = step * 0.65;
    hips.position.y = 0.86 + Math.abs(step) * 0.045;
    torso.rotation.y = step * 0.08;
    head.rotation.y = -step * 0.05;
    return;
  }
  if (pose === 'type') {
    hips.position.y = 0.52;
    legL.rotation.x = -1.2;
    legR.rotation.x = -1.2;
    torso.rotation.x = 0.18;
    head.rotation.x = 0.28;
    const tap = Math.sin(time * 14);
    armL.rotation.set(-1.05 + tap * 0.14, 0, 0.35);
    armR.rotation.set(-1.05 - tap * 0.14, 0, -0.35);
    return;
  }
  hips.position.y = 0.86;
  armR.rotation.set(-1.35, 0, -0.25);
  head.rotation.x = -0.12 + Math.sin(time * 2) * 0.04;
}
