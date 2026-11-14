import * as THREE from 'three';
import { createC2CBadgeTexture, createHairStrandTexture, createHumanSkinTexture } from './textures.ts';

export type CharacterAnimState =
  | 'idle'
  | 'walk'
  | 'run'
  | 'sit'
  | 'typing'
  | 'talking'
  | 'turning'
  | 'interacting'
  | 'coffee';

export type HairStyle =
  | 'receding_fade'
  | 'side_part'
  | 'curly'
  | 'long_wavy'
  | 'bob_wavy'
  | 'silver_classic'
  | 'modern_fade';

export interface CharacterAppearance {
  gender: 'male' | 'female';
  build?: 'regular' | 'stocky' | 'slim';
  skinColor: number;
  hairColor: number;
  hairStyle: HairStyle;
  eyeColor: number;
  shirtColor: number;
  shirtStyle: 'polo' | 'polo_striped' | 'dress' | 'dress_rolled' | 'blouse' | 'blazer';
  collarColor?: number;
  pantsColor: number;
  shoeColor: number;
  shoeStyle: 'oxford' | 'sneaker' | 'boot' | 'flat';
  facialHair?: 'none' | 'goatee' | 'trimmed_beard' | 'mustache';
  glasses?: boolean;
  watchColor?: number;
  hasC2CLanyard?: boolean;
  hasBadge?: boolean;
  heightScale?: number;
}

export interface HumanRig {
  root: THREE.Group;
  pelvis: THREE.Group;
  spine: THREE.Group;
  chest: THREE.Group;
  neck: THREE.Group;
  head: THREE.Group;
  shoulderL: THREE.Group;
  elbowL: THREE.Group;
  wristL: THREE.Group;
  shoulderR: THREE.Group;
  elbowR: THREE.Group;
  wristR: THREE.Group;
  hipL: THREE.Group;
  kneeL: THREE.Group;
  ankleL: THREE.Group;
  hipR: THREE.Group;
  kneeR: THREE.Group;
  ankleR: THREE.Group;
}

export interface CharacterInstance {
  rig: HumanRig;
  mixer: THREE.AnimationMixer;
  actions: Record<CharacterAnimState, THREE.AnimationAction>;
  currentState: CharacterAnimState;
  coffeeMug: THREE.Group;
  setAnimation: (next: CharacterAnimState, fadeDuration?: number) => void;
  setHoldingCoffee: (holding: boolean) => void;
  update: (dt: number) => void;
}

// Pre-allocated shared animation clips (reused across all characters for high performance!)
let cachedClips: Record<CharacterAnimState, THREE.AnimationClip> | null = null;

function createEulerQuatTrack(
  nodeName: string,
  times: number[],
  eulers: [number, number, number][]
): THREE.QuaternionKeyframeTrack {
  const values: number[] = [];
  const e = new THREE.Euler();
  const q = new THREE.Quaternion();
  for (const [rx, ry, rz] of eulers) {
    e.set(rx, ry, rz, 'XYZ');
    q.setFromEuler(e);
    values.push(q.x, q.y, q.z, q.w);
  }
  return new THREE.QuaternionKeyframeTrack(`${nodeName}.quaternion`, times, values);
}

function createCharacterClips(): Record<CharacterAnimState, THREE.AnimationClip> {
  if (cachedClips) return cachedClips;

  // Pelvis standing height is 0.88m
  const PY = 0.88;
  const SIT_PY = 0.50;

  // 1. IDLE: subtle breathing, weight shift, relaxed arms, subtle head glance
  const idleClip = new THREE.AnimationClip('idle', 3.2, [
    new THREE.VectorKeyframeTrack('pelvis.position', [0, 1.6, 3.2], [0, PY, 0, 0, PY - 0.008, 0, 0, PY, 0]),
    createEulerQuatTrack('spine', [0, 1.6, 3.2], [[0.01, 0, 0], [0.035, 0.02, 0], [0.01, 0, 0]]),
    createEulerQuatTrack('chest', [0, 1.6, 3.2], [[0, 0, 0], [-0.02, -0.015, 0], [0, 0, 0]]),
    createEulerQuatTrack('head', [0, 0.9, 1.8, 2.6, 3.2], [
      [0.02, 0, 0],
      [0.01, 0.07, 0.02],
      [0.03, -0.05, -0.01],
      [0.01, 0.02, 0],
      [0.02, 0, 0],
    ]),
    createEulerQuatTrack('shoulderL', [0, 1.6, 3.2], [[0.04, 0, 0.09], [0.07, 0, 0.11], [0.04, 0, 0.09]]),
    createEulerQuatTrack('shoulderR', [0, 1.6, 3.2], [[0.04, 0, -0.09], [0.02, 0, -0.11], [0.04, 0, -0.09]]),
    createEulerQuatTrack('elbowL', [0, 1.6, 3.2], [[-0.18, 0, 0], [-0.24, 0, 0], [-0.18, 0, 0]]),
    createEulerQuatTrack('elbowR', [0, 1.6, 3.2], [[-0.18, 0, 0], [-0.22, 0, 0], [-0.18, 0, 0]]),
    createEulerQuatTrack('hipL', [0, 3.2], [[0, 0, 0.02], [0, 0, 0.02]]),
    createEulerQuatTrack('hipR', [0, 3.2], [[0, 0, -0.02], [0, 0, -0.02]]),
    createEulerQuatTrack('kneeL', [0, 3.2], [[0.04, 0, 0], [0.04, 0, 0]]),
    createEulerQuatTrack('kneeR', [0, 3.2], [[0.04, 0, 0], [0.04, 0, 0]]),
  ]);

  // 2. WALKING: natural contralateral stride, pelvis bob & yaw, knee bend, ankle push-off
  const wt = [0, 0.22, 0.45, 0.67, 0.9];
  const walkClip = new THREE.AnimationClip('walk', 0.9, [
    new THREE.VectorKeyframeTrack('pelvis.position', wt, [
      0, PY, 0,
      0, PY + 0.032, 0,
      0, PY - 0.01, 0,
      0, PY + 0.032, 0,
      0, PY, 0,
    ]),
    createEulerQuatTrack('pelvis', wt, [
      [0.03, -0.06, 0.02],
      [0.03, 0, 0],
      [0.03, 0.06, -0.02],
      [0.03, 0, 0],
      [0.03, -0.06, 0.02],
    ]),
    createEulerQuatTrack('spine', wt, [
      [0.04, 0.08, 0],
      [0.04, 0, 0],
      [0.04, -0.08, 0],
      [0.04, 0, 0],
      [0.04, 0.08, 0],
    ]),
    createEulerQuatTrack('hipL', wt, [
      [-0.45, 0, 0.02],
      [0.05, 0, 0.02],
      [0.42, 0, 0.02],
      [-0.12, 0, 0.02],
      [-0.45, 0, 0.02],
    ]),
    createEulerQuatTrack('kneeL', wt, [
      [0.12, 0, 0],
      [0.18, 0, 0],
      [0.25, 0, 0],
      [0.82, 0, 0],
      [0.12, 0, 0],
    ]),
    createEulerQuatTrack('ankleL', wt, [
      [-0.15, 0, 0],
      [0.02, 0, 0],
      [0.22, 0, 0],
      [-0.18, 0, 0],
      [-0.15, 0, 0],
    ]),
    createEulerQuatTrack('hipR', wt, [
      [0.42, 0, -0.02],
      [-0.12, 0, -0.02],
      [-0.45, 0, -0.02],
      [0.05, 0, -0.02],
      [0.42, 0, -0.02],
    ]),
    createEulerQuatTrack('kneeR', wt, [
      [0.25, 0, 0],
      [0.82, 0, 0],
      [0.12, 0, 0],
      [0.18, 0, 0],
      [0.25, 0, 0],
    ]),
    createEulerQuatTrack('ankleR', wt, [
      [0.22, 0, 0],
      [-0.18, 0, 0],
      [-0.15, 0, 0],
      [0.02, 0, 0],
      [0.22, 0, 0],
    ]),
    createEulerQuatTrack('shoulderL', wt, [
      [0.42, 0, 0.08],
      [0.05, 0, 0.08],
      [-0.38, 0, 0.08],
      [0.05, 0, 0.08],
      [0.42, 0, 0.08],
    ]),
    createEulerQuatTrack('elbowL', wt, [
      [-0.22, 0, 0],
      [-0.34, 0, 0],
      [-0.48, 0, 0],
      [-0.30, 0, 0],
      [-0.22, 0, 0],
    ]),
    createEulerQuatTrack('shoulderR', wt, [
      [-0.38, 0, -0.08],
      [0.05, 0, -0.08],
      [0.42, 0, -0.08],
      [0.05, 0, -0.08],
      [-0.38, 0, -0.08],
    ]),
    createEulerQuatTrack('elbowR', wt, [
      [-0.48, 0, 0],
      [-0.30, 0, 0],
      [-0.22, 0, 0],
      [-0.34, 0, 0],
      [-0.48, 0, 0],
    ]),
  ]);

  // 3. RUNNING: dynamic forward lean, deeper knee lift, fast pumping elbows
  const rt = [0, 0.14, 0.28, 0.42, 0.56];
  const runClip = new THREE.AnimationClip('run', 0.56, [
    new THREE.VectorKeyframeTrack('pelvis.position', rt, [
      0, PY - 0.02, 0,
      0, PY + 0.055, 0,
      0, PY - 0.02, 0,
      0, PY + 0.055, 0,
      0, PY - 0.02, 0,
    ]),
    createEulerQuatTrack('pelvis', rt, [
      [0.14, -0.1, 0],
      [0.14, 0, 0],
      [0.14, 0.1, 0],
      [0.14, 0, 0],
      [0.14, -0.1, 0],
    ]),
    createEulerQuatTrack('spine', rt, [
      [0.14, 0.14, 0],
      [0.14, 0, 0],
      [0.14, -0.14, 0],
      [0.14, 0, 0],
      [0.14, 0.14, 0],
    ]),
    createEulerQuatTrack('hipL', rt, [
      [-0.78, 0, 0.02],
      [0.12, 0, 0.02],
      [0.68, 0, 0.02],
      [-0.28, 0, 0.02],
      [-0.78, 0, 0.02],
    ]),
    createEulerQuatTrack('kneeL', rt, [
      [0.24, 0, 0],
      [0.35, 0, 0],
      [0.45, 0, 0],
      [1.25, 0, 0],
      [0.24, 0, 0],
    ]),
    createEulerQuatTrack('hipR', rt, [
      [0.68, 0, -0.02],
      [-0.28, 0, -0.02],
      [-0.78, 0, -0.02],
      [0.12, 0, -0.02],
      [0.68, 0, -0.02],
    ]),
    createEulerQuatTrack('kneeR', rt, [
      [0.45, 0, 0],
      [1.25, 0, 0],
      [0.24, 0, 0],
      [0.35, 0, 0],
      [0.45, 0, 0],
    ]),
    createEulerQuatTrack('shoulderL', rt, [
      [0.72, 0, 0.12],
      [0.05, 0, 0.12],
      [-0.72, 0, 0.12],
      [0.05, 0, 0.12],
      [0.72, 0, 0.12],
    ]),
    createEulerQuatTrack('elbowL', rt, [
      [-1.15, 0, 0],
      [-1.25, 0, 0],
      [-1.35, 0, 0],
      [-1.25, 0, 0],
      [-1.15, 0, 0],
    ]),
    createEulerQuatTrack('shoulderR', rt, [
      [-0.72, 0, -0.12],
      [0.05, 0, -0.12],
      [0.72, 0, -0.12],
      [0.05, 0, -0.12],
      [-0.72, 0, -0.12],
    ]),
    createEulerQuatTrack('elbowR', rt, [
      [-1.35, 0, 0],
      [-1.25, 0, 0],
      [-1.15, 0, 0],
      [-1.25, 0, 0],
      [-1.35, 0, 0],
    ]),
  ]);

  // 4. SITTING: seated comfortably in ergonomic chair
  const sitClip = new THREE.AnimationClip('sit', 2.6, [
    new THREE.VectorKeyframeTrack('pelvis.position', [0, 2.6], [0, SIT_PY, 0, 0, SIT_PY, 0]),
    createEulerQuatTrack('spine', [0, 1.3, 2.6], [[-0.04, 0, 0], [-0.02, 0.03, 0], [-0.04, 0, 0]]),
    createEulerQuatTrack('head', [0, 1.3, 2.6], [[0.03, -0.05, 0], [0.05, 0.06, 0], [0.03, -0.05, 0]]),
    createEulerQuatTrack('hipL', [0, 2.6], [[-1.42, 0.08, 0.04], [-1.42, 0.08, 0.04]]),
    createEulerQuatTrack('hipR', [0, 2.6], [[-1.42, -0.08, -0.04], [-1.42, -0.08, -0.04]]),
    createEulerQuatTrack('kneeL', [0, 2.6], [[1.42, 0, 0], [1.42, 0, 0]]),
    createEulerQuatTrack('kneeR', [0, 2.6], [[1.42, 0, 0], [1.42, 0, 0]]),
    createEulerQuatTrack('shoulderL', [0, 1.3, 2.6], [[-0.25, 0, 0.14], [-0.22, 0, 0.14], [-0.25, 0, 0.14]]),
    createEulerQuatTrack('elbowL', [0, 1.3, 2.6], [[-0.85, 0, 0], [-0.88, 0, 0], [-0.85, 0, 0]]),
    createEulerQuatTrack('shoulderR', [0, 1.3, 2.6], [[-0.25, 0, -0.14], [-0.28, 0, -0.14], [-0.25, 0, -0.14]]),
    createEulerQuatTrack('elbowR', [0, 1.3, 2.6], [[-0.85, 0, 0], [-0.82, 0, 0], [-0.85, 0, 0]]),
  ]);

  // 5. TYPING: seated at workstation, forearms extended over keyboard, fingers/wrists tapping
  const tt = [0, 0.25, 0.5, 0.75, 1.0, 1.25];
  const typingClip = new THREE.AnimationClip('typing', 1.25, [
    new THREE.VectorKeyframeTrack('pelvis.position', [0, 1.25], [0, SIT_PY, 0, 0, SIT_PY, 0]),
    createEulerQuatTrack('spine', [0, 0.62, 1.25], [[0.08, 0, 0], [0.1, 0.02, 0], [0.08, 0, 0]]),
    createEulerQuatTrack('head', [0, 0.62, 1.25], [[0.12, -0.06, 0], [0.10, 0.06, 0], [0.12, -0.06, 0]]),
    createEulerQuatTrack('hipL', [0, 1.25], [[-1.45, 0.06, 0.03], [-1.45, 0.06, 0.03]]),
    createEulerQuatTrack('hipR', [0, 1.25], [[-1.45, -0.06, -0.03], [-1.45, -0.06, -0.03]]),
    createEulerQuatTrack('kneeL', [0, 1.25], [[1.45, 0, 0], [1.45, 0, 0]]),
    createEulerQuatTrack('kneeR', [0, 1.25], [[1.45, 0, 0], [1.45, 0, 0]]),
    createEulerQuatTrack('shoulderL', tt, [
      [-0.55, -0.15, 0.1],
      [-0.52, -0.15, 0.1],
      [-0.58, -0.15, 0.1],
      [-0.53, -0.15, 0.1],
      [-0.56, -0.15, 0.1],
      [-0.55, -0.15, 0.1],
    ]),
    createEulerQuatTrack('elbowL', tt, [
      [-1.05, 0, 0],
      [-1.12, 0, 0],
      [-0.98, 0, 0],
      [-1.10, 0, 0],
      [-1.02, 0, 0],
      [-1.05, 0, 0],
    ]),
    createEulerQuatTrack('wristL', tt, [
      [-0.1, 0, 0],
      [0.14, 0, 0],
      [-0.08, 0, 0],
      [0.15, 0, 0],
      [-0.12, 0, 0],
      [-0.1, 0, 0],
    ]),
    createEulerQuatTrack('shoulderR', tt, [
      [-0.58, 0.15, -0.1],
      [-0.53, 0.15, -0.1],
      [-0.55, 0.15, -0.1],
      [-0.59, 0.15, -0.1],
      [-0.52, 0.15, -0.1],
      [-0.58, 0.15, -0.1],
    ]),
    createEulerQuatTrack('elbowR', tt, [
      [-1.0, 0, 0],
      [-0.94, 0, 0],
      [-1.12, 0, 0],
      [-0.98, 0, 0],
      [-1.10, 0, 0],
      [-1.0, 0, 0],
    ]),
    createEulerQuatTrack('wristR', tt, [
      [0.14, 0, 0],
      [-0.12, 0, 0],
      [0.15, 0, 0],
      [-0.10, 0, 0],
      [0.12, 0, 0],
      [0.14, 0, 0],
    ]),
  ]);

  // 6. TALKING: expressive conversational arm gestures + head nods
  const tkt = [0, 0.55, 1.1, 1.65, 2.2];
  const talkingClip = new THREE.AnimationClip('talking', 2.2, [
    new THREE.VectorKeyframeTrack('pelvis.position', [0, 1.1, 2.2], [0, PY, 0, 0, PY - 0.01, 0, 0, PY, 0]),
    createEulerQuatTrack('spine', tkt, [
      [0.02, 0, 0],
      [0.05, 0.08, 0.02],
      [0.01, -0.06, -0.02],
      [0.04, 0.05, 0],
      [0.02, 0, 0],
    ]),
    createEulerQuatTrack('head', tkt, [
      [0.02, 0, 0],
      [0.11, 0.08, 0.04],
      [-0.04, -0.08, -0.04],
      [0.09, 0.04, 0.02],
      [0.02, 0, 0],
    ]),
    createEulerQuatTrack('shoulderL', tkt, [
      [-0.22, 0, 0.12],
      [-0.48, -0.15, 0.22],
      [-0.30, 0, 0.15],
      [-0.42, -0.1, 0.18],
      [-0.22, 0, 0.12],
    ]),
    createEulerQuatTrack('elbowL', tkt, [
      [-0.55, 0, 0],
      [-1.05, 0, 0],
      [-0.72, 0, 0],
      [-0.95, 0, 0],
      [-0.55, 0, 0],
    ]),
    createEulerQuatTrack('shoulderR', tkt, [
      [-0.28, 0, -0.14],
      [-0.55, 0.15, -0.25],
      [-0.65, 0.22, -0.28],
      [-0.38, 0.08, -0.18],
      [-0.28, 0, -0.14],
    ]),
    createEulerQuatTrack('elbowR', tkt, [
      [-0.68, 0, 0],
      [-1.12, 0, 0],
      [-0.85, 0, 0],
      [-1.05, 0, 0],
      [-0.68, 0, 0],
    ]),
  ]);

  // 7. TURNING: weight transfer & body pivot
  const trt = [0, 0.3, 0.6];
  const turningClip = new THREE.AnimationClip('turning', 0.6, [
    new THREE.VectorKeyframeTrack('pelvis.position', trt, [0, PY, 0, 0, PY + 0.025, 0, 0, PY, 0]),
    createEulerQuatTrack('spine', trt, [[0, 0, 0], [0.04, 0.16, 0], [0, 0, 0]]),
    createEulerQuatTrack('hipL', trt, [[0, 0, 0.03], [-0.28, 0, 0.04], [0, 0, 0.03]]),
    createEulerQuatTrack('kneeL', trt, [[0.04, 0, 0], [0.45, 0, 0], [0.04, 0, 0]]),
    createEulerQuatTrack('hipR', trt, [[0, 0, -0.03], [0.15, 0, -0.04], [0, 0, -0.03]]),
    createEulerQuatTrack('shoulderL', trt, [[0, 0, 0.1], [-0.22, 0, 0.14], [0, 0, 0.1]]),
    createEulerQuatTrack('shoulderR', trt, [[0, 0, -0.1], [0.22, 0, -0.14], [0, 0, -0.1]]),
  ]);

  // 8. INTERACTING: reaching forward with right hand & leaning gently
  const it = [0, 0.35, 0.7, 1.0];
  const interactingClip = new THREE.AnimationClip('interacting', 1.0, [
    new THREE.VectorKeyframeTrack('pelvis.position', it, [0, PY, 0, 0, PY - 0.02, 0, 0, PY - 0.02, 0, 0, PY, 0]),
    createEulerQuatTrack('spine', it, [[0, 0, 0], [0.14, -0.12, 0], [0.12, -0.08, 0], [0, 0, 0]]),
    createEulerQuatTrack('shoulderR', it, [[0, 0, -0.1], [-0.95, 0.1, -0.12], [-0.82, 0.1, -0.12], [0, 0, -0.1]]),
    createEulerQuatTrack('elbowR', it, [[-0.2, 0, 0], [-0.65, 0, 0], [-0.85, 0, 0], [-0.2, 0, 0]]),
    createEulerQuatTrack('wristR', it, [[0, 0, 0], [-0.2, 0, 0], [0.15, 0, 0], [0, 0, 0]]),
    createEulerQuatTrack('shoulderL', it, [[0, 0, 0.1], [0.15, 0, 0.12], [0.12, 0, 0.12], [0, 0, 0.1]]),
  ]);

  // 9. COFFEE: standing relaxed holding mug and taking warm sips while chatting
  const cft = [0, 1.1, 2.0, 2.9, 4.0];
  const coffeeClip = new THREE.AnimationClip('coffee', 4.0, [
    new THREE.VectorKeyframeTrack('pelvis.position', [0, 2.0, 4.0], [0, PY, 0, 0, PY - 0.008, 0, 0, PY, 0]),
    createEulerQuatTrack('spine', cft, [
      [0.01, 0, 0],
      [0.03, 0.04, 0],
      [0.04, 0.02, 0],
      [0.02, -0.04, 0],
      [0.01, 0, 0],
    ]),
    createEulerQuatTrack('head', cft, [
      [0.02, 0.04, 0],
      [-0.08, 0.0, 0],
      [-0.12, 0.0, 0],
      [0.03, -0.08, 0.02],
      [0.02, 0.04, 0],
    ]),
    createEulerQuatTrack('shoulderL', cft, [
      [0.05, 0, 0.1],
      [0.08, 0, 0.12],
      [0.06, 0, 0.1],
      [-0.18, -0.05, 0.16],
      [0.05, 0, 0.1],
    ]),
    createEulerQuatTrack('elbowL', cft, [
      [-0.25, 0, 0],
      [-0.28, 0, 0],
      [-0.24, 0, 0],
      [-0.75, 0, 0],
      [-0.25, 0, 0],
    ]),
    createEulerQuatTrack('shoulderR', cft, [
      [-0.36, 0.12, -0.08],
      [-0.68, 0.18, -0.06],
      [-0.72, 0.18, -0.06],
      [-0.38, 0.10, -0.08],
      [-0.36, 0.12, -0.08],
    ]),
    createEulerQuatTrack('elbowR', cft, [
      [-1.08, 0, 0],
      [-1.58, 0, 0],
      [-1.62, 0, 0],
      [-1.05, 0, 0],
      [-1.08, 0, 0],
    ]),
    createEulerQuatTrack('wristR', cft, [
      [0.05, 0, 0],
      [0.24, 0, 0],
      [0.26, 0, 0],
      [0.04, 0, 0],
      [0.05, 0, 0],
    ]),
  ]);

  cachedClips = {
    idle: idleClip,
    walk: walkClip,
    run: runClip,
    sit: sitClip,
    typing: typingClip,
    talking: talkingClip,
    turning: turningClip,
    interacting: interactingClip,
    coffee: coffeeClip,
  };
  return cachedClips;
}

/**
 * Helper: Sculpted Lathe Geometry along Y from profile points [[radius, y], ...]
 */
function createSculptedLathe(
  profile: [number, number][],
  radialSegments = 18,
  scaleX = 1,
  scaleZ = 1
): THREE.BufferGeometry {
  const pts = profile.map(([r, y]) => new THREE.Vector2(Math.max(0.001, r), y));
  const geo = new THREE.LatheGeometry(pts, radialSegments);
  if (scaleX !== 1 || scaleZ !== 1) {
    geo.scale(scaleX, 1, scaleZ);
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Builds an articulated, stylized-realistic 3D human character with full anatomy,
 * modeled face, sculpted hair, corporate attire, joints, and AnimationMixer rig.
 */
export function buildHumanCharacter(
  appearance: CharacterAppearance,
  castShadow: boolean
): CharacterInstance {
  const root = new THREE.Group();
  const scaleH = appearance.heightScale ?? (appearance.gender === 'female' ? 0.96 : 1.0);
  const buildFactor = appearance.build === 'stocky' ? 1.16 : appearance.build === 'slim' ? 0.92 : 1.0;

  const isFemale = appearance.gender === 'female';
  const faceSkinTex = createHumanSkinTexture(appearance.skinColor, isFemale);
  const hairStrandTex = createHairStrandTexture(appearance.hairColor);

  // Materials (Warm natural human skin with subtle sheen + textured hair)
  const skinMat = new THREE.MeshPhysicalMaterial({
    color: appearance.skinColor,
    roughness: 0.56,
    metalness: 0.01,
    sheen: 0.25,
    sheenRoughness: 0.8,
    sheenColor: new THREE.Color(0xffcbb8),
    clearcoat: 0.04,
    clearcoatRoughness: 0.75,
  });

  const faceSkinMat = new THREE.MeshPhysicalMaterial({
    map: faceSkinTex,
    roughness: 0.54,
    metalness: 0.01,
    sheen: 0.28,
    sheenRoughness: 0.78,
    sheenColor: new THREE.Color(0xffcbb8),
    clearcoat: 0.05,
    clearcoatRoughness: 0.7,
  });

  const hairMat = new THREE.MeshStandardMaterial({
    map: hairStrandTex,
    roughness: 0.64,
    metalness: 0.06,
  });

  const shirtMat = new THREE.MeshPhysicalMaterial({
    color: appearance.shirtColor,
    roughness: 0.72,
    metalness: 0.02,
    sheen: 0.35,
    sheenRoughness: 0.75,
    sheenColor: new THREE.Color(appearance.shirtColor).lerp(new THREE.Color(0xffffff), 0.3),
  });

  const collarMat = new THREE.MeshPhysicalMaterial({
    color: appearance.collarColor ?? appearance.shirtColor,
    roughness: 0.68,
    metalness: 0.02,
  });

  const pantsMat = new THREE.MeshPhysicalMaterial({
    color: appearance.pantsColor,
    roughness: 0.82,
    metalness: 0.02,
    sheen: 0.25,
    sheenRoughness: 0.85,
  });

  const shoeMat = new THREE.MeshPhysicalMaterial({
    color: appearance.shoeColor,
    roughness: appearance.shoeStyle === 'oxford' ? 0.26 : 0.48,
    metalness: 0.1,
    clearcoat: appearance.shoeStyle === 'oxford' ? 0.45 : 0.1,
  });

  const soleMat = new THREE.MeshStandardMaterial({
    color: appearance.shoeStyle === 'sneaker' ? 0xf1f5f9 : 0x111827,
    roughness: 0.7,
  });

  const beltMat = new THREE.MeshStandardMaterial({ color: 0x2b1d14, roughness: 0.38, metalness: 0.1 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.9, roughness: 0.2 });

  const setShadow = (m: THREE.Object3D) => {
    m.castShadow = castShadow;
    m.receiveShadow = castShadow;
  };

  // --- SOFT CONTACT SHADOW DISC ---
  const contactShadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.32, 24),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.34, depthWrite: false })
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = 0.015;
  root.add(contactShadow);

  // --- PELVIS (Hips & Waist) ---
  const pelvis = new THREE.Group();
  pelvis.name = 'pelvis';
  pelvis.position.set(0, 0.88, 0);
  root.add(pelvis);

  const pelvisGeo = createSculptedLathe(
    [
      [0.01, -0.08],
      [0.145 * buildFactor, -0.05],
      [0.155 * buildFactor, 0.03],
      [0.135 * buildFactor, 0.09],
      [0.01, 0.11],
    ],
    20,
    1.12,
    0.78
  );
  const pelvisMesh = new THREE.Mesh(pelvisGeo, pantsMat);
  setShadow(pelvisMesh);
  pelvis.add(pelvisMesh);

  // Leather belt & metallic buckle
  const beltMesh = new THREE.Mesh(
    createSculptedLathe(
      [
        [0.139 * buildFactor, 0.06],
        [0.142 * buildFactor, 0.105],
      ],
      20,
      1.13,
      0.81
    ),
    beltMat
  );
  pelvis.add(beltMesh);

  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.042, 0.02), metalMat);
  buckle.position.set(0, 0.082, 0.118 * buildFactor);
  pelvis.add(buckle);

  // --- SPINE & CHEST ---
  const spine = new THREE.Group();
  spine.name = 'spine';
  spine.position.set(0, 0.09, 0);
  pelvis.add(spine);

  const chest = new THREE.Group();
  chest.name = 'chest';
  chest.position.set(0, 0.16, 0);
  spine.add(chest);
  const torsoProfile: [number, number][] = isFemale
    ? [
        [0.01, -0.02],
        [0.132 * buildFactor, 0.0],
        [0.118 * buildFactor, 0.10],
        [0.145 * buildFactor, 0.24],
        [0.152 * buildFactor, 0.34],
        [0.125 * buildFactor, 0.42],
        [0.062, 0.45],
        [0.01, 0.455],
      ]
    : [
        [0.01, -0.02],
        [0.138 * buildFactor, 0.0],
        [0.136 * buildFactor, 0.12],
        [0.165 * buildFactor, 0.28],
        [0.182 * buildFactor, 0.38],
        [0.142 * buildFactor, 0.44],
        [0.068, 0.465],
        [0.01, 0.47],
      ];

  const torsoGeo = createSculptedLathe(torsoProfile, 22, 1.18, 0.72);
  const torsoMesh = new THREE.Mesh(torsoGeo, shirtMat);
  torsoMesh.position.y = -0.15;
  setShadow(torsoMesh);
  chest.add(torsoMesh);

  // Striped polo bands (for Roberto Viana)
  if (appearance.shirtStyle === 'polo_striped') {
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.7 });
    [0.02, 0.11, 0.20].forEach((sy) => {
      const band = new THREE.Mesh(
        createSculptedLathe(
          [
            [0.148 * buildFactor, sy],
            [0.156 * buildFactor, sy + 0.022],
          ],
          22,
          1.19,
          0.735
        ),
        stripeMat
      );
      chest.add(band);
    });
  }

  // Blazer lapels for Mariana
  if (appearance.shirtStyle === 'blazer') {
    const innerTopMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 });
    const innerV = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.26, 0.05), innerTopMat);
    innerV.position.set(0, 0.19, 0.105 * buildFactor);
    chest.add(innerV);
  }

  // Shirt Collar & Placket / Buttons
  const collarShape = new THREE.Shape();
  collarShape.moveTo(-0.085, 0);
  collarShape.lineTo(-0.02, -0.065);
  collarShape.lineTo(0, -0.03);
  collarShape.lineTo(0.02, -0.065);
  collarShape.lineTo(0.085, 0);
  collarShape.lineTo(0.065, 0.038);
  collarShape.lineTo(-0.065, 0.038);
  collarShape.closePath();

  const collarGeo = new THREE.ExtrudeGeometry(collarShape, {
    depth: 0.022,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.006,
    bevelSegments: 2,
  });
  const collarMesh = new THREE.Mesh(collarGeo, collarMat);
  collarMesh.position.set(0, 0.295, 0.055 * buildFactor);
  collarMesh.rotation.x = -0.35;
  chest.add(collarMesh);

  // Shirt front buttons
  if (appearance.shirtStyle === 'dress' || appearance.shirtStyle === 'dress_rolled' || appearance.shirtStyle === 'polo' || appearance.shirtStyle === 'polo_striped') {
    const btnCount = appearance.shirtStyle.startsWith('polo') ? 2 : 4;
    const btnMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3 });
    for (let b = 0; b < btnCount; b++) {
      const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.008, 10), btnMat);
      btn.rotation.x = Math.PI / 2;
      btn.position.set(0, 0.24 - b * 0.065, 0.128 * buildFactor);
      chest.add(btn);
    }
  }

  // Marcelo's C2C Lanyard & Corporate Photo Badge
  if (appearance.hasC2CLanyard || appearance.hasBadge) {
    const lanyardCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.06, 0.315, 0.02),
      new THREE.Vector3(-0.055, 0.23, 0.12 * buildFactor),
      new THREE.Vector3(0.0, 0.11, 0.135 * buildFactor),
      new THREE.Vector3(0.055, 0.23, 0.12 * buildFactor),
      new THREE.Vector3(0.06, 0.315, 0.02),
    ]);
    const lanyardMat = new THREE.MeshStandardMaterial({
      color: appearance.hasC2CLanyard ? 0xea580c : 0x0284c7,
      roughness: 0.55,
    });
    const lanyardMesh = new THREE.Mesh(new THREE.TubeGeometry(lanyardCurve, 24, 0.009, 6, false), lanyardMat);
    chest.add(lanyardMesh);

    const badgeTex = createC2CBadgeTexture();
    const badgeMat = new THREE.MeshPhysicalMaterial({
      map: badgeTex,
      roughness: 0.25,
      clearcoat: 0.6,
    });
    const badge = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.098, 0.008), badgeMat);
    badge.position.set(0, 0.065, 0.138 * buildFactor);
    chest.add(badge);
  }

  // --- NECK & SCULPTED HUMAN HEAD ---
  const neck = new THREE.Group();
  neck.name = 'neck';
  neck.position.set(0, 0.31, 0);
  chest.add(neck);

  const neckGeo = createSculptedLathe(
    [
      [0.068, -0.02],
      [0.054, 0.04],
      [0.052, 0.09],
      [0.058, 0.12],
    ],
    16,
    1.0,
    0.95
  );
  const neckMesh = new THREE.Mesh(neckGeo, skinMat);
  setShadow(neckMesh);
  neck.add(neckMesh);

  const head = new THREE.Group();
  head.name = 'head';
  head.position.set(0, 0.10, 0);
  neck.add(head);

  // Sculpted human cranium + jawline + chin
  const headGeo = createSculptedLathe(
    [
      [0.001, -0.01],
      [0.055, 0.005], // chin
      [0.084, 0.05],  // jaw / lower cheeks
      [0.094, 0.11],  // cheekbones
      [0.095, 0.17],  // temples
      [0.082, 0.215], // crown
      [0.045, 0.24],
      [0.001, 0.248],
    ],
    24,
    0.94,
    1.06
  );
  // Subtle forward chin & brow projection
  const hPos = headGeo.attributes.position;
  for (let i = 0; i < hPos.count; i++) {
    const y = hPos.getY(i);
    const z = hPos.getZ(i);
    if (z > 0.02 && y < 0.08) {
      hPos.setZ(i, z + (0.08 - y) * 0.14); // natural chin & mouth plane
    }
  }
  headGeo.computeVertexNormals();

  const headMesh = new THREE.Mesh(headGeo, faceSkinMat);
  setShadow(headMesh);
  head.add(headMesh);

  // Subtle Cheekbone Contours (humanized soft fullness)
  [-1, 1].forEach((side) => {
    const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 10), faceSkinMat);
    cheek.scale.set(1.15, 0.85, 0.65);
    cheek.position.set(side * 0.048, 0.095, 0.082);
    head.add(cheek);
  });

  // Ears (Left & Right sculpted auricles)
  const earGeo = createSculptedLathe(
    [
      [0.001, -0.026],
      [0.018, -0.018],
      [0.022, 0.005],
      [0.017, 0.024],
      [0.001, 0.028],
    ],
    12,
    0.55,
    0.9
  );
  [-1, 1].forEach((side) => {
    const ear = new THREE.Mesh(earGeo, skinMat);
    ear.position.set(side * 0.088, 0.116, -0.01);
    ear.rotation.z = side * -0.18;
    ear.rotation.y = side * 0.25;
    head.add(ear);
  });

  // Sculpted Nose (Bridge + Tip + Nostril Wings)
  const noseBridge = new THREE.Mesh(
    createSculptedLathe(
      [
        [0.007, 0],
        [0.012, 0.018],
        [0.0085, 0.044],
        [0.003, 0.054],
      ],
      10,
      0.88,
      1.2
    ),
    skinMat
  );
  noseBridge.position.set(0, 0.097, 0.096);
  noseBridge.rotation.x = -0.24;
  head.add(noseBridge);

  const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.0135, 12, 10), skinMat);
  noseTip.scale.set(1.08, 0.84, 1.0);
  noseTip.position.set(0, 0.098, 0.109);
  head.add(noseTip);

  [-1, 1].forEach((side) => {
    const wing = new THREE.Mesh(new THREE.SphereGeometry(0.0075, 8, 8), skinMat);
    wing.position.set(side * 0.0105, 0.094, 0.103);
    head.add(wing);
  });

  // Expressive Eyes with Blinking Eyelids & Eyelashes
  const scleraMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.22 });
  const irisMat = new THREE.MeshStandardMaterial({ color: appearance.eyeColor, roughness: 0.18 });
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.08 });
  const catchlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const browMat = new THREE.MeshStandardMaterial({ color: appearance.hairColor, roughness: 0.72 });
  const lashMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.6 });
  const eyelids: THREE.Group[] = [];

  [-1, 1].forEach((side) => {
    const eyeGroup = new THREE.Group();
    eyeGroup.position.set(side * 0.035, 0.132, 0.087);

    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.017, 14, 12), scleraMat);
    sclera.scale.set(1.05, 0.84, 0.75);
    eyeGroup.add(sclera);

    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.0102, 12, 10), irisMat);
    iris.position.set(0, 0, 0.0088);
    iris.scale.set(1, 1, 0.58);
    eyeGroup.add(iris);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.0055, 10, 8), pupilMat);
    pupil.position.set(0, 0, 0.0124);
    eyeGroup.add(pupil);

    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.0023, 6, 6), catchlightMat);
    glint.position.set(0.0036, 0.0036, 0.0155);
    eyeGroup.add(glint);

    // Animated Upper Eyelid Shell (pivots to blink smoothly)
    const eyelidPivot = new THREE.Group();
    const upperLid = new THREE.Mesh(
      new THREE.SphereGeometry(0.0185, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.44),
      skinMat
    );
    upperLid.scale.set(1.06, 0.88, 0.78);
    eyelidPivot.add(upperLid);

    // Delicate upper lash rim
    const lashCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.015, 0.004, 0.011),
      new THREE.Vector3(0, 0.009, 0.0145),
      new THREE.Vector3(0.015, 0.004, 0.011),
    ]);
    const lash = new THREE.Mesh(new THREE.TubeGeometry(lashCurve, 8, 0.0018, 5, false), lashMat);
    eyelidPivot.add(lash);

    eyelidPivot.rotation.x = -0.52; // open resting position
    eyeGroup.add(eyelidPivot);
    eyelids.push(eyelidPivot);

    // Sculpted arched eyebrow
    const browCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.016, 0.022, 0.008),
      new THREE.Vector3(0, 0.0265, 0.012),
      new THREE.Vector3(0.016, 0.0205, 0.006),
    ]);
    const brow = new THREE.Mesh(new THREE.TubeGeometry(browCurve, 8, 0.0038, 6, false), browMat);
    eyeGroup.add(brow);

    head.add(eyeGroup);
  });

  // Sculpted Upper & Lower Lips (Natural Warm Smile)
  const upperLipMat = new THREE.MeshStandardMaterial({
    color: isFemale ? 0xc05663 : 0xa35a52,
    roughness: 0.42,
  });
  const lowerLipMat = new THREE.MeshStandardMaterial({
    color: isFemale ? 0xd16874 : 0xb36960,
    roughness: 0.38,
  });
  const upperLipCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.022, 0.061, 0.095),
    new THREE.Vector3(-0.008, 0.062, 0.104),
    new THREE.Vector3(0, 0.060, 0.106),
    new THREE.Vector3(0.008, 0.062, 0.104),
    new THREE.Vector3(0.022, 0.061, 0.095),
  ]);
  const upperLip = new THREE.Mesh(new THREE.TubeGeometry(upperLipCurve, 12, 0.0035, 6, false), upperLipMat);
  head.add(upperLip);

  const lowerLipCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.019, 0.059, 0.096),
    new THREE.Vector3(0, 0.053, 0.1055),
    new THREE.Vector3(0.019, 0.059, 0.096),
  ]);
  const lowerLip = new THREE.Mesh(new THREE.TubeGeometry(lowerLipCurve, 10, 0.0044, 6, false), lowerLipMat);
  head.add(lowerLip);

  // Glasses (Marcelo & Roberto Viana)
  if (appearance.glasses) {
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.25, metalness: 0.35 });
    const lensMat = new THREE.MeshPhysicalMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.22,
      roughness: 0.05,
      clearcoat: 1.0,
    });
    [-1, 1].forEach((side) => {
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.0038, 8, 20), frameMat);
      rim.position.set(side * 0.037, 0.132, 0.108);
      head.add(rim);

      const lens = new THREE.Mesh(new THREE.CircleGeometry(0.023, 18), lensMat);
      lens.position.set(side * 0.037, 0.132, 0.108);
      head.add(lens);

      // Temple arm reaching back to ear
      const temple = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.004, 0.11), frameMat);
      temple.position.set(side * 0.063, 0.135, 0.055);
      temple.rotation.y = side * -0.18;
      head.add(temple);
    });
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.004, 0.005), frameMat);
    bridge.position.set(0, 0.135, 0.11);
    head.add(bridge);
  }

  // Facial Hair
  if (appearance.facialHair === 'goatee' || appearance.facialHair === 'trimmed_beard') {
    const beardMat = new THREE.MeshStandardMaterial({ color: appearance.hairColor, roughness: 0.85 });
    const chinBeard = new THREE.Mesh(
      createSculptedLathe(
        [
          [0.001, -0.015],
          [0.058, 0.004],
          [0.082, 0.045],
          [0.062, 0.072],
          [0.001, 0.075],
        ],
        18,
        0.95,
        1.07
      ),
      beardMat
    );
    chinBeard.position.set(0, 0.002, 0.006);
    head.add(chinBeard);

    // Mustache arch
    const stacheCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.032, 0.064, 0.092),
      new THREE.Vector3(-0.014, 0.072, 0.105),
      new THREE.Vector3(0, 0.073, 0.107),
      new THREE.Vector3(0.014, 0.072, 0.105),
      new THREE.Vector3(0.032, 0.064, 0.092),
    ]);
    const stache = new THREE.Mesh(new THREE.TubeGeometry(stacheCurve, 12, 0.0065, 6, false), beardMat);
    head.add(stache);
  } else if (appearance.facialHair === 'mustache') {
    const stacheMat = new THREE.MeshStandardMaterial({ color: appearance.hairColor, roughness: 0.8 });
    const stacheCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.033, 0.066, 0.092),
      new THREE.Vector3(-0.012, 0.075, 0.107),
      new THREE.Vector3(0, 0.076, 0.109),
      new THREE.Vector3(0.012, 0.075, 0.107),
      new THREE.Vector3(0.033, 0.066, 0.092),
    ]);
    const stache = new THREE.Mesh(new THREE.TubeGeometry(stacheCurve, 14, 0.0075, 6, false), stacheMat);
    head.add(stache);
  }

  // Individually Modeled Hair
  buildSculptedHair(head, appearance.hairStyle, hairMat, castShadow);

  // --- SHOULDERS, ARMS, ELBOWS & HANDS ---
  const createArm = (side: -1 | 1) => {
    const shoulder = new THREE.Group();
    shoulder.name = side === -1 ? 'shoulderL' : 'shoulderR';
    shoulder.position.set(side * (0.195 * buildFactor), 0.255, 0);
    chest.add(shoulder);

    const isShortSleeve = appearance.shirtStyle === 'polo' || appearance.shirtStyle === 'polo_striped' || appearance.shirtStyle === 'blouse';
    const isRolledSleeve = appearance.shirtStyle === 'dress_rolled';

    // Deltoid shoulder cap
    const deltoid = new THREE.Mesh(new THREE.SphereGeometry(0.058 * buildFactor, 14, 12), shirtMat);
    deltoid.scale.set(0.95, 1.05, 0.92);
    setShadow(deltoid);
    shoulder.add(deltoid);

    // Upper arm
    const upperArmGeo = createSculptedLathe(
      [
        [0.038 * buildFactor, -0.25],
        [0.044 * buildFactor, -0.14],
        [0.052 * buildFactor, -0.02],
        [0.01, 0.0],
      ],
      14
    );
    const upperArmMesh = new THREE.Mesh(
      upperArmGeo,
      isShortSleeve ? skinMat : shirtMat
    );
    setShadow(upperArmMesh);
    shoulder.add(upperArmMesh);

    if (isShortSleeve) {
      // Tailored short sleeve over upper half of upper arm
      const sleeveGeo = createSculptedLathe(
        [
          [0.053 * buildFactor, -0.145],
          [0.056 * buildFactor, -0.04],
          [0.052 * buildFactor, 0.0],
        ],
        14
      );
      const sleeve = new THREE.Mesh(sleeveGeo, shirtMat);
      setShadow(sleeve);
      shoulder.add(sleeve);
    }

    // Elbow joint
    const elbow = new THREE.Group();
    elbow.name = side === -1 ? 'elbowL' : 'elbowR';
    elbow.position.set(0, -0.25, 0);
    shoulder.add(elbow);

    const elbowCapMat = isShortSleeve || isRolledSleeve ? skinMat : shirtMat;
    const elbowCap = new THREE.Mesh(new THREE.SphereGeometry(0.037 * buildFactor, 12, 10), elbowCapMat);
    elbow.add(elbowCap);

    // Forearm
    const forearmGeo = createSculptedLathe(
      [
        [0.026 * buildFactor, -0.23],
        [0.033 * buildFactor, -0.12],
        [0.038 * buildFactor, 0.0],
      ],
      14
    );
    const forearm = new THREE.Mesh(forearmGeo, isShortSleeve || isRolledSleeve ? skinMat : shirtMat);
    setShadow(forearm);
    elbow.add(forearm);

    if (isRolledSleeve) {
      // Rolled cuff at upper forearm
      const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.041 * buildFactor, 0.011, 8, 16), shirtMat);
      cuff.rotation.x = Math.PI / 2;
      cuff.position.y = -0.035;
      elbow.add(cuff);
    }

    // Wristwatch on Left Wrist
    if (side === -1 && appearance.watchColor !== undefined) {
      const strapMat = new THREE.MeshStandardMaterial({ color: appearance.watchColor, roughness: 0.35, metalness: 0.65 });
      const strap = new THREE.Mesh(new THREE.CylinderGeometry(0.031 * buildFactor, 0.031 * buildFactor, 0.022, 14), strapMat);
      strap.position.y = -0.205;
      elbow.add(strap);

      const dial = new THREE.Mesh(
        new THREE.CylinderGeometry(0.016, 0.016, 0.008, 14),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.2, roughness: 0.2 })
      );
      dial.rotation.z = Math.PI / 2;
      dial.position.set(-0.032 * buildFactor, -0.205, 0);
      elbow.add(dial);
    }

    // Wrist & Anatomical Rounded Human Hand (Sculpted Palm + Thumb + Tapered Fingers)
    const wrist = new THREE.Group();
    wrist.name = side === -1 ? 'wristL' : 'wristR';
    wrist.position.set(0, -0.23, 0);
    elbow.add(wrist);

    const palmGeo = createSculptedLathe(
      [
        [0.016, -0.065],
        [0.028, -0.042],
        [0.029, -0.018],
        [0.022, 0.0],
      ],
      14,
      0.52,
      1.05
    );
    const palm = new THREE.Mesh(palmGeo, skinMat);
    setShadow(palm);
    wrist.add(palm);

    // Finger cluster (4 slightly splayed, naturally curled fingers)
    for (let f = 0; f < 4; f++) {
      const len = f === 1 || f === 2 ? -0.044 : -0.036;
      const finger = new THREE.Mesh(
        createSculptedLathe([[0.0042, len], [0.0062, 0]], 8),
        skinMat
      );
      finger.position.set(side * -0.002, -0.058, -0.018 + f * 0.012);
      finger.rotation.z = side * -0.18;
      wrist.add(finger);
    }

    // Thumb
    const thumb = new THREE.Mesh(createSculptedLathe([[0.0048, -0.032], [0.0072, 0]], 8), skinMat);
    thumb.position.set(0, -0.022, 0.026);
    thumb.rotation.x = 0.58;
    wrist.add(thumb);

    return { shoulder, elbow, wrist };
  };

  const leftArm = createArm(-1);
  const rightArm = createArm(1);

  // Ceramic Office Coffee Mug Prop (held in Right Hand during coffee breaks)
  const coffeeMug = new THREE.Group();
  const mugBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.036, 0.031, 0.078, 14),
    new THREE.MeshPhysicalMaterial({ color: 0xf8fafc, roughness: 0.18, clearcoat: 0.65 })
  );
  coffeeMug.add(mugBody);
  const mugLiquid = new THREE.Mesh(
    new THREE.CircleGeometry(0.032, 12),
    new THREE.MeshStandardMaterial({ color: 0x3b2314, roughness: 0.15 })
  );
  mugLiquid.rotation.x = -Math.PI / 2;
  mugLiquid.position.y = 0.033;
  coffeeMug.add(mugLiquid);
  const mugHandle = new THREE.Mesh(
    new THREE.TorusGeometry(0.022, 0.0055, 8, 14, Math.PI),
    new THREE.MeshPhysicalMaterial({ color: 0xf8fafc, roughness: 0.2, clearcoat: 0.6 })
  );
  mugHandle.rotation.z = -Math.PI / 2;
  mugHandle.position.set(0.034, 0, 0);
  coffeeMug.add(mugHandle);

  coffeeMug.position.set(-0.025, -0.055, 0.04);
  coffeeMug.rotation.set(Math.PI * 0.48, 0, 0.12);
  coffeeMug.visible = false;
  rightArm.wrist.add(coffeeMug);

  // --- HIPS, LEGS, KNEES & DETAILED SHOES ---
  const createLeg = (side: -1 | 1) => {
    const hip = new THREE.Group();
    hip.name = side === -1 ? 'hipL' : 'hipR';
    hip.position.set(side * (0.095 * buildFactor), -0.04, 0);
    pelvis.add(hip);

    const hipCap = new THREE.Mesh(new THREE.SphereGeometry(0.072 * buildFactor, 14, 12), pantsMat);
    hip.add(hipCap);

    // Thigh
    const thighGeo = createSculptedLathe(
      [
        [0.056 * buildFactor, -0.40],
        [0.068 * buildFactor, -0.22],
        [0.076 * buildFactor, -0.04],
        [0.01, 0],
      ],
      16,
      0.96,
      1.04
    );
    const thigh = new THREE.Mesh(thighGeo, pantsMat);
    setShadow(thigh);
    hip.add(thigh);

    // Knee
    const knee = new THREE.Group();
    knee.name = side === -1 ? 'kneeL' : 'kneeR';
    knee.position.set(0, -0.40, 0);
    hip.add(knee);

    const kneeCap = new THREE.Mesh(new THREE.SphereGeometry(0.055 * buildFactor, 12, 10), pantsMat);
    knee.add(kneeCap);

    // Lower leg / Calf
    const calfGeo = createSculptedLathe(
      [
        [0.043 * buildFactor, -0.39],
        [0.050 * buildFactor, -0.20],
        [0.056 * buildFactor, 0],
      ],
      16,
      0.95,
      1.02
    );
    const calf = new THREE.Mesh(calfGeo, pantsMat);
    setShadow(calf);
    knee.add(calf);

    // Ankle & Sculpted Shoe
    const ankle = new THREE.Group();
    ankle.name = side === -1 ? 'ankleL' : 'ankleR';
    ankle.position.set(0, -0.39, 0);
    knee.add(ankle);

    // Shoe sole (beveled extruded foot profile)
    const shoeShape = new THREE.Shape();
    shoeShape.moveTo(-0.044, -0.055);
    shoeShape.quadraticCurveTo(-0.048, 0.05, -0.036, 0.13);
    shoeShape.quadraticCurveTo(0, 0.17, 0.036, 0.13);
    shoeShape.quadraticCurveTo(0.048, 0.05, 0.044, -0.055);
    shoeShape.quadraticCurveTo(0, -0.07, -0.044, -0.055);

    const soleGeo = new THREE.ExtrudeGeometry(shoeShape, {
      depth: 0.022,
      bevelEnabled: true,
      bevelThickness: 0.004,
      bevelSize: 0.004,
      bevelSegments: 2,
    });
    soleGeo.rotateX(Math.PI / 2);
    const sole = new THREE.Mesh(soleGeo, soleMat);
    sole.position.set(0, -0.03, 0.01);
    setShadow(sole);
    ankle.add(sole);

    // Shoe upper / vamp
    const upperGeo = new THREE.ExtrudeGeometry(shoeShape, {
      depth: 0.048,
      bevelEnabled: true,
      bevelThickness: 0.014,
      bevelSize: 0.006,
      bevelSegments: 3,
    });
    upperGeo.rotateX(Math.PI / 2);
    const shoeUpper = new THREE.Mesh(upperGeo, shoeMat);
    shoeUpper.position.set(0, 0.018, 0.01);
    shoeUpper.scale.set(0.95, 0.85, 0.96);
    setShadow(shoeUpper);
    ankle.add(shoeUpper);

    return { hip, knee, ankle };
  };

  const leftLeg = createLeg(-1);
  const rightLeg = createLeg(1);

  // Scale character height cleanly while keeping foot bottom at y = 0
  root.scale.setScalar(scaleH);

  const rig: HumanRig = {
    root,
    pelvis,
    spine,
    chest,
    neck,
    head,
    shoulderL: leftArm.shoulder,
    elbowL: leftArm.elbow,
    wristL: leftArm.wrist,
    shoulderR: rightArm.shoulder,
    elbowR: rightArm.elbow,
    wristR: rightArm.wrist,
    hipL: leftLeg.hip,
    kneeL: leftLeg.knee,
    ankleL: leftLeg.ankle,
    hipR: rightLeg.hip,
    kneeR: rightLeg.knee,
    ankleR: rightLeg.ankle,
  };

  // Setup AnimationMixer & 9 Independent Clips
  const mixer = new THREE.AnimationMixer(root);
  const clips = createCharacterClips();
  const actions: Record<CharacterAnimState, THREE.AnimationAction> = {
    idle: mixer.clipAction(clips.idle),
    walk: mixer.clipAction(clips.walk),
    run: mixer.clipAction(clips.run),
    sit: mixer.clipAction(clips.sit),
    typing: mixer.clipAction(clips.typing),
    talking: mixer.clipAction(clips.talking),
    turning: mixer.clipAction(clips.turning),
    interacting: mixer.clipAction(clips.interacting),
    coffee: mixer.clipAction(clips.coffee),
  };

  actions.idle.play();
  let currentState: CharacterAnimState = 'idle';
  let blinkCooldown = 2.0 + Math.random() * 3.0;
  let blinkProgress = -1;

  const setAnimation = (next: CharacterAnimState, fadeDuration = 0.22) => {
    if (next === currentState) return;
    const prevAction = actions[currentState];
    const nextAction = actions[next];
    nextAction.reset();
    nextAction.setEffectiveTimeScale(1);
    nextAction.setEffectiveWeight(1);
    nextAction.play();
    prevAction.crossFadeTo(nextAction, fadeDuration, true);
    currentState = next;
  };

  const instance: CharacterInstance = {
    rig,
    mixer,
    actions,
    coffeeMug,
    get currentState() {
      return currentState;
    },
    set currentState(v: CharacterAnimState) {
      currentState = v;
    },
    setAnimation,
    setHoldingCoffee: (holding: boolean) => {
      coffeeMug.visible = holding;
    },
    update: (dt: number) => {
      mixer.update(dt);

      // Natural asynchronous eye blinking
      if (blinkProgress < 0) {
        blinkCooldown -= dt;
        if (blinkCooldown <= 0) {
          blinkProgress = 0;
          blinkCooldown = 2.6 + Math.random() * 3.4;
        }
      } else {
        blinkProgress += dt * 7.5;
        const closedAmt = blinkProgress <= 1 ? Math.sin(blinkProgress * Math.PI) : 0;
        const lidAngle = THREE.MathUtils.lerp(-0.52, 0.35, closedAmt);
        for (const lid of eyelids) {
          lid.rotation.x = lidAngle;
        }
        if (blinkProgress >= 1) {
          blinkProgress = -1;
          for (const lid of eyelids) {
            lid.rotation.x = -0.52;
          }
        }
      }
    },
  };

  return instance;
}

function buildSculptedHair(
  head: THREE.Group,
  style: HairStyle,
  mat: THREE.Material,
  castShadow: boolean
) {
  const hairGroup = new THREE.Group();
  const addPart = (mesh: THREE.Mesh) => {
    mesh.castShadow = castShadow;
    hairGroup.add(mesh);
  };

  if (style === 'receding_fade' || style === 'side_part' || style === 'silver_classic' || style === 'modern_fade') {
    // Natural temple/sideburn transitions framing ears
    [-1, 1].forEach((side) => {
      const sideburn = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.048, 0.022), mat);
      sideburn.position.set(side * 0.084, 0.132, 0.022);
      addPart(sideburn);
    });
  }

  if (style === 'receding_fade') {
    // Marcelo: clean short sides/back + receding natural hairline
    const crownCap = new THREE.Mesh(
      createSculptedLathe(
        [
          [0.095, 0.14],
          [0.098, 0.185],
          [0.086, 0.225],
          [0.048, 0.248],
          [0.001, 0.254],
        ],
        20,
        0.95,
        1.07
      ),
      mat
    );
    crownCap.position.set(0, 0.002, -0.015);
    addPart(crownCap);

    // Back taper
    const backFade = new THREE.Mesh(new THREE.SphereGeometry(0.088, 16, 12, 0, Math.PI * 2, 0.5, 1.3), mat);
    backFade.scale.set(0.96, 1.0, 1.02);
    backFade.position.set(0, 0.135, -0.018);
    addPart(backFade);
  } else if (style === 'side_part' || style === 'silver_classic') {
    // Dr. Marcos / Roberto: sculpted parted hair with volume sweep
    const baseCap = new THREE.Mesh(
      createSculptedLathe(
        [
          [0.097, 0.13],
          [0.102, 0.185],
          [0.092, 0.232],
          [0.052, 0.258],
          [0.001, 0.265],
        ],
        20,
        0.96,
        1.08
      ),
      mat
    );
    baseCap.position.set(0, 0.005, -0.008);
    addPart(baseCap);

    // Swept top lock
    const sweepCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.055, 0.225, 0.055),
      new THREE.Vector3(0.0, 0.252, 0.048),
      new THREE.Vector3(0.068, 0.232, 0.018),
    ]);
    const sweep = new THREE.Mesh(new THREE.TubeGeometry(sweepCurve, 12, 0.028, 8, false), mat);
    addPart(sweep);
  } else if (style === 'modern_fade') {
    // Lucas / Fábio: sleek fade sides + textured pompadour top
    const fadeBack = new THREE.Mesh(
      createSculptedLathe(
        [
          [0.095, 0.13],
          [0.099, 0.19],
          [0.088, 0.235],
          [0.001, 0.255],
        ],
        18,
        0.94,
        1.06
      ),
      mat
    );
    fadeBack.position.set(0, 0.002, -0.012);
    addPart(fadeBack);

    const pomp = new THREE.Mesh(new THREE.SphereGeometry(0.072, 16, 12), mat);
    pomp.scale.set(0.95, 0.65, 1.35);
    pomp.position.set(0, 0.242, 0.025);
    pomp.rotation.x = 0.22;
    addPart(pomp);
  } else if (style === 'curly') {
    // Carlos: voluminous sculpted cluster of curly locks
    const baseCap = new THREE.Mesh(new THREE.SphereGeometry(0.10, 16, 12), mat);
    baseCap.scale.set(0.98, 0.85, 1.06);
    baseCap.position.set(0, 0.175, -0.008);
    addPart(baseCap);

    const curlOffsets: [number, number, number, number][] = [
      [0, 0.255, 0.03, 0.036],
      [-0.045, 0.242, 0.035, 0.032],
      [0.045, 0.242, 0.035, 0.032],
      [-0.072, 0.21, 0.01, 0.03],
      [0.072, 0.21, 0.01, 0.03],
      [-0.035, 0.252, -0.035, 0.034],
      [0.035, 0.252, -0.035, 0.034],
      [0, 0.225, -0.07, 0.035],
    ];
    curlOffsets.forEach(([cx, cy, cz, r]) => {
      const curl = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), mat);
      curl.position.set(cx, cy, cz);
      addPart(curl);
    });
  } else if (style === 'long_wavy') {
    // Bruna / Mariana: sculpted crown + flowing layered side & back waves down to shoulders
    const crown = new THREE.Mesh(
      createSculptedLathe(
        [
          [0.098, 0.12],
          [0.105, 0.19],
          [0.094, 0.238],
          [0.052, 0.262],
          [0.001, 0.268],
        ],
        20,
        0.99,
        1.08
      ),
      mat
    );
    addPart(crown);

    // Back flowing hair curtain
    const backFlow = new THREE.Mesh(
      createSculptedLathe(
        [
          [0.125, -0.14],
          [0.118, -0.02],
          [0.108, 0.09],
          [0.102, 0.18],
        ],
        18,
        1.02,
        0.85
      ),
      mat
    );
    backFlow.position.set(0, 0.0, -0.035);
    addPart(backFlow);

    // Side framing locks
    [-1, 1].forEach((side) => {
      const lockCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.055, 0.23, 0.045),
        new THREE.Vector3(side * 0.105, 0.14, 0.032),
        new THREE.Vector3(side * 0.112, 0.02, 0.025),
        new THREE.Vector3(side * 0.098, -0.09, 0.04),
      ]);
      const lock = new THREE.Mesh(new THREE.TubeGeometry(lockCurve, 14, 0.026, 8, false), mat);
      addPart(lock);
    });
  } else if (style === 'bob_wavy') {
    // Tânia / Juliana: voluminous shoulder-length wavy bob
    const crown = new THREE.Mesh(
      createSculptedLathe(
        [
          [0.10, 0.12],
          [0.108, 0.19],
          [0.096, 0.24],
          [0.052, 0.262],
          [0.001, 0.268],
        ],
        20,
        1.02,
        1.08
      ),
      mat
    );
    addPart(crown);

    [-1, 1].forEach((side) => {
      const waveCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.045, 0.24, 0.045),
        new THREE.Vector3(side * 0.108, 0.15, 0.025),
        new THREE.Vector3(side * 0.115, 0.05, 0.01),
        new THREE.Vector3(side * 0.095, -0.01, -0.02),
      ]);
      const wave = new THREE.Mesh(new THREE.TubeGeometry(waveCurve, 12, 0.032, 8, false), mat);
      addPart(wave);
    });

    const backBob = new THREE.Mesh(new THREE.SphereGeometry(0.112, 16, 12), mat);
    backBob.scale.set(1.02, 1.15, 0.72);
    backBob.position.set(0, 0.09, -0.045);
    addPart(backBob);
  }

  head.add(hairGroup);
}

export function getMarceloAppearance(): CharacterAppearance {
  return {
    gender: 'male',
    build: 'regular',
    skinColor: 0xe6b590,
    hairColor: 0x261a14,
    hairStyle: 'receding_fade',
    eyeColor: 0x3b281c,
    shirtColor: 0x475569,
    collarColor: 0x0284c7,
    shirtStyle: 'polo',
    pantsColor: 0x25446b,
    shoeColor: 0x6b4423,
    shoeStyle: 'boot',
    facialHair: 'goatee',
    glasses: false,
    watchColor: 0x94a3b8,
    hasC2CLanyard: true,
    hasBadge: true,
    heightScale: 1.0,
  };
}

export function getNPCAppearance(npcId: string, fallbackShirtHex: string, fallbackHairHex: string): CharacterAppearance {
  switch (npcId) {
    case 'npc_bruna_folha':
      return {
        gender: 'female',
        build: 'slim',
        skinColor: 0xf1c5a6,
        hairColor: 0x1a1311,
        hairStyle: 'long_wavy',
        eyeColor: 0x452719,
        shirtColor: 0x7c3aed,
        shirtStyle: 'blouse',
        pantsColor: 0x1e293b,
        shoeColor: 0x18181b,
        shoeStyle: 'flat',
        hasBadge: true,
      };
    case 'npc_carlos_beneficios':
      return {
        gender: 'male',
        build: 'stocky',
        skinColor: 0xd99b72,
        hairColor: 0x141418,
        hairStyle: 'curly',
        eyeColor: 0x362317,
        shirtColor: 0xf8fafc,
        collarColor: 0x1e293b,
        shirtStyle: 'polo',
        pantsColor: 0x24426e,
        shoeColor: 0xf1f5f9,
        shoeStyle: 'sneaker',
        facialHair: 'goatee',
        watchColor: 0x18181b,
      };
    case 'npc_juliana_cadastro':
      return {
        gender: 'female',
        build: 'slim',
        skinColor: 0xebc0a0,
        hairColor: 0x7c3f1d,
        hairStyle: 'bob_wavy',
        eyeColor: 0x3f6212,
        shirtColor: 0x059669,
        shirtStyle: 'blouse',
        pantsColor: 0x1e293b,
        shoeColor: 0x18181b,
        shoeStyle: 'flat',
        hasBadge: true,
      };
    case 'npc_roberto_contabil':
      return {
        gender: 'male',
        build: 'slim',
        skinColor: 0xe3b490,
        hairColor: 0xcbd5e1,
        hairStyle: 'silver_classic',
        eyeColor: 0x3b2f2f,
        shirtColor: 0x1e40af,
        collarColor: 0x1e3a8a,
        shirtStyle: 'polo_striped',
        pantsColor: 0x253e63,
        shoeColor: 0x090d16,
        shoeStyle: 'oxford',
        facialHair: 'mustache',
        glasses: true,
      };
    case 'npc_mariana_funcional':
      return {
        gender: 'female',
        build: 'slim',
        skinColor: 0xe8b594,
        hairColor: 0x4a1d32,
        hairStyle: 'long_wavy',
        eyeColor: 0x3b281c,
        shirtColor: 0xbe185d,
        shirtStyle: 'blazer',
        pantsColor: 0x0f172a,
        shoeColor: 0x18181b,
        shoeStyle: 'flat',
        watchColor: 0xd4af37,
      };
    case 'npc_lucas_abap':
      return {
        gender: 'male',
        build: 'regular',
        skinColor: 0xdca47e,
        hairColor: 0x14161c,
        hairStyle: 'modern_fade',
        eyeColor: 0x3b281c,
        shirtColor: 0xf4efe6,
        collarColor: 0xe7dfd1,
        shirtStyle: 'dress_rolled',
        pantsColor: 0x6b4423,
        shoeColor: 0x111827,
        shoeStyle: 'oxford',
        facialHair: 'trimmed_beard',
        watchColor: 0x78350f,
      };
    case 'npc_fabio_basis':
      return {
        gender: 'male',
        build: 'regular',
        skinColor: 0xd29770,
        hairColor: 0x1c1917,
        hairStyle: 'modern_fade',
        eyeColor: 0x292524,
        shirtColor: 0x4338ca,
        collarColor: 0x312e81,
        shirtStyle: 'polo',
        pantsColor: 0x1e293b,
        shoeColor: 0x1f2937,
        shoeStyle: 'sneaker',
        facialHair: 'goatee',
        watchColor: 0x475569,
      };
    case 'npc_gestor_marcos':
      return {
        gender: 'male',
        build: 'regular',
        skinColor: 0xdfaa84,
        hairColor: 0x2c221c,
        hairStyle: 'side_part',
        eyeColor: 0x3b281c,
        shirtColor: 0x6d28d9,
        collarColor: 0x5b21b6,
        shirtStyle: 'dress',
        pantsColor: 0x23395d,
        shoeColor: 0x090d16,
        shoeStyle: 'oxford',
        facialHair: 'trimmed_beard',
        watchColor: 0x94a3b8,
      };
    case 'npc_tania_cafe':
      return {
        gender: 'female',
        build: 'slim',
        skinColor: 0xf2c9ac,
        hairColor: 0xe5e7eb,
        hairStyle: 'bob_wavy',
        eyeColor: 0x3b281c,
        shirtColor: 0x18181b,
        shirtStyle: 'blouse',
        pantsColor: 0x2c4a75,
        shoeColor: 0xf1f5f9,
        shoeStyle: 'sneaker',
      };
    default:
      return {
        gender: 'male',
        build: 'regular',
        skinColor: 0xe5b592,
        hairColor: new THREE.Color(fallbackHairHex).getHex(),
        hairStyle: 'side_part',
        eyeColor: 0x3b281c,
        shirtColor: new THREE.Color(fallbackShirtHex).getHex(),
        shirtStyle: 'polo',
        pantsColor: 0x1e293b,
        shoeColor: 0x111827,
        shoeStyle: 'oxford',
      };
  }
}
