import * as THREE from 'three';

/**
 * Procedural Realistic Textures for The Sims-style 2.5D Corporate Office
 */

export function createCarpetTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#8e959e';
  ctx.fillRect(0, 0, 512, 512);

  const tileSize = 128;
  ctx.strokeStyle = '#7c848e';
  ctx.lineWidth = 2;

  for (let x = 0; x <= 512; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  for (let y = 0; y <= 512; y += tileSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  // Woven micro-texture noise
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 10;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(12, 10);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createWoodParquetTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Warm wood base
  ctx.fillStyle = '#854d0e';
  ctx.fillRect(0, 0, 512, 512);

  // Planks
  const plankH = 32;
  const plankW = 128;

  for (let y = 0; y < 512; y += plankH) {
    const offsetX = (Math.floor(y / plankH) % 2) * (plankW / 2);
    for (let x = -plankW; x < 512 + plankW; x += plankW) {
      const px = x + offsetX;

      // Plank color variation
      const shade = (Math.random() - 0.5) * 28;
      ctx.fillStyle = `rgb(${133 + shade}, ${77 + shade * 0.8}, ${14 + shade * 0.5})`;
      ctx.fillRect(px, y, plankW - 2, plankH - 2);

      // Wood grain lines
      ctx.strokeStyle = `rgba(69, 26, 3, 0.25)`;
      ctx.lineWidth = 1;
      for (let g = 0; g < 3; g++) {
        const gy = y + 6 + g * 8 + Math.random() * 4;
        ctx.beginPath();
        ctx.moveTo(px, gy);
        ctx.bezierCurveTo(px + 40, gy + (Math.random() - 0.5) * 4, px + 80, gy + (Math.random() - 0.5) * 4, px + plankW - 2, gy);
        ctx.stroke();
      }
    }
  }

  // Plank borders
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 2;
  for (let y = 0; y <= 512; y += plankH) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createCeramicTileTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1e293b'; // dark slate tile
  ctx.fillRect(0, 0, 256, 256);

  const tileSize = 64;
  ctx.strokeStyle = '#334155'; // grout lines
  ctx.lineWidth = 3;

  for (let x = 0; x <= 256; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }
  for (let y = 0; y <= 256; y += tileSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createGlassDecalTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 256, 256);

  // Modern corporate frosted privacy stripes
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.fillRect(0, 80, 256, 96);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  for (let y = 88; y < 168; y += 12) {
    ctx.fillRect(0, y, 256, 3);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 1);
  return texture;
}

export function createServerRackTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, 256, 512);

  // Perforated hex/square mesh door
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(16, 20, 224, 472);

  // Unit slots (1U, 2U servers)
  const unitH = 32;
  for (let y = 30; y < 480; y += unitH) {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(24, y, 208, unitH - 4);

    // Drive bays
    ctx.fillStyle = '#334155';
    for (let d = 0; d < 6; d++) {
      ctx.fillRect(32 + d * 22, y + 6, 16, 16);
    }

    // Status LED row
    ctx.fillStyle = Math.random() > 0.3 ? '#22c55e' : '#38bdf8';
    ctx.beginPath();
    ctx.arc(180, y + 14, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = Math.random() > 0.6 ? '#f59e0b' : '#10b981';
    ctx.beginPath();
    ctx.arc(195, y + 14, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createSapMonitorTexture(type: 'sap' | 'code' | 'chart'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;

  if (type === 'sap') {
    // SAP GUI Classic Blue Title & Table
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(0, 0, 256, 24);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('SAP GUI [PC00_M37_CALC - PRD]', 8, 16);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 24, 256, 136);

    // Table RT header
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(8, 32, 240, 16);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('WAGETYPE | AMT | HRS | CURR', 14, 44);

    // Data rows
    ctx.fillStyle = '#38bdf8';
    ctx.font = '8px monospace';
    ctx.fillText('1000 Salário Base  4.500,00  BRL', 14, 62);
    ctx.fillText('1025 Horas Extras    620,50  BRL', 14, 78);
    ctx.fillText('/101 Base Previdênc 5.120,50 BRL', 14, 94);
    ctx.fillText('/559 Salário Líquid 4.102,15 BRL', 14, 110);

    // Green status message at bottom
    ctx.fillStyle = '#065f46';
    ctx.fillRect(0, 140, 256, 20);
    ctx.fillStyle = '#34d399';
    ctx.fillText('✔ Cálculo simulado com sucesso (RC=0)', 8, 154);
  } else if (type === 'code') {
    // ABAP Code editor
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 256, 160);
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('PROGRAM Z_FOLHA_EXT.', 8, 20);
    ctx.fillStyle = '#38bdf8';
    ctx.font = '8px monospace';
    ctx.fillText('DATA: lt_rt TYPE TABLE OF p0001,', 8, 40);
    ctx.fillText('      ls_rt LIKE LINE OF lt_rt.', 8, 55);
    ctx.fillStyle = '#10b981';
    ctx.fillText('* Verifica processamento da rubrica 1025', 8, 75);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText('LOOP AT lt_rt INTO ls_rt.', 8, 95);
    ctx.fillText('  IF ls_rt-lgart = "1025".', 16, 110);
    ctx.fillText('    ls_rt-betrg = ls_rt-betrg * 1.5.', 24, 125);
    ctx.fillText('  ENDIF.', 16, 140);
  } else {
    // Chart / Dashboard
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(0, 0, 256, 24);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('SLA & INDICADORES DE SUSTENTAÇÃO', 8, 16);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 24, 256, 136);

    // Bar chart
    const bars = [45, 78, 62, 92, 85, 96];
    bars.forEach((val, idx) => {
      ctx.fillStyle = idx === 3 ? '#22c55e' : '#38bdf8';
      const h = (val / 100) * 80;
      ctx.fillRect(20 + idx * 36, 130 - h, 24, h);
    });
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates C2C Corporate Badge Texture for Marcelo
 */
export function createC2CBadgeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;

  // White badge plastic card
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 128, 160);

  // Top header with C2C orange/blue bar
  ctx.fillStyle = '#ea580c'; // C2C vibrant orange
  ctx.fillRect(0, 0, 128, 36);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px "Chakra Petch", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('C2C', 64, 26);

  // Photo placeholder / avatar silhouette
  ctx.fillStyle = '#0284c7'; // Blue frame
  ctx.fillRect(34, 46, 60, 60);

  ctx.fillStyle = '#fcd34d'; // Head
  ctx.beginPath();
  ctx.arc(64, 70, 16, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#2563eb'; // Polo
  ctx.beginPath();
  ctx.arc(64, 102, 22, Math.PI, 0);
  ctx.fill();

  // Name & Role
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MARCELO', 64, 124);

  ctx.fillStyle = '#ea580c';
  ctx.font = 'bold 10px monospace';
  ctx.fillText('KEY USER SAP', 64, 142);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates The Sims-style floating nametag billboard for MARCELO (Key User / C2C)
 */
export function createMarceloBillboard(name: string = 'SABASTIAN', role: string = ''): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 96;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 320, 96);

  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  ctx.beginPath();
  ctx.roundRect(48, 6, 224, 40, 12);
  ctx.fill();

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 22px "Chakra Petch", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, 160, 26);

  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.beginPath();
  ctx.roundRect(78, 54, 164, 10, 5);
  ctx.fill();
  ctx.fillStyle = '#22d3ee';
  ctx.beginPath();
  ctx.roundRect(78, 54, 118, 10, 5);
  ctx.fill();

  void role;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(1.7, 0.5, 1);
  return sprite;
}

// Alias for backwards compatibility
export const createSabastianBillboard = createMarceloBillboard;

/**
 * Creates The Sims Plumbob (Rotating Green Diamond)
 */
export function createSimsPlumbob(): THREE.Mesh {
  // Octahedron geometry stretched vertically
  const geo = new THREE.OctahedronGeometry(0.24, 0);
  geo.scale(1, 2.2, 1);

  const mat = new THREE.MeshStandardMaterial({
    color: 0x22c55e,
    emissive: 0x15803d,
    emissiveIntensity: 0.6,
    roughness: 0.15,
    metalness: 0.2,
    transparent: true,
    opacity: 0.95,
  });

  const plumbob = new THREE.Mesh(geo, mat);
  plumbob.castShadow = true;
  return plumbob;
}
