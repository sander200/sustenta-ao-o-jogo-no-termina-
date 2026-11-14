import React, { useEffect, useRef, useState } from 'react';
import { Hand, RotateCcw, RotateCw, Zap } from 'lucide-react';
import { InteractiveTarget } from '../three/OfficeScene.ts';
import { sound } from '../audio.ts';

interface TouchControlsProps {
  nearTarget: InteractiveTarget | null;
  isSprinting: boolean;
  onJoystickMove: (x: number, y: number) => void;
  onToggleSprint: (active: boolean) => void;
  onRotateCamera: (deltaYaw: number) => void;
  onInteract: () => void;
  open: boolean;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  nearTarget,
  isSprinting,
  onJoystickMove,
  onToggleSprint,
  onRotateCamera,
  onInteract,
  open,
}) => {
  const padRef = useRef<HTMLDivElement>(null);
  const activePointerId = useRef<number | null>(null);
  const [knobOffset, setKnobOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    return () => {
      onJoystickMove(0, 0);
    };
  }, [onJoystickMove]);

  const updateStick = (clientX: number, clientY: number) => {
    const el = padRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maxRadius = rect.width * 0.36;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);
    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);

    const clampedX = dist > 0 ? Math.cos(angle) * clampedDist : 0;
    const clampedY = dist > 0 ? Math.sin(angle) * clampedDist : 0;

    setKnobOffset({ x: clampedX, y: clampedY });

    // Normalize to [-1, 1] where +y is forward (up on screen)
    const normX = clampedX / maxRadius;
    const normY = -clampedY / maxRadius;
    onJoystickMove(normX, normY);
  };

  const resetStick = () => {
    activePointerId.current = null;
    setKnobOffset({ x: 0, y: 0 });
    onJoystickMove(0, 0);
  };

  const handleStickDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    activePointerId.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    updateStick(e.clientX, e.clientY);
  };

  const handleStickMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerId.current !== e.pointerId) return;
    e.stopPropagation();
    e.preventDefault();
    updateStick(e.clientX, e.clientY);
  };

  const handleStickUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerId.current !== e.pointerId) return;
    e.stopPropagation();
    e.preventDefault();
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    resetStick();
  };

  return (
    <div
      className={`fixed inset-x-0 bottom-16 z-20 flex items-end justify-between px-4 sm:px-6 select-none transition-transform duration-200 ${
        open ? 'pointer-events-none translate-y-0' : 'pointer-events-none translate-y-[130%]'
      }`}
    >
      {/* Left: Virtual Analog Joystick */}
      <div className="pointer-events-auto flex flex-col items-center gap-1.5">
        <div
          ref={padRef}
          onPointerDown={handleStickDown}
          onPointerMove={handleStickMove}
          onPointerUp={handleStickUp}
          onPointerCancel={handleStickUp}
          className="relative w-28 h-28 md:w-32 md:h-32 rounded-full bg-slate-950/35 border border-white/25 shadow-lg touch-none flex items-center justify-center"
          aria-label="Joystick virtual de movimentação"
        >
          {/* Inner directional guide ring */}
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border border-slate-400/25 pointer-events-none" />
          {/* Cardinal markers */}
          <span className="absolute top-1.5 text-[9px] font-bold text-slate-400/70 pointer-events-none">▲</span>
          <span className="absolute bottom-1.5 text-[9px] font-bold text-slate-400/70 pointer-events-none">▼</span>
          <span className="absolute left-2 text-[9px] font-bold text-slate-400/70 pointer-events-none">◀</span>
          <span className="absolute right-2 text-[9px] font-bold text-slate-400/70 pointer-events-none">▶</span>

          {/* Movable thumbstick */}
          <div
            style={{
              transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)`,
            }}
            className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-sky-400/45 border border-white/50 shadow-md pointer-events-none"
          />
        </div>
        <span className="text-[10px] font-mono font-bold text-slate-100/80 bg-slate-950/35 px-2 py-0.5 rounded-md border border-white/15">
          MOVER
        </span>
      </div>

      {/* Right: Android & iPad Action Cluster */}
      <div
        className="pointer-events-auto flex flex-col items-end gap-2.5 touch-none"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Camera Rotate Row */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onRotateCamera(0.45)}
            aria-label="Girar câmera para esquerda"
            className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-slate-950/40 active:scale-90 border border-slate-600/80 text-slate-200 flex items-center justify-center shadow-lg cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => onRotateCamera(-0.45)}
            aria-label="Girar câmera para direita"
            className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-slate-950/40 active:scale-90 border border-slate-600/80 text-slate-200 flex items-center justify-center shadow-lg cursor-pointer"
          >
            <RotateCw className="w-5 h-5" />
          </button>
        </div>

        {/* Sprint + Interact Row */}
        <div className="flex items-center gap-3">
          {/* Sprint Toggle */}
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onToggleSprint(!isSprinting);
            }}
            aria-pressed={isSprinting}
            className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl border-2 flex flex-col items-center justify-center gap-0.5 font-bold text-[10px] shadow-xl active:scale-90 transition-all cursor-pointer ${
              isSprinting
                ? 'bg-amber-500 border-amber-200 text-slate-950 shadow-amber-500/30'
                : 'bg-slate-950/40 border-slate-600/80 text-slate-200'
            }`}
          >
            <Zap className={`w-5 h-5 ${isSprinting ? 'fill-slate-950' : ''}`} />
            <span>CORRER</span>
          </button>

          {/* Interact Button (E) */}
          <button
            type="button"
            disabled={!nearTarget}
            onClick={() => {
              if (!nearTarget) return;
              sound.playClick();
              onInteract();
            }}
            className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 font-bold text-xs shadow-2xl transition-all ${
              nearTarget
                ? 'bg-blue-600 border-sky-300 text-white shadow-blue-500/40 active:scale-90 cursor-pointer'
                : 'bg-slate-900/60 border-slate-700/60 text-slate-500 cursor-default'
            }`}
          >
            <Hand className="w-6 h-6" />
            <span>AÇÃO</span>
          </button>
        </div>
      </div>
    </div>
  );
};
