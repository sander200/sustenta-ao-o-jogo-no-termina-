import type { Phase } from "./types";

export const PHASES: Phase[] = [
  {
    id: "rubrica",
    tag: "Fase 1 · Rubrica",
    title: "A diferença nasceu onde?",
    story:
      "A Folha totalizou R$ 1.250.000,00, mas a contabilização apresenta R$ 1.217.450,00. Antes de corrigir valores, descubra onde a diferença nasceu.",
    question: "Qual é a primeira trilha de investigação?",
    answers: [
      "Alterar o valor diretamente na conta contábil.",
      "Rastrear rubrica → conta simbólica → determinação → conta contábil.",
      "Reprocessar toda a folha imediatamente.",
      "Excluir o documento contábil e gerar outro.",
    ],
    correct: 1,
    explain:
      "A investigação começa na origem. Se a rubrica está correta, siga a determinação contábil até a conta do razão.",
    hint: "Não comece pela conta final. Volte uma camada: rubrica e determinação.",
  },
  {
    id: "determinacao",
    tag: "Fase 2 · Determinação",
    title: "A rubrica está certa. A conta não.",
    story:
      "O valor da rubrica bate com a Folha, mas foi parar em uma conta diferente da esperada.",
    question: "O que deve ser validado primeiro?",
    answers: [
      "Somente o nome da conta no FI.",
      "Conta bancária do empregado.",
      "Conta simbólica e regra de determinação contábil da rubrica.",
      "Cadastro de endereço.",
    ],
    correct: 2,
    explain:
      "A ponte entre Folha e FI passa pela conta simbólica e pela determinação contábil.",
    hint: "Pense na ponte entre Folha e FI.",
  },
  {
    id: "centro",
    tag: "Fase 3 · Centro de custo",
    title: "O valor fecha. O centro não.",
    story:
      "A despesa total está correta, mas R$ 18.000 foram para um centro de custo incorreto.",
    question: "Qual análise resolve o problema?",
    answers: [
      "Ignorar, pois o total fecha.",
      "Validar centro de custo, rateio e origem do lançamento.",
      "Alterar a descrição da rubrica.",
      "Trocar a data do documento.",
    ],
    correct: 1,
    explain:
      "Conciliação também é dimensional: valor total, centro de custo e rateio precisam fazer sentido.",
    hint: "O total pode fechar e ainda assim a informação gerencial estar errada.",
  },
  {
    id: "beneficio",
    tag: "Fase 4 · Benefício",
    title: "Folha x fornecedor",
    story:
      "A participação do benefício na Folha soma R$ 72.400,00. A cobrança do fornecedor chegou a R$ 75.100,00.",
    question: "Qual comparação faz sentido?",
    answers: [
      "Comparar apenas o valor final.",
      "Comparar população, competência, empresa, parcela empregado/empresa e faturamento.",
      "Excluir a fatura.",
      "Lançar a diferença como ajuste sem investigação.",
    ],
    correct: 1,
    explain:
      "Benefícios exigem conciliação entre população, competência, participação e cobrança.",
    hint: "Não compare apenas dois totais. Abra a composição.",
  },
  {
    id: "provisao",
    tag: "Fase 5 · Provisão",
    title: "A provisão não desapareceu",
    story:
      "Na realização foram identificados R$ 96.000,00, mas ainda existe saldo de provisão de R$ 41.500,00.",
    question: "Qual trilha deve ser conferida?",
    answers: [
      "Somente a conta bancária.",
      "Provisão, realização, reversão, encargos e competência.",
      "Somente o holerite.",
      "Trocar o centro de custo.",
    ],
    correct: 1,
    explain:
      "O saldo residual pode decorrer de competência, encargos, reversões ou diferença entre provisionado e realizado.",
    hint: "Provisão tem um ciclo: reconhecimento, realização e reversão.",
  },
  {
    id: "competencia",
    tag: "Fase 6 · Competência",
    title: "Competência diferente",
    story:
      "Um valor aparece na Folha de setembro, mas a despesa gerencial foi analisada como se fosse de outubro. O pagamento ocorrerá em outra data.",
    question: "Como organizar a análise?",
    answers: [
      "Misturar competência e pagamento.",
      "Separar competência, provisão, realização e pagamento.",
      "Considerar somente a data bancária.",
      "Excluir o lançamento antigo.",
    ],
    correct: 1,
    explain:
      "Uma conciliação robusta separa o momento econômico de provisão, realização e pagamento.",
    hint: "Pergunte: de que competência é o fato e quando ele foi pago?",
  },
  {
    id: "tesouraria",
    tag: "Fase 7 · Tesouraria",
    title: "O arquivo está certo... será?",
    story:
      "A Folha fechou. O arquivo bancário está pronto, mas um beneficiário apresenta dados bancários divergentes.",
    question: "Qual atitude evita que um erro vire pagamento?",
    answers: [
      "Enviar porque a Folha já fechou.",
      "Bloquear o envio e validar banco, agência, conta, beneficiário e origem.",
      "Corrigir o arquivo sem rastreabilidade.",
      "Ignorar e conferir depois.",
    ],
    correct: 1,
    explain:
      "Conciliação também é preventiva: uma divergência antes do envio pode evitar pagamento incorreto.",
    hint: "Fechamento da Folha não significa autorização automática para pagar.",
  },
  {
    id: "fechamento",
    tag: "Fase 8 · Fechamento",
    title: "A trilha completa",
    story:
      "Chegou a hora do fechamento. Um valor precisa ser explicado de ponta a ponta, do cálculo até o reflexo financeiro.",
    question: "Qual trilha representa uma conciliação completa?",
    answers: [
      "Rubrica → conta contábil e parar.",
      "Rubrica → determinação → conta → centro/rateio → fornecedor/provisão → FI → pagamento.",
      "Somente Folha → banco.",
      "Somente conta contábil → fornecedor.",
    ],
    correct: 1,
    explain:
      "A trilha completa conecta origem, regra, contabilidade, dimensão gerencial, obrigações e pagamento.",
    hint: "A pergunta-mestra é: de onde veio esse valor e onde deveria terminar?",
  },
];

export const MAX_LIVES = 3;
export const HINT_COST = 20;
export const BEST_SCORE_KEY = "missao-fechamento-best";
