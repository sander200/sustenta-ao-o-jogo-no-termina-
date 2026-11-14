import * as THREE from 'three';

/**
 * Procedural High-Resolution PBR Textures for Corporate 3D Office
 * (Zero external 404 assets — 100% Canvas-generated with proper ColorSpace & Anisotropy)
 */

function configureTexture(
  tex: THREE.CanvasTexture,
  isColor: boolean,
  repeatX = 1,
  repeatY = 1,
  anisotropy = 8
): THREE.CanvasTexture {
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.anisotropy = anisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createCarpetTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#333b48';
  ctx.fillRect(0, 0, 512, 512);

  const tileSize = 128;
  for (let ty = 0; ty < 4; ty++) {
    for (let tx = 0; tx < 4; tx++) {
      const shade = ((tx + ty) % 2 === 0 ? 4 : -4) + (Math.random() - 0.5) * 4;
      ctx.fillStyle = `rgb(${51 + shade}, ${59 + shade}, ${72 + shade})`;
      ctx.fillRect(tx * tileSize + 1, ty * tileSize + 1, tileSize - 2, tileSize - 2);

      // Subtle directional weave lines alternating per tile
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 1;
      const horiz = (tx + ty) % 2 === 0;
      for (let k = 4; k < tileSize - 4; k += 6) {
        ctx.beginPath();
        if (horiz) {
          ctx.moveTo(tx * tileSize + 2, ty * tileSize + k);
          ctx.lineTo((tx + 1) * tileSize - 2, ty * tileSize + k);
        } else {
          ctx.moveTo(tx * tileSize + k, ty * tileSize + 2);
          ctx.lineTo(tx * tileSize + k, (ty + 1) * tileSize - 2);
        }
        ctx.stroke();
      }
    }
  }

  // Tile seams
  ctx.strokeStyle = '#1f2631';
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

  // Fine woven fiber grain
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 14;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  return configureTexture(new THREE.CanvasTexture(canvas), true, 10, 8);
}

export function createCarpetBumpTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.createImageData(256, 256);
  for (let i = 0; i < imgData.data.length; i += 4) {
    const v = 110 + Math.floor(Math.random() * 55);
    imgData.data[i] = v;
    imgData.data[i + 1] = v;
    imgData.data[i + 2] = v;
    imgData.data[i + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);
  return configureTexture(new THREE.CanvasTexture(canvas), false, 16, 14);
}

export function createWoodParquetTexture(tint: 'oak' | 'walnut' = 'oak'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const baseR = tint === 'oak' ? 168 : 108;
  const baseG = tint === 'oak' ? 122 : 68;
  const baseB = tint === 'oak' ? 76 : 38;

  ctx.fillStyle = `rgb(${baseR},${baseG},${baseB})`;
  ctx.fillRect(0, 0, 512, 512);

  const plankH = 32;
  const plankW = 160;

  for (let y = 0; y < 512; y += plankH) {
    const offsetX = ((y / plankH) * 53) % plankW;
    for (let x = -plankW; x < 512 + plankW; x += plankW) {
      const px = x + offsetX;
      const shade = (Math.random() - 0.5) * 22;
      ctx.fillStyle = `rgb(${baseR + shade}, ${baseG + shade * 0.85}, ${baseB + shade * 0.65})`;
      ctx.fillRect(px + 1, y + 1, plankW - 2, plankH - 2);

      // Natural wood grain
      ctx.strokeStyle = tint === 'oak' ? 'rgba(92, 56, 24, 0.22)' : 'rgba(38, 18, 8, 0.30)';
      ctx.lineWidth = 1.1;
      for (let g = 0; g < 4; g++) {
        const gy = y + 4 + g * 7 + Math.random() * 2;
        ctx.beginPath();
        ctx.moveTo(px + 2, gy);
        ctx.bezierCurveTo(
          px + plankW * 0.35,
          gy + (Math.random() - 0.5) * 4,
          px + plankW * 0.7,
          gy + (Math.random() - 0.5) * 4,
          px + plankW - 2,
          gy
        );
        ctx.stroke();
      }
    }
  }

  ctx.strokeStyle = tint === 'oak' ? 'rgba(72, 45, 22, 0.55)' : 'rgba(30, 15, 6, 0.7)';
  ctx.lineWidth = 1.5;
  for (let y = 0; y <= 512; y += plankH) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  return configureTexture(new THREE.CanvasTexture(canvas), true, 4, 4);
}

export function createCeramicTileTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#253042';
  ctx.fillRect(0, 0, 512, 512);

  const tileSize = 128;
  for (let ty = 0; ty < 4; ty++) {
    for (let tx = 0; tx < 4; tx++) {
      const s = (Math.random() - 0.5) * 8;
      ctx.fillStyle = `rgb(${37 + s}, ${48 + s}, ${66 + s})`;
      ctx.fillRect(tx * tileSize + 3, ty * tileSize + 3, tileSize - 6, tileSize - 6);

      // Subtle anti-static raised floor corner screw dots
      ctx.fillStyle = '#475569';
      [
        [tx * tileSize + 10, ty * tileSize + 10],
        [(tx + 1) * tileSize - 10, ty * tileSize + 10],
        [tx * tileSize + 10, (ty + 1) * tileSize - 10],
        [(tx + 1) * tileSize - 10, (ty + 1) * tileSize - 10],
      ].forEach(([cx, cy]) => {
        ctx.beginPath();
        ctx.arc(cx, cy, 2, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }

  return configureTexture(new THREE.CanvasTexture(canvas), true, 5, 5);
}

export function createCafeTileTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#d6d3cb';
  ctx.fillRect(0, 0, 512, 512);

  const tile = 128;
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      const warm = ((x + y) % 2) * 8 + (Math.random() - 0.5) * 6;
      ctx.fillStyle = `rgb(${212 + warm}, ${206 + warm}, ${195 + warm})`;
      ctx.fillRect(x * tile + 2, y * tile + 2, tile - 4, tile - 4);
    }
  }

  ctx.strokeStyle = '#9ca3af';
  ctx.lineWidth = 2;
  for (let i = 0; i <= 512; i += tile) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }

  return configureTexture(new THREE.CanvasTexture(canvas), true, 4, 4);
}

export function createWallPlasterTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#eef2f6');
  grad.addColorStop(1, '#dce3ec');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Subtle architectural panel seams
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
  ctx.lineWidth = 2;
  for (let x = 128; x < 512; x += 128) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }

  const imgData = ctx.getImageData(0, 0, 512, 512);
  for (let i = 0; i < imgData.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 7;
    imgData.data[i] = Math.max(0, Math.min(255, imgData.data[i] + n));
    imgData.data[i + 1] = Math.max(0, Math.min(255, imgData.data[i + 1] + n));
    imgData.data[i + 2] = Math.max(0, Math.min(255, imgData.data[i + 2] + n));
  }
  ctx.putImageData(imgData, 0, 0);

  return configureTexture(new THREE.CanvasTexture(canvas), true, 4, 1);
}

export function createWoodSlatWallTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Dark acoustic felt backing
  ctx.fillStyle = '#17191f';
  ctx.fillRect(0, 0, 512, 512);

  const slatW = 20;
  const gap = 12;
  for (let x = 0; x < 512; x += slatW + gap) {
    const shade = (Math.random() - 0.5) * 16;
    const grad = ctx.createLinearGradient(x, 0, x + slatW, 0);
    grad.addColorStop(0, `rgb(${155 + shade}, ${106 + shade * 0.7}, ${62 + shade * 0.5})`);
    grad.addColorStop(0.5, `rgb(${176 + shade}, ${122 + shade * 0.7}, ${74 + shade * 0.5})`);
    grad.addColorStop(1, `rgb(${135 + shade}, ${92 + shade * 0.7}, ${54 + shade * 0.5})`);
    ctx.fillStyle = grad;
    ctx.fillRect(x, 0, slatW, 512);
  }

  return configureTexture(new THREE.CanvasTexture(canvas), true, 3, 1);
}

export function createGlassDecalTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 256, 256);

  // Subtle frosted corporate safety band at eye/waist height
  ctx.fillStyle = 'rgba(226, 232, 240, 0.22)';
  ctx.fillRect(0, 96, 256, 64);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.48)';
  for (let y = 102; y < 154; y += 10) {
    ctx.fillRect(0, y, 256, 2);
  }

  return configureTexture(new THREE.CanvasTexture(canvas), true, 4, 1);
}

export function createKeyboardTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 96;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 256, 96);

  // Key rows
  const rows = 5;
  const cols = 15;
  const kw = 14;
  const kh = 13;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (r === 4 && c >= 4 && c <= 9) {
        if (c === 4) {
          ctx.fillStyle = '#334155';
          ctx.fillRect(10 + c * 16, 10 + r * 16, kw * 6 + 6, kh);
        }
        continue;
      }
      ctx.fillStyle = c === 0 || c === 14 ? '#475569' : '#334155';
      ctx.fillRect(10 + c * 16, 10 + r * 16, kw, kh);
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.fillRect(12 + c * 16, 12 + r * 16, 4, 2);
    }
  }

  return configureTexture(new THREE.CanvasTexture(canvas), true, 1, 1);
}

export function createServerRackTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, 256, 512);

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(14, 18, 228, 476);

  const unitH = 30;
  for (let y = 28; y < 480; y += unitH) {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(22, y, 212, unitH - 4);

    // Hot-swap drive bays
    ctx.fillStyle = '#0f172a';
    for (let d = 0; d < 7; d++) {
      ctx.fillRect(30 + d * 21, y + 5, 17, 16);
      ctx.fillStyle = '#334155';
      ctx.fillRect(32 + d * 21, y + 7, 13, 4);
      ctx.fillStyle = '#0f172a';
    }

    // Status LEDs
    ctx.fillStyle = Math.random() > 0.25 ? '#22c55e' : '#38bdf8';
    ctx.beginPath();
    ctx.arc(192, y + 13, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = Math.random() > 0.7 ? '#f59e0b' : '#10b981';
    ctx.beginPath();
    ctx.arc(206, y + 13, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export function createSapMonitorTexture(type: 'sap' | 'code' | 'chart'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext('2d')!;

  if (type === 'sap') {
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(0, 0, 512, 42);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('SAP GUI 770  [PC00_M37_CALC · PRD]', 16, 27);

    ctx.fillStyle = '#0b1324';
    ctx.fillRect(0, 42, 512, 278);

    // Toolbar icons strip
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 42, 512, 26);
    ['#22c55e', '#38bdf8', '#f59e0b', '#94a3b8'].forEach((c, idx) => {
      ctx.fillStyle = c;
      ctx.fillRect(14 + idx * 28, 49, 16, 12);
    });

    ctx.fillStyle = '#2563eb';
    ctx.fillRect(16, 80, 480, 28);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px monospace';
    ctx.fillText('RUBRICA | DESCRIÇÃO             | VALOR      | MOEDA', 24, 99);

    const rows = [
      ['1000', 'Salário Base Mensal', '4.500,00', 'BRL'],
      ['1025', 'Horas Extras 50%', '  620,50', 'BRL'],
      ['/101', 'Base Previdência INSS', '5.120,50', 'BRL'],
      ['/559', 'Salário Líquido', '4.102,15', 'BRL'],
    ];
    rows.forEach(([cod, desc, val, cur], idx) => {
      ctx.fillStyle = idx % 2 === 0 ? '#111c33' : '#0f172a';
      ctx.fillRect(16, 112 + idx * 34, 480, 32);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '14px monospace';
      ctx.fillText(`${cod}   ${desc.padEnd(22, ' ')} ${val}   ${cur}`, 24, 133 + idx * 34);
    });

    ctx.fillStyle = '#065f46';
    ctx.fillRect(0, 284, 512, 36);
    ctx.fillStyle = '#6ee7b7';
    ctx.font = 'bold 15px monospace';
    ctx.fillText('✔ Simulação de folha concluída sem erros (RC=0)', 16, 307);
  } else if (type === 'code') {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, 512, 320);
    ctx.fillStyle = '#161b22';
    ctx.fillRect(0, 0, 512, 36);
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('SE38 · PROGRAM Z_FOLHA_EXT_CALC', 16, 24);

    const lines = [
      { c: '#79c0ff', t: 'DATA: lt_rt TYPE TABLE OF pc207,' },
      { c: '#79c0ff', t: '      ls_rt TYPE pc207.' },
      { c: '#8b949e', t: '* Verifica processamento da rubrica 1025' },
      { c: '#ff7b72', t: 'LOOP AT lt_rt INTO ls_rt.' },
      { c: '#e6edf3', t: '  IF ls_rt-lgart = \'1025\'.' },
      { c: '#a5d6ff', t: '    ls_rt-betrg = ls_rt-betrg * \'1.50\'.' },
      { c: '#a5d6ff', t: '    MODIFY lt_rt FROM ls_rt.' },
      { c: '#e6edf3', t: '  ENDIF.' },
      { c: '#ff7b72', t: 'ENDLOOP.' },
    ];
    lines.forEach((ln, idx) => {
      ctx.fillStyle = '#484f58';
      ctx.font = '13px monospace';
      ctx.fillText(String(idx + 1).padStart(2, '0'), 14, 66 + idx * 26);
      ctx.fillStyle = ln.c;
      ctx.font = '14px monospace';
      ctx.fillText(ln.t, 48, 66 + idx * 26);
    });
  } else {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 512, 320);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(0, 0, 512, 42);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 17px sans-serif';
    ctx.fillText('CENTRAL DE COMANDO SAP · SLA & KPIs', 16, 27);

    // KPI Cards
    const cards = [
      { label: 'SLA P1', val: '98.4%', color: '#22c55e' },
      { label: 'BACKLOG', val: '12', color: '#38bdf8' },
      { label: 'QAS OK', val: '100%', color: '#a855f7' },
    ];
    cards.forEach((c, idx) => {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(18 + idx * 162, 56, 148, 68);
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(c.label, 30 + idx * 162, 78);
      ctx.fillStyle = c.color;
      ctx.font = 'bold 26px monospace';
      ctx.fillText(c.val, 30 + idx * 162, 110);
    });

    const bars = [52, 78, 64, 92, 85, 96, 89];
    bars.forEach((val, idx) => {
      ctx.fillStyle = idx === 5 ? '#22c55e' : '#38bdf8';
      const h = (val / 100) * 145;
      ctx.fillRect(30 + idx * 66, 292 - h, 42, h);
    });
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function createMotivationalPosterTexture(variant: 'disciplina' | 'plano'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 480;
  const ctx = canvas.getContext('2d')!;

  if (variant === 'disciplina') {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 384, 480);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 18;
    ctx.strokeRect(9, 9, 366, 462);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 46px "Chakra Petch", sans-serif';
    ['DISCIPLINA', 'FOCO', 'CONSTÂNCIA', 'SUCESSO'].forEach((w, i) => {
      ctx.fillText(w, 42, 115 + i * 86);
    });
    ctx.fillStyle = '#7c3aed';
    ctx.fillRect(42, 404, 160, 10);
  } else {
    // Whiteboard "PLANO" matching attached Dr. Marcos reference!
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, 384, 480);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 12;
    ctx.strokeRect(6, 6, 372, 468);

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText('PLANO DE AÇÃO', 34, 68);
    ctx.fillRect(34, 80, 220, 4);

    const items = ['META', 'PLANO', 'AÇÃO', 'REVISÃO', 'SUCESSO'];
    items.forEach((item, i) => {
      const y = 148 + i * 58;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      ctx.strokeRect(38, y - 22, 24, 24);
      ctx.strokeStyle = '#16a34a';
      ctx.beginPath();
      ctx.moveTo(42, y - 10);
      ctx.lineTo(48, y - 3);
      ctx.lineTo(60, y - 20);
      ctx.stroke();

      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(item, 80, y);
    });

    // Yellow sticky note
    ctx.fillStyle = '#fde047';
    ctx.fillRect(265, 340, 82, 82);
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(':)', 296, 390);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export function createCitySkylineTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const sky = ctx.createLinearGradient(0, 0, 0, 512);
  sky.addColorStop(0, '#1e3a5f');
  sky.addColorStop(0.55, '#60a5fa');
  sky.addColorStop(1, '#dbeafe');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 1024, 512);

  // Soft clouds
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  [
    [160, 110, 110, 28],
    [540, 85, 140, 32],
    [840, 130, 120, 26],
  ].forEach(([cx, cy, rx, ry]) => {
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  // Distant glass corporate towers
  const towers = [
    [30, 210, 75, 302, '#475569'],
    [115, 160, 85, 352, '#334155'],
    [220, 240, 70, 272, '#64748b'],
    [310, 130, 95, 382, '#1e293b'],
    [430, 195, 80, 317, '#475569'],
    [535, 145, 90, 367, '#334155'],
    [650, 225, 72, 287, '#64748b'],
    [740, 150, 100, 362, '#1e293b'],
    [860, 200, 85, 312, '#475569'],
    [955, 250, 65, 262, '#334155'],
  ] as const;

  towers.forEach(([x, y, w, h, col]) => {
    ctx.fillStyle = col;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(186, 230, 253, 0.35)';
    for (let wy = y + 14; wy < 500; wy += 18) {
      for (let wx = x + 8; wx < x + w - 10; wx += 14) {
        ctx.fillRect(wx, wy, 8, 10);
      }
    }
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createC2CBadgeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 128, 160);

  ctx.fillStyle = '#ea580c';
  ctx.fillRect(0, 0, 128, 36);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px "Chakra Petch", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('C2C', 64, 26);

  ctx.fillStyle = '#0284c7';
  ctx.fillRect(34, 46, 60, 60);

  ctx.fillStyle = '#fcd34d';
  ctx.beginPath();
  ctx.arc(64, 70, 16, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#2563eb';
  ctx.beginPath();
  ctx.arc(64, 102, 22, Math.PI, 0);
  ctx.fill();

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

export function createMarceloBillboard(name: string = 'MARCELO', _role: string = 'Key User · C2C'): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 76;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 256, 76);

  ctx.fillStyle = 'rgba(15, 23, 42, 0.84)';
  ctx.beginPath();
  ctx.roundRect(8, 6, 240, 64, 14);
  ctx.fill();

  ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(8, 6, 240, 64, 14);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px "Chakra Petch", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(name, 128, 36);

  // Compact status accent bar
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.roundRect(36, 48, 184, 10, 5);
  ctx.fill();

  const barGrad = ctx.createLinearGradient(36, 48, 220, 58);
  barGrad.addColorStop(0, '#06b6d4');
  barGrad.addColorStop(1, '#10b981');
  ctx.fillStyle = barGrad;
  ctx.beginPath();
  ctx.roundRect(38, 50, 158, 6, 3);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: true,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(0.95, 0.28, 1);
  return sprite;
}

export const createSabastianBillboard = createMarceloBillboard;

export function createSapCentroSuporteTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 512, 256);

  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 500, 244);

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.strokeRect(14, 14, 484, 228);

  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.moveTo(150, 40);
  ctx.lineTo(362, 40);
  ctx.lineTo(332, 130);
  ctx.lineTo(180, 130);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 74px "Chakra Petch", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SAP', 256, 108);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 36px "Chakra Petch", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CENTRO DE SUPORTE', 256, 190);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function createSimsPlumbob(): THREE.Mesh {
  const geo = new THREE.OctahedronGeometry(0.12, 0);
  geo.scale(1, 2.1, 1);

  const mat = new THREE.MeshStandardMaterial({
    color: 0x22c55e,
    emissive: 0x15803d,
    emissiveIntensity: 0.22,
    roughness: 0.2,
    metalness: 0.05,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
  });

  const plumbob = new THREE.Mesh(geo, mat);
  plumbob.castShadow = true;
  return plumbob;
}

export function createHumanSkinTexture(baseHex: number, isFemale: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const base = new THREE.Color(baseHex);
  const warmCheek = base.clone().lerp(new THREE.Color(isFemale ? 0xe17b7b : 0xd47664), isFemale ? 0.34 : 0.22);
  const shadowTone = base.clone().multiplyScalar(0.86);

  ctx.fillStyle = `#${base.getHexString()}`;
  ctx.fillRect(0, 0, 256, 256);

  // Subtle vertical warmth & chin/under-brow shading
  const vertGrad = ctx.createLinearGradient(0, 0, 0, 256);
  vertGrad.addColorStop(0, `rgba(${Math.round(shadowTone.r * 255)}, ${Math.round(shadowTone.g * 255)}, ${Math.round(shadowTone.b * 255)}, 0.16)`);
  vertGrad.addColorStop(0.45, 'rgba(255, 255, 255, 0.04)');
  vertGrad.addColorStop(1, `rgba(${Math.round(shadowTone.r * 255)}, ${Math.round(shadowTone.g * 255)}, ${Math.round(shadowTone.b * 255)}, 0.22)`);
  ctx.fillStyle = vertGrad;
  ctx.fillRect(0, 0, 256, 256);

  // Soft cheek & nose warmth gradients (mapped around front face UV center)
  [
    [104, 146, 36],
    [152, 146, 36],
    [128, 134, 24],
  ].forEach(([cx, cy, r]) => {
    const blush = ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
    blush.addColorStop(0, `rgba(${Math.round(warmCheek.r * 255)}, ${Math.round(warmCheek.g * 255)}, ${Math.round(warmCheek.b * 255)}, 0.35)`);
    blush.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = blush;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  });

  // Natural micro skin texture noise
  for (let i = 0; i < 650; i++) {
    const x = (i * 53) % 256;
    const y = (i * 97) % 256;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(60,30,20,0.03)';
    ctx.fillRect(x, y, 2, 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createHairStrandTexture(baseHex: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const base = new THREE.Color(baseHex);
  const highlight = base.clone().lerp(new THREE.Color(0xffffff), 0.18);
  const shade = base.clone().multiplyScalar(0.75);

  ctx.fillStyle = `#${base.getHexString()}`;
  ctx.fillRect(0, 0, 128, 128);

  for (let x = 0; x < 128; x += 3) {
    ctx.strokeStyle = x % 6 === 0 ? `#${highlight.getHexString()}` : `#${shade.getHexString()}`;
    ctx.globalAlpha = 0.28;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + (x % 9) - 4, 128);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}
