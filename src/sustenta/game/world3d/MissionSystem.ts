export type Criterion = { id: string; label: string; required: boolean; completed: boolean };

export class MissionSystem {
  criteria: Criterion[] = [
    { id: 'impact', label: 'Identificar impacto e população afetada', required: true, completed: false },
    { id: 'evidence', label: 'Coletar período, passos e log', required: true, completed: false },
    { id: 'route', label: 'Encaminhar ao especialista correto', required: true, completed: false },
    { id: 'qas', label: 'Validar a correção em QAS', required: true, completed: false },
    { id: 'document', label: 'Documentar resultado e próximo passo', required: true, completed: false },
  ];

  complete(id: string) {
    const criterion = this.criteria.find((c) => c.id === id);
    if (criterion) criterion.completed = true;
    return this.isApproved();
  }

  done(id: string) {
    return Boolean(this.criteria.find((c) => c.id === id)?.completed);
  }

  isApproved() {
    return this.criteria.filter((c) => c.required).every((c) => c.completed);
  }

  progress() {
    const done = this.criteria.filter((c) => c.completed).length;
    return { done, total: this.criteria.length };
  }

  pending() {
    return this.criteria.filter((c) => c.required && !c.completed).map((c) => c.label);
  }
}
