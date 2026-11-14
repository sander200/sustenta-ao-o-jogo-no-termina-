import * as THREE from 'three';

/**
 * Shared PBR Material Library for Stylized-Realistic Corporate 3D Scene
 */
export interface OfficeMaterialLibrary {
  brushedAluminum: THREE.MeshStandardMaterial;
  chromeSteel: THREE.MeshStandardMaterial;
  blackAnodized: THREE.MeshStandardMaterial;
  matteDeskOak: THREE.MeshStandardMaterial;
  matteDeskWhite: THREE.MeshStandardMaterial;
  executiveWalnut: THREE.MeshStandardMaterial;
  glassPartition: THREE.MeshPhysicalMaterial;
  glassWindow: THREE.MeshPhysicalMaterial;
  fabricMeshChair: THREE.MeshPhysicalMaterial;
  leatherDark: THREE.MeshPhysicalMaterial;
  ceramicWhite: THREE.MeshPhysicalMaterial;
  foliageGreen: THREE.MeshStandardMaterial;
  foliageDarkGreen: THREE.MeshStandardMaterial;
  soilDark: THREE.MeshStandardMaterial;
  baseboardMat: THREE.MeshStandardMaterial;
  ceilingPanelMat: THREE.MeshStandardMaterial;
  ledEmitMat: THREE.MeshStandardMaterial;
  dispose: () => void;
}

export function createOfficeMaterialLibrary(
  isSoftwareGl: boolean,
  glassDecal: THREE.Texture
): OfficeMaterialLibrary {
  const created: THREE.Material[] = [];
  const track = <T extends THREE.Material>(m: T): T => {
    created.push(m);
    return m;
  };

  const brushedAluminum = track(
    new THREE.MeshStandardMaterial({
      color: 0xb8c2cc,
      metalness: 0.85,
      roughness: 0.28,
    })
  );

  const chromeSteel = track(
    new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.95,
      roughness: 0.12,
    })
  );

  const blackAnodized = track(
    new THREE.MeshStandardMaterial({
      color: 0x181c24,
      metalness: 0.72,
      roughness: 0.34,
    })
  );

  const matteDeskOak = track(
    new THREE.MeshStandardMaterial({
      color: 0xd9b382,
      roughness: 0.55,
      metalness: 0.04,
    })
  );

  const matteDeskWhite = track(
    new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.36,
      metalness: 0.05,
    })
  );

  const executiveWalnut = track(
    new THREE.MeshStandardMaterial({
      color: 0x5c341d,
      roughness: 0.38,
      metalness: 0.08,
    })
  );

  const glassPartition = track(
    new THREE.MeshPhysicalMaterial({
      color: 0xdbeafe,
      transparent: true,
      opacity: isSoftwareGl ? 0.32 : 0.42,
      roughness: 0.08,
      metalness: 0.05,
      transmission: isSoftwareGl ? 0 : 0.55,
      ior: 1.5,
      thickness: 0.08,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      map: glassDecal,
      depthWrite: false,
    })
  );

  const glassWindow = track(
    new THREE.MeshPhysicalMaterial({
      color: 0xbae6fd,
      transparent: true,
      opacity: isSoftwareGl ? 0.28 : 0.25,
      roughness: 0.05,
      metalness: 0.1,
      ior: 1.5,
      clearcoat: 1.0,
      depthWrite: false,
    })
  );

  const fabricMeshChair = track(
    new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      roughness: 0.85,
      metalness: 0.05,
      sheen: 0.45,
      sheenRoughness: 0.75,
      sheenColor: new THREE.Color(0x475569),
    })
  );

  const leatherDark = track(
    new THREE.MeshPhysicalMaterial({
      color: 0x18181b,
      roughness: 0.36,
      metalness: 0.08,
      clearcoat: 0.35,
      clearcoatRoughness: 0.35,
    })
  );

  const ceramicWhite = track(
    new THREE.MeshPhysicalMaterial({
      color: 0xf8fafc,
      roughness: 0.22,
      metalness: 0.04,
      clearcoat: 0.55,
      clearcoatRoughness: 0.12,
    })
  );

  const foliageGreen = track(
    new THREE.MeshStandardMaterial({
      color: 0x228b22,
      roughness: 0.58,
      metalness: 0.02,
      side: THREE.DoubleSide,
    })
  );

  const foliageDarkGreen = track(
    new THREE.MeshStandardMaterial({
      color: 0x155e28,
      roughness: 0.65,
      metalness: 0.02,
      side: THREE.DoubleSide,
    })
  );

  const soilDark = track(
    new THREE.MeshStandardMaterial({
      color: 0x3b2a1e,
      roughness: 0.95,
      metalness: 0,
    })
  );

  const baseboardMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x27303f,
      roughness: 0.45,
      metalness: 0.2,
    })
  );

  const ceilingPanelMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x1f2530,
      roughness: 0.78,
      metalness: 0.12,
      side: THREE.FrontSide,
    })
  );

  const ledEmitMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      emissive: 0xe0f2fe,
      emissiveIntensity: 1.35,
      roughness: 0.2,
      metalness: 0.1,
    })
  );

  return {
    brushedAluminum,
    chromeSteel,
    blackAnodized,
    matteDeskOak,
    matteDeskWhite,
    executiveWalnut,
    glassPartition,
    glassWindow,
    fabricMeshChair,
    leatherDark,
    ceramicWhite,
    foliageGreen,
    foliageDarkGreen,
    soilDark,
    baseboardMat,
    ceilingPanelMat,
    ledEmitMat,
    dispose: () => {
      created.forEach((m) => m.dispose());
    },
  };
}
