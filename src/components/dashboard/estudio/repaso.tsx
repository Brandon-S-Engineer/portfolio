'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, PartyPopper } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { dueAt } from '@/lib/estudio/srs'
import { useStudy } from '@/lib/estudio/store'
import type { DeckCard } from '@/lib/estudio/types'
import { FlipCard } from './checks'

export default function Repaso({ cards }: { cards: DeckCard[] }) {
  const { rows, loaded, load } = useStudy()
  useEffect(() => { load() }, [load])
  // La cola se arma una vez: calificar no debe reordenarla a media sesión.
  const [queue, setQueue] = useState<DeckCard[] | null>(null)
  const [total, setTotal] = useState(0)

  const start = (mode: 'due' | 'all') => {
    const now = Date.now()
    const withDue = cards.map((c) => ({ c, due: dueAt(rows[`card:${c.id}`], rows[`lesson:${c.lessonId}`]) }))
    const picked = mode === 'due'
      ? withDue.filter((x) => x.due !== null && x.due <= now).sort((a, b) => (a.due ?? 0) - (b.due ?? 0))
      : withDue.filter((x) => x.due !== null).sort(() => Math.random() - 0.5)
    const list = (picked.length || mode === 'due' ? picked : withDue).map((x) => x.c)
    setQueue(list); setTotal(list.length)
  }
  useEffect(() => { if (loaded && queue === null) start('due') }, [loaded]) // eslint-disable-line react-hooks/exhaustive-deps

  // Todas las pendientes a la vista, agrupadas por lección. "La sabía" la quita;
  // "Agregar" la deja en su lugar (borde naranja) para volver a intentarla.
  const [known, setKnown] = useState<Set<string>>(new Set())
  useEffect(() => { setKnown(new Set()) }, [queue])
  const pending = (queue ?? []).filter((c) => !known.has(c.id))
  const groups = [...pending.reduce((m, c) => m.set(c.lessonId, [...(m.get(c.lessonId) ?? []), c]), new Map<string, DeckCard[]>()).values()]
  const seen = known.size

  return (
    <div className='mx-auto max-w-5xl px-3 pb-16 sm:px-0'>
      <Link href='/dashboard/estudio' className='inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground'><ArrowLeft className='h-4 w-4' />Estudio</Link>
      <h1 className='mt-3 text-2xl font-bold tracking-tight'>Repaso de hoy</h1>
      <p className='mt-1 text-sm text-muted-foreground'>Responde en tu cabeza antes de voltear. Sé honesto: lo que fallas vuelve mañana.</p>

      {!queue ? <p className='mt-8 text-sm text-muted-foreground'>Cargando…</p> : pending.length ? (
        <div className='mt-6'>
          <div className='sticky top-0 z-10 -mx-3 mb-4 flex items-center gap-3 bg-background/95 px-3 py-2 text-xs text-muted-foreground backdrop-blur'>
            <div className='h-1.5 flex-1 overflow-hidden rounded-full bg-muted'><div className='h-full bg-green-500 transition-all' style={{ width: `${total ? (seen / total) * 100 : 0}%` }} /></div>
            <span className='tabular-nums'>{seen}/{total}</span>
          </div>
          <div className='space-y-6'>
            {groups.map((g) => (
              <section key={g[0].lessonId}>
                <div className='mb-2 flex items-baseline justify-between gap-2'>
                  <Link href={`/dashboard/estudio/${g[0].lessonId}`} className='text-sm font-semibold hover:underline'>{g[0].lessonTitle}</Link>
                  <span className='text-xs text-muted-foreground tabular-nums'>{g.length}</span>
                </div>
                <div className='grid gap-2 sm:grid-cols-2 lg:grid-cols-3'>
                  {g.map((c) => <FlipCard key={c.id} card={c} onRated={(knew) => { if (knew) setKnown((k) => new Set(k).add(c.id)) }} />)}
                </div>
              </section>
            ))}
          </div>
        </div>
      ) : (
        <div className='mt-8 rounded-xl border bg-card p-6 text-center'>
          <PartyPopper className='mx-auto h-8 w-8 text-green-600' />
          <p className='mt-2 font-semibold'>{total > 0 ? `Listo: ${total} tarjetas repasadas.` : 'Nada pendiente por hoy.'}</p>
          <p className='mt-1 text-sm text-muted-foreground'>Las tarjetas aparecen aquí cuando las calificas en una lección o palomeas la lección.</p>
          <Button variant='outline' className='mt-4' onClick={() => start('all')}>Practicar de todos modos</Button>
        </div>
      )}
    </div>
  )
}
