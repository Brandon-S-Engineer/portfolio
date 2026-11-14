// ── Proxy del agente de voz ("Talk to my portfolio") ─────────────────────────
//
// El SDK de Retell en el navegador manda aquí su POST /v3/create-web-call; este
// route le pone la API key real (nunca llega al navegador), fija el agente y
// aplica los topes de gasto antes de reenviarlo a Retell.
//
// Topes: TALK_PER_VISITOR llamadas por visitante al día y TALK_DAILY_LIMIT en
// total al día. Cada llamada dura como máximo 3 min (configurado en Retell), así
// que el peor caso diario es TALK_DAILY_LIMIT × 3 min × costo por minuto.
// El límite de gasto de la cuenta en Retell es la red de seguridad final.

import { createHash } from 'crypto'
import { prisma } from '@/lib/db'

const PER_VISITOR = Number(process.env.TALK_PER_VISITOR ?? 3)
const DAILY_LIMIT = Number(process.env.TALK_DAILY_LIMIT ?? 20)
const DAY = 24 * 60 * 60 * 1000

const json = (body: unknown, status = 200) => Response.json(body, { status })

export async function POST(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  if (path.join('/') !== 'v3/create-web-call') return json({ error: 'not_found' }, 404)

  const key = process.env.RETELL_API_KEY
  const agentId = process.env.RETELL_AGENT_ID
  if (!key || !agentId) return json({ error: 'not_configured' }, 503)

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  const ipHash = createHash('sha256').update(`talk:${ip}`).digest('hex').slice(0, 32)
  const since = new Date(Date.now() - DAY)
  const [mine, total] = await Promise.all([
    prisma.talkCall.count({ where: { ipHash, createdAt: { gte: since } } }),
    prisma.talkCall.count({ where: { createdAt: { gte: since } } }),
  ])
  if (mine >= PER_VISITOR) return json({ error: 'visitor_limit' }, 429)
  if (total >= DAILY_LIMIT) return json({ error: 'daily_limit' }, 429)

  // Lo que mande el navegador se ignora: el agente y sus datos los fija el servidor.
  const upstream = await fetch('https://api.retellai.com/v3/create-web-call', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ agent_id: agentId, metadata: { source: 'portfolio' } }),
  }).catch(() => null)
  if (!upstream) return json({ error: 'upstream_unreachable' }, 502)

  const text = await upstream.text()
  if (upstream.ok) {
    let callId: string | null = null
    try { callId = JSON.parse(text).call_id ?? null } catch {}
    await prisma.talkCall.create({ data: { ipHash, callId } })
  } else {
    console.error('Retell create-web-call', upstream.status, text.slice(0, 300))
  }
  return new Response(text, { status: upstream.status, headers: { 'Content-Type': 'application/json' } })
}
