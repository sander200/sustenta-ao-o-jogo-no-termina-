import React, { useEffect, useRef, useState } from 'react';
import { evaluateMission } from './evaluate.server.ts';
import type { EvaluationResult, EvidenceSubmission } from './evaluate-rules.ts';
import { DialogState, HudState, OfficeWorld } from './OfficeWorld.ts';

const emptyHud: HudState = {
  clock: '08:14',
  energy: 85,
  stress: 20,
  reputation: 60,
  xp: 45,
  missionDone: 0,
  missionTotal: 5,
  approved: false,
};

export function Office3DScreen({ onExit }: { onExit: () => void }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<OfficeWorld | null>(null);
  const [hud, setHud] = useState<HudState>(emptyHud);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [form, setForm] = useState<EvidenceSubmission>({
    impact: '',
    period: '',
    steps: '',
    log: '',
    specialist: '',
    qasEnvironment: '',
    qasResult: '',
    solution: '',
    nextStep: '',
  });

  useEffect(() => {
    if (!mountRef.current) return;
    const world = new OfficeWorld(mountRef.current);
    world.onHud = setHud;
    world.onDialog = setDialog;
    world.onPrompt = setPrompt;
    worldRef.current = world;
    return () => world.destroy();
  }, []);

  return (
    <div className="absolute inset-0 z-50 bg-slate-900">
      <div ref={mountRef} className="absolute inset-0" />

      <header className="pointer-events-none absolute left-3 right-3 top-3 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-white backdrop-blur-md">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-slate-400">Expediente 3D</div>
          <div className="font-mono text-lg font-bold">{hud.clock}</div>
        </div>
        <Meter label="Energia" value={`${hud.energy}%`} width={hud.energy} bar="bg-emerald-400" />
        <Meter label="Estresse" value={`${hud.stress}%`} width={hud.stress} bar="bg-fuchsia-400" />
        <Meter label="Reputação" value={`${hud.reputation}`} width={hud.reputation} bar="bg-amber-400" />
        <Meter label="SAP XP" value={`${hud.xp}`} width={hud.xp} bar="bg-sky-400" />
        <div className="ml-auto text-xs text-sky-200">
          Missão 001 · {hud.missionDone}/{hud.missionTotal}
          {hud.approved ? ' · aprovada' : ''}
        </div>
      </header>

      {prompt && !dialog && (
        <div className="pointer-events-none absolute bottom-4 left-4 rounded-xl border border-blue-500/70 bg-slate-950/90 px-3 py-2 text-sm text-white">
          {prompt}
        </div>
      )}

      <button
        onClick={onExit}
        className="absolute bottom-4 right-4 rounded-xl border border-slate-600 bg-slate-950/90 px-3 py-2 text-xs font-semibold text-slate-200"
      >
        Voltar ao 2.5D
      </button>

      {dialog && !formOpen && (
        <aside className="absolute bottom-16 right-4 top-20 flex w-[min(100%-2rem,22rem)] flex-col rounded-2xl border border-slate-600 bg-slate-950/95 p-4 text-white shadow-2xl">
          <h2 className="text-base font-bold text-sky-300">{dialog.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-200">{dialog.body}</p>
          <div className="mt-4 flex flex-col gap-2 overflow-y-auto">
            {dialog.actions.map((action) => (
              <button
                key={action.id}
                onClick={() => {
                  if (action.id === 'open-evaluator') {
                    setDialog(null);
                    setFormOpen(true);
                    return;
                  }
                  worldRef.current?.choose(action.id);
                }}
                className="rounded-lg bg-slate-800 px-3 py-2 text-left text-xs font-semibold text-slate-100 hover:bg-blue-700"
              >
                {action.label}
              </button>
            ))}
          </div>
        </aside>
      )}

      {formOpen && (
        <aside className="absolute bottom-16 right-4 top-20 flex w-[min(100%-2rem,24rem)] flex-col overflow-y-auto rounded-2xl border border-sky-700 bg-slate-950/95 p-4 text-white shadow-2xl">
          <h2 className="text-base font-bold text-sky-300">IA Avaliadora</h2>
          <p className="mt-1 text-xs text-slate-400">Servidor. Sem chave no navegador. Sem acesso a produção.</p>
          <Field label="Impacto" value={form.impact} onChange={(impact) => setForm({ ...form, impact })} />
          <Field label="Período" value={form.period} onChange={(period) => setForm({ ...form, period })} />
          <Field label="Passos" value={form.steps} onChange={(steps) => setForm({ ...form, steps })} />
          <Field label="Log" value={form.log} onChange={(log) => setForm({ ...form, log })} />
          <label className="mt-2 block text-[10px] uppercase text-slate-400">
            Especialista
            <select
              value={form.specialist}
              onChange={(event) => setForm({ ...form, specialist: event.target.value })}
              className="mt-1 w-full rounded-lg bg-slate-800 px-2 py-1.5 text-sm text-white"
            >
              <option value="">Escolher</option>
              <option value="folha-funcional">Consultoria funcional de Folha</option>
              <option value="abap-hcm">ABAP HCM</option>
              <option value="basis">Basis</option>
            </select>
          </label>
          <label className="mt-2 block text-[10px] uppercase text-slate-400">
            Ambiente do teste
            <select
              value={form.qasEnvironment}
              onChange={(event) => setForm({ ...form, qasEnvironment: event.target.value })}
              className="mt-1 w-full rounded-lg bg-slate-800 px-2 py-1.5 text-sm text-white"
            >
              <option value="">Escolher</option>
              <option value="QAS">QAS</option>
              <option value="DEV">DEV</option>
              <option value="PRD">PRD</option>
            </select>
          </label>
          <Field label="Resultado do teste" value={form.qasResult} onChange={(qasResult) => setForm({ ...form, qasResult })} />
          <Field label="Solução" value={form.solution} onChange={(solution) => setForm({ ...form, solution })} />
          <Field label="Próximo passo" value={form.nextStep} onChange={(nextStep) => setForm({ ...form, nextStep })} />
          <div className="mt-3 flex gap-2">
            <button
              disabled={pending}
              onClick={async () => {
                setPending(true);
                try {
                  const evaluation = await evaluateMission({ data: form });
                  setResult(evaluation);
                  worldRef.current?.applyEvaluation(
                    evaluation.criteria.filter((item) => item.status === 'approved').map((item) => item.criterionId),
                  );
                } finally {
                  setPending(false);
                }
              }}
              className="rounded-lg bg-sky-600 px-3 py-2 text-xs font-bold disabled:opacity-60"
            >
              {pending ? 'Avaliando…' : 'Enviar ao servidor'}
            </button>
            <button onClick={() => setFormOpen(false)} className="rounded-lg bg-slate-800 px-3 py-2 text-xs">
              Fechar
            </button>
          </div>
          {result && (
            <div className="mt-3 space-y-2 text-xs">
              <p className="text-slate-200">{result.summary}</p>
              <p className="font-mono text-[10px] text-slate-500">{result.auditId}</p>
              {result.criteria.map((item) => (
                <div key={item.criterionId} className="rounded-lg border border-slate-700 p-2">
                  <div className="flex justify-between gap-2">
                    <span className="font-semibold">{item.agent}</span>
                    <span className={item.status === 'approved' ? 'text-emerald-300' : 'text-amber-300'}>{item.status}</span>
                  </div>
                  <p className="mt-1 text-slate-300">{item.feedback}</p>
                  {item.nextHint && <p className="mt-1 text-sky-200">{item.nextHint}</p>}
                </div>
              ))}
            </div>
          )}
        </aside>
      )}

      <p className="pointer-events-none absolute bottom-4 left-1/2 hidden -translate-x-1/2 text-[11px] text-slate-300 md:block">
        WASD move · arraste o mouse gira a câmera · E interage
      </p>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="mt-2 block text-[10px] uppercase text-slate-400">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg bg-slate-800 px-2 py-1.5 text-sm normal-case text-white"
      />
    </label>
  );
}

function Meter({ label, value, width, bar }: { label: string; value: string; width: number; bar: string }) {
  return (
    <div className="w-28">
      <div className="flex justify-between text-[10px] uppercase text-slate-300">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-700">
        <div className={`h-full ${bar}`} style={{ width: `${Math.max(0, Math.min(100, width))}%` }} />
      </div>
    </div>
  );
}
