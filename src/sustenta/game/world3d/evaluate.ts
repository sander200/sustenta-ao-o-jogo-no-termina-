import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import type { EvidenceSubmission, EvaluationResult } from './evaluate-rules.ts';

const evidenceSubmissionSchema = z.object({
  impact: z.string().catch(''),
  period: z.string().catch(''),
  steps: z.string().catch(''),
  log: z.string().catch(''),
  specialist: z.string().catch(''),
  qasEnvironment: z.string().catch(''),
  qasResult: z.string().catch(''),
  solution: z.string().catch(''),
  nextStep: z.string().catch(''),
});

const audits: { id: string; at: string; approved: boolean }[] = [];

function clip(value: unknown, max = 500) {
  return String(value ?? '').slice(0, max).trim();
}

export const evaluateMission = createServerFn({ method: 'POST' })
  .validator((data: unknown) => evidenceSubmissionSchema.parse(data))
  .handler(async ({ data }): Promise<EvaluationResult> => {
    const { evaluateSubmission } = await import('./evaluate-rules.ts');
    const submission: EvidenceSubmission = {
      impact: clip(data.impact),
      period: clip(data.period, 80),
      steps: clip(data.steps),
      log: clip(data.log),
      specialist: clip(data.specialist, 40),
      qasEnvironment: clip(data.qasEnvironment, 8),
      qasResult: clip(data.qasResult),
      solution: clip(data.solution),
      nextStep: clip(data.nextStep),
    };
    const auditId = `aud-${Date.now().toString(36)}`;
    const result = evaluateSubmission(submission, auditId);
    audits.unshift({ id: auditId, at: new Date().toISOString(), approved: result.approved });
    if (audits.length > 20) audits.pop();
    return result;
  });
