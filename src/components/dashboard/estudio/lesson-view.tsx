'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, Clock, FileCode2, GraduationCap, Megaphone, ShieldAlert, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useStudy } from '@/lib/estudio/store'
import { isCheck, type Block, type Callout, type Lesson } from '@/lib/estudio/types'
import { Cards, Cloze, Exercise, Qa, Quiz, Speak, Write } from './checks'
import { CodeBlock } from './code-block'
import { Rich } from './rich'

const CALLOUT: Record<Callout, { label: string; cls: string; head: string; icon: typeof Check }> = {
  rem: { label: 'Recuerda', cls: 'border-green-600 bg-green-500/10', head: 'text-green-700 dark:text-green-400', icon: Sparkles },
  say: { label: 'Dilo con tus palabras', cls: 'border-blue-600 bg-blue-500/10', head: 'text-blue-700 dark:text-blue-400', icon: Megaphone },
  warn: { label: 'No exageres', cls: 'border-orange-500 bg-orange-500/10', head: 'text-orange-700 dark:text-orange-400', icon: ShieldAlert },
  senior: { label: 'Nivel senior', cls: 'border-purple-600 bg-purple-500/10', head: 'text-purple-700 dark:text-purple-400', icon: GraduationCap },
}

function View({ b }: { b: Block }) {
  switch (b.t) {
    case 'p': return <p className='my-3 leading-relaxed text-foreground/90'><Rich text={b.text} /></p>
    case 'h': return <h3 className='mb-2 mt-7 text-lg font-semibold'>{b.text}</h3>
    case 'list': {
      const L = b.ordered ? 'ol' : 'ul'
      return <L className={cn('my-3 space-y-1.5 pl-5 leading-relaxed text-foreground/90', b.ordered ? 'list-decimal' : 'list-disc')}>{b.items.map((it, i) => <li key={i}><Rich text={it} /></li>)}</L>
    }
    case 'callout': {
      const c = CALLOUT[b.kind]
      return (
        <div className={cn('my-4 rounded-r-lg border-l-4 px-4 py-3', c.cls)}>
          <div className={cn('mb-0.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider', c.head)}><c.icon className='h-3.5 w-3.5' />{c.label}</div>
          <div className={cn('leading-relaxed', b.kind === 'rem' && 'text-[1.05rem]')}><Rich text={b.text} /></div>
        </div>
      )
    }
    case 'file': return <p className='my-2 flex items-start gap-1.5 text-sm text-muted-foreground'><FileCode2 className='mt-0.5 h-4 w-4 shrink-0' /><span><b className='text-foreground'>En tu código:</b> <Rich text={b.text} /></span></p>
    case 'code': return <CodeBlock code={b.code} lang={b.lang} file={b.file} />
    case 'flow': return <pre className='my-3 overflow-x-auto rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 font-mono text-[12px] leading-[1.55]'>{b.text}</pre>
    case 'table':
      return (
        <div className='my-3 overflow-x-auto rounded-lg border'>
          <table className='w-full text-sm'>
            <thead><tr className='border-b bg-muted/50'>{b.head.map((h, i) => <th key={i} className='px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground'>{h}</th>)}</tr></thead>
            <tbody>{b.rows.map((r, i) => <tr key={i} className='border-b last:border-b-0'>{r.map((c, j) => <td key={j} className={cn('px-3 py-2 align-top', j === 0 && 'font-semibold')}><Rich text={c} /></td>)}</tr>)}</tbody>
          </table>
        </div>
      )
    case 'cards': return <Cards b={b} />
    case 'quiz': return <Quiz b={b} />
    case 'cloze': return <Cloze b={b} />
    case 'speak': return <Speak b={b} />
    case 'write': return <Write b={b} />
    case 'exercise': return <Exercise b={b} />
    case 'qa': return <Qa b={b} />
  }
}

type Nav = { id: string; title: string } | null

export default function LessonView({ lesson, unit, siblings, prev, next }: { lesson: Lesson; unit: { title: string; level: string }; siblings: { id: string; title: string }[]; prev: Nav; next: Nav }) {
  const { rows, load, set, remove } = useStudy()
  useEffect(() => { load() }, [load])
  const done = rows[`lesson:${lesson.id}`]?.status === 'done'
  const checks = lesson.blocks.filter(isCheck)
  const passed = checks.filter((c) => rows[`check:${c.id}`]?.status === 'pass').length
  const toggle = () => (done ? remove(`lesson:${lesson.id}`) : set(`lesson:${lesson.id}`, 'done'))

  return (
    <article className='mx-auto max-w-3xl px-3 pb-24 sm:px-0'>
      <Link href='/dashboard/estudio' className='inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground'><ArrowLeft className='h-4 w-4' />Estudio</Link>
      <div className='mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
        <span className='rounded-full border px-2 py-0.5 font-semibold'>{unit.level}</span>
        <span>{unit.title}</span>
      </div>
      <div className='mt-2 flex gap-1'>
        {siblings.map((s) => (
          <Link key={s.id} href={`/dashboard/estudio/${s.id}`} title={s.title} className={cn('h-1.5 flex-1 rounded-full', s.id === lesson.id ? 'bg-blue-600' : rows[`lesson:${s.id}`]?.status === 'done' ? 'bg-green-500' : 'bg-muted')} />
        ))}
      </div>
      <header className='mt-4 flex items-start gap-3'>
        <div className='min-w-0 flex-1'>
          <h1 className='text-2xl font-bold tracking-tight sm:text-3xl'>{lesson.title}</h1>
          <p className='mt-1 flex items-center gap-3 text-sm text-muted-foreground'>
            <span className='inline-flex items-center gap-1'><Clock className='h-3.5 w-3.5' />{lesson.minutes} min</span>
            {checks.length > 0 && <span>{passed}/{checks.length} ejercicios</span>}
          </p>
        </div>
        <Button variant={done ? 'default' : 'outline'} onClick={toggle} className={cn('shrink-0', done && 'bg-green-600 text-white hover:bg-green-700')}>
          <Check className='h-4 w-4' strokeWidth={3} />{done ? 'Aprendida' : 'Ya me lo sé'}
        </Button>
      </header>

      <div className='mt-4'>{lesson.blocks.map((b, i) => <View key={i} b={b} />)}</div>

      <footer className='mt-10 rounded-xl border bg-card p-4'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
          <div className='min-w-0 flex-1 text-sm'>
            {done ? <b className='text-green-700 dark:text-green-400'>Lección aprendida.</b> : checks.length > 0 && passed < checks.length
              ? <>{checks.length - passed === 1 ? 'Te falta' : 'Te faltan'} <b>{checks.length - passed}</b> {checks.length - passed === 1 ? 'ejercicio' : 'ejercicios'}. Puedes palomearla de todos modos si ya la dominas.</>
              : <>¿Puedes explicarla sin leer? Entonces palomea.</>}
          </div>
          <Button onClick={toggle} variant={done ? 'outline' : 'default'} className={cn(!done && 'bg-green-600 text-white hover:bg-green-700')}><Check className='h-4 w-4' strokeWidth={3} />{done ? 'Desmarcar' : 'Marcar como aprendida'}</Button>
        </div>
        <div className='mt-4 flex justify-between gap-2 border-t pt-4'>
          {prev ? <Link href={`/dashboard/estudio/${prev.id}`} className='inline-flex min-w-0 items-center gap-1 text-sm text-muted-foreground hover:text-foreground'><ArrowLeft className='h-4 w-4 shrink-0' /><span className='truncate'>{prev.title}</span></Link> : <span />}
          {next ? <Link href={`/dashboard/estudio/${next.id}`} className='inline-flex min-w-0 items-center gap-1 text-sm font-semibold text-blue-700 hover:underline dark:text-blue-400'><span className='truncate'>{next.title}</span><ArrowRight className='h-4 w-4 shrink-0' /></Link> : <span />}
        </div>
      </footer>
    </article>
  )
}
