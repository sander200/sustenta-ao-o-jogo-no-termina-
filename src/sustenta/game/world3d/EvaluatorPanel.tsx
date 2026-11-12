import React, { useState } from 'react';
import { evaluateMission } from './evaluate.ts';
import type { EvaluationResult, EvidenceSubmission } from './evaluate-rules.ts';

const empty: EvidenceSubmission = {
  impact: '',
  period: '',
  steps: '',
  log: '',
  specialist: '',
  qasEnvironment: '',
  qasResult: '',
  solution: '',
  nextStep: '',
};

export function EvaluatorPanel({ onClose, onApproved }: { onClose: () => void; onApproved: () => void }) {
  const [form, setForm] = useState<EvidenceSubmission>(empty);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [credited, setCredited] = useState(false);

  const set = (patch: Partial<EvidenceSubmission>) => setForm((current) => ({ ...current, ...patch }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
      <div className="max-h-[86vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-sky-700 bg-slate-950 p-4 text-white shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-sky-300">IA Avaliadora</h2>
            <p className="text-xs text-slate-400">Missão 001 · rubrica não calculada. O servidor só aprova evidência observável.</p>
          </div>
          <button onClick={onClose} className="text-slate-400">×</button>
        </div>
        <Field label="Impacto" value={form.impact} onChange={(impact) => set({ impact })} />
        <Field label="Período" value={form.period} onChange={(period) => set({ period })} />
        <Field label="Passos" value={form.steps} onChange={(steps) => set({ steps })} />
        <Field label="Log" value={form.log} onChange={(log) => set({ log })} />
        <label className="mt-2 block text-[10px] uppercase text-slate-400">
          Especialista
          <select value={form.specialist} onChange={(e) => set({ specialist: e.target.value })} className="mt-1 w-full rounded-lg bg-slate-800 px-2 py-1.5 text-sm">
            <option value="">Escolher</option>
            <option value="folha-funcional">Consultoria funcional de Folha</option>
            <option value="abap-hcm">ABAP HCM</option>
            <option value="basis">Basis</option>
          </select>
        </label>
        <label className="mt-2 block text-[10px] uppercase text-slate-400">
          Ambiente do teste
          <select value={form.qasEnvironment} onChange={(e) => set({ qasEnvironment: e.target.value })} className="mt-1 w-full rounded-lg bg-slate-800 px-2 py-1.5 text-sm">
            <option value="">Escolher</option>
            <option value="QAS">QAS</option>
            <option value="DEV">DEV</option>
            <option value="PRD">PRD</option>
          </select>
        </label>
        <Field label="Resultado do teste" value={form.qasResult} onChange={(qasResult) => set({ qasResult })} />
        <Field label="Solução" value={form.solution} onChange={(solution) => set({ solution })} />
        <Field label="Próximo passo" value={form.nextStep} onChange={(nextStep) => set({ nextStep })} />
        <button
          disabled={pending}
          onClick={async () => {
            setPending(true);
            try {
              const evaluation = await evaluateMission({ data: form });
              setResult(evaluation);
              if (evaluation.approved && !credited) {
                setCredited(true);
                onApproved();
              }
            } finally {
              setPending(false);
            }
          }}
          className="mt-3 rounded-lg bg-sky-600 px-3 py-2 text-xs font-bold disabled:opacity-60"
        >
          {pending ? 'Avaliando…' : 'Enviar ao servidor'}
        </button>
        {result && (
          <div className="mt-3 space-y-2 text-xs">
            <p>{result.summary}</p>
            {result.criteria.map((item) => (
              <div key={item.criterionId} className="rounded-lg border border-slate-700 p-2">
                <div className="flex justify-between">
                  <span className="font-semibold">{item.agent}</span>
                  <span className={item.status === 'approved' ? 'text-emerald-300' : 'text-amber-300'}>{item.status}</span>
                </div>
                <p className="mt-1 text-slate-300">{item.feedback}</p>
                {item.nextHint && <p className="mt-1 text-sky-200">{item.nextHint}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="mt-2 block text-[10px] uppercase text-slate-400">
      {label}
      <input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-lg bg-slate-800 px-2 py-1.5 text-sm normal-case text-white" />
    </label>
  );
}
