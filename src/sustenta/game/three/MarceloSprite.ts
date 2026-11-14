import * as THREE from 'three';
import { readFacing } from './CutoutSprite';

export type MarceloMove = 'idle' | 'walk' | 'run' | 'interact';

const HEIGHT = 1.86;

const FRAMES = {
  idle: { url: '/sustenta/marcelo/idle.png', aspect: 502 / 797 },
  walk: { url: '/sustenta/marcelo/walk.png', aspect: 527 / 781 },
  walk2: { url: '/sustenta/marcelo/walk2.png', aspect: 527 / 742 },
  run: { url: '/sustenta/marcelo/run.png', aspect: 566 / 764 },
  phone: { url: '/sustenta/marcelo/phone.png', aspect: 552 / 784 },
  call: { url: '/sustenta/marcelo/call.png', aspect: 346 / 782 },
  wave: { url: '/sustenta/marcelo/wave.png', aspect: 459 / 793 },
} as const;

type FrameId = keyof typeof FRAMES;

/**
 * Camera-facing cutout of Marcelo. The procedural rig stays in the scene only
 * as an animation clock; this plane is what the camera actually shows.
 */
export class MarceloSprite {
  readonly group = new THREE.Group();
  private mesh: THREE.Mesh;
  private material: THREE.MeshBasicMaterial;
  private shadow: THREE.Mesh;
  private textures = new Map<FrameId, THREE.Texture>();
  private frame: FrameId = 'idle';
  private facing: 1 | -1 = 1;
  private walkTime = 0;
  private ready = false;

  constructor(private onReady: () => void) {
    const geo = new THREE.PlaneGeometry(1, 1);
    geo.translate(0, 0.5, 0);
    this.material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      alphaTest: 0.32,
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
      opacity: 0.32,
      depthWrite: false,
    });
    this.shadow = new THREE.Mesh(new THREE.CircleGeometry(0.46, 20), shadowMat);
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = 0.03;
    this.shadow.renderOrder = 1;
    this.shadow.visible = false;
    this.group.add(this.shadow);

    this.applyFrame('idle');
  }

  load(anisotropy: number) {
    const loader = new THREE.TextureLoader();
    (Object.keys(FRAMES) as FrameId[]).forEach((id) => {
      loader.load(FRAMES[id].url, (tex) => {
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
        } else if (id === this.frame) {
          this.material.map = tex;
          this.material.needsUpdate = true;
        }
      });
    });
  }

  present(dt: number, mode: MarceloMove, interactLeft: number, camera: THREE.Camera, lookX: number, lookZ: number) {
    const view = readFacing(camera, this.group.position.x, this.group.position.z, lookX, lookZ);
    this.billboard(camera);
    const away = view.dot < -0.42;
    const beside = view.dot < 0.5;
    const nose: 1 | -1 = view.screen >= 0 ? 1 : -1;

    let next: FrameId = 'idle';
    if (mode === 'run' || mode === 'walk') {
      if (mode === 'walk') this.walkTime += dt;
      else this.walkTime = 0;
      next = mode === 'run' ? 'run' : Math.floor(this.walkTime / 0.26) % 2 === 0 ? 'walk' : 'walk2';
      this.facing = nose;
    } else if (away || beside) {
      this.walkTime = 0;
      next = 'walk';
      this.facing = nose;
    } else if (mode === 'interact') {
      this.walkTime = 0;
      this.facing = 1;
      if (interactLeft > 0.55) next = 'wave';
      else if (interactLeft > 0.28) next = 'phone';
      else next = 'call';
    } else {
      this.walkTime = 0;
      this.facing = 1;
      next = 'idle';
    }

    const changed = next !== this.frame;
    this.frame = next;
    this.applyFrame(next);
    if (changed) {
      const tex = this.textures.get(next);
      if (tex) {
        this.material.map = tex;
        this.material.needsUpdate = true;
      }
    }
  }

  billboard(camera: THREE.Camera) {
    const dx = camera.position.x - this.group.position.x;
    const dz = camera.position.z - this.group.position.z;
    this.group.rotation.y = Math.atan2(dx, dz);
  }

  private applyFrame(id: FrameId) {
    const w = HEIGHT * FRAMES[id].aspect;
    this.mesh.scale.set(this.facing * w, HEIGHT, 1);
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.material.dispose();
    this.shadow.geometry.dispose();
    (this.shadow.material as THREE.Material).dispose();
    this.textures.forEach((tex) => tex.dispose());
  }
}
