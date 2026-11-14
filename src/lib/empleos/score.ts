// ── Veredicto de una vacante ─────────────────────────────────────────────────
// Pregunta: "¿vale la pena aplicar?" para Brandon: ~2 años de freelance, sin
// empleo formal ni título, fuerte en agentes de IA + full-stack TS/Python.
//
// Filtro #1: los años de experiencia que piden.
//   sin mínimo o ≤2 → aplicar · 3–4 → estirar (aplica si el resto encaja) · ≥5 → descartar
// Después: nivel en el título, qué tanto coincide el stack, ubicación y título.
// Sin descripción (solo la tarjeta de la lista) queda PENDIENTE.

export type RawPosting = {
  title: string
  company?: string | null
  location?: string | null
  snippet?: string | null
  details?: string | null
  description?: string | null
}

export type Verdict = 'APLICAR' | 'ESTIRAR' | 'DESCARTAR' | 'PENDIENTE'
export type Tag = 'SILENCIADA' | 'MASIVA' | 'YA_APLICASTE'
export type Reason = { pts: number; why: string; tag?: Tag }
export type PostingScore = { verdict: Verdict; score: number; expYears: number | null; reasons: Reason[]; tag: Tag | null }

// Lo que se sabe de la empresa y de republicaciones (lo arma lib/empleos/server).
export type PostingContext = {
  muted?: boolean // el usuario silenció a la empresa
  companyPostings?: number // vacantes distintas de esa empresa en 30 días
  repost?: 'APLICADA' | 'VISTA' | null // misma empresa y título ya capturados con otro ID
}

// Desde cuántas vacantes en 30 días se considera que una empresa publica en masa.
export const MASS_POSTINGS = 8

const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')

// "3 años", "3+ years", "3 a 5 años", "2-4 yrs": se toma el número de abajo del rango.
const YEARS = /(\d{1,2})\s*(?:\+|(?:a|-|–|to)\s*\d{1,2})?\s*\+?\s*(?:anos?|years?|yrs?)\b/g
// Años que no son experiencia del candidato: edad, o antigüedad de la empresa.
const NOT_EXPERIENCE = /edad|mayor de|years? old|mercado|market|trayectoria|fundad|founded|historia|history|aniversario|en la industria desde/

/** El mínimo de años que exige la vacante (el más alto que mencione), o null. */
export function requiredYears(text: string): number | null {
  const t = norm(text)
  let max: number | null = null
  for (const m of t.matchAll(YEARS)) {
    const n = Number(m[1])
    if (n < 1 || n > 15) continue
    const around = t.slice(Math.max(0, m.index - 60), m.index + m[0].length + 60)
    if (!/experienc|\bexp\b|trabajando|working|hands[- ]on|background/.test(around)) continue
    if (NOT_EXPERIENCE.test(t.slice(Math.max(0, m.index - 30), m.index + m[0].length + 25))) continue
    if (max === null || n > max) max = n
  }
  return max
}

const SENIOR = /\b(senior|sr|lead|staff|principal|architect|arquitecto|manager|gerente|head|director|lider)\b/
const JUNIOR = /\b(junior|jr|trainee|entry|associate|graduate|recien egresado)\b/
const INTERN = /\b(becario|practicante|intern|internship|practicas)\b/

// Lo que Brandon sí domina. Las de IA pesan más: es lo que quiere vender.
const AI_STACK: [RegExp, string][] = [
  [/\bllms?\b|large language model/, 'LLM'],
  [/\brag\b|retrieval/, 'RAG'],
  [/langgraph|langchain/, 'LangGraph'],
  [/openai|gpt|claude|anthropic|gemini/, 'APIs de modelos'],
  [/\bagent(s|es|ic)?\b|agente/, 'agentes'],
  [/\bmcp\b/, 'MCP'],
  [/\bn8n\b/, 'n8n'],
  [/prompt/, 'prompts'],
  [/embedding|pgvector|vector (db|database|store)/, 'embeddings'],
  [/generative ai|genai|gen ai|ia generativa|inteligencia artificial generativa/, 'IA generativa'],
  [/chatbot|asistente virtual|conversational/, 'chatbots'],
]
const WEB_STACK: [RegExp, string][] = [
  [/python/, 'Python'],
  [/typescript/, 'TypeScript'],
  [/javascript/, 'JavaScript'],
  [/\breact\b|reactjs|react\.js/, 'React'],
  [/next\.?js/, 'Next.js'],
  [/node\.?js|\bnode\b/, 'Node.js'],
  [/fastapi/, 'FastAPI'],
  [/postgres|\bsql\b/, 'SQL/Postgres'],
  [/tailwind/, 'Tailwind'],
  [/mongo/, 'MongoDB'],
  [/docker/, 'Docker'],
  [/\baws\b/, 'AWS'],
  [/api rest|rest api|restful|\bapis?\b/, 'APIs'],
]
// Si el TÍTULO gira alrededor de esto, el puesto es de otro stack.
const OTHER_STACK = /\bjava\b|\.net\b|\bc#|\bphp\b|\bsap\b|salesforce|cobol|android|\bios\b|swift|kotlin|golang|\bruby\b|angular|\babap\b|mainframe|power ?bi|servicenow|dynamics|oracle|wordpress|\bqa\b|tester|devops|\bsre\b|soporte|help ?desk|data analyst|analista de datos/
const DEV_TITLE = /develop|desarroll|engineer|ingenier|programad|software|full[- ]?stack|front[- ]?end|back[- ]?end|\bai\b|\bia\b|\bml\b|machine learning|automatiza|automation/
const AI_TITLE = /\bai\b|\bia\b|\bllm|genai|generative|generativa|inteligencia artificial|machine learning|\bml\b|agent|automatiza|automation/
const DEGREE = /titulad[oa]|titulo profesional|cedula profesional|licenciatura (concluida|terminada)|bachelor'?s degree (is )?required|degree required/
const DEGREE_OPTIONAL = /or equivalent|o experiencia equivalente|o equivalente|pasante|trunca/

const REMOTE = /remot|home ?office|desde casa|teletrabajo|work from home/
const CDMX = /ciudad de mexico|cdmx|\bd\.?f\.?\b|miguel hidalgo|cuauhtemoc|benito juarez|alvaro obregon|polanco|santa fe|coyoacan|azcapotzalco|naucalpan|tlalnepantla|huixquilucan|interlomas|estado de mexico|\bmex\./

export function scorePosting(p: RawPosting, ctx: PostingContext = {}): PostingScore {
  const title = norm(p.title)
  const body = norm([p.description, p.details, p.snippet].filter(Boolean).join('\n'))
  const all = `${title}\n${body}`
  const hasDescription = (p.description?.trim().length ?? 0) > 200
  const reasons: Reason[] = []
  const add = (pts: number, why: string, tag?: Tag) => reasons.push(tag ? { pts, why, tag } : { pts, why })

  // 1) Experiencia
  const expYears = hasDescription ? requiredYears(all) : null
  if (hasDescription) {
    if (expYears === null) add(2, 'No piden un mínimo de años')
    else if (expYears <= 2) add(2.5, `Piden ${expYears} año${expYears > 1 ? 's' : ''}: lo cumples`)
    else if (expYears === 3) add(0, 'Piden 3 años: estás cerca, aplica si el resto encaja')
    else if (expYears === 4) add(-1.5, 'Piden 4 años: es estirar bastante')
    else add(-4, `Piden ${expYears}+ años: fuera de alcance por ahora`)
  }

  // 2) Nivel en el título
  const senior = SENIOR.test(title)
  if (senior) add(-2, 'Título de nivel senior o líder')
  if (JUNIOR.test(title)) add(1.5, 'Título de nivel junior')
  if (INTERN.test(title)) add(-1, 'Es beca o prácticas (suele pedir ser estudiante)')

  // 3) Stack
  const ai = AI_STACK.filter(([re]) => re.test(all)).map(([, n]) => n)
  const web = WEB_STACK.filter(([re]) => re.test(all)).map(([, n]) => n)
  const stackPts = Math.min(3.5, ai.length * 0.75 + web.length * 0.4)
  if (ai.length + web.length) add(Math.round(stackPts * 10) / 10, `Coincide con tu stack: ${[...ai, ...web].slice(0, 8).join(', ')}`)
  if (AI_TITLE.test(title)) add(1, 'El puesto es de IA o automatización')
  const otherStack = OTHER_STACK.test(title)
  if (otherStack) add(-3, 'El título es de otro stack o de otra área')
  const isDev = DEV_TITLE.test(title)
  if (!isDev && !otherStack) add(-1.5, 'El título no parece de desarrollo')

  // 4) Título universitario
  if (hasDescription && DEGREE.test(body) && !DEGREE_OPTIONAL.test(body)) add(-1, 'Piden título o cédula')

  // 5) Ubicación
  const loc = norm([p.location, p.snippet, p.details].filter(Boolean).join(' '))
  if (REMOTE.test(loc) || REMOTE.test(title)) add(0.5, 'Remoto')
  else if (CDMX.test(loc)) add(0.5, 'En CDMX o área metropolitana')
  else if (loc.trim()) add(-1.5, `Otra ciudad y no dice remoto (${p.location ?? ''})`)

  // 6) Spam: empresas que publican sin parar y vacantes republicadas
  const mass = (ctx.companyPostings ?? 0) >= MASS_POSTINGS
  if (ctx.muted) add(-5, 'Silenciaste a esta empresa', 'SILENCIADA')
  else if (mass) add(-2, `Esta empresa publica en masa (${ctx.companyPostings} vacantes en 30 días)`, 'MASIVA')
  if (ctx.repost === 'APLICADA') add(-5, 'Ya aplicaste a esta misma vacante (la republicaron)', 'YA_APLICASTE')
  else if (ctx.repost === 'VISTA') add(-1, 'Republicada: ya habías visto esta misma vacante')

  // Las penalizaciones de spam se restan después del tope de 10, para que una
  // vacante "perfecta" de una empresa que publica en masa no siga viéndose perfecta.
  const sum = (rs: Reason[]) => rs.reduce((t, r) => t + r.pts, 0)
  const clamp = (n: number) => Math.max(0, Math.min(10, Math.round(n * 10) / 10))
  const spamFrom = reasons.findIndex((r) => r.tag || r.why.startsWith('Republicada'))
  const fit = spamFrom < 0 ? reasons : reasons.slice(0, spamFrom)
  const score = clamp(clamp(5 + sum(fit)) + sum(spamFrom < 0 ? [] : reasons.slice(spamFrom)))

  let verdict: Verdict
  const noFit = ai.length + web.length === 0
  if (ctx.muted || ctx.repost === 'APLICADA' || (otherStack && ai.length === 0)) verdict = 'DESCARTAR'
  else if (!hasDescription) verdict = 'PENDIENTE'
  else if ((expYears ?? 0) >= 5 || noFit || score < 4) verdict = 'DESCARTAR'
  else if ((expYears ?? 0) >= 3 || senior || score < 6.5) verdict = 'ESTIRAR'
  else verdict = 'APLICAR'
  // Una empresa que publica en masa nunca sale en verde: que no robe atención.
  if (mass && verdict === 'APLICAR') verdict = 'ESTIRAR'

  if (!hasDescription && verdict === 'PENDIENTE') add(0, 'Falta leer la descripción para ver los años que piden')
  return { verdict, score, expYears, reasons, tag: reasons.find((r) => r.tag)?.tag ?? null }
}
