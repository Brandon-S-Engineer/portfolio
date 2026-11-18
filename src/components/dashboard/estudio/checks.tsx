'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Check, CircleCheck, Eye, Lightbulb, Mic, Pencil, Play, Plus, RotateCcw, Square, Terminal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { highlight } from '@/lib/estudio/highlight'
import { runTests, type RunResult } from '@/lib/estudio/runner'
import { rate } from '@/lib/estudio/srs'
import { useStudy } from '@/lib/estudio/store'
import type { Block, Card } from '@/lib/estudio/types'
import { CODE_FRAME, CODE_TEXT, CodeBlock, Tokens } from './code-block'
import { Editor } from './editor'
import { Rich } from './rich'

type Of<T extends Block['t']> = Extract<Block, { t: T }>

export const usePassed = (id: string) => useStudy((s) => s.rows[`check:${id}`]?.status === 'pass')
const pass = (id: string) => useStudy.getState().set(`check:${id}`, 'pass')

// Marco común de todo lo que es "te toca a ti".
function Task({ icon, label, done, children }: { icon: ReactNode; label: string; done?: boolean; children: ReactNode }) {
  return (
    <section className={cn('my-5 rounded-xl border-2 border-dashed p-4 transition-colors', done ? 'border-green-500/50 bg-green-500/5' : 'border-blue-500/40 bg-blue-500/[0.03]')}>
      <div className={cn('mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider', done ? 'text-green-700 dark:text-green-400' : 'text-blue-700 dark:text-blue-400')}>
        {done ? <CircleCheck className='h-4 w-4' /> : icon}
        {label}
        {done && <span className='font-medium normal-case tracking-normal'>· hecho</span>}
      </div>
      {children}
    </section>
  )
}

// ── Tarjetas de repaso ──────────────────────────────────────────────────────
export function FlipCard({ card, onRated, big }: { card: Card; onRated?: (knew: boolean) => void; big?: boolean }) {
  const row = useStudy((s) => s.rows[`card:${card.id}`])
  const set = useStudy((s) => s.set)
  const [open, setOpen] = useState(false)
  const answer = (knew: boolean) => {
    const r = rate(row, knew)
    set(`card:${card.id}`, r.status, r.data)
    setOpen(false)
    onRated?.(knew)
  }
  return (
    <div className={cn('flex flex-col rounded-lg border bg-card', big ? 'min-h-56 p-6' : 'p-3', !big && row?.status === 'known' && 'border-green-500/40', !big && row?.status === 'again' && 'border-orange-500/50')}>
      <button onClick={() => setOpen((o) => !o)} className='flex-1 text-left'>
        <div className={cn('font-medium leading-snug', big ? 'text-xl' : 'text-sm')}><Rich text={card.q} /></div>
        {open
          ? <div className={cn('mt-3 border-t pt-3 text-muted-foreground', big ? 'text-base' : 'text-sm')}><Rich text={card.a} /></div>
          : <div className='mt-2 text-xs text-muted-foreground'>Responde en tu cabeza y toca para ver</div>}
      </button>
      {open && (
        <div className='mt-3 flex gap-2'>
          <Button size='sm' variant='outline' className='flex-1 border-orange-500/50 text-orange-700 dark:text-orange-300' onClick={() => answer(false)}><Plus className='h-3.5 w-3.5' />Agregar</Button>
          <Button size='sm' variant='outline' className='flex-1 border-green-500/50 text-green-700 dark:text-green-300' onClick={() => answer(true)}><Check className='h-3.5 w-3.5' />La sabía</Button>
        </div>
      )}
    </div>
  )
}

export function Cards({ b }: { b: Of<'cards'> }) {
  return (
    <section className='my-5'>
      <div className='mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground'>Tarjetas · se van al repaso espaciado</div>
      <div className='grid gap-2 sm:grid-cols-2'>{b.cards.map((c) => <FlipCard key={c.id} card={c} />)}</div>
    </section>
  )
}

// ── Quiz ────────────────────────────────────────────────────────────────────
export function Quiz({ b }: { b: Of<'quiz'> }) {
  const done = usePassed(b.id)
  const [picked, setPicked] = useState<number | null>(null)
  const pick = (i: number) => { setPicked(i); if (i === b.answer) pass(b.id) }
  return (
    <Task icon={<Pencil className='h-4 w-4' />} label='Pregunta rápida' done={done}>
      <p className='mb-3 font-medium'><Rich text={b.q} /></p>
      <div className='grid gap-1.5'>
        {b.options.map((o, i) => {
          const right = picked !== null && i === b.answer && picked === b.answer
          const wrong = picked === i && i !== b.answer
          return (
            <button key={i} onClick={() => pick(i)} className={cn('rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:bg-muted', right && 'border-green-600 bg-green-500/10', wrong && 'border-red-500 bg-red-500/10')}>
              <span className='mr-2 font-mono text-xs text-muted-foreground'>{String.fromCharCode(65 + i)}</span><Rich text={o} />
            </button>
          )
        })}
      </div>
      {picked !== null && (
        <p className={cn('mt-3 text-sm', picked === b.answer ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300')}>
          {picked === b.answer ? <><b>Correcto.</b> <Rich text={b.why} /></> : <b>No. Piénsalo otra vez.</b>}
        </p>
      )}
    </Task>
  )
}

// ── Completar el código ─────────────────────────────────────────────────────
const norm = (s: string) => s.replace(/\s+/g, '').replace(/"/g, "'").toLowerCase()

export function Cloze({ b }: { b: Of<'cloze'> }) {
  const done = usePassed(b.id)
  const parts = useMemo(() => b.code.split(/\[\[(.+?)\]\]/g), [b.code])
  const answers = parts.filter((_, i) => i % 2 === 1)
  const [vals, setVals] = useState<string[]>(() => answers.map(() => ''))
  const [checked, setChecked] = useState(false)
  const check = () => { setChecked(true); if (answers.every((a, i) => norm(a) === norm(vals[i]))) pass(b.id) }
  return (
    <Task icon={<Pencil className='h-4 w-4' />} label='Completa el código' done={done}>
      <p className='mb-2 text-sm'><Rich text={b.prompt} /></p>
      <pre className={cn(CODE_FRAME, CODE_TEXT, 'overflow-x-auto p-3 leading-[2.1]')}>
        {parts.map((p, i) => {
          if (i % 2 === 0) return <Tokens key={i} lines={highlight(p, b.lang)} />
          const k = (i - 1) / 2
          const good = checked && norm(answers[k]) === norm(vals[k])
          return (
            <input
              key={i}
              value={vals[k]}
              onChange={(e) => { setChecked(false); setVals((v) => v.map((x, j) => (j === k ? e.target.value : x))) }}
              onKeyDown={(e) => { if (e.key === 'Enter') check() }}
              spellCheck={false}
              autoCapitalize='off'
              style={{ width: `${Math.max(answers[k].length, 3) + 2}ch` }}
              className={cn('rounded border-2 bg-background px-1 font-mono font-bold outline-none focus:border-blue-500', checked ? (good ? 'border-green-600 text-green-700 dark:text-green-300' : 'border-red-500 text-red-700 dark:text-red-300') : 'border-blue-500/40')}
            />
          )
        })}
      </pre>
      <div className='mt-3 flex gap-2'>
        <Button size='sm' onClick={check}><Check className='h-3.5 w-3.5' />Revisar</Button>
        <Button size='sm' variant='ghost' onClick={() => { setVals(answers); setChecked(false) }}><Eye className='h-3.5 w-3.5' />Ver respuestas</Button>
      </div>
    </Task>
  )
}

// ── Explícalo en voz alta ───────────────────────────────────────────────────
function useTimer(seconds: number) {
  const [left, setLeft] = useState<number | null>(null)
  const [running, setRunning] = useState(false)
  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setLeft((l) => Math.max((l ?? 0) - 1, 0)), 1000)
    return () => clearInterval(t)
  }, [running])
  useEffect(() => { if (left === 0) setRunning(false) }, [left])
  return { left, running, start: () => { setLeft(seconds); setRunning(true) }, stop: () => setRunning(false) }
}
const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

function SelfGrade({ id, points }: { id: string; points: string[] }) {
  const set = useStudy((s) => s.set)
  const [hit, setHit] = useState<boolean[]>(() => points.map(() => false))
  return (
    <div className='mt-3'>
      {points.length > 0 && (
        <>
          <div className='mb-1 text-xs font-semibold text-muted-foreground'>¿Lo dijiste? Marca lo que sí mencionaste:</div>
          <ul className='space-y-1'>
            {points.map((p, i) => (
              <li key={i}>
                <label className='flex cursor-pointer items-start gap-2 text-sm'>
                  <input type='checkbox' checked={hit[i]} onChange={() => setHit((h) => h.map((x, j) => (j === i ? !x : x)))} className='mt-1 accent-green-600' />
                  <span className={cn(hit[i] && 'text-muted-foreground')}><Rich text={p} /></span>
                </label>
              </li>
            ))}
          </ul>
        </>
      )}
      <div className='mt-3 flex gap-2'>
        <Button size='sm' variant='outline' onClick={() => set(`check:${id}`, 'again')}><RotateCcw className='h-3.5 w-3.5' />Me faltó, otra vez</Button>
        <Button size='sm' onClick={() => pass(id)}><Check className='h-3.5 w-3.5' />Me salió bien</Button>
      </div>
    </div>
  )
}

export function Speak({ b }: { b: Of<'speak'> }) {
  const done = usePassed(b.id)
  const t = useTimer(b.seconds)
  const [revealed, setRevealed] = useState(false)
  return (
    <Task icon={<Mic className='h-4 w-4' />} label={`Dilo en voz alta · ${b.seconds} s · en inglés`} done={done}>
      <p className='font-medium'><Rich text={b.prompt} /></p>
      <div className='mt-3 flex flex-wrap items-center gap-2'>
        {t.running
          ? <Button size='sm' variant='outline' onClick={() => { t.stop(); setRevealed(true) }}><Square className='h-3.5 w-3.5' />Terminé</Button>
          : <Button size='sm' onClick={() => { setRevealed(false); t.start() }}><Play className='h-3.5 w-3.5' />{t.left === null ? 'Empezar' : 'Otra vez'}</Button>}
        {t.left !== null && <span className={cn('font-mono text-lg font-bold tabular-nums', t.left === 0 ? 'text-red-600' : t.left <= 10 ? 'text-orange-600' : 'text-foreground')}>{clock(t.left)}</span>}
        {!revealed && !t.running && <Button size='sm' variant='ghost' onClick={() => setRevealed(true)}><Eye className='h-3.5 w-3.5' />Ver puntos clave</Button>}
      </div>
      {(revealed || t.left === 0) && <SelfGrade id={b.id} points={b.points} />}
    </Task>
  )
}

// ── Escríbelo de memoria (SQL, Python…) ─────────────────────────────────────
export function Write({ b }: { b: Of<'write'> }) {
  const done = usePassed(b.id)
  const [val, setVal] = useState('')
  const [revealed, setRevealed] = useState(false)
  return (
    <Task icon={<Pencil className='h-4 w-4' />} label={`Escríbelo de memoria · ${b.lang}`} done={done}>
      <p className='mb-2 font-medium'><Rich text={b.prompt} /></p>
      <Editor value={val} onChange={setVal} lang={b.lang} />
      {!revealed
        ? <Button size='sm' className='mt-3' onClick={() => setRevealed(true)}><Eye className='h-3.5 w-3.5' />Comparar con la solución</Button>
        : <>
            <CodeBlock code={b.solution} lang={b.lang} file='solución' />
            <SelfGrade id={b.id} points={b.points} />
          </>}
    </Task>
  )
}

// ── Ejercicio de código con pruebas ─────────────────────────────────────────
export function Exercise({ b }: { b: Of<'exercise'> }) {
  const done = usePassed(b.id)
  const draftKey = `estudio.draft.${b.id}`
  const [code, setCode] = useState(b.starter)
  const [res, setRes] = useState<RunResult | null>(null)
  const [running, setRunning] = useState(false)
  const [hints, setHints] = useState(0)
  const [solution, setSolution] = useState(false)

  useEffect(() => { try { const d = localStorage.getItem(draftKey); if (d) setCode(d) } catch {} }, [draftKey])
  const change = (v: string) => { setCode(v); try { localStorage.setItem(draftKey, v) } catch {} }

  const run = async () => {
    setRunning(true)
    const r = await runTests(code, b.tests)
    setRes(r)
    setRunning(false)
    if (!r.fatal && r.results.length > 0 && r.results.every((t) => t.pass)) pass(b.id)
  }
  const passed = res?.results.filter((t) => t.pass).length ?? 0

  return (
    <Task icon={<Terminal className='h-4 w-4' />} label='Ejercicio de código · JavaScript' done={done}>
      <h4 className='text-base font-semibold'>{b.title}</h4>
      {b.prompt.map((p, i) => <p key={i} className='mt-1.5 text-sm'><Rich text={p} /></p>)}
      <div className='mt-3'><Editor value={code} onChange={change} onRun={run} /></div>
      <div className='mt-3 flex flex-wrap items-center gap-2'>
        <Button size='sm' onClick={run} disabled={running}><Play className='h-3.5 w-3.5' />{running ? 'Corriendo…' : 'Correr pruebas'}</Button>
        <span className='hidden text-xs text-muted-foreground sm:inline'>⌘/Ctrl + Enter</span>
        <span className='flex-1' />
        {hints < b.hints.length && <Button size='sm' variant='ghost' onClick={() => setHints((h) => h + 1)}><Lightbulb className='h-3.5 w-3.5' />Pista {hints + 1}/{b.hints.length}</Button>}
        <Button size='sm' variant='ghost' onClick={() => setSolution((s) => !s)}><Eye className='h-3.5 w-3.5' />{solution ? 'Ocultar solución' : 'Solución'}</Button>
        <Button size='sm' variant='ghost' onClick={() => { change(b.starter); setRes(null) }}><RotateCcw className='h-3.5 w-3.5' />Reiniciar</Button>
      </div>
      {hints > 0 && (
        <ul className='mt-3 space-y-1 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm'>
          {b.hints.slice(0, hints).map((h, i) => <li key={i}><b>Pista {i + 1}.</b> <Rich text={h} /></li>)}
        </ul>
      )}
      {res && (
        <div className='mt-3 rounded-lg border bg-card p-3 text-sm'>
          {res.fatal
            ? <p className='font-mono text-red-600 dark:text-red-400'>{res.fatal}</p>
            : <>
                <p className={cn('mb-1.5 font-semibold', passed === res.results.length ? 'text-green-700 dark:text-green-400' : 'text-orange-700 dark:text-orange-400')}>
                  {passed}/{res.results.length} pruebas pasan
                </p>
                <ul className='space-y-1'>
                  {res.results.map((t, i) => (
                    <li key={i} className='flex items-start gap-2'>
                      {t.pass ? <Check className='mt-0.5 h-4 w-4 shrink-0 text-green-600' /> : <X className='mt-0.5 h-4 w-4 shrink-0 text-red-600' />}
                      <span>{t.name}{t.error && <span className='block font-mono text-xs text-red-600 dark:text-red-400'>{t.error}</span>}</span>
                    </li>
                  ))}
                </ul>
              </>}
          {res.logs.length > 0 && <pre className='mt-2 max-h-40 overflow-auto border-t pt-2 font-mono text-xs text-muted-foreground'>{res.logs.join('\n')}</pre>}
        </div>
      )}
      {solution && <CodeBlock code={b.solution} lang='js' file='una solución posible' />}
    </Task>
  )
}

// ── Pregunta de entrevista ──────────────────────────────────────────────────
const QA_LABEL: Record<string, string> = { recruiter: 'Reclutador', technical: 'Técnica', project: 'Proyecto', behavioral: 'Conductual', design: 'Diseño de sistemas' }
export const qaLabel = (cat: string) => QA_LABEL[cat] ?? cat

export function QaAnswer({ b }: { b: Of<'qa'> }) {
  return (
    <div className='space-y-2'>
      <p className='text-sm'><span className='font-bold text-green-700 dark:text-green-400'>Idea clave: </span><Rich text={b.key} /></p>
      <div className='rounded-r-lg border-l-4 border-blue-500 bg-blue-500/10 px-3 py-2 text-sm'>
        <div className='text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400'>Dilo con tus palabras</div>
        <Rich text={b.say} />
      </div>
      {b.note && <p className='text-xs text-muted-foreground'><Rich text={b.note} /></p>}
    </div>
  )
}

export function Qa({ b }: { b: Of<'qa'> }) {
  const row = useStudy((s) => s.rows[`qa:${b.id}`])
  const set = useStudy((s) => s.set)
  const [open, setOpen] = useState(false)
  const grade = (knew: boolean) => { const r = rate(row, knew); set(`qa:${b.id}`, r.status, r.data); setOpen(false) }
  return (
    <div className={cn('my-2 rounded-lg border bg-card', row?.status === 'known' && 'border-l-4 border-l-green-500', row?.status === 'again' && 'border-l-4 border-l-orange-500')}>
      <button onClick={() => setOpen((o) => !o)} className='flex w-full items-start gap-3 px-4 py-3 text-left'>
        <span className='flex-1 font-semibold'>{b.q}</span>
        <span className='shrink-0 pt-0.5 text-xs text-muted-foreground'>{open ? 'ocultar' : 'responde y revela'}</span>
      </button>
      {open && (
        <div className='border-t px-4 py-3'>
          <QaAnswer b={b} />
          <div className='mt-3 flex gap-2'>
            <Button size='sm' variant='outline' onClick={() => grade(false)}><RotateCcw className='h-3.5 w-3.5' />Me costó</Button>
            <Button size='sm' onClick={() => grade(true)}><Check className='h-3.5 w-3.5' />Me salió</Button>
          </div>
        </div>
      )}
    </div>
  )
}

