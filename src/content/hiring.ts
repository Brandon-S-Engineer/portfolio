// Contenido del home de empleo (`/`). Dos lectores en cada bloque: la capa llana
// (qué hace para un negocio) para reclutadores no técnicos, y la capa técnica
// (pipeline, decisiones con su trade-off, qué falla y cómo se maneja) para
// quien revisa el código.
//
// Destacados: tres sistemas que suben en responsabilidad — un agente que
// responde, uno que actúa (con aprobación humana) y el sistema real de mi
// negocio. Debajo, funcionalidades más chicas. Regla: todo lo que se muestra
// pega a un backend real; nada se simula.

const REPO = 'https://github.com/Brandon-S-Engineer/portfolio/tree/main'

export type Decision = { choice: string; why: string; tradeoff: string }

export type Level = {
  step: 1 | 2
  id: string
  verb: string
  name: string
  // Una frase, sin jerga: qué hace para el negocio.
  plain: string
  useWhen: string
  // Paso, qué hace y qué pasa en un ejemplo.
  pipeline: [string, string, string][]
  decisions: Decision[]
  failures: string[]
  stack: string[]
  code?: string
}

const levels: Level[] = [
  {
    step: 1,
    id: 'answer',
    verb: 'Answer',
    name: 'Answer from company data',
    plain: 'Answers customers from the store’s policies and live orders, and **cites every source**.',
    useWhen: 'the answers exist in documents or a database, but finding them takes a person.',
    pipeline: [
      ['Question', 'streamed chat', '“Do you have an iPhone 13? Can I return it?”'],
      ['Agent loop', 'tool calling, max 5 steps', 'Decides it needs the policy and the stock.'],
      ['search_docs', 'policies in pgvector', 'Finds the 30-day return policy.'],
      ['find_products · get_order', 'Postgres', 'Finds iPhone 13 units in stock.'],
      ['Answer + trace', 'sources, SQL, cost', 'Answers and cites the policy it used.'],
    ],
    decisions: [
      {
        choice: 'No agent framework',
        why: 'Three tools and one loop fit in a plain route handler.',
        tradeoff: 'Retries and memory are hand-written.',
      },
      {
        choice: 'Vector search + SQL',
        why: 'Policies are fuzzy; stock and orders need exact values.',
        tradeoff: 'The model can pick the wrong tool — the trace shows it.',
      },
      {
        choice: 'The model never writes SQL',
        why: 'Fixed, parameterized queries; arguments validated with zod.',
        tradeoff: 'No ad-hoc questions outside the tools.',
      },
    ],
    failures: [
      'Weak matches (<0.3 similarity) → **“I don’t know”**, not a guess.',
      'Bad tool arguments **go back to the model**, not a crash.',
      '**5 steps** per answer, **25 requests/hour** per visitor.',
    ],
    stack: ['Next.js', 'OpenAI', 'pgvector', 'Postgres', 'zod'],
    code: `${REPO}/src/lib/agent-demo`,
  },
  {
    step: 2,
    id: 'act',
    verb: 'Act',
    name: 'Act on the CRM, with approval',
    plain: 'Qualifies a lead and prepares the CRM updates, then **waits for a person to approve**.',
    useWhen: 'the AI should take actions, but a wrong one costs money or customers.',
    pipeline: [
      ['Qualify', 'intent, budget, score', '“iPhone 15 Pro today, 16,000 pesos.” Buyer, score 85.'],
      ['Look up', 'CRM + inventory via MCP', 'Checks the contact and matching stock.'],
      ['Draft + propose', 'reply and actions', 'Writes the reply and the CRM updates.'],
      ['Approval', 'paused, state in Postgres', 'Stops here. A person reviews it.'],
      ['Execute', 'approved actions only', 'Runs only what was approved.'],
    ],
    decisions: [
      {
        choice: 'LangGraph here',
        why: 'The run pauses for hours and resumes exactly where it stopped.',
        tradeoff: 'More moving parts than the first system.',
      },
      {
        choice: 'Its own MCP server',
        why: 'The only door to the CRM, reusable from any agent.',
        tradeoff: 'One more process to run.',
      },
      {
        choice: 'Writes need a human',
        why: 'Nothing changes before approval; only allow-listed tools run.',
        tradeoff: 'Slower than full autonomy.',
      },
    ],
    failures: [
      'Tools outside the allow-list are **rejected**.',
      'A restart mid-approval **resumes from the checkpoint**.',
      'Cold starts are **shown, not hidden**.',
    ],
    stack: ['Python', 'FastAPI', 'LangGraph', 'MCP', 'Postgres'],
    code: `${REPO}/services/lead-agent`,
  },
]

// Funcionalidades más chicas pero reales (voz, clasificación con evals,
// automatización). La sección no se muestra mientras esté vacía.
export type SmallBuild = { name: string; plain: string; stack: string[]; href: string; image?: string; status?: string }
const smallBuilds: SmallBuild[] = [
  {
    name: 'Lead triage with n8n',
    plain: 'Sorts incoming messages and sends serious buyers to the Lead agent. **If a step fails, a person gets the lead.**',
    stack: ['n8n', 'OpenAI', 'Webhooks'],
    href: `${REPO}/services/n8n-lead-triage`,
    image: '/builds/n8n-lead-triage.png',
    status: 'Self-hosted · run locally · workflow and test runs on GitHub',
  },
]

const en = {
  role: 'Full-stack & AI Engineer',
  headline: 'I build AI agents that do real work — and stay under control.',
  subhead: '**Three live systems.** Try them.',
  availability: 'Open to full-time · remote or CDMX',
  ladder: {
    kicker: 'More responsibility at every step',
    hint: 'Click a step',
    production: 'Decide',
    productionName: 'Multi-agent, on real business data',
  },
  section: {
    useWhen: 'Use this when',
    howBuilt: 'How it’s built',
    example: 'Example',
    decisions: 'Decisions',
    why: 'Why',
    tradeoff: 'Trade-off',
    failures: 'When it fails',
    code: 'View the code',
  },
  levels,
  production: {
    kicker: '03 · Decide · in production',
    title: 'Resale Intelligence',
    plain: 'The system I run my electronics resale business on. **Real data, updated daily.**',
    pipeline: [
      ['Chrome extension', 'captures listings', 'Sees “iPhone 13 128GB, $6,500.”'],
      ['Ingest API', 'validated, deduped', 'Saves it once, with its price.'],
      ['Price model', 'deterministic code + SQL', 'Works out market price and max buy.'],
      ['Postgres', 'listings, price history', 'Keeps it with its price history.'],
      ['Agents', 'judgment only', 'Verdict: negotiate. Offer written.'],
    ] as [string, string, string][],
    decisions: [
      {
        choice: 'Code for numbers, AI for judgment',
        why: 'Prices and margins are code; agents judge text and scam signals.',
        tradeoff: 'More code than “ask the model”.',
      },
      {
        choice: 'Capture at the source',
        why: 'A Chrome extension sends every listing I browse.',
        tradeoff: 'Coverage = what I browse.',
      },
      {
        choice: 'Cache the market view',
        why: '30-minute cache lets the database sleep.',
        tradeoff: 'Numbers can be 30 minutes old.',
      },
    ] as Decision[],
    stack: ['Chrome extension', 'Next.js', 'Postgres', 'Multi-agent', 'zod'],
    code: `${REPO}/src/lib/resale`,
    next: 'Next: cross-border sourcing.',
  },
  smallBuilds: {
    kicker: 'Smaller builds',
    title: 'Focused features, each one real.',
    items: smallBuilds,
  },
  contact: {
    title: 'Let’s talk.',
  },
  talk: {
    label: 'Talk to my portfolio',
    sub: 'EN · ES',
    pending: 'My voice agent is being tuned and goes live soon. Meanwhile, try the three systems below.',
  },
}

export type HiringCopy = typeof en
export const hiringCopy = { en }
