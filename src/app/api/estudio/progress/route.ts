import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/require-admin'
import type { ProgressMap } from '@/lib/estudio/types'

const body = z.object({
  key: z.string().min(1).max(120),
  status: z.string().min(1).max(20),
  data: z.record(z.string(), z.unknown()).optional(),
})

export async function GET() {
  const error = await requireAdmin()
  if (error) return error
  const rows = await prisma.studyProgress.findMany()
  const map: ProgressMap = {}
  for (const r of rows) map[r.key] = { status: r.status, data: r.data as ProgressMap[string]['data'], updatedAt: r.updatedAt.toISOString() }
  return NextResponse.json(map)
}

export async function PUT(req: Request) {
  const error = await requireAdmin()
  if (error) return error
  const parsed = body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  const { key, status, data } = parsed.data
  const json = (data ?? undefined) as object | undefined
  await prisma.studyProgress.upsert({ where: { key }, create: { key, status, data: json }, update: { status, data: json } })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const error = await requireAdmin()
  if (error) return error
  const key = new URL(req.url).searchParams.get('key')
  if (!key) return NextResponse.json({ error: 'Falta key' }, { status: 400 })
  await prisma.studyProgress.deleteMany({ where: { key } })
  return NextResponse.json({ ok: true })
}
