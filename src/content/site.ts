// Central config for the public portfolio.
//
// The home (`hiring`) targets employers and shows direct contact details. The
// agency pages (/agency, /services, /solutions) stay marketplace-safe: no
// contact details, prices or platform names, so they can be linked from
// freelance profiles.

export const site = {
  name: 'Brandon Soria',
  role: 'Full-stack & AI Engineer',
  // The 5-second hook. Speed + outcome, mirrors what high-budget clients
  // actually search for.
  tagline: 'Production-ready AI web apps in days, not months.',
  subhead:
    'From simple automations to multi-agent systems — fixed scope, fixed timeline, and a live demo of every level you can try right here.',
  location: 'Remote · Available worldwide',
  // Home orientado a contratación: quien evalúa debe poder contactarte en un
  // clic. Los vacíos no se muestran. El copy del home vive en content/hiring.
  hiring: {
    links: {
      github: 'https://github.com/Brandon-S-Engineer',
      linkedin: 'https://www.linkedin.com/in/brandon-i-soria/',
      email: 'brandon.s.engineer@gmail.com',
      // Número en formato internacional para wa.me (52 = México).
      whatsapp: '525516516493',
      phone: '+525516516493',
      // El CV en español vive junto: /cv/Brandon-Soria-CV-ES.pdf
      cv: '/cv/Brandon-Soria-CV-EN.pdf',
    },
  },
  // Servicio Python del proyecto 02 (Render). En local se sobreescribe con
  // NEXT_PUBLIC_LEAD_AGENT_URL.
  leadAgentUrl: 'https://volt-lead-agent.onrender.com',
  // Core stack shown as a trust strip on the home page — AI first.
  stack: [
    'Python',
    'FastAPI',
    'Pydantic AI',
    'OpenAI',
    'Claude',
    'pgvector',
    'n8n',
    'Next.js',
    'TypeScript',
    'Postgres',
    'Stripe',
  ],
} as const

export type Site = typeof site
