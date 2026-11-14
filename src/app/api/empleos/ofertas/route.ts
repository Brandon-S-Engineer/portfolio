// ── Captura de vacantes (Indeed): la extensión manda la vacante cruda, el
//    servidor calcula el veredicto y hace upsert por externalId.
//
// Acepta sesión NextAuth (admin) o API key Bearer, con CORS para la extensión.
// Responde el veredicto de cada una para que la extensión lo pinte en Indeed.

import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireSessionOrApiKey, CORS_HEADERS, corsOk } from '@/lib/api-auth'
import { MASS_POSTINGS, scorePosting } from '@/lib/empleos/score'
import { postingContext, rescoreCompany, toResult } from '@/lib/empleos/server'

const postingSchema = z.object({
  externalId: z.string().min(3).max(120),
  url: z.string().url(),
  title: z.string().min(1).max(300),
  company: z.string().max(300).optional(),
  location: z.string().max(300).optional(),
  snippet: z.string().max(1000).optional(),
  details: z.string().max(2000).optional(),
  description: z.string().max(30000).optional(),
})

const bodySchema = z.array(postingSchema).min(1).max(100)

export function OPTIONS() {
  return corsOk()
}

export async function POST(req: Request) {
  const authError = await requireSessionOrApiKey(req)
  if (authError) {
    authError.headers.set('Access-Control-Allow-Origin', '*')
    return authError
  }

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers: CORS_HEADERS })
  }
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400, headers: CORS_HEADERS })
  }

  let created = 0
  let updated = 0
  const results = new Map<string, ReturnType<typeof toResult>>()
  const newByCompany = new Map<string, number>()

  for (const p of parsed.data) {
    try {
      const existing = await prisma.jobPosting.findUnique({ where: { externalId: p.externalId } })
      // La tarjeta de la lista llega sin descripción: no pisar la que ya se leyó.
      const merged = {
        url: p.url,
        title: p.title,
        company: p.company ?? existing?.company ?? null,
        location: p.location ?? existing?.location ?? null,
        snippet: p.snippet ?? existing?.snippet ?? null,
        details: p.details ?? existing?.details ?? null,
        description: p.description ?? existing?.description ?? null,
      }
      const s = scorePosting(merged, await postingContext({ ...merged, externalId: p.externalId }))
      const data = { ...merged, expYears: s.expYears, verdict: s.verdict, score: s.score, reasons: s.reasons, lastSeenAt: new Date() }
      const row = await prisma.jobPosting.upsert({
        where: { externalId: p.externalId },
        create: { externalId: p.externalId, ...data },
        update: data,
      })
      if (existing) updated++
      else {
        created++
        if (row.company) newByCompany.set(row.company, (newByCompany.get(row.company) ?? 0) + 1)
      }
      results.set(row.externalId, toResult(row))
    } catch (err) {
      console.error(`empleos POST falló para ${p.externalId}:`, err)
    }
  }

  // Una empresa que llega al umbral de "publica en masa" con este lote: se
  // recalculan todas sus vacantes para que ninguna se quede en verde.
  for (const company of newByCompany.keys()) {
    const total = await prisma.jobPosting.count({ where: { company: { equals: company, mode: 'insensitive' } } })
    if (total < MASS_POSTINGS) continue
    for (const row of await rescoreCompany(company)) if (results.has(row.externalId)) results.set(row.externalId, toResult(row))
  }

  return NextResponse.json({ created, updated, results: [...results.values()] }, { status: 201, headers: CORS_HEADERS })
}
