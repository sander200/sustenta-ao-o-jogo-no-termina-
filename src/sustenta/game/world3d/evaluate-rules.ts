export type CriterionStatus = 'approved' | 'needs_revision' | 'not_evaluated';

export type EvidenceSubmission = {
  impact: string;
  period: string;
  steps: string;
  log: string;
  specialist: string;
  qasEnvironment: string;
  qasResult: string;
  solution: string;
  nextStep: string;
};

export type CriterionResult = {
  criterionId: 'impact' | 'evidence' | 'route' | 'qas' | 'document';
  agent: string;
  status: CriterionStatus;
  evidence: string[];
  feedback: string;
  nextHint: string;
};

export type EvaluationResult = {
  missionId: 'MISSION-001';
  approved: boolean;
  criteria: CriterionResult[];
  summary: string;
  auditId: string;
};

const FOLHA = ['folha', 'empregado', 'empregados', 'rubrica', '1025'];
const PERIOD = ['período', 'periodo', 'competência', 'competencia', 'mês', 'mes', '2026', 'novembro'];
const TOO_BROAD = ['todos os módulos', 'todos os modulos', 'empresa inteira'];
const LOG = ['st22', 'dump', 'log', 'cálculo', 'calculo', 'pcr', 'rc='];
const QAS_OK = ['calcul', 'sucesso', 'rubrica', 'aprov', 'ok', '1025'];
const FOLHA_OWNER = new Set(['folha-funcional', 'abap-hcm']);

function has(text: string, words: string[]) {
  const value = text.toLowerCase();
  return words.filter((word) => value.includes(word));
}

function criterion(
  criterionId: CriterionResult['criterionId'],
  agent: string,
  status: CriterionStatus,
  evidence: string[],
  feedback: string,
  nextHint: string,
): CriterionResult {
  return { criterionId, agent, status, evidence, feedback, nextHint };
}

export function evaluateSubmission(input: EvidenceSubmission, auditId: string): EvaluationResult {
  const broad = has(input.impact, TOO_BROAD);
  const folhaHits = has(`${input.impact} ${input.period}`, FOLHA);
  const periodHits = has(`${input.impact} ${input.period}`, PERIOD);
  const impactOk = broad.length === 0 && folhaHits.length > 0 && (periodHits.length > 0 || input.period.length >= 4);

  const logHits = has(input.log, LOG);
  const printOnly = /print|screenshot|imagem/i.test(input.log) && logHits.length === 0;
  const evidenceOk = input.period.length >= 4 && input.steps.length >= 12 && logHits.length > 0 && !printOnly;

  const routeOk = FOLHA_OWNER.has(input.specialist);

  let qasStatus: CriterionStatus = 'not_evaluated';
  let qasFeedback = 'Ainda não avaliado. Encaminhe primeiro ao especialista de Folha.';
  let qasHint = 'Este critério abre depois do encaminhamento correto.';
  if (routeOk) {
    if (input.qasEnvironment === 'PRD') {
      qasStatus = 'needs_revision';
      qasFeedback = 'Produção não é evidência de teste. O resultado tem que vir do QAS.';
      qasHint = 'Troque o ambiente para QAS e descreva o que a rubrica fez lá.';
    } else if (input.qasEnvironment === 'QAS' && has(input.qasResult, QAS_OK).length > 0 && input.qasResult.length >= 8) {
      qasStatus = 'approved';
      qasFeedback = 'O teste em QAS traz um resultado observável.';
      qasHint = '';
    } else {
      qasStatus = 'needs_revision';
      qasFeedback = 'Falta um resultado observável no QAS.';
      qasHint = 'Diga o que aconteceu com a rubrica no QAS, sem usar produção.';
    }
  }

  let docStatus: CriterionStatus = 'not_evaluated';
  let docFeedback = 'Ainda não avaliado. O QAS precisa estar aceito antes da documentação.';
  let docHint = 'Este critério abre depois do teste em QAS.';
  if (qasStatus === 'approved') {
    if (input.solution.length >= 12 && input.nextStep.length >= 8) {
      docStatus = 'approved';
      docFeedback = 'A documentação traz a solução, o resultado e o próximo passo.';
      docHint = '';
    } else {
      docStatus = 'needs_revision';
      docFeedback = 'A documentação ainda não cobre solução e próximo passo.';
      docHint = 'Escreva o que foi corrigido e qual é o próximo passo, sem copiar só o título do chamado.';
    }
  }

  const criteria: CriterionResult[] = [
    criterion(
      'impact',
      'SAP Expert',
      impactOk ? 'approved' : 'needs_revision',
      impactOk ? [...folhaHits, ...periodHits] : broad,
      impactOk
        ? 'O impacto aponta a folha, a rubrica e o período. Não generaliza a empresa inteira.'
        : 'O impacto ainda não identifica população e período, ou abre demais o escopo.',
      impactOk ? '' : 'Diga quem foi afetado na folha e em qual período. Não use "todos os módulos".',
    ),
    criterion(
      'evidence',
      'Quality Auditor',
      evidenceOk ? 'approved' : 'needs_revision',
      evidenceOk ? logHits : [],
      evidenceOk
        ? 'Período, passos e log são evidências observáveis.'
        : 'Um texto livre ou um print sem log não comprova o incidente.',
      evidenceOk ? '' : 'Informe o período, os passos para reproduzir e um trecho de log (ST22, dump ou cálculo).',
    ),
    criterion(
      'route',
      'Mission Master',
      routeOk ? 'approved' : 'needs_revision',
      routeOk ? [input.specialist] : [],
      routeOk
        ? 'O encaminhamento foi para quem trata regra de folha, com contexto.'
        : 'Basis, infra ou um responsável vazio não recebem este incidente.',
      routeOk ? '' : 'Encaminhe à consultoria funcional de Folha ou ao ABAP de HCM.',
    ),
    criterion('qas', 'ABAP Expert', qasStatus, qasStatus === 'approved' ? [input.qasEnvironment] : [], qasFeedback, qasHint),
    criterion('document', 'Quality Auditor', docStatus, [], docFeedback, docHint),
  ];

  const approved = criteria.every((item) => item.status === 'approved');
  const pending = criteria.filter((item) => item.status !== 'approved').length;

  return {
    missionId: 'MISSION-001',
    approved,
    criteria,
    summary: approved
      ? 'Quality Auditor: os cinco critérios têm evidência. A missão pode ser registrada.'
      : `Quality Auditor: ${pending} critério(s) sem evidência suficiente. Nada foi aprovado por texto livre.`,
    auditId,
  };
}
