// ── Acciones sobre vacantes desde la extensión (en Indeed) o desde el CRM:
//    marcar el estado de una vacante, o silenciar/reactivar una empresa.
//
// Acepta sesión NextAuth (admin) o API key Bearer, con CORS para la extensión.
// Responde las vacantes afectadas para que quien llama las vuelva a pintar.

import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireSessionOrApiKey, CORS_HEADERS, corsOk } from '@/lib/api-auth'
import { companyKey, rescoreCompany, toResult } from '@/lib/empleos/server'

const bodySchema = z.union([
  z.object({ externalId: z.string().min(3), estado: z.enum(['NUEVA', 'GUARDADA', 'APLICADA', 'DESCARTADA']) }),
  z.object({ company: z.string().min(1).max(300), mute: z.boolean() }),
])

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
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400, headers: CORS_HEADERS })
  const data = parsed.data

  if ('company' in data) {
    const name = companyKey(data.company)
    if (data.mute) await prisma.jobMutedCompany.upsert({ where: { name }, create: { name }, update: {} })
    else await prisma.jobMutedCompany.deleteMany({ where: { name } })
    const rows = await rescoreCompany(data.company)
    return NextResponse.json({ rows, results: rows.map(toResult) }, { headers: CORS_HEADERS })
  }

  const existing = await prisma.jobPosting.findUnique({ where: { externalId: data.externalId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404, headers: CORS_HEADERS })
  await prisma.jobPosting.update({
    where: { id: existing.id },
    data: { estado: data.estado, appliedAt: data.estado === 'APLICADA' ? (existing.appliedAt ?? new Date()) : existing.appliedAt },
  })
  // Aplicar (o deshacerlo) cambia el veredicto de las republicaciones de la misma vacante.
  const rows = existing.company
    ? await rescoreCompany(existing.company)
    : await prisma.jobPosting.findMany({ where: { id: existing.id } })
  return NextResponse.json({ rows, results: rows.map(toResult) }, { headers: CORS_HEADERS })
}
