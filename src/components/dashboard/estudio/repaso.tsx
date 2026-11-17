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
  const [seen, setSeen] = useState(0)

  const start = (mode: 'due' | 'all') => {
    const now = Date.now()
    const withDue = cards.map((c) => ({ c, due: dueAt(rows[`card:${c.id}`], rows[`lesson:${c.lessonId}`]) }))
    const picked = mode === 'due'
      ? withDue.filter((x) => x.due !== null && x.due <= now).sort((a, b) => (a.due ?? 0) - (b.due ?? 0))
      : withDue.filter((x) => x.due !== null).sort(() => Math.random() - 0.5)
    const list = (picked.length || mode === 'due' ? picked : withDue).map((x) => x.c)
    setQueue(list); setTotal(list.length); setSeen(0)
  }
  useEffect(() => { if (loaded && queue === null) start('due') }, [loaded]) // eslint-disable-line react-hooks/exhaustive-deps

  const card = queue?.[0]
  const onRated = (knew: boolean) => {
    setSeen((n) => n + (knew ? 1 : 0))
    setQueue((q) => (q ? (knew ? q.slice(1) : [...q.slice(1), q[0]]) : q)) // la que fallas vuelve al final
  }

  return (
    <div className='mx-auto max-w-2xl px-3 pb-16 sm:px-0'>
      <Link href='/dashboard/estudio' className='inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground'><ArrowLeft className='h-4 w-4' />Estudio</Link>
      <h1 className='mt-3 text-2xl font-bold tracking-tight'>Repaso de hoy</h1>
      <p className='mt-1 text-sm text-muted-foreground'>Responde en tu cabeza antes de voltear. Sé honesto: lo que fallas vuelve mañana.</p>

      {!queue ? <p className='mt-8 text-sm text-muted-foreground'>Cargando…</p> : card ? (
        <div className='mt-6'>
          <div className='mb-3 flex items-center gap-3 text-xs text-muted-foreground'>
            <div className='h-1.5 flex-1 overflow-hidden rounded-full bg-muted'><div className='h-full bg-green-500 transition-all' style={{ width: `${total ? (seen / total) * 100 : 0}%` }} /></div>
            <span className='tabular-nums'>{seen}/{total}</span>
          </div>
          <FlipCard key={card.id + queue.length} card={card} onRated={onRated} big />
          <p className='mt-2 text-xs text-muted-foreground'>De: <Link href={`/dashboard/estudio/${card.lessonId}`} className='underline'>{card.lessonTitle}</Link></p>
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
