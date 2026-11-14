import * as THREE from 'three';

export type CutoutMode = 'idle' | 'walk' | 'talk' | 'loaf';

export interface CutoutFrame {
  url: string;
  aspect: number;
}

export interface CutoutSet {
  height: number;
  idle: CutoutFrame;
  walk: CutoutFrame;
  walk2: CutoutFrame;
  talk: CutoutFrame;
  loaf: CutoutFrame;
  back?: CutoutFrame;
}

const frameOf = (url: string, aspect: number): CutoutFrame => ({ url, aspect });

export const CREW_SPRITES: Record<string, CutoutSet> = {
  npc_pincer: {
    height: 1.8,
    idle: frameOf('/sustenta/pincer/idle.png', 0.4504),
    walk: frameOf('/sustenta/pincer/walk.png', 0.52),
    walk2: frameOf('/sustenta/pincer/walk2.png', 0.5111),
    talk: frameOf('/sustenta/pincer/talk.png', 0.4807),
    loaf: frameOf('/sustenta/pincer/loaf.png', 0.3983),
    back: frameOf('/sustenta/pincer/back.png', 0.4372),
  },
  npc_wbiondi: {
    height: 1.68,
    idle: frameOf('/sustenta/biondi/idle.png', 0.3404),
    walk: frameOf('/sustenta/biondi/walk.png', 0.3621),
    walk2: frameOf('/sustenta/biondi/walk2.png', 0.5596),
    talk: frameOf('/sustenta/biondi/talk.png', 0.3305),
    loaf: frameOf('/sustenta/biondi/loaf.png', 0.3489),
    back: frameOf('/sustenta/biondi/back.png', 0.3713),
  },
  npc_gustavo: {
    height: 1.82,
    idle: frameOf('/sustenta/gustavo/idle.png', 0.3432),
    walk: frameOf('/sustenta/gustavo/walk.png', 0.4478),
    walk2: frameOf('/sustenta/gustavo/walk2.png', 0.4535),
    talk: frameOf('/sustenta/gustavo/talk.png', 0.4719),
    loaf: frameOf('/sustenta/gustavo/loaf.png', 0.3918),
  },
  npc_camilinha: {
    height: 1.7,
    idle: frameOf('/sustenta/camilinha/idle.png', 0.3745),
    walk: frameOf('/sustenta/camilinha/walk.png', 0.5064),
    walk2: frameOf('/sustenta/camilinha/walk2.png', 0.5021),
    talk: frameOf('/sustenta/camilinha/talk.png', 0.4317),
    loaf: frameOf('/sustenta/camilinha/loaf.png', 0.4483),
  },
  npc_vanesa: {
    height: 1.74,
    idle: frameOf('/sustenta/vanesa/idle.png', 0.3593),
    walk: frameOf('/sustenta/vanesa/walk.png', 0.4074),
    walk2: frameOf('/sustenta/vanesa/walk2.png', 0.4295),
    talk: frameOf('/sustenta/vanesa/talk.png', 0.6234),
    loaf: frameOf('/sustenta/vanesa/loaf.png', 0.458),
    back: frameOf('/sustenta/vanesa/back.png', 0.2838),
  },
  npc_sand: {
    height: 1.66,
    idle: frameOf('/sustenta/sand/idle.png', 0.5146),
    walk: frameOf('/sustenta/sand/walk.png', 0.5331),
    walk2: frameOf('/sustenta/sand/walk2.png', 0.5815),
    talk: frameOf('/sustenta/sand/talk.png', 0.5263),
    loaf: frameOf('/sustenta/sand/loaf.png', 0.395),
    back: frameOf('/sustenta/sand/back.png', 0.4851),
  },
};

/**
 * Camera-facing paper doll. Feet sit on y=0. Flip faces the walk direction.
 */
export class CutoutSprite {
  readonly group = new THREE.Group();
  private mesh: THREE.Mesh;
  private material: THREE.MeshBasicMaterial;
  private shadow: THREE.Mesh;
  private textures = new Map<string, THREE.Texture>();
  private key: 'idle' | 'walk' | 'walk2' | 'talk' | 'loaf' | 'back' = 'idle';
  private facing: 1 | -1 = 1;
  private walkTime = 0;
  private ready = false;

  constructor(
    private frames: CutoutSet,
    private onReady: () => void
  ) {
    const geo = new THREE.PlaneGeometry(1, 1);
    geo.translate(0, 0.5, 0);
    this.material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      alphaTest: 0.28,
      depthWrite: true,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    this.mesh = new THREE.Mesh(geo, this.material);
    this.mesh.visible = false;
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 3;
    this.group.add(this.mesh);

    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x070b14,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    });
    this.shadow = new THREE.Mesh(new THREE.CircleGeometry(0.38, 18), shadowMat);
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = 0.03;
    this.shadow.visible = false;
    this.group.add(this.shadow);
    this.apply('idle');
  }

  load(anisotropy: number) {
    const loader = new THREE.TextureLoader();
    const ids = ['idle', 'walk', 'walk2', 'talk', 'loaf', 'back'] as const;
    ids.forEach((id) => {
      const frame = this.frames[id];
      if (!frame) return;
      loader.load(frame.url, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = anisotropy;
        tex.magFilter = THREE.LinearFilter;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.needsUpdate = true;
        this.textures.set(id, tex);
        if (!this.ready && id === 'idle') {
          this.ready = true;
          this.material.map = tex;
          this.material.needsUpdate = true;
          this.mesh.visible = true;
          this.shadow.visible = true;
          this.onReady();
        } else if (id === this.key) {
          this.material.map = tex;
          this.material.needsUpdate = true;
        }
      });
    });
  }

  /**
   * Show the side that actually faces the person being talked to.
   * Front when that person is toward the camera, profile when they are beside,
   * back of the head when Marcelo (or the camera) is behind them.
   */
  present(
    dt: number,
    mode: CutoutMode,
    camera: THREE.Camera,
    lookX: number,
    lookZ: number,
    fast = false
  ) {
    const view = readFacing(camera, this.group.position.x, this.group.position.z, lookX, lookZ);
    this.billboard(camera);

    const away = view.dot < -0.42;
    const beside = view.dot < 0.5;
    const nose: 1 | -1 = view.screen >= 0 ? 1 : -1;
    let next: typeof this.key = 'idle';

    if (mode === 'walk') {
      this.walkTime += dt;
      const step = fast ? 0.14 : 0.28;
      if (away && this.frames.back) {
        next = 'back';
        this.facing = 1;
      } else {
        next = Math.floor(this.walkTime / step) % 2 === 0 ? 'walk' : 'walk2';
        this.facing = nose;
      }
    } else if (away && this.frames.back) {
      this.walkTime = 0;
      next = 'back';
      this.facing = 1;
    } else if (away || beside) {
      this.walkTime = 0;
      next = 'walk';
      this.facing = nose;
    } else if (mode === 'talk') {
      this.walkTime = 0;
      next = 'talk';
      this.facing = 1;
    } else if (mode === 'loaf') {
      this.walkTime = 0;
      next = 'loaf';
      this.facing = 1;
    } else {
      this.walkTime = 0;
      next = 'idle';
      this.facing = 1;
    }

    if (next !== this.key) {
      this.key = next;
      const tex = this.textures.get(next);
      if (tex) {
        this.material.map = tex;
        this.material.needsUpdate = true;
      }
    }
    this.apply(this.key);
  }

  billboard(camera: THREE.Camera) {
    const dx = camera.position.x - this.group.position.x;
    const dz = camera.position.z - this.group.position.z;
    this.group.rotation.y = Math.atan2(dx, dz);
  }

  private apply(id: typeof this.key) {
    const frame = this.frames[id];
    if (!frame) return;
    const h = this.frames.height;
    const w = h * frame.aspect;
    this.mesh.scale.set(this.facing * w, h, 1);
  }

  dispose() {
    this.group.parent?.remove(this.group);
    this.mesh.geometry.dispose();
    this.shadow.geometry.dispose();
    this.material.dispose();
    (this.shadow.material as THREE.Material).dispose();
    this.textures.forEach((tex) => tex.dispose());
  }
}

const _right = new THREE.Vector3();

/** How the character's face sits relative to the camera. `screen` > 0 means the face points to screen-right. */
export function readFacing(
  camera: THREE.Camera,
  px: number,
  pz: number,
  lookX: number,
  lookZ: number
): { dot: number; screen: number } {
  let fx = lookX - px;
  let fz = lookZ - pz;
  let fl = Math.hypot(fx, fz);
  if (fl < 0.05) {
    fx = camera.position.x - px;
    fz = camera.position.z - pz;
    fl = Math.hypot(fx, fz) || 1;
  }
  fx /= fl;
  fz /= fl;
  const cx = camera.position.x - px;
  const cz = camera.position.z - pz;
  const cl = Math.hypot(cx, cz) || 1;
  const dot = fx * (cx / cl) + fz * (cz / cl);
  _right.set(1, 0, 0).applyQuaternion(camera.quaternion);
  const screen = fx * _right.x + fz * _right.z;
  return { dot, screen };
}
