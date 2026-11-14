'use client'

// Demo del proyecto 02: lead agent en Python (FastAPI + LangGraph + MCP) que
// corre en un servicio aparte. Flujo: mensaje entrante → grafo en vivo →
// pausa para aprobación humana → ejecución vía MCP → el kanban del CRM cambia.
// Abre con una corrida real guardada, detenida justo en la aprobación, para que
// se vea sin hacer clic; al correr un lead, todo pasa a ser en vivo.

import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, Circle, Loader2, PauseCircle, Send, X } from 'lucide-react'
import { site } from '@/content/site'
import { leadRun } from '@/content/recorded-runs'
import { useLocale } from '@/components/site/locale-context'

const API = process.env.NEXT_PUBLIC_LEAD_AGENT_URL || site.leadAgentUrl

const NODES = [
  { id: 'qualify' },
  { id: 'lookup' },
  { id: 'draft_reply' },
  { id: 'propose_actions' },
  { id: 'approval' },
  { id: 'execute' },
] as const

// Lo que hace cada nodo mientras el LLM o MCP trabajan; rota para que el
// panel nunca se quede quieto en los ~15 s del free tier.
const T = {
  en: {
    nodes: {
      qualify: 'Qualify',
      lookup: 'Look up',
      draft_reply: 'Draft reply',
      propose_actions: 'Propose CRM actions',
      approval: 'Human approval',
      execute: 'Execute',
    } as Record<string, string>,
    hints: {
      qualify: 'LLM · structured output',
      lookup: 'MCP · find_contact, search_inventory',
      draft_reply: 'LLM · streamed',
      propose_actions: 'LLM · MCP tool schemas',
      approval: 'LangGraph interrupt · Postgres checkpoint',
      execute: 'MCP · write tools',
    } as Record<string, string>,
    thinking: {
      qualify: ['Reading the message…', 'Detecting intent and language…', 'Scoring the lead 0–100…', 'Estimating budget and urgency…'],
      lookup: ['Calling find_contact over MCP…', 'Calling search_inventory over MCP…', 'Matching models and budget…'],
      draft_reply: ['Grounding the reply in stock and store facts…', 'Writing the reply…'],
      propose_actions: ['Reading the MCP tool schemas…', 'Choosing CRM actions…', 'Filling tool arguments…'],
      execute: ['Running approved tools over MCP…', 'Writing to Postgres…'],
    } as Record<string, string[]>,
    presets: { hot: 'Hot lead + trade-in', spam: 'Spam' } as Record<string, string>,
    inbound: 'Inbound WhatsApp lead',
    up: 'Python service up',
    down: 'service offline',
    waking: 'waking Python service…',
    savedRun: (
      <>
        On the right is a saved run of the hot lead. Now run one <b style={{ color: 'var(--fg)' }}>live</b>:
      </>
    ),
    name: 'Name',
    leadName: 'Lead name',
    contact: 'Email or phone',
    leadContact: 'Lead email or phone',
    leadMessage: 'Lead message',
    runLive: 'Run the agent live',
    run: 'Run the agent',
    graphRecorded: 'What the agent did · LangGraph',
    graphLive: 'LangGraph · live',
    stopped: 'stopped here',
    pick: (
      <>
        Pick a lead and run it. The agent <b>stops</b> before changing anything, until you approve.
      </>
    ),
    recorded: 'recorded run · real output',
    paused: (
      <>
        <b>Paused before any write.</b> Nothing changes in the CRM until a person approves.
      </>
    ),
    streaming: 'Streaming tokens…',
    qual: { intent: 'intent', score: 'score', urgency: 'urgency' },
    intents: { buy: 'buy', trade_in: 'trade-in', support: 'support', spam: 'spam', other: 'other' } as Record<string, string>,
    urgencies: { now: 'now', this_month: 'this month', browsing: 'browsing' } as Record<string, string>,
    drafted: 'Drafted reply',
    proposed: 'Proposed CRM actions',
    waiting: '· waiting for approval',
    executed: '✓ executed via MCP',
    stoppedRun: 'This run stopped here. Run the agent live to approve or reject its actions yourself.',
    approve: 'Approve',
    reject: 'Reject all',
    done: (n: number) => `${n} actions executed through MCP — see the CRM below.`,
    rejected: 'Rejected. Nothing was written to the CRM.',
    none: 'No CRM actions proposed.',
    pipeline: 'CRM pipeline · Postgres',
    stages: { new: 'new', qualified: 'qualified', quoted: 'quoted', won: 'won', lost: 'lost' } as Record<string, string>,
    failed: 'Request failed',
  },
  es: {
    nodes: {
      qualify: 'Calificar',
      lookup: 'Consultar',
      draft_reply: 'Redactar respuesta',
      propose_actions: 'Proponer cambios al CRM',
      approval: 'Aprobación humana',
      execute: 'Ejecutar',
    } as Record<string, string>,
    hints: {
      qualify: 'LLM · salida estructurada',
      lookup: 'MCP · find_contact, search_inventory',
      draft_reply: 'LLM · en streaming',
      propose_actions: 'LLM · esquemas de tools MCP',
      approval: 'interrupt de LangGraph · checkpoint en Postgres',
      execute: 'MCP · tools de escritura',
    } as Record<string, string>,
    thinking: {
      qualify: ['Leyendo el mensaje…', 'Detectando intención e idioma…', 'Calificando el lead de 0 a 100…', 'Estimando presupuesto y urgencia…'],
      lookup: ['Llamando find_contact por MCP…', 'Llamando search_inventory por MCP…', 'Cruzando modelos y presupuesto…'],
      draft_reply: ['Basando la respuesta en el stock y los datos de la tienda…', 'Escribiendo la respuesta…'],
      propose_actions: ['Leyendo los esquemas de tools MCP…', 'Eligiendo cambios al CRM…', 'Llenando los argumentos…'],
      execute: ['Ejecutando por MCP las tools aprobadas…', 'Escribiendo en Postgres…'],
    } as Record<string, string[]>,
    presets: { hot: 'Lead caliente + a cuenta', spam: 'Spam' } as Record<string, string>,
    inbound: 'Lead entrante por WhatsApp',
    up: 'servicio Python activo',
    down: 'servicio fuera de línea',
    waking: 'despertando el servicio Python…',
    savedRun: (
      <>
        A la derecha está una corrida grabada del lead caliente. Ahora corre uno <b style={{ color: 'var(--fg)' }}>en vivo</b>:
      </>
    ),
    name: 'Nombre',
    leadName: 'Nombre del lead',
    contact: 'Correo o teléfono',
    leadContact: 'Correo o teléfono del lead',
    leadMessage: 'Mensaje del lead',
    runLive: 'Correr el agente en vivo',
    run: 'Correr el agente',
    graphRecorded: 'Lo que hizo el agente · LangGraph',
    graphLive: 'LangGraph · en vivo',
    stopped: 'se detuvo aquí',
    pick: (
      <>
        Elige un lead y córrelo. El agente se <b>detiene</b> antes de cambiar nada, hasta que apruebes.
      </>
    ),
    recorded: 'corrida grabada · salida real',
    paused: (
      <>
        <b>En pausa antes de escribir.</b> Nada cambia en el CRM hasta que una persona apruebe.
      </>
    ),
    streaming: 'Recibiendo tokens…',
    qual: { intent: 'intención', score: 'score', urgency: 'urgencia' },
    intents: { buy: 'comprar', trade_in: 'a cuenta', support: 'soporte', spam: 'spam', other: 'otro' } as Record<string, string>,
    urgencies: { now: 'ya', this_month: 'este mes', browsing: 'solo mira' } as Record<string, string>,
    drafted: 'Respuesta redactada',
    proposed: 'Cambios propuestos al CRM',
    waiting: '· esperando aprobación',
    executed: '✓ ejecutado por MCP',
    stoppedRun: 'Esta corrida se detuvo aquí. Corre el agente en vivo para aprobar o rechazar sus cambios tú mismo.',
    approve: 'Aprobar',
    reject: 'Rechazar todo',
    done: (n: number) => `${n} cambios ejecutados por MCP. Míralos en el CRM de abajo.`,
    rejected: 'Rechazado. No se escribió nada en el CRM.',
    none: 'No propuso cambios al CRM.',
    pipeline: 'Pipeline del CRM · Postgres',
    stages: { new: 'nuevo', qualified: 'calificado', quoted: 'cotizado', won: 'ganado', lost: 'perdido' } as Record<string, string>,
    failed: 'La solicitud falló',
  },
}

const STAGES = ['new', 'qualified', 'quoted', 'won', 'lost'] as const

// Nodos que la corrida guardada ya terminó (se detuvo en la aprobación).
const RECORDED_DONE = ['qualify', 'lookup', 'draft_reply', 'propose_actions']
// El free tier puede tardar en despertar: se reintenta antes de darlo por caído.
const HEALTH_TRIES = 3
const HEALTH_WAIT_MS = 5000

const PRESETS = {
  en: [
    {
      id: 'hot',
      name: 'Carlos',
      contact: 'carlos@example.com',
      message: "Hi! I'm looking for an iPhone 15 Pro, I have about 19k pesos and need it this week. Do you take my iPhone 12 as a trade-in?",
    },
    { id: 'spam', name: '', contact: '+52 55 9999 0000', message: 'CLICK HERE to win FREE bitcoin!!! www.win-btc.xyz' },
  ],
  es: [
    {
      id: 'hot',
      name: 'Carlos',
      contact: 'carlos@example.com',
      message: 'Hola! busco un iPhone 15 Pro, tengo como 19 mil y lo necesito esta semana. ¿Aceptan mi iPhone 12 a cuenta?',
    },
    { id: 'spam', name: '', contact: '+52 55 9999 0000', message: '¡¡GANA bitcoin GRATIS!!! Da clic AQUÍ www.win-btc.xyz' },
  ],
}

export type Action = { tool: string; args: Record<string, unknown>; why: string }
export type Qualification = { intent: string; score: number; urgency: string; budget_mxn: number | null; summary: string }
type Contact = { id: number; contact_key: string; name: string | null; interest: string | null; score: number | null; stage: string }

export default function LeadAgentDemo() {
  const locale = useLocale()
  const t = T[locale]
  const rec = leadRun[locale]
  const presets = PRESETS[locale]
  const [awake, setAwake] = useState<'waking' | 'up' | 'down'>('waking')
  const [form, setForm] = useState(presets[0])
  // Mientras `recorded` sea true, lo que se ve es la corrida guardada del
  // primer preset, detenida en la aprobación humana.
  const [recorded, setRecorded] = useState(true)
  const [done, setDone] = useState<string[]>(RECORDED_DONE)
  const [active, setActive] = useState<string | null>('approval')
  const [qual, setQual] = useState<Qualification | null>(rec.qualification)
  const [reply, setReply] = useState(rec.reply)
  const [actions, setActions] = useState<Action[]>(rec.actions)
  const [selected, setSelected] = useState<boolean[]>(rec.actions.map(() => true))
  const [threadId, setThreadId] = useState<string | null>(null)
  const [phase, setPhase] = useState<'idle' | 'running' | 'approval' | 'executing' | 'finished'>('idle')
  const [results, setResults] = useState<{ tool: string; result: unknown }[]>([])
  const [crm, setCrm] = useState<Contact[]>([])
  const [error, setError] = useState('')
  const [model, setModel] = useState('')
  // Tiempos por nodo para que se vea dónde se va la latencia.
  const [times, setTimes] = useState<Record<string, number>>(rec.times)
  const [now, setNow] = useState(0)
  const stepStart = useRef(0)
  const runStart = useRef(0)

  const loadCrm = useCallback(async () => {
    const r = await fetch(`${API}/crm`).catch(() => null)
    if (r?.ok) setCrm((await r.json()).contacts)
  }, [])

  // El servicio está en un free tier que se duerme: se despierta en cuanto
  // carga la página, mucho antes de que el visitante llegue a esta sección.
  useEffect(() => {
    let alive = true
    ;(async () => {
      for (let i = 0; i < HEALTH_TRIES && alive; i++) {
        const r = await fetch(`${API}/health`).catch(() => null)
        if (!alive) return
        if (r?.ok) {
          setAwake('up')
          setModel((await r.json()).model ?? '')
          loadCrm()
          return
        }
        if (i < HEALTH_TRIES - 1) await new Promise((res) => setTimeout(res, HEALTH_WAIT_MS))
      }
      if (alive) setAwake('down')
    })()
    return () => {
      alive = false
    }
  }, [loadCrm])

  async function consume(res: Response) {
    if (!res.ok || !res.body) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail ?? t.failed)
    }
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buf = ''
    for (;;) {
      const { done: end, value } = await reader.read()
      if (end) break
      buf += decoder.decode(value, { stream: true })
      const lines = buf.split('\n')
      buf = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.trim()) continue
        const ev = JSON.parse(line)
        if (ev.type === 'thread') setThreadId(ev.thread_id)
        if (ev.type === 'token') {
          setActive('draft_reply')
          setReply((r) => r + ev.text)
        }
        if (ev.type === 'node') {
          const t = Date.now()
          const ms = t - stepStart.current
          setTimes((m) => ({ ...m, [ev.node]: ms }))
          stepStart.current = t
          setDone((d) => [...d, ev.node])
          const i = NODES.findIndex((n) => n.id === ev.node)
          setActive(NODES[i + 1]?.id ?? null)
          if (ev.node === 'qualify') setQual(ev.data.qualification)
          if (ev.node === 'draft_reply') setReply(ev.data.reply)
          if (ev.node === 'execute') setResults(ev.data.results)
        }
        if (ev.type === 'awaiting_approval') {
          setActive('approval')
          setActions(ev.actions)
          setSelected(ev.actions.map(() => true))
          setThreadId(ev.thread_id)
          setPhase('approval')
        }
        if (ev.type === 'error') throw new Error(ev.message)
      }
    }
  }

  async function run() {
    setRecorded(false)
    setDone([])
    setActive('qualify')
    setQual(null)
    setReply('')
    setActions([])
    setResults([])
    setError('')
    setTimes({})
    stepStart.current = runStart.current = Date.now()
    setPhase('running')
    try {
      await consume(
        await fetch(`${API}/leads`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: form.message, name: form.name || null, contact_key: form.contact }),
        }),
      )
    } catch (e) {
      setError((e as Error).message)
      setPhase('idle')
      setActive(null)
    }
  }

  async function decide(approved: boolean) {
    if (!threadId) return
    setPhase('executing')
    setActive('execute')
    stepStart.current = runStart.current = Date.now()
    try {
      await consume(
        await fetch(`${API}/leads/${threadId}/decision`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ approved, actions: actions.filter((_, i) => selected[i]) }),
        }),
      )
      setPhase('finished')
      setActive(null)
      await loadCrm()
    } catch (e) {
      setError((e as Error).message)
      setPhase('approval')
    }
  }

  const busy = phase === 'running' || phase === 'executing'

  useEffect(() => {
    if (!busy) return
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(id)
  }, [busy])

  const lines = (active && t.thinking[active]) || []
  const thinking = lines[Math.floor((now - stepStart.current) / 2200) % Math.max(lines.length, 1)]
  const streaming = active === 'draft_reply' && reply.length > 0
  const focusKey = form.contact.trim().toLowerCase()

  return (
    <div className='overflow-hidden rounded-[20px]' style={{ border: '1px solid var(--border)', background: 'var(--card)' }}>
      <div className='grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]'>
        {/* INBOUND MESSAGE */}
        <div className='min-w-0 p-5' style={{ borderBottom: '1px solid var(--border)' }}>
          <div className='flex items-center justify-between gap-2'>
            <span className='site-kicker'>{t.inbound}</span>
            <span className='site-mono inline-flex items-center gap-1.5 text-[11.5px]' style={{ color: 'var(--muted)' }}>
              <span
                className='h-[7px] w-[7px] rounded-full'
                style={{ background: awake === 'up' ? 'var(--live)' : awake === 'down' ? 'var(--accent)' : 'var(--muted)' }}
              />
              {awake === 'up' ? t.up : awake === 'down' ? t.down : t.waking}
            </span>
          </div>
          {recorded && (
            <p className='mt-3 text-[13.5px]' style={{ color: 'var(--muted)', lineHeight: 1.5 }}>
              {t.savedRun}
            </p>
          )}
          <div className='mt-3 flex flex-wrap gap-2'>
            {presets.map((p) => (
              <button
                key={p.id}
                type='button'
                disabled={busy}
                onClick={() => setForm(p)}
                className='site-pick rounded-full px-3 py-1 text-[12.5px] disabled:opacity-50'
                style={{
                  border: '1px solid var(--border)',
                  background: form.id === p.id ? 'var(--accent-soft)' : 'transparent',
                  color: form.id === p.id ? 'var(--accent)' : 'var(--muted)',
                }}>
                {t.presets[p.id]}
              </button>
            ))}
          </div>
          <div className='mt-3 grid grid-cols-2 gap-2'>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, id: 'custom', name: e.target.value })}
              placeholder={t.name}
              aria-label={t.leadName}
              maxLength={80}
              className='h-10 min-w-0 rounded-[10px] px-3 text-[13.5px]'
              style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
            />
            <input
              value={form.contact}
              onChange={(e) => setForm({ ...form, id: 'custom', contact: e.target.value })}
              placeholder={t.contact}
              aria-label={t.leadContact}
              maxLength={120}
              className='h-10 min-w-0 rounded-[10px] px-3 text-[13.5px]'
              style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
            />
          </div>
          <textarea
            value={form.message}
            onChange={(e) => setForm({ ...form, id: 'custom', message: e.target.value })}
            rows={4}
            maxLength={800}
            aria-label={t.leadMessage}
            className='mt-2 w-full resize-none rounded-[10px] px-3 py-2 text-[13.5px]'
            style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', lineHeight: 1.5 }}
          />
          <button
            type='button'
            onClick={run}
            disabled={busy || awake === 'down' || form.message.trim().length < 3 || form.contact.trim().length < 5}
            className='site-btn site-btn-accent site-cta mt-2 h-11 w-full justify-center text-[14.5px] disabled:opacity-50'>
            {phase === 'running' ? <Loader2 className='h-4 w-4 animate-spin' /> : <Send className='h-4 w-4' />}
            {recorded ? t.runLive : t.run}
          </button>
          {error && (
            <p className='mt-2 text-[13px]' style={{ color: 'var(--accent)' }}>
              {error}
            </p>
          )}

          {/* GRAPH */}
          <p className='site-kicker mt-6'>{recorded ? t.graphRecorded : t.graphLive}</p>
          <ol className='mt-2 space-y-1.5'>
            {NODES.map((n) => {
              const isDone = done.includes(n.id) || (n.id === 'approval' && (phase === 'executing' || phase === 'finished'))
              const isActive = active === n.id && !isDone
              const Icon = isDone ? Check : isActive ? (n.id === 'approval' ? PauseCircle : Loader2) : Circle
              return (
                <li key={n.id} className='flex items-center gap-2.5 text-[13px]'>
                  <Icon
                    className={`h-4 w-4 shrink-0 ${isActive && n.id !== 'approval' ? 'animate-spin' : ''}`}
                    style={{ color: isDone ? 'var(--live)' : isActive ? 'var(--accent)' : 'var(--border)' }}
                  />
                  <span className='font-medium' style={{ opacity: isDone || isActive ? 1 : 0.55 }}>
                    {t.nodes[n.id]}
                  </span>
                  <span className='site-mono truncate text-[11px]' style={{ color: 'var(--muted)' }}>
                    {t.hints[n.id]}
                  </span>
                  {times[n.id] != null && (
                    <span className='site-mono ml-auto shrink-0 text-[11px]' style={{ color: 'var(--muted)' }}>
                      {(times[n.id] / 1000).toFixed(1)}s
                    </span>
                  )}
                  {isActive && n.id === 'approval' && (
                    <span className='site-mono ml-auto shrink-0 text-[11px] font-bold' style={{ color: 'var(--accent)' }}>
                      {t.stopped}
                    </span>
                  )}
                </li>
              )
            })}
          </ol>
        </div>

        {/* AGENT OUTPUT + APPROVAL */}
        <div className='min-w-0 p-5 lg:border-l' style={{ borderColor: 'var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--bg-2)' }}>
          {!qual && !busy && (
            <p className='text-[13.5px]' style={{ color: 'var(--muted)', lineHeight: 1.55 }}>
              {t.pick}
            </p>
          )}
          {recorded && (
            <p className='site-mono mb-3 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold' style={{ background: 'var(--card)', color: 'var(--muted)' }}>
              {t.recorded} · {rec.model}
            </p>
          )}
          {(recorded || phase === 'approval') && (
            <div
              className='mb-3 flex items-center gap-2.5 rounded-[12px] px-3.5 py-3 text-[14px]'
              style={{ background: 'var(--card)', border: '1.5px solid var(--accent)', lineHeight: 1.4 }}>
              <PauseCircle className='h-5 w-5 shrink-0' style={{ color: 'var(--accent)' }} />
              <span>
                {t.paused}
              </span>
            </div>
          )}
          {busy && (
            <div
              className='mb-3 flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-[12.5px]'
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              aria-live='polite'>
              <span className='flex shrink-0 gap-1'>
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className='site-pulse h-[6px] w-[6px] rounded-full'
                    style={{ background: 'var(--accent)', animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </span>
              <span className='min-w-0 flex-1 truncate'>{streaming ? t.streaming : thinking}</span>
              <span className='site-mono shrink-0 text-[11px]' style={{ color: 'var(--muted)' }}>
                {model && `${model} · `}
                {(Math.max(0, now - runStart.current) / 1000).toFixed(1)}s
              </span>
            </div>
          )}
          {busy && !qual && (
            <div className='grid grid-cols-3 gap-2'>
              {[0, 1, 2].map((i) => (
                <div key={i} className='site-skeleton h-[46px]' />
              ))}
            </div>
          )}
          {qual && (
            <div className='site-mono grid grid-cols-3 gap-2 text-center text-[11.5px]'>
              {[
                [t.qual.intent, t.intents[qual.intent] ?? qual.intent],
                [t.qual.score, `${qual.score}/100`],
                [t.qual.urgency, t.urgencies[qual.urgency] ?? qual.urgency.replace(/_/g, ' ')],
              ].map(([k, v]) => (
                <div key={k} className='rounded-[10px] p-2' style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                  <div style={{ color: 'var(--muted)' }}>{k}</div>
                  <div className='mt-0.5 font-medium'>{v}</div>
                </div>
              ))}
            </div>
          )}
          {phase === 'running' && !reply && (
            <div className='mt-3'>
              <p className='site-kicker'>{t.drafted}</p>
              <div className='mt-1.5 space-y-2 rounded-[12px] px-3.5 py-3' style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                {['92%', '100%', '64%'].map((w) => (
                  <div key={w} className='site-skeleton h-[10px]' style={{ width: w }} />
                ))}
              </div>
            </div>
          )}
          {reply && (
            <div className='mt-3'>
              <p className='site-kicker'>{t.drafted}</p>
              <div
                className='mt-1.5 rounded-[12px] px-3.5 py-2.5 text-[13.5px]'
                style={{ background: 'var(--card)', border: '1px solid var(--border)', lineHeight: 1.5 }}>
                {reply}
                {active === 'draft_reply' && ' ▍'}
              </div>
            </div>
          )}
          {phase === 'running' && actions.length === 0 && (
            <div className='mt-4'>
              <p className='site-kicker'>{t.proposed}</p>
              <div className='mt-1.5 space-y-1.5'>
                {[0, 1, 2].map((i) => (
                  <div key={i} className='site-skeleton h-[44px]' style={{ opacity: 1 - i * 0.25 }} />
                ))}
              </div>
            </div>
          )}
          {actions.length > 0 && (
            <div className='mt-4'>
              <p className='site-kicker'>{t.proposed} {(phase === 'approval' || recorded) && t.waiting}</p>
              <ul className='mt-1.5 space-y-1.5'>
                {actions.map((a, i) => {
                  // Se ejecutan en orden solo las seleccionadas.
                  const executed = phase === 'finished' && results.length > 0 && selected[i]
                  return (
                    <li
                      key={i}
                      className='rounded-[10px] px-3 py-2 text-[12.5px]'
                      style={{ background: 'var(--card)', border: '1px solid var(--border)', opacity: selected[i] ? 1 : 0.45 }}>
                      <label className='flex cursor-pointer items-start gap-2'>
                        <input
                          type='checkbox'
                          checked={selected[i] ?? false}
                          disabled={phase !== 'approval'}
                          onChange={() => setSelected((s) => s.map((v, j) => (j === i ? !v : v)))}
                          className='mt-0.5'
                        />
                        <span className='min-w-0'>
                          <span className='site-mono font-medium'>{a.tool}</span>
                          <span style={{ color: 'var(--muted)' }}> — {a.why}</span>
                          <span className='site-mono mt-0.5 block truncate text-[11px]' style={{ color: 'var(--muted)' }}>
                            {JSON.stringify(a.args)}
                          </span>
                          {executed && (
                            <span className='site-mono mt-0.5 block text-[11px]' style={{ color: 'var(--live)' }}>
                              {t.executed}
                            </span>
                          )}
                        </span>
                      </label>
                    </li>
                  )
                })}
              </ul>
              {recorded && (
                <p className='mt-3 text-[13px]' style={{ color: 'var(--muted)', lineHeight: 1.5 }}>
                  {t.stoppedRun}
                </p>
              )}
              {phase === 'approval' && (
                <div className='mt-3 flex gap-2'>
                  <button
                    type='button'
                    onClick={() => decide(true)}
                    disabled={!selected.some(Boolean)}
                    className='site-btn site-btn-accent h-10 flex-1 justify-center text-[14px] disabled:opacity-50'>
                    <Check className='h-4 w-4' /> {t.approve} {selected.filter(Boolean).length}
                  </button>
                  <button
                    type='button'
                    onClick={() => decide(false)}
                    className='site-btn site-btn-outline h-10 flex-1 justify-center text-[14px]'>
                    <X className='h-4 w-4' /> {t.reject}
                  </button>
                </div>
              )}
            </div>
          )}
          {phase === 'finished' && (
            <p className='mt-3 text-[13px]' style={{ color: 'var(--muted)' }}>
              {results.length ? t.done(results.length) : t.rejected}
            </p>
          )}
          {qual && actions.length === 0 && phase === 'approval' && (
            <p className='mt-3 text-[13px]' style={{ color: 'var(--muted)' }}>
              {t.none}
            </p>
          )}
        </div>
      </div>

      {/* CRM KANBAN */}
      <div className='p-5'>
        <p className='site-kicker'>{t.pipeline}</p>
        <div className='mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5'>
          {STAGES.map((s) => (
            <div key={s} className='min-w-0 rounded-[12px] p-2' style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
              <p className='site-mono px-1 text-[11px] uppercase' style={{ color: 'var(--muted)' }}>
                {t.stages[s]} · {crm.filter((c) => c.stage === s).length}
              </p>
              <div className='mt-1.5 space-y-1.5'>
                {crm
                  .filter((c) => c.stage === s)
                  .slice(0, 4)
                  .map((c) => (
                    <div
                      key={c.id}
                      className='rounded-[8px] px-2 py-1.5 text-[12px]'
                      style={{
                        background: 'var(--card)',
                        border: `1px solid ${c.contact_key === focusKey && phase === 'finished' ? 'var(--accent)' : 'var(--border)'}`,
                      }}>
                      <div className='truncate font-medium'>{c.name ?? c.contact_key}</div>
                      <div className='site-mono truncate text-[10.5px]' style={{ color: 'var(--muted)' }}>
                        {c.interest ?? '—'} · {c.score ?? '–'}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
