import { requireAdmin } from '@/lib/require-admin'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const patchSchema = z.object({
  estado: z.enum(['NUEVA', 'GUARDADA', 'APLICADA', 'DESCARTADA']).optional(),
  notes: z.string().max(2000).optional(),
})

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Params) {
  const error = await requireAdmin()
  if (error) return error
  const { id } = await params

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const existing = await prisma.jobPosting.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { estado, notes } = parsed.data
  const row = await prisma.jobPosting.update({
    where: { id },
    data: {
      ...(estado !== undefined && { estado, appliedAt: estado === 'APLICADA' ? (existing.appliedAt ?? new Date()) : existing.appliedAt }),
      ...(notes !== undefined && { notes }),
    },
  })
  return NextResponse.json(row)
}
