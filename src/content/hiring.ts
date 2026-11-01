// Contenido del home de empleo (`/`). Dos lectores en cada bloque: la capa llana
// (qué hace para un negocio) para reclutadores no técnicos, y la capa técnica
// (pipeline, decisiones con su trade-off, qué falla y cómo se maneja) para
// quien revisa el código.
//
// La escalera sube por cuánto se le confía a la IA, toda sobre la misma tienda
// ficticia (Volt Mobile). Regla: lo que se muestra aquí pega a un backend real;
// un nivel sin backend todavía se marca 'building', nunca se simula.

const REPO = 'https://github.com/Brandon-S-Engineer/real-state/tree/main'

export type Decision = { choice: string; why: string; tradeoff: string }

export type Level = {
  tier: 1 | 2 | 3 | 4
  id: string
  status: 'live' | 'building'
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
    tier: 1,
    id: 'level-1',
    status: 'building',
    verb: 'Automate',
    name: 'Move data between tools',
    plain: 'A new customer form lands in the CRM and the team is notified — no copying by hand, and nothing lost if a step fails.',
    useWhen: 'the rule is fixed and someone copies the same data between tools every day.',
    pipeline: [],
    decisions: [
      {
        choice: 'n8n, not code',
        why: 'This is plumbing between existing systems. n8n has the connectors, and the client can read and edit the workflow.',
        tradeoff: 'Complex logic gets fragile in visual nodes — that work moves to Python at the next levels.',
      },
    ],
    failures: [],
    stack: ['n8n', 'Docker Compose', 'Postgres', 'Webhooks'],
  },
  {
    tier: 2,
    id: 'level-2',
    status: 'building',
    verb: 'Decide',
    name: 'AI sorts every message',
    plain: 'AI reads each incoming message, labels it and sends it to the right person. When it is unsure, a human decides.',
    useWhen: 'people spend hours reading things just to decide what happens next.',
    pipeline: [],
    decisions: [
      {
        choice: 'Typed output with a confidence threshold',
        why: 'Pydantic AI returns a validated object, never loose text. Low confidence goes to a human queue.',
        tradeoff: 'Some messages a model could have handled still reach a person — cheaper than a wrong route.',
      },
    ],
    failures: [],
    stack: ['Python', 'Pydantic AI', 'FastAPI', 'Evals'],
  },
  {
    tier: 3,
    id: 'level-3',
    status: 'live',
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
        tradeoff: 'Retries and memory are written by hand. A framework earns its place once there is long-lived state — see Level 4.',
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
    tier: 4,
    id: 'level-4',
    status: 'live',
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
        tradeoff: 'More moving parts than Level 3 — only worth it for long-lived, stateful flows.',
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

const en = {
  role: 'Applied AI Engineer',
  headline: 'I build software where AI does real work — and stays under control.',
  subhead:
    'From simple automations to agents that act on a CRM with a human approving. Every system below is live: try it, then open “How it’s built” to see the decisions behind it.',
  availability: 'Open to full-time remote or on-site in CDMX',
  meta: ['Cuajimalpa, Mexico City · GMT-6', 'English C1'],
  proof: {
    live: 'live systems you can try',
    listings: 'real listings in my production system',
    code: 'All code public on GitHub',
    levels: 'levels of AI autonomy, one store',
  },
  ladder: {
    kicker: 'Four levels of trust in AI',
    hint: 'Click a level to jump to it',
    building: 'building',
    production: 'In production',
    productionName: 'Resale Intelligence — my own business, real data',
  },
  levelsIntro: {
    kicker: 'The levels',
    title: 'Same store, more trust at every level.',
    body: 'Each level gives the AI more responsibility for Volt Mobile, a fictional refurbished-phone store. Higher is not “better” — the skill is picking the lowest level that solves the problem.',
  },
  section: {
    level: 'Level',
    useWhen: 'Use this when',
    howBuilt: 'How it’s built',
    howBuiltHint: 'architecture, decisions and trade-offs',
    decisions: 'Key decisions',
    why: 'Why',
    tradeoff: 'Trade-off',
    failures: 'What can fail, and how it’s handled',
    code: 'View the code',
    building: 'In progress — this level goes live with a real backend, not a mock.',
  },
  levels,
  production: {
    kicker: 'In production · used daily',
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
        title: 'Simplest level that works',
        body: 'Not every problem needs an agent. Automation first, AI only where judgment is needed.',
        href: '#levels',
      },
      {
        title: 'Grounded or silent',
        body: 'Answers come from retrieved sources or tool results, cited. When nothing relevant comes back, the agent says so.',
        href: '#level-3',
      },
      {
        title: 'The model never writes SQL',
        body: 'Typed, parameterized tools with validated arguments. Data access is scoped by design, not by prompt.',
        href: '#level-3',
      },
      {
        title: 'Humans approve side effects',
        body: 'Anything that changes the outside world goes through an explicit approval step.',
        href: '#level-4',
      },
      {
        title: 'Observable by default',
        body: 'Every step is traced: tool calls, queries, sources, tokens, cost and latency.',
        href: '#level-3',
      },
      {
        title: 'Numbers come from code',
        body: 'Prices, totals and scores are computed deterministically; LLMs judge, they don’t calculate.',
        href: '#production',
      },
    ],
    see: 'See it',
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
