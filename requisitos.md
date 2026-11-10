# Freelance Flow

## 1. Objetivo do Sistema

**Freelance Flow** é uma aplicação desktop/local para gerenciamento de propostas e projetos freelance de programação.

### Características

* Funcionamento totalmente local.
* Sem necessidade de login ou senha.
* Banco de dados SQLite.
* Interface Kanban.
* Cards movidos por drag and drop.
* Integração com IA (OpenAI inicialmente).
* Todos os documentos gerados são armazenados localmente em Markdown.
* Possibilidade de comentários em todos os cards.

---

# 2. Fluxo do Kanban

| Ordem | Nome                    |
| ----- | ----------------------- |
| 1     | Projetos                |
| 2     | Análise Inicial         |
| 3     | Especificação Refinada  |
| 4     | Documento de Requisitos |
| 5     | Planejamento            |
| 6     | UX/UI                   |
| 7     | Proposta Comercial      |
| 8     | Aguardando Cliente      |
| 9     | Em Desenvolvimento      |
| 10    | Finalizados             |

## Fluxo

```text
Projetos
↓
Análise Inicial
↓
Especificação Refinada
↓
Documento de Requisitos
↓
Planejamento
↓
UX/UI
↓
Proposta Comercial
↓
Aguardando Cliente
↓
Em Desenvolvimento
↓
Finalizados
```

---

# 3. Estrutura Base do Card

```ts
Project {
    id: string

    title: string

    currentColumn: string

    createdAt: Date
    updatedAt: Date

    comments: Comment[]

    tags: string[]

    priority: string

    statusColor: string

    movedToCurrentColumnAt: Date

    expectedFinishDate?: Date

    proposalValue?: number

    estimatedHours?: number

    estimatedDays?: number
}
```

---

# 4. Coluna: Projetos

## Objetivo

Cadastrar oportunidades encontradas em plataformas freelance.

## Campos

```ts
{
    title: string

    sourcePlatform: string

    sourceUrl: string

    shortDescription: string

    clientName?: string

    budgetMin?: number

    budgetMax?: number

    postedAt?: Date

    notes?: string
}
```

## Exemplo

```text
Título:
Sistema para oficina mecânica

Plataforma:
Workana

URL:
https://workana.com/...

Orçamento:
R$ 3.000 ~ R$ 6.000

Descrição:
Sistema para controle de estoque e agendamentos.
```

---

# 5. Coluna: Análise Inicial

## Objetivo

Registrar tudo que foi entendido inicialmente sobre o projeto.

## Campos

```ts
{
    overview: string

    objectives: string

    technologies: string[]

    assumptions: string

    risks: string

    estimatedComplexity: string

    estimatedValue: number
}
```

## Complexidade

```text
Baixa

Média

Alta

Muito Alta
```

---

# 6. Coluna: Especificação Refinada

## Objetivo

Utilizar IA para transformar a análise inicial em uma especificação completa.

## Interface

Tela dividida:

### Esquerda

* Chat com IA

### Direita

* Documento Markdown sendo construído em tempo real.

---

## Fluxo

Usuário:

```text
Quero fazer um sistema para oficina.
```

IA:

```text
Quem serão os usuários?
```

Usuário:

```text
Funcionários e administradores.
```

IA:

```text
Quais funcionalidades serão necessárias?
```

...

Ao finalizar:

```text
[ Gerar Documento ]
```

Será criado:

```text
specification.md
```

---

## Prompt Inicial

```text
Você é um analista de software sênior.

Seu trabalho é entrevistar o usuário para transformar
uma descrição simples de projeto em uma especificação
completa.

Faça perguntas objetivas.

Investigue:

- Objetivo
- Usuários
- Funcionalidades
- Fluxos
- Regras de negócio
- Integrações
- Restrições
- Requisitos não funcionais

Ao final gere um markdown estruturado.
```

---

# 7. Coluna: Documento de Requisitos

## Entrada

```text
Especificação Refinada
```

## Saída

```text
requirements.md
```

## Estrutura

```markdown
# Visão Geral

# Objetivos

# Usuários

# Casos de Uso

# Requisitos Funcionais

RF01

RF02

RF03

# Requisitos Não Funcionais

RNF01

RNF02

# Integrações

# Restrições

# Critérios de Aceite
```

---

# 8. Coluna: Planejamento

## Objetivo

Gerar Backlog, QA e planejamento do projeto.

## Entrada

```text
requirements.md
```

## Saída

```text
planning.md
```

---

## Estrutura

### Backlog

```text
Epic

Feature

Story

Task
```

### Exemplo

```text
Epic

Gestão de clientes

Feature

Cadastro de clientes

Story

Como administrador

Quero cadastrar clientes

Para gerenciar atendimentos
```

---

## QA

A IA deverá gerar:

```text
Casos de teste

Cenários de teste

Critérios de aceite

Fluxos críticos
```

---

# 9. Coluna: UX/UI

## Objetivo

Armazenar referências visuais do projeto.

## Campos

```ts
{
    figmaUrl?: string

    inspirationUrls: string[]

    notes?: string
}
```

## Tipos aceitos

* Figma
* Dribbble
* Behance
* Sites reais
* Github Pages

### Futuro

Exibir preview da imagem do link.

---

# 10. Coluna: Proposta Comercial

## Objetivo

Definir escopo comercial e gerar proposta com ajuda da IA.

## Campos

```ts
{
    proposedValue: number

    currency: string

    estimatedHours: number

    estimatedDays: number

    paymentModel: string

    milestones: Milestone[]

    warrantyDays?: number

    notes?: string
}
```

---

## Formas de pagamento

```text
Valor Fechado

Hora Trabalhada

Mensalidade

Por Entrega
```

---

## Milestones

Exemplo:

```text
20%

Documento de requisitos

30%

Backend

30%

Frontend

20%

Entrega final
```

---

## IA da Proposta

### Entrada

* Dados do projeto
* Documento de requisitos
* Prazo
* Valor

### Saída

```text
proposal.md
```

### Estrutura

```markdown
# Apresentação

# Entendimento do Projeto

# Escopo

# Tecnologias

# Cronograma

# Investimento

# Forma de Pagamento

# Garantia

# Considerações Finais
```

---

# 11. Coluna: Aguardando Cliente

## Objetivo

Aguardar resposta da proposta enviada.

Não existem ações nesta etapa.

## Campos

```ts
{
    movedAt: Date
}
```

---

## Indicador Visual

### Até 15 dias

```text
Verde
```

### Entre 15 e 30 dias

```text
Laranja
```

### Acima de 30 dias

```text
Vermelho
```

---

## Informações exibidas

```text
Aguardando há:

23 dias
```

---

# 12. Coluna: Em Desenvolvimento

## Objetivo

Controlar andamento e prazo do projeto.

## Campos

```ts
{
    startedAt: Date

    expectedFinishDate: Date

    estimatedDays: number
}
```

---

## Indicador de Prazo

### Exemplo

```text
Prazo:

180 dias

Dias decorridos:

50 dias

Percentual:

27%
```

---

### Cores

Até 70%

```text
Verde
```

Entre 70% e 85%

```text
Amarelo
```

Acima de 85%

```text
Vermelho
```

---

## Informações exibidas

```text
Prazo

180 dias

Passados

150 dias

83%
```

---

# 13. Coluna: Finalizados

Todos os projetos concluídos ficam nesta coluna.

Nenhuma ação adicional.

---

# 14. Comentários

Todos os cards possuem comentários.

```ts
Comment {

    id: string

    text: string

    createdAt: Date
}
```

### Exemplos

```text
Cliente demorou para responder.

Verificar API do Mercado Pago.

Pedir mais detalhes sobre autenticação.
```

---

# 15. Estrutura do Banco SQLite

## Tabelas

```text
projects

columns

comments

documents

messages

ai_conversations

milestones

attachments
```

---

## Tabela documents

```ts
Document {

    id: string

    projectId: string

    type: string

    content: string

    createdAt: Date
}
```

### Tipos

```text
SPEC_REFINED

REQUIREMENTS

PLANNING

PROPOSAL
```

---

# 16. Tecnologias Sugeridas

## Frontend

* React
* Typescript
* Tailwind CSS
* ShadCN
* Dnd Kit
* Zustand

## Banco

* SQLite
* Drizzle ORM

## IA

* OpenAI SDK

## Desktop

### Tauri

Motivos:

* React + SQLite local.
* Acesso ao sistema de arquivos.
* Aplicação leve.
* Armazenamento de arquivos Markdown.
* Mais leve que Electron.

---

# 17. Funcionalidades Futuras

## Dashboard

Exibir:

* Projetos por etapa.
* Taxa de conversão.
* Valor total em propostas.
* Valor total ganho.
* Tempo médio de resposta dos clientes.
* Tempo médio para fechar um projeto.

---

## Templates de IA

Permitir configuração dos prompts:

```text
Prompt de Refinamento

Prompt de Documento de Requisitos

Prompt de Planejamento

Prompt de Proposta Comercial
```

O usuário poderá evoluir seus agentes ao longo do tempo.

---

# 18. Visão Geral do Produto

O sistema deve funcionar como um **Copiloto para Freelancers**, auxiliando em todas as etapas:

```text
Projeto encontrado

↓

IA ajuda a entender

↓

IA cria especificação

↓

IA gera requisitos

↓

IA monta backlog

↓

IA auxilia UX

↓

IA gera proposta

↓

Cliente responde

↓

Projeto é executado

↓

Projeto finalizado
```

O objetivo é transformar uma oportunidade encontrada em uma plataforma freelance em um projeto estruturado, documentado e acompanhado até sua conclusão.


# 19. Configuração de IA e Variáveis de Ambiente

## Objetivo

A aplicação usa **OpenRouter** como gateway de IA, permitindo escolher entre vários modelos (OpenAI, Anthropic, Google, DeepSeek etc.) com uma única chave.

A chave de API **não** fica no `.env` versionável. Ela é configurada na interface e salva **criptografada** no SQLite local do usuário.

---

## Arquivo `.env`

O `.env` contém apenas configurações não sensíveis (portas/caminhos):

```env
BACKEND_PORT=3001
FRONTEND_PORT=5173
```

---

## Arquivo `.env.example`

Modelo versionado sem secrets:

```env
BACKEND_PORT=3001
FRONTEND_PORT=5173
```

---

## Estrutura de Configuração

```ts
AISettings {
  provider: "OPENROUTER"
  apiKeyEncrypted: string | null  // AES-256-GCM
  defaultModel: "openai/gpt-4.1-mini"
  usdToBrl: number
}
```

A chave de criptografia local fica em `data/.encryption-key` (fora do Git).

---

## Tela de Configurações

A tela **Configurações → IA → Credenciais** permite:

* Informar/atualizar a chave OpenRouter
* Selecionar o modelo padrão (lista da API OpenRouter, com fallback local)
* Ajustar a taxa USD → BRL para custos
* Testar a conexão
* Remover a chave salva

Em **IA → Agentes**, cada agente pode usar um modelo OpenRouter específico.

---

## Segurança

* Chave de API criptografada no SQLite local; nunca em texto claro no repositório.
* Interface exibe apenas versão mascarada da chave.
* `.env`, `data/` e `.encryption-key` no `.gitignore`.
* Apenas `.env.example` (sem secrets) é versionado.
