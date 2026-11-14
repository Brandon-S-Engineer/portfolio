// Contexto de empresa para el veredicto (silenciadas, publicación en masa,
// republicaciones) y re-cálculo de las vacantes de una empresa.

import { prisma } from '@/lib/db'
import type { JobPosting } from '@prisma/client'
import { scorePosting, type PostingContext, type RawPosting } from './score'

const DAY = 24 * 60 * 60 * 1000

export const companyKey = (name: string) => name.toLowerCase().replace(/\s+/g, ' ').trim()

export async function postingContext(p: RawPosting & { externalId: string }): Promise<PostingContext> {
  if (!p.company) return {}
  const sameCompany = { company: { equals: p.company, mode: 'insensitive' as const } }
  const [muted, companyPostings, siblings] = await Promise.all([
    prisma.jobMutedCompany.findUnique({ where: { name: companyKey(p.company) } }),
    prisma.jobPosting.count({ where: { ...sameCompany, firstSeenAt: { gte: new Date(Date.now() - 30 * DAY) } } }),
    prisma.jobPosting.findMany({
      where: { ...sameCompany, title: { equals: p.title, mode: 'insensitive' }, externalId: { not: p.externalId } },
      select: { estado: true },
    }),
  ])
  return {
    muted: !!muted,
    companyPostings,
    repost: siblings.some((s) => s.estado === 'APLICADA') ? 'APLICADA' : siblings.length ? 'VISTA' : null,
  }
}

/** Lo que la extensión necesita para pintar una tarjeta. */
export function toResult(row: JobPosting) {
  const reasons = Array.isArray(row.reasons) ? (row.reasons as { tag?: string }[]) : []
  return {
    externalId: row.externalId,
    verdict: row.verdict,
    score: row.score,
    expYears: row.expYears,
    estado: row.estado,
    tag: reasons.find((r) => r.tag)?.tag ?? null,
  }
}

/** Recalcula las vacantes de una empresa (al silenciarla, o cuando cruza el umbral de "en masa"). */
export async function rescoreCompany(company: string): Promise<JobPosting[]> {
  const rows = await prisma.jobPosting.findMany({ where: { company: { equals: company, mode: 'insensitive' } } })
  const out: JobPosting[] = []
  for (const row of rows) {
    const s = scorePosting(row, await postingContext(row))
    out.push(
      await prisma.jobPosting.update({
        where: { id: row.id },
        data: { expYears: s.expYears, verdict: s.verdict, score: s.score, reasons: s.reasons },
      }),
    )
  }
  return out
}
