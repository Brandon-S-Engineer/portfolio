'use client'

import { useEffect, useMemo } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, Layers, MessagesSquare, Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import { dueAt } from '@/lib/estudio/srs'
import { useStudy } from '@/lib/estudio/store'
import type { UnitOutline } from '@/lib/estudio/types'

const LEVEL: Record<string, string> = {
  Base: 'bg-green-500/15 text-green-700 dark:text-green-300',
  Core: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  Senior: 'bg-purple-500/15 text-purple-700 dark:text-purple-300',
  Proyectos: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  Entrevista: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
}

function Bar({ value, className }: { value: number; className?: string }) {
  return <div className={cn('h-2 overflow-hidden rounded-full bg-muted', className)}><div className='h-full rounded-full bg-green-500 transition-all' style={{ width: `${Math.round(value * 100)}%` }} /></div>
}

export default function StudyHome({ units, qaCount }: { units: UnitOutline[]; qaCount: number }) {
  const { rows, loaded, load, set, remove } = useStudy()
  useEffect(() => { load() }, [load])

  const lessons = useMemo(() => units.flatMap((u) => u.lessons), [units])
  const isDone = (id: string) => rows[`lesson:${id}`]?.status === 'done'
  const doneCount = lessons.filter((l) => isDone(l.id)).length
  const checks = lessons.flatMap((l) => l.checks)
  const checksDone = checks.filter((c) => rows[`check:${c}`]?.status === 'pass').length
  const next = lessons.find((l) => !isDone(l.id))
  const due = useMemo(() => {
    const now = Date.now()
    return lessons.reduce((n, l) => n + l.cards.filter((c) => { const d = dueAt(rows[`card:${c}`], rows[`lesson:${l.id}`]); return d !== null && d <= now }).length, 0)
  }, [lessons, rows])

  if (units.length === 0) {
    return <div className='mx-auto max-w-xl rounded-xl border p-6 text-sm'>Todavía no hay contenido cargado. Corre <code className='rounded bg-muted px-1 font-mono'>npm run seed:study -- &lt;carpeta&gt;</code>.</div>
  }

  const action = 'group flex flex-col rounded-xl border bg-card p-4 transition-colors hover:border-blue-500/60'
  return (
    <div className='mx-auto max-w-5xl space-y-8 px-2 pb-16 sm:px-0'>
      <header>
        <h1 className='text-2xl font-bold tracking-tight'>Estudio</h1>
        <p className='mt-1 text-sm text-muted-foreground'>Entender, practicar, repasar. Palomea lo que ya dominas y sigue con lo siguiente.</p>
        <div className='mt-4 flex items-center gap-3'>
          <Bar value={lessons.length ? doneCount / lessons.length : 0} className='h-3 flex-1' />
          <span className='shrink-0 text-sm font-semibold tabular-nums'>{loaded ? `${doneCount}/${lessons.length}` : '…'} lecciones</span>
        </div>
        <p className='mt-1 text-xs text-muted-foreground'>{checksDone}/{checks.length} ejercicios resueltos</p>
      </header>

      <div className='grid gap-3 sm:grid-cols-3'>
        {next ? (
          <Link href={`/dashboard/estudio/${next.id}`} className={cn(action, 'border-blue-500/50 bg-blue-500/5')}>
            <span className='flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400'><Play className='h-4 w-4' />Continuar</span>
            <span className='mt-2 font-semibold'>{next.title}</span>
            <span className='mt-auto flex items-center gap-1 pt-2 text-xs text-muted-foreground'>{next.minutes} min <ArrowRight className='h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5' /></span>
          </Link>
        ) : <div className={action}><span className='font-semibold text-green-700 dark:text-green-400'>Todo palomeado.</span><span className='text-sm text-muted-foreground'>Mantente con el repaso y la entrevista simulada.</span></div>}
        <Link href='/dashboard/estudio/repaso' className={action}>
          <span className='flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground'><Layers className='h-4 w-4' />Repaso de hoy</span>
          <span className='mt-2 font-semibold'><span className={cn('text-2xl tabular-nums', due > 0 && 'text-orange-600 dark:text-orange-400')}>{due}</span> tarjetas</span>
          <span className='mt-auto pt-2 text-xs text-muted-foreground'>Lo que fallas vuelve mañana; lo que sabes, cada vez más lejos.</span>
        </Link>
        <Link href='/dashboard/estudio/entrevista' className={action}>
          <span className='flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground'><MessagesSquare className='h-4 w-4' />Entrevista simulada</span>
          <span className='mt-2 font-semibold'><span className='text-2xl tabular-nums'>{qaCount}</span> preguntas</span>
          <span className='mt-auto pt-2 text-xs text-muted-foreground'>Pregunta al azar, cronómetro, respondes en voz alta.</span>
        </Link>
      </div>

      <div className='space-y-4'>
        {units.map((u, ui) => {
          const d = u.lessons.filter((l) => isDone(l.id)).length
          const complete = d === u.lessons.length
          return (
            <details key={u.id} open={!complete || undefined} className='group/unit rounded-xl border bg-card'>
              <summary className='flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden'>
                <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold', complete ? 'bg-green-600 text-white' : 'bg-muted')}>{complete ? <Check className='h-4 w-4' strokeWidth={3} /> : ui + 1}</span>
                <span className='min-w-0 flex-1'>
                  <span className='flex flex-wrap items-center gap-2'>
                    <span className='font-semibold'>{u.title}</span>
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', LEVEL[u.level] ?? 'bg-muted')}>{u.level}</span>
                  </span>
                  <span className='block text-sm text-muted-foreground'>{u.goal}</span>
                </span>
                <span className='hidden w-28 shrink-0 sm:block'><Bar value={d / u.lessons.length} /></span>
                <span className='shrink-0 text-xs tabular-nums text-muted-foreground'>{d}/{u.lessons.length}</span>
              </summary>
              <ul className='border-t'>
                {u.lessons.map((l) => {
                  const ok = isDone(l.id)
                  const p = l.checks.filter((c) => rows[`check:${c}`]?.status === 'pass').length
                  return (
                    <li key={l.id} className='flex items-center gap-3 border-b px-4 py-2 last:border-b-0'>
                      <button
                        onClick={() => (ok ? remove(`lesson:${l.id}`) : set(`lesson:${l.id}`, 'done'))}
                        title={ok ? 'Desmarcar' : 'Ya me lo sé'}
                        className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors', ok ? 'border-green-600 bg-green-600 text-white' : 'border-muted-foreground/40 text-transparent hover:border-green-600 hover:text-green-600')}
                      ><Check className='h-3.5 w-3.5' strokeWidth={3} /></button>
                      <Link href={`/dashboard/estudio/${l.id}`} className={cn('min-w-0 flex-1 py-1 leading-snug hover:underline', ok && 'text-muted-foreground')}>{l.title}</Link>
                      {l.checks.length > 0 && <span className={cn('shrink-0 text-xs tabular-nums', p === l.checks.length ? 'text-green-600' : 'text-muted-foreground')}>{p}/{l.checks.length} ej.</span>}
                      <span className='hidden w-12 shrink-0 text-right text-xs text-muted-foreground sm:block'>{l.minutes} min</span>
                    </li>
                  )
                })}
              </ul>
            </details>
          )
        })}
      </div>
    </div>
  )
}
