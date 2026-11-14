import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import VacantesBoard, { type Vacante } from '@/components/dashboard/vacantes-board'

export const dynamic = 'force-dynamic'

export default async function EmpleosPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const rows = await prisma.jobPosting.findMany({ orderBy: [{ score: 'desc' }, { firstSeenAt: 'desc' }], take: 1000 })

  const vacantes: Vacante[] = rows.map((r) => ({
    id: r.id,
    externalId: r.externalId,
    url: r.url,
    title: r.title,
    company: r.company,
    location: r.location,
    snippet: r.snippet,
    details: r.details,
    description: r.description,
    expYears: r.expYears,
    verdict: r.verdict as Vacante['verdict'],
    score: r.score,
    reasons: Array.isArray(r.reasons) ? (r.reasons as Vacante['reasons']) : [],
    estado: r.estado as Vacante['estado'],
    appliedAt: r.appliedAt ? r.appliedAt.toISOString() : null,
    firstSeenAt: r.firstSeenAt.toISOString(),
  }))

  return (
    <div className='p-3 sm:p-6 space-y-6'>
      <div>
        <h1 className='text-xl font-semibold'>Vacantes</h1>
        <p className='text-sm text-muted-foreground mt-1'>
          Capturadas en Indeed por la extensión. El filtro principal son los años de experiencia que piden.
        </p>
      </div>
      <VacantesBoard vacantes={vacantes} />
    </div>
  )
}
