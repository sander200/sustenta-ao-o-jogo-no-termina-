import React, { useEffect, useState } from 'react';
import type { OfficeScene } from '../three/OfficeScene.ts';

const ROOMS = [
  { name: 'Gestor', x: -24, z: -19, w: 13.5, h: 13.5, color: 'rgba(248,113,113,0.28)' },
  { name: 'Reunião', x: -24, z: -5.5, w: 13.5, h: 12, color: 'rgba(251,191,36,0.22)' },
  { name: 'Sustentação', x: -10.5, z: -19, w: 16.5, h: 24.5, color: 'rgba(56,189,248,0.16)' },
  { name: 'Servidores', x: 6, z: -19, w: 17.5, h: 12, color: 'rgba(99,102,241,0.28)' },
  { name: 'Consultoria', x: 6, z: -7, w: 17.5, h: 12.5, color: 'rgba(52,211,153,0.22)' },
  { name: 'Refeitório', x: 5.5, z: 5.5, w: 8, h: 13, color: 'rgba(251,146,60,0.24)' },
  { name: 'Copa', x: 13.5, z: 5.5, w: 10, h: 13, color: 'rgba(244,114,182,0.22)' },
];

const MIN_X = -24;
const MAX_X = 24;
const MIN_Z = -19;
const MAX_Z = 19;

function pctX(x: number) {
  return ((x - MIN_X) / (MAX_X - MIN_X)) * 100;
}
function pctZ(z: number) {
  return ((z - MIN_Z) / (MAX_Z - MIN_Z)) * 100;
}

export function OfficeMap({ scene, onClose }: { scene: OfficeScene; onClose: () => void }) {
  const [mark, setMark] = useState(() => scene.getPlayerMark());

  useEffect(() => {
    const id = window.setInterval(() => setMark(scene.getPlayerMark()), 180);
    return () => window.clearInterval(id);
  }, [scene]);

  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center p-4">
      <div className="pointer-events-auto w-full max-w-3xl rounded-3xl border border-white/20 bg-slate-950/45 p-3 shadow-2xl backdrop-blur-[2px]">
        <div className="mb-2 flex items-center justify-between px-1">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-200">Mapa do expediente</div>
            <div className="text-sm font-semibold text-white">O cenário inteiro, sem tapar o escritório</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white cursor-pointer"
          >
            Fechar
          </button>
        </div>
        <div className="relative aspect-[48/38] overflow-hidden rounded-2xl border border-white/10 bg-slate-900/25">
          {ROOMS.map((room) => (
            <div
              key={room.name}
              className="absolute flex items-start p-1 text-[10px] font-bold uppercase tracking-wide text-white/80"
              style={{
                left: `${pctX(room.x)}%`,
                top: `${pctZ(room.z)}%`,
                width: `${(room.w / (MAX_X - MIN_X)) * 100}%`,
                height: `${(room.h / (MAX_Z - MIN_Z)) * 100}%`,
                background: room.color,
              }}
            >
              {room.name}
            </div>
          ))}
          <div
            className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-cyan-300 shadow"
            style={{ left: `${pctX(mark.x)}%`, top: `${pctZ(mark.z)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
