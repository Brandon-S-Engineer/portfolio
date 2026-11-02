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
  pipeline: [string, string][]
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
    plain:
      'Answers customer questions from the store’s policies and its live inventory and orders — and shows where every answer came from.',
    useWhen: 'the answers already exist in documents or a database, but finding them takes a person.',
    pipeline: [
      ['Question', 'chat, streamed back token by token'],
      ['Agent loop', 'OpenAI tool calling, max 5 steps'],
      ['search_docs', 'policies in pgvector'],
      ['find_products · get_order', 'inventory and orders in Postgres'],
      ['Answer + trace', 'cited sources, SQL, tokens, cost'],
    ],
    decisions: [
      {
        choice: 'No agent framework',
        why: 'Three tools and one loop. A plain Next.js route handler streams the answer and the full trace with nothing hidden.',
        tradeoff: 'Retries and memory are written by hand. A framework earns its place once there is long-lived state — see the next system.',
      },
      {
        choice: 'Two kinds of search, one agent',
        why: 'Policies are fuzzy questions → vector search. Stock, prices and orders need exact values → SQL. The agent picks per question.',
        tradeoff: 'The model can pick the wrong tool. Tool descriptions keep that rare, and the trace makes it visible when it happens.',
      },
      {
        choice: 'The model never writes SQL',
        why: 'It only chooses a tool and its arguments. Arguments are validated with zod, queries are fixed and parameterized, and an order is only shown if the email matches.',
        tradeoff: 'It cannot answer questions the tools do not cover, such as ad-hoc totals. That limit is on purpose.',
      },
    ],
    failures: [
      'Retrieved passages below 0.3 similarity are dropped, so the agent says it does not know instead of guessing.',
      'Invalid tool arguments go back to the model as an error, not a crash.',
      'Max 5 tool steps per answer and 25 requests per hour per visitor keep the cost bounded.',
    ],
    stack: ['Next.js route handler', 'OpenAI tool calling', 'pgvector', 'Postgres', 'zod', 'Streaming'],
    code: `${REPO}/src/lib/agent-demo`,
  },
  {
    step: 2,
    id: 'act',
    verb: 'Act',
    name: 'Act on the CRM, with approval',
    plain:
      'Qualifies a new lead, drafts the reply and prepares the CRM updates — then waits for a person to approve before anything changes.',
    useWhen: 'the AI should take actions, but a wrong action costs money or customers.',
    pipeline: [
      ['Qualify', 'structured output: intent, budget, score'],
      ['Look up', 'CRM + inventory through MCP'],
      ['Draft + propose', 'reply and CRM actions'],
      ['Human approval', 'graph paused, state in Postgres'],
      ['Execute', 'only approved actions, through MCP'],
    ],
    decisions: [
      {
        choice: 'LangGraph for this one',
        why: 'The run must pause for minutes or hours and resume exactly where it stopped. interrupt() plus a Postgres checkpointer does that.',
        tradeoff: 'More moving parts than the first system — only worth it for long-lived, stateful flows.',
      },
      {
        choice: 'Its own MCP server is the only door to the CRM',
        why: 'Tools are defined once with schemas. The same server can be used from Claude Desktop, n8n or another agent.',
        tradeoff: 'One more process to run and monitor.',
      },
      {
        choice: 'Writes need a human',
        why: 'Nothing is written before approval, the approver can untick actions, and only allow-listed write tools can run.',
        tradeoff: 'Slower than full autonomy — the right default while a wrong write would corrupt real customer data.',
      },
    ],
    failures: [
      'A proposed tool outside the allow-list is rejected before it runs.',
      'If the service restarts mid-approval, the run resumes from its Postgres checkpoint.',
      'Free-tier cold starts are shown in the UI instead of a silent spinner.',
      'Visitor leads are deleted after 24 hours.',
    ],
    stack: ['Python', 'FastAPI', 'LangGraph', 'MCP server', 'Postgres checkpointer', 'Render'],
    code: `${REPO}/services/lead-agent`,
  },
]

// Funcionalidades más chicas pero reales (voz, clasificación con evals,
// automatización). La sección no se muestra mientras esté vacía.
export type SmallBuild = { name: string; plain: string; stack: string[]; href: string }
const smallBuilds: SmallBuild[] = []

const en = {
  role: 'Full-stack & AI Engineer',
  headline: 'I build software where AI does real work — and stays under control.',
  subhead:
    'An agent that answers from company data, one that acts on a CRM with a human approving, and the system I run my own business on. All three are live: try them, then open “How it’s built” to see the decisions behind each one.',
  availability: 'Open to full-time remote or on-site in CDMX',
  meta: ['Cuajimalpa, Mexico City · GMT-6', 'English C1'],
  proof: {
    live: 'live systems you can try',
    listings: 'real listings in my production system',
    public: 'Public',
    publicLabel: 'source code on GitHub',
  },
  ladder: {
    kicker: 'More responsibility at every step',
    hint: 'Click a step to jump to it',
    production: 'In production',
    productionName: 'Run a real business on it',
  },
  levelsIntro: {
    kicker: 'Featured systems',
    title: 'From answering, to acting, to running in production.',
    body: 'The first two run for Volt Mobile, a fictional refurbished-phone store: one answers its customers, the next acts on its CRM with a human approving. The third is my own business. More responsibility is not “better” — the skill is giving the AI only as much as the problem needs.',
  },
  section: {
    useWhen: 'Use this when',
    howBuilt: 'How it’s built',
    howBuiltHint: 'architecture, decisions and trade-offs',
    decisions: 'Key decisions',
    why: 'Why',
    tradeoff: 'Trade-off',
    failures: 'What can fail, and how it’s handled',
    code: 'View the code',
  },
  levels,
  production: {
    kicker: '03 · In production · used daily',
    title: 'Resale Intelligence — a price model and multi-agent deal desk on real listings',
    decisions: [
      {
        choice: 'Code for numbers, AI for judgment',
        why: 'Parsing, comparable sales, margins and max price are deterministic code and SQL. LLM agents only judge what code cannot: ambiguous text, scam signals, how to word the offer.',
        tradeoff: 'More code to write than “ask the model” — in exchange, every number is reproducible.',
      },
      {
        choice: 'Capture data at the source',
        why: 'A Chrome extension sends every listing I browse to an ingest API that validates, dedupes and keeps price history.',
        tradeoff: 'Coverage depends on what I browse — enough for my market, not a full crawl.',
      },
      {
        choice: 'Cache the market view',
        why: 'The snapshot is cached for 30 minutes and polling stops when the tab is hidden, so the database can sleep between uses.',
        tradeoff: 'Numbers on this page can be up to 30 minutes old.',
      },
    ] as Decision[],
    stack: ['Chrome extension', 'Next.js', 'Postgres', 'Multi-agent', 'Structured outputs', 'zod'],
    code: `${REPO}/src/lib/resale`,
    next: 'Currently building: cross-border product sourcing — matching the same product across supplier and US marketplaces to compute real landed margin.',
  },
  principles: {
    kicker: 'How I build',
    title: 'Production habits, and where to see each one.',
    items: [
      {
        title: 'Simplest thing that works',
        body: 'Not every problem needs an agent or a framework. Plain code first, AI only where judgment is needed.',
        href: '#answer',
      },
      {
        title: 'Grounded or silent',
        body: 'Answers come from retrieved sources or tool results, cited. When nothing relevant comes back, the agent says so.',
        href: '#answer',
      },
      {
        title: 'The model never writes SQL',
        body: 'Typed, parameterized tools with validated arguments. Data access is scoped by design, not by prompt.',
        href: '#answer',
      },
      {
        title: 'Humans approve side effects',
        body: 'Anything that changes the outside world goes through an explicit approval step.',
        href: '#act',
      },
      {
        title: 'Observable by default',
        body: 'Every step is traced: tool calls, queries, sources, tokens, cost and latency.',
        href: '#answer',
      },
      {
        title: 'Numbers come from code',
        body: 'Prices, totals and scores are computed deterministically; LLMs judge, they don’t calculate.',
        href: '#production',
      },
    ],
    see: 'See it',
  },
  smallBuilds: {
    kicker: 'Smaller builds',
    title: 'Focused features, each one real.',
    items: smallBuilds,
  },
  foundations: {
    kicker: 'Beyond AI',
    title: 'Full-stack foundations.',
    body: 'The product around the AI. These are interactive prototypes that show the patterns; the systems above are the live ones.',
    items: [
      {
        name: 'Payments, four levels',
        body: 'One-time checkout → subscriptions with dunning → usage-metered billing → marketplace payouts, on Stripe.',
        href: '/mvp-saas#payments',
      },
      {
        name: 'Dashboards & internal tools',
        body: 'Admin panels, CRMs and ops tools with auth, charts and tables.',
        href: '/mvp-saas#dashboards',
      },
      {
        name: 'Chrome extensions',
        body: 'Including the one that feeds Resale Intelligence: it captures listings as I browse and syncs them to the ingest API.',
        href: `${REPO}/extension`,
      },
    ],
    open: 'Open',
  },
  contact: {
    title: 'Building something with LLMs? Let’s talk.',
    body: 'Also available for fixed-scope builds.',
  },
  cta: 'Try the live systems',
}

export type HiringCopy = typeof en
export const hiringCopy = { en }
