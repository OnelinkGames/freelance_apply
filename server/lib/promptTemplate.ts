export interface PromptContext {
  project_name?: string;
  initial_spec?: string;
  documents?: string;
  requirements?: string;
  planning?: string;
}

export function resolvePromptTemplate(template: string, context: PromptContext): string {
  const replacements: Record<string, string> = {
    project_name: context.project_name ?? "[Sem nome]",
    initial_spec: context.initial_spec ?? "[Não informado]",
    documents: context.documents ?? "[Nenhum documento]",
    requirements: context.requirements ?? "[Nenhum requisito]",
    planning: context.planning ?? "[Nenhum planejamento]",
  };

  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    return replacements[key] ?? `[${key} não disponível]`;
  });
}
