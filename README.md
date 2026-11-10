# Freelance Flow

Aplicação **local** para gerenciar o ciclo completo de propostas e projetos freelance — da oportunidade inicial até a entrega. Organize oportunidades em um kanban, preencha informações por etapa, use agentes de IA para produzir documentação e acompanhe os custos de uso da IA.

> Tudo roda na sua máquina: SQLite local, documentos em arquivos locais e chave de IA configurada pela interface (armazenada **criptografada** no banco). Nenhuma credencial precisa ir para o repositório.

## O que a aplicação faz

1. **Captura oportunidades** — registra vagas/projetos com plataforma, URL, cliente, orçamento e notas.
2. **Conduz análise e documentação** — guia o projeto por etapas estruturadas com formulários e geração assistida por IA.
3. **Produz artefatos profissionais** — especificação refinada, requisitos, planejamento, diretrizes de UX e proposta comercial em Markdown.
4. **Acompanha execução** — controla aprovação do cliente e progresso do desenvolvimento.
5. **Mede custos de IA** — registra tokens e gastos estimados por projeto, processo e modelo.

## Fluxo do kanban

| Coluna | Descrição |
|--------|-----------|
| **Projetos** | Cadastro inicial da oportunidade |
| **Análise Inicial** | Visão geral, objetivos, tecnologias, riscos e valor estimado |
| **Especificação Refinada** | Chat com IA + documento de especificação |
| **Documento de Requisitos** | Geração de requisitos funcionais e não funcionais |
| **Planejamento** | Cronograma, milestones e estimativas |
| **UX/UI** | Figma, referências e diretrizes de UX |
| **Proposta Comercial** | Valores, horas e proposta em Markdown |
| **Aguardando Cliente** | Controle de aprovação |
| **Em Desenvolvimento** | Prazo e progresso |
| **Finalizados** | Projetos concluídos |

Cards podem ser movidos com **drag and drop**. Ao abrir um card, o painel lateral mostra a etapa atual, etapas anteriores, comentários e ações de IA.

## Stack

- **Frontend:** React 19 + TypeScript + Tailwind CSS + Zustand + @dnd-kit
- **Backend:** Node.js + Express + better-sqlite3 + Drizzle ORM
- **IA:** [OpenRouter](https://openrouter.ai/) (API compatível com OpenAI SDK) — vários modelos com uma única chave

## Pré-requisitos

- Node.js 20+ (recomendado)
- Conta e API key no [OpenRouter](https://openrouter.ai/)

## Instalação

```bash
git clone git@github.com:OnelinkGames/freelance_apply.git
cd freelance_apply
cp .env.example .env
npm install
```

O arquivo `.env` só controla portas e caminhos opcionais — **não** coloca chave de IA.

### Variáveis opcionais (`.env`)

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `BACKEND_PORT` | `3001` | Porta da API Express |
| `FRONTEND_PORT` | `5173` | Porta do Vite (dev/preview) |
| `DB_PATH` | `./data/freelance.db` | Caminho do SQLite |
| `DATA_DIR` | `./data` | Pasta de dados/documentos |

## Configuração da IA (obrigatório para usar agentes)

1. Suba a aplicação (`npm run dev`).
2. Abra **Configurações → IA → Credenciais**.
3. Escolha o **modelo padrão** (lista do OpenRouter).
4. Crie/copie a chave em [openrouter.ai/keys](https://openrouter.ai/keys) e cole no campo **Chave OpenRouter**.
5. (Opcional) Ajuste a taxa **USD → BRL** usada no dashboard de custos.
6. Clique em **Salvar**. Use **Testar conexão** para validar chave + modelo com uma chamada real ao OpenRouter.

A chave é criptografada (AES-256-GCM) e salva no SQLite local. A chave de criptografia fica em `data/.encryption-key` (pasta `data/` está no `.gitignore`).

Em **IA → Agentes** você pode escolher um modelo OpenRouter diferente por processo (especificação, requisitos, planejamento, UX, proposta) e editar prompts.

Todas as requisições de IA passam por `https://openrouter.ai/api/v1` (não pela API direta da OpenAI).

## Uso

### Desenvolvimento

```bash
npm run dev
```

- API: `http://localhost:3001` (ou `BACKEND_PORT`)
- Frontend: `http://localhost:5173` (ou `FRONTEND_PORT`), com proxy `/api` → backend

### Produção

```bash
npm run build
npm start
```

O Express serve a API em `/api` e o frontend buildado em `dist/` na porta `BACKEND_PORT`.

### Fluxo típico

1. Crie um projeto na coluna **Projetos** (título, plataforma e URL são obrigatórios).
2. Avance o card pelas colunas, preenchendo formulários e gerando documentos com IA.
3. Em etapas com IA, use **Gerar** ou **Inserir manualmente** (colar Markdown de outra ferramenta).
4. Acompanhe gastos em **Custos de IA**.

## Dados locais

| Caminho | Conteúdo |
|---------|----------|
| `data/freelance.db` | Banco SQLite (projetos, conversas, custos, agentes, settings) |
| `data/.encryption-key` | Chave local para criptografar a API key |
| `data/projects/{projectId}/` | Documentos Markdown gerados |
| `agents/` | Prompts padrão dos agentes (versionados, sem secrets) |

## Segurança para repositório público

- Não versionar `.env`, `data/` nem chaves de API.
- Credenciais de IA só entram pela UI e ficam criptografadas no banco local.
- Se for fazer fork/clone público de uma cópia antiga, confirme que nenhum secret ficou no histórico do Git.

## Estrutura de agentes

Arquivos em `agents/`:

- `spec-refined.md` — Especificação Refinada
- `requirements.md` — Documento de Requisitos
- `planning.md` — Planejamento
- `ux.md` — UX/UI
- `proposal.md` — Proposta Comercial

Prompts suportam placeholders como `{{project_name}}`, `{{initial_spec}}` e `{{documents}}` (veja a referência na tela de configurações).

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | API + frontend em modo desenvolvimento |
| `npm run build` | Build do frontend |
| `npm start` | Servidor de produção |
| `npm run preview` | Preview do build Vite |
