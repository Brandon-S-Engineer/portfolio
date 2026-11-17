'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, Eye, RotateCcw, SkipForward } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { rate } from '@/lib/estudio/srs'
import { useStudy } from '@/lib/estudio/store'
import type { DeckQa } from '@/lib/estudio/types'
import { QaAnswer, qaLabel } from './checks'

const LIMIT = 90

export default function Entrevista({ questions }: { questions: DeckQa[] }) {
  const { rows, loaded, load, set } = useStudy()
  useEffect(() => { load() }, [load])
  const cats = useMemo(() => [...new Set(questions.map((q) => q.cat))], [questions])
  const [cat, setCat] = useState('all')
  const [queue, setQueue] = useState<DeckQa[] | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [secs, setSecs] = useState(0)
  const [answered, setAnswered] = useState(0)

  // Primero las que te costaron, luego las nunca vistas, al final las que ya salen.
  useEffect(() => {
    if (!loaded) return
    const rank = (q: DeckQa) => { const s = rows[`qa:${q.id}`]?.status; return s === 'again' ? 0 : s === 'known' ? 2 : 1 }
    const pool = questions.filter((q) => cat === 'all' || q.cat === cat).map((q) => ({ q, r: rank(q) + Math.random() * 0.9 }))
    setQueue(pool.sort((a, b) => a.r - b.r).map((x) => x.q))
    setRevealed(false); setSecs(0)
  }, [loaded, cat, questions]) // eslint-disable-line react-hooks/exhaustive-deps

  const q = queue?.[0]
  useEffect(() => {
    if (!q || revealed) return
    const t = setInterval(() => setSecs((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [q, revealed])

  const nextQ = () => { setQueue((x) => (x ? x.slice(1) : x)); setRevealed(false); setSecs(0) }
  const grade = (knew: boolean) => {
    if (!q) return
    const r = rate(rows[`qa:${q.id}`], knew)
    set(`qa:${q.id}`, r.status, r.data)
    setAnswered((n) => n + 1)
    nextQ()
  }
  const known = questions.filter((x) => rows[`qa:${x.id}`]?.status === 'known').length
  const chip = (active: boolean) => cn('rounded-full border px-3 py-1 text-xs font-medium transition-colors', active ? 'border-blue-600 bg-blue-600 text-white' : 'hover:bg-muted')

  return (
    <div className='mx-auto max-w-2xl px-3 pb-16 sm:px-0'>
      <Link href='/dashboard/estudio' className='inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground'><ArrowLeft className='h-4 w-4' />Estudio</Link>
      <h1 className='mt-3 text-2xl font-bold tracking-tight'>Entrevista simulada</h1>
      <p className='mt-1 text-sm text-muted-foreground'>Responde <b>en voz alta y en inglés</b> antes de revelar. Dominas {known} de {questions.length}.</p>
      <div className='mt-4 flex flex-wrap gap-1.5'>
        <button className={chip(cat === 'all')} onClick={() => setCat('all')}>Todas</button>
        {cats.map((c) => <button key={c} className={chip(cat === c)} onClick={() => setCat(c)}>{qaLabel(c)}</button>)}
      </div>

      {!queue ? <p className='mt-8 text-sm text-muted-foreground'>Cargando…</p> : q ? (
        <div className='mt-6 rounded-xl border bg-card p-5 sm:p-6'>
          <div className='flex items-center justify-between text-xs text-muted-foreground'>
            <span className='font-semibold uppercase tracking-wider'>{qaLabel(q.cat)}</span>
            <span className={cn('font-mono text-base font-bold tabular-nums', secs > LIMIT ? 'text-red-600' : secs > LIMIT - 20 ? 'text-orange-600' : 'text-foreground')}>{Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')}</span>
          </div>
          <p className='mt-3 text-xl font-semibold leading-snug sm:text-2xl'>{q.q}</p>
          <p className='mt-1 text-xs text-muted-foreground'>Apunta a menos de {LIMIT} segundos.</p>
          {!revealed ? (
            <div className='mt-5 flex gap-2'>
              <Button onClick={() => setRevealed(true)}><Eye className='h-4 w-4' />Ya respondí, revelar</Button>
              <Button variant='ghost' onClick={nextQ}><SkipForward className='h-4 w-4' />Saltar</Button>
            </div>
          ) : (
            <div className='mt-5 border-t pt-4'>
              <QaAnswer b={q} />
              <div className='mt-4 flex gap-2'>
                <Button variant='outline' onClick={() => grade(false)}><RotateCcw className='h-4 w-4' />Me costó</Button>
                <Button onClick={() => grade(true)} className='bg-green-600 text-white hover:bg-green-700'><Check className='h-4 w-4' />Me salió</Button>
              </div>
            </div>
          )}
          <p className='mt-4 text-xs text-muted-foreground'>{answered} respondidas en esta sesión · quedan {queue.length} · de <Link className='underline' href={`/dashboard/estudio/${q.lessonId}`}>{q.lessonTitle}</Link></p>
        </div>
      ) : (
        <div className='mt-8 rounded-xl border bg-card p-6 text-center'>
          <p className='font-semibold'>Terminaste esta ronda: {answered} respondidas.</p>
          <Button variant='outline' className='mt-4' onClick={() => setCat((c) => (c === 'all' ? cats[0] ?? 'all' : 'all'))}>Otra ronda</Button>
        </div>
      )}
    </div>
  )
}
