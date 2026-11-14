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

// `question`: la decisión dicha como pregunta llana. `why` y `tradeoff` siguen a
// "Because" e "It costs", por eso empiezan en minúscula.
export type Decision = { question: string; choice: string; why: string; tradeoff: string }

// Paso del ejemplo: [nombre técnico, detalle técnico, qué pasa en el ejemplo, título llano].
export type PipelineStep = [string, string, string, string]

// Falla: [qué pasa, qué hace el sistema, el detalle técnico].
export type Failure = [string, string, string]

export type Level = {
  step: 1 | 2
  id: string
  verb: string
  name: string
  // Una frase, sin jerga: qué hace para el negocio.
  plain: string
  // Tres datos duros del sistema: [dato, qué significa].
  facts: [string, string][]
  // El dato que se ve en su escalón del hero.
  ladderFact: [string, string]
  useWhen: string
  // "How it's built": el sistema en una frase y el mensaje que sigue el ejemplo.
  summary: string
  exampleInput: string
  pipeline: PipelineStep[]
  decisions: Decision[]
  failures: Failure[]
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
    facts: [
      ['3 tools', 'one loop, no framework'],
      ['≤ 5 steps', 'per answer, then it stops'],
      ['Every answer', 'cites its source'],
    ],
    ladderFact: ['Every answer', 'cites its source'],
    useWhen: 'the answers exist in documents or a database, but finding them takes a person.',
    summary:
      'A customer asks, the agent looks the answer up in the store’s policies and database, and replies showing where it came from.',
    exampleInput: '“Do you have an iPhone 13? Can I return it?”',
    pipeline: [
      ['Question', 'streamed chat', 'Two questions in one message.', 'The question arrives'],
      ['Agent loop', 'tool calling, max 5 steps', 'Here: the return policy and the stock.', 'The agent decides what it needs'],
      ['search_docs', 'policies in pgvector', 'Finds the 30-day return policy.', 'It reads the policy'],
      ['find_products · get_order', 'Postgres', 'Finds iPhone 13 units in stock.', 'It checks the stock'],
      ['Answer + trace', 'sources, SQL, cost', 'Replies and cites the policy it used.', 'It answers and shows its work'],
    ],
    decisions: [
      {
        question: 'Why not use an agent framework?',
        choice: 'no framework',
        why: 'three tools and one loop fit in a plain route handler.',
        tradeoff: 'retries and memory written by hand.',
      },
      {
        question: 'Why two kinds of search?',
        choice: 'vector search + SQL',
        why: 'policies are fuzzy text; stock and orders need exact values.',
        tradeoff: 'the model can pick the wrong tool. The trace shows it when it does.',
      },
      {
        question: 'Why can’t the model write SQL?',
        choice: 'fixed, parameterized queries',
        why: 'nothing it writes ever reaches the database; arguments are validated with zod.',
        tradeoff: 'no ad-hoc questions outside the three tools.',
      },
    ],
    failures: [
      ['It can’t find a good match', 'It says “I don’t know” instead of guessing.', 'similarity < 0.3'],
      ['The model calls a tool with bad arguments', 'The error goes back to the model. No crash.', 'zod validation'],
      ['Someone tries to abuse it', 'It stops at 5 steps per answer and 25 requests an hour.', 'per-visitor rate limit'],
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
    facts: [
      ['6 steps', 'in one LangGraph run'],
      ['0 writes', 'without human approval'],
      ['Survives restarts', 'state saved in Postgres'],
    ],
    ladderFact: ['0 writes', 'without human approval'],
    useWhen: 'the AI should take actions, but a wrong one costs money or customers.',
    summary:
      'A lead writes in, the agent scores it, drafts the reply and prepares the CRM updates, then stops until a person approves.',
    exampleInput: '“iPhone 15 Pro today, 16,000 pesos.”',
    pipeline: [
      ['Qualify', 'intent, budget, score', 'A buyer, score 85.', 'It sizes up the lead'],
      ['Look up', 'CRM + inventory via MCP', 'Checks the contact and matching stock.', 'It checks what the store knows'],
      ['Draft + propose', 'reply and actions', 'Writes the reply and the CRM updates.', 'It prepares everything'],
      ['Approval', 'paused, state in Postgres', 'Stops here. A person reviews it.', 'It waits for a person'],
      ['Execute', 'approved actions only', 'Runs only what was approved.', 'It does only what was approved'],
    ],
    decisions: [
      {
        question: 'Why use LangGraph here?',
        choice: 'LangGraph',
        why: 'the run pauses for hours and resumes exactly where it stopped.',
        tradeoff: 'more moving parts than the first system.',
      },
      {
        question: 'Why does the CRM get its own MCP server?',
        choice: 'a custom MCP server',
        why: 'it is the only door to the CRM, and any agent can reuse it.',
        tradeoff: 'one more process to run.',
      },
      {
        question: 'Why does every write need a human?',
        choice: 'human approval before writes',
        why: 'nothing changes before approval, and only allow-listed tools run.',
        tradeoff: 'slower than full autonomy.',
      },
    ],
    failures: [
      ['The agent proposes a tool outside the allow-list', 'It is rejected.', 'allow-list of 4 write tools'],
      ['The server restarts in the middle of an approval', 'The run resumes where it stopped.', 'Postgres checkpoint'],
      ['The service is asleep (free tier)', 'The page says so instead of hiding it.', 'cold start shown'],
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
  subhead: '**Three live systems.** Try them on this page.',
  // Lo que un reclutador quiere saber antes de seguir leyendo.
  // [etiqueta, dato, detalle opcional]
  about: [
    ['Based in', 'Mexico City', 'UTC−6'],
    ['English', 'C1'],
    ['Stack', 'Python + TypeScript'],
    ['Client work', 'Since 2024'],
  ] as [string, string, string?][],
  availability: 'Open to full-time · remote or CDMX',
  ladder: {
    kicker: 'More responsibility at every step',
    hint: 'Click a step to try it',
    production: 'Decide',
    productionName: 'Multi-agent, on real market data',
    live: 'live',
    inProduction: 'in production',
  },
  section: {
    useWhen: 'Use this when',
    howBuilt: 'How it’s built',
    howBuiltHint: 'One example step by step, then the decisions and what they cost',
    inOne: 'In one sentence:',
    layers: 'Plain words on top · the tech underneath',
    decision: 'Decision:',
    open: 'Open',
    close: 'Close',
    tracked: 'listings tracked',
    example: 'Follow one example',
    decisions: 'The decisions, and what each one costs',
    why: 'Because',
    tradeoff: 'It costs',
    failures: 'When things go wrong',
    code: 'View the code',
  },
  levels,
  production: {
    kicker: '03 · Decide · in production',
    title: 'Resale Intelligence',
    plain: 'The system I built to price used electronics from **real market data**.',
    // El primer dato (anuncios rastreados) sale en vivo de la base; ver page.tsx.
    facts: [
      ['4 LLM agents', 'spec, market, risk, lead'],
      ['< 5 s · $0.001', 'per deal scored'],
    ] as [string, string][],
    summary:
      'I browse listings, the system records every price, code works out what a device is really worth, and the agents judge whether a deal is safe to buy.',
    exampleInput: '“iPhone 13 128GB, $6,500.”',
    pipeline: [
      ['Chrome extension', 'captures listings', 'Sees the listing while I browse.', 'It sees the listing'],
      ['Ingest API', 'validated, deduped', 'Saves it once, with its price.', 'It saves it once'],
      ['Price model', 'deterministic code + SQL', 'Works out market price and max buy.', 'Code does the math'],
      ['Postgres', 'listings, price history', 'Keeps it with its price history.', 'It remembers every price'],
      ['Agents', 'judgment only', 'Verdict: negotiate. Offer written.', 'The agents give a verdict'],
    ] as PipelineStep[],
    decisions: [
      {
        question: 'Why not let the AI do the math?',
        choice: 'code for numbers, AI for judgment',
        why: 'prices and margins must be exact, so they are code. Agents only judge text and scam signals.',
        tradeoff: 'more code than “ask the model”.',
      },
      {
        question: 'Why capture listings with a Chrome extension?',
        choice: 'capture at the source',
        why: 'it sends every listing I browse, exactly as the buyer sees it.',
        tradeoff: 'coverage is only what I browse.',
      },
      {
        question: 'Why cache the market view?',
        choice: '30-minute cache',
        why: 'it lets the database sleep between visits.',
        tradeoff: 'numbers can be 30 minutes old.',
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
    fastest: 'Fastest way to reach me',
  },
  talk: {
    sub: 'EN · ES',
    caption: 'Ask about my experience and projects, out loud, in English or Spanish.',
    // Mensajes de cada estado de la llamada.
    connecting: 'Connecting… allow the microphone when your browser asks.',
    live: 'Live with Leo · just talk, he’ll answer.',
    ended: 'Thanks for calling. My contact details are right below.',
    limit: 'Today’s call limit is reached. Try the three systems below, or contact me directly.',
    micDenied: 'The call needs your microphone. Allow it in your browser and try again.',
    error: 'The call couldn’t start. Try again in a moment.',
    pending: 'My voice agent goes live soon. Meanwhile, try the three systems below.',
  },
}

export type HiringCopy = typeof en
export const hiringCopy = { en }
