'use client'

// Demo embebido del home: chat con el agente real (RAG + SQL) a la izquierda y,
// a la derecha, la traza de cómo se construyó cada respuesta. Abre con una
// corrida real guardada, para que la prueba se vea sin hacer clic; al preguntar
// algo, todo pasa a ser una llamada en vivo.

import { useRef, useState } from 'react'
import { ArrowUp, Code2, Database, FileSearch, Loader2, RotateCcw, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { suggestedQuestions } from '@/lib/agent-demo/data'
import { SYSTEM_PROMPT, toolSpecs } from '@/lib/agent-demo/specs'
import { answerRun } from '@/content/recorded-runs'
import { useLocale } from '@/components/site/locale-context'

// Dos preguntas para probar en vivo: una de inventario (SQL) y una de políticas
// (RAG). El agente responde en el idioma de la pregunta.
const T = {
  en: {
    questions: [suggestedQuestions[1], suggestedQuestions[3]],
    agent: 'Volt Mobile · support agent',
    recorded: 'recorded run · real output',
    live: 'live model call · not scripted',
    reset: 'Reset',
    thinking: 'Thinking…',
    lookedUp: 'looked up with',
    saved: (
      <>
        This is a saved run. Now make it answer you, with a <b style={{ color: 'var(--fg)' }}>live model call</b>. Try to make it
        hallucinate.
      </>
    ),
    model: 'Model',
    own: 'Or write your own question…',
    placeholder: 'Ask about an order, a phone or a policy…',
    message: 'Message the agent',
    send: 'Send',
    askLive: 'Ask live',
    ask: 'Ask',
    promptTools: 'Prompt & tools',
    did: 'What the agent did',
    liveBuild: 'Live build',
    back: 'Back to trace',
    view: 'View prompt & tools',
    system: 'System prompt',
    schemas: 'Tool schemas sent to the model',
    empty: 'Tool calls, SQL, sources and cost appear here.',
    picks: 'The model picks a tool',
    writes: 'The model writes the answer',
    searches: 'searches the policies',
    runsSql: 'runs a fixed SQL query',
    rows: 'rows',
    latency: 'latency',
    tokens: 'tokens',
    cost: 'cost',
  },
  es: {
    questions: ['¿Qué modelos de iPhone 15 tienen en stock por menos de $15,000 MXN?', '¿La garantía cubre una pantalla estrellada?'],
    agent: 'Volt Mobile · agente de soporte',
    recorded: 'corrida grabada · salida real',
    live: 'llamada real al modelo · sin guion',
    reset: 'Reiniciar',
    thinking: 'Pensando…',
    lookedUp: 'consultó con',
    saved: (
      <>
        Esta es una corrida grabada. Ahora haz que te responda a ti, con una <b style={{ color: 'var(--fg)' }}>llamada real al modelo</b>.
        Intenta que invente algo.
      </>
    ),
    model: 'Modelo',
    own: 'O escribe tu propia pregunta…',
    placeholder: 'Pregunta por un pedido, un teléfono o una política…',
    message: 'Mensaje al agente',
    send: 'Enviar',
    askLive: 'Preguntar en vivo',
    ask: 'Preguntar',
    promptTools: 'Prompt y tools',
    did: 'Lo que hizo el agente',
    liveBuild: 'En vivo',
    back: 'Volver a la traza',
    view: 'Ver prompt y tools',
    system: 'System prompt',
    schemas: 'Esquemas de tools que recibe el modelo',
    empty: 'Aquí aparecen las tools, el SQL, las fuentes y el costo.',
    picks: 'El modelo elige una tool',
    writes: 'El modelo escribe la respuesta',
    searches: 'busca en las políticas',
    runsSql: 'corre una consulta SQL fija',
    rows: 'filas',
    latency: 'latencia',
    tokens: 'tokens',
    cost: 'costo',
  },
}

// Debe coincidir con MODELS en lib/agent-demo/openai.ts (solo modelos baratos).
const MODEL_OPTIONS = [
  { id: 'gpt-5-nano', label: 'gpt-5-nano · cheapest' },
  { id: 'gpt-5-mini', label: 'gpt-5-mini · smarter' },
  { id: 'gpt-4.1-mini', label: 'gpt-4.1-mini · fastest' },
]

export type Msg = { role: 'user' | 'assistant'; content: string }
type Source = { id: string; title: string; heading: string; score: number }
export type TraceEvent =
  | { type: 'delta'; text: string }
  | { type: 'llm'; step: number; ms: number; input: number; output: number }
  | { type: 'tool_call'; id: string; name: string; args: string }
  | { type: 'tool_result'; id: string; name: string; ms: number; sql?: string; sources?: Source[]; rows?: number; preview: string }
  | { type: 'answer'; content: string; sources: Source[]; model: string; ms: number; tokens: { input: number; output: number }; cost_usd: number | null }
  | { type: 'error'; message: string }

const toolIcon = { search_docs: FileSearch, find_products: Database, get_order: Database } as Record<string, typeof Database>

export default function CompanyAgentDemo() {
  const t = T[useLocale()]
  // Mientras `recorded` sea true, lo que se ve es la corrida guardada.
  const [recorded, setRecorded] = useState(true)
  const [messages, setMessages] = useState<Msg[]>(answerRun.messages)
  const [trace, setTrace] = useState<TraceEvent[]>(answerRun.trace)
  const [input, setInput] = useState(t.questions[0])
  const [busy, setBusy] = useState(false)
  const [model, setModel] = useState('gpt-4.1-mini')
  const [streaming, setStreaming] = useState('')
  const [showPrompt, setShowPrompt] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  async function ask(text: string) {
    const q = text.trim()
    if (!q || busy) return
    // La corrida guardada no forma parte de la conversación en vivo.
    const next: Msg[] = [...(recorded ? [] : messages), { role: 'user', content: q }]
    setRecorded(false)
    setMessages(next)
    setInput('')
    setTrace([])
    setStreaming('')
    setBusy(true)
    try {
      const res = await fetch('/api/agent-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages: next.slice(-12) }),
      })
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }))
        setMessages([...next, { role: 'assistant', content: `⚠️ ${err.error ?? 'Request failed'}` }])
        return
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.trim()) continue
          const ev = JSON.parse(line) as TraceEvent
          // El texto llega token por token; no va a la traza.
          if (ev.type === 'delta') {
            setStreaming((t) => t + ev.text)
            continue
          }
          if (ev.type === 'tool_call') setStreaming('')
          setTrace((t) => [...t, ev])
          if (ev.type === 'answer') setStreaming('')
          if (ev.type === 'answer') setMessages([...next, { role: 'assistant', content: ev.content }])
          if (ev.type === 'error') setMessages([...next, { role: 'assistant', content: `⚠️ ${ev.message}` }])
        }
        requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }))
      }
    } catch {
      setMessages([...next, { role: 'assistant', content: '⚠️ Network error. Please try again.' }])
    } finally {
      setBusy(false)
      setStreaming('')
    }
  }

  const answer = trace.find((e): e is Extract<TraceEvent, { type: 'answer' }> => e.type === 'answer')
  // De dónde salió la respuesta, dicho en una línea bajo el chat.
  const usedTools = [...new Set(trace.flatMap((e) => (e.type === 'tool_call' ? [e.name] : [])))]

  return (
    <div
      className='grid overflow-hidden rounded-[20px] lg:grid-cols-[1.15fr_1fr]'
      style={{ border: '1px solid var(--border)', background: 'var(--card)' }}>
      {/* CHAT */}
      <div className='flex h-[520px] min-w-0 flex-col'>
        <div className='flex items-center justify-between px-5 py-3' style={{ borderBottom: '1px solid var(--border)' }}>
          <span className='inline-flex items-center gap-2 text-[13.5px] font-medium'>
            <span className='site-pulse h-[7px] w-[7px] rounded-full' style={{ background: 'var(--live)' }} />
            {t.agent}
          </span>
          <span
            className='site-mono hidden rounded-full px-2 py-0.5 text-[11px] font-bold sm:inline'
            style={
              recorded
                ? { background: 'var(--bg-2)', color: 'var(--muted)' }
                : { background: 'var(--accent-soft)', color: 'var(--accent)' }
            }>
            {recorded ? t.recorded : t.live}
          </span>
          {!recorded && (
            <button
              type='button'
              disabled={busy}
              onClick={() => {
                setRecorded(true)
                setMessages(answerRun.messages)
                setTrace(answerRun.trace)
                setInput(t.questions[0])
              }}
              className='inline-flex items-center gap-1 text-[12.5px]'
              style={{ color: 'var(--muted)' }}>
              <RotateCcw className='h-3.5 w-3.5' /> {t.reset}
            </button>
          )}
        </div>

        <div ref={scrollRef} className='flex-1 space-y-3 overflow-y-auto px-5 py-4'>
          {messages.map((m, i) => (
            <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <div
                className='prose prose-sm max-w-[85%] rounded-[14px] px-3.5 py-2.5 text-[14px] dark:prose-invert'
                style={
                  m.role === 'user'
                    ? { background: 'var(--accent)', color: 'var(--accent-fg)' }
                    : { background: 'var(--bg-2)', border: '1px solid var(--border)' }
                }>
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
            </div>
          ))}
          {streaming && (
            <div className='flex justify-start'>
              <div
                className='prose prose-sm max-w-[85%] rounded-[14px] px-3.5 py-2.5 text-[14px] dark:prose-invert'
                style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
                <ReactMarkdown>{streaming + ' ▍'}</ReactMarkdown>
              </div>
            </div>
          )}
          {busy && !streaming && (
            <div className='inline-flex items-center gap-2 text-[13px]' style={{ color: 'var(--muted)' }}>
              <Loader2 className='h-3.5 w-3.5 animate-spin' /> {t.thinking}
            </div>
          )}
          {!busy && answer && usedTools.length > 0 && (
            <p className='site-mono inline-flex items-center gap-1.5 text-[11.5px]' style={{ color: 'var(--muted)' }}>
              <Database className='h-3 w-3' /> {t.lookedUp} {usedTools.join(' + ')}
            </p>
          )}
        </div>

        {recorded && (
          <div className='px-5 pt-3 pb-1' style={{ borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
            <p className='text-[13.5px]' style={{ color: 'var(--muted)', lineHeight: 1.5 }}>
              {t.saved}
            </p>
            <div className='mt-2.5 flex flex-wrap gap-2'>
              {t.questions.map((q) => (
                <button
                  key={q}
                  type='button'
                  onClick={() => setInput(q)}
                  aria-pressed={input === q}
                  className='site-pick min-h-[40px] rounded-[11px] px-3.5 py-2 text-left text-[13.5px]'
                  style={
                    input === q
                      ? { border: '1px solid var(--accent)', background: 'var(--accent-soft)' }
                      : { border: '1px solid var(--border-strong)', background: 'var(--card)' }
                  }>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            ask(input)
          }}
          className='flex flex-wrap gap-2 p-3'
          style={recorded ? { background: 'var(--bg)' } : { borderTop: '1px solid var(--border)' }}>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={busy}
            aria-label={t.model}
            className='site-mono h-11 w-full rounded-[12px] px-2.5 text-[12.5px] outline-none focus-visible:ring-2 sm:w-auto'
            style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
            {MODEL_OPTIONS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={1000}
            placeholder={recorded ? t.own : t.placeholder}
            aria-label={t.message}
            className='h-11 min-w-0 flex-1 rounded-[12px] px-3.5 text-[14px] outline-none focus-visible:ring-2'
            style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
          />
          <button
            type='submit'
            disabled={busy || !input.trim()}
            aria-label={t.send}
            className='site-btn site-btn-accent site-cta h-11 shrink-0 justify-center px-4 text-[14.5px] disabled:opacity-50'>
            {recorded ? t.askLive : t.ask}
            <ArrowUp className='h-[18px] w-[18px]' />
          </button>
        </form>
      </div>

      {/* TRACE */}
      <div
        className='flex h-[520px] min-w-0 flex-col'
        style={{ background: 'var(--bg-2)', borderLeft: '1px solid var(--border)' }}>
        <div className='flex items-center justify-between px-5 py-3' style={{ borderBottom: '1px solid var(--border)' }}>
          <span className='site-kicker'>{showPrompt ? t.promptTools : recorded ? t.did : t.liveBuild}</span>
          <button
            type='button'
            onClick={() => setShowPrompt((v) => !v)}
            className='inline-flex items-center gap-1 text-[12.5px]'
            style={{ color: 'var(--muted)' }}>
            <Code2 className='h-3.5 w-3.5' /> {showPrompt ? t.back : t.view}
          </button>
        </div>
        <div className='flex-1 space-y-2.5 overflow-y-auto px-5 py-4'>
          {showPrompt && (
            <>
              <p className='site-kicker'>{t.system}</p>
              <Code text={SYSTEM_PROMPT} />
              <p className='site-kicker pt-2'>{t.schemas}</p>
              <Code text={JSON.stringify(toolSpecs, null, 2)} />
            </>
          )}
          {!showPrompt && trace.length === 0 && (
            <p className='text-[13px]' style={{ color: 'var(--muted)', lineHeight: 1.55 }}>
              {t.empty}
            </p>
          )}
          {!showPrompt && answer && (
            <p className='site-mono text-[11.5px]' style={{ color: 'var(--muted)' }}>
              model: {answer.model}
            </p>
          )}
          {!showPrompt && trace.map((ev, i) => {
            // Cada paso dice en llano qué hizo el modelo; el detalle técnico va al lado.
            if (ev.type === 'llm')
              return (
                <Row
                  key={i}
                  icon={Sparkles}
                  title={trace[i + 1]?.type === 'tool_call' ? t.picks : t.writes}
                  meta={`${ev.ms} ms · ${ev.input}→${ev.output} tok`}
                />
              )
            if (ev.type === 'tool_call')
              return (
                <Row
                  key={i}
                  icon={toolIcon[ev.name] ?? Database}
                  title={ev.name}
                  note={ev.name === 'search_docs' ? t.searches : t.runsSql}
                  code={prettyArgs(ev.args)}
                />
              )
            if (ev.type === 'tool_result')
              return (
                <div key={i} className='pl-7'>
                  {ev.sql && <Code text={ev.sql} />}
                  {ev.sources?.length ? (
                    <ul className='mt-1.5 space-y-1'>
                      {ev.sources.map((s) => (
                        <li key={s.id} className='site-mono flex justify-between gap-2 text-[11.5px]'>
                          <span className='truncate'>
                            [{s.id}] {s.heading}
                          </span>
                          <span style={{ color: 'var(--muted)' }}>{s.score.toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <p className='site-mono mt-1 text-[11.5px]' style={{ color: 'var(--muted)' }}>
                    {ev.ms} ms{ev.rows !== undefined ? ` · ${ev.rows} ${t.rows}` : ''}
                  </p>
                </div>
              )
            if (ev.type === 'answer')
              return (
                <div
                  key={i}
                  className='site-mono mt-3 grid grid-cols-3 gap-2 rounded-[12px] p-3 text-center text-[11.5px]'
                  style={{ border: '1px solid var(--border)', background: 'var(--card)' }}>
                  <Stat label={t.latency} value={`${(ev.ms / 1000).toFixed(1)} s`} />
                  <Stat label={t.tokens} value={`${ev.tokens.input + ev.tokens.output}`} />
                  <Stat label={t.cost} value={ev.cost_usd !== null ? `$${ev.cost_usd.toFixed(4)}` : 'n/a'} />
                </div>
              )
            return null
          })}
        </div>
      </div>
    </div>
  )
}

function prettyArgs(args: string) {
  try {
    return JSON.stringify(JSON.parse(args))
  } catch {
    return args
  }
}

function Row({
  icon: Icon,
  title,
  note,
  meta,
  code,
}: {
  icon: typeof Database
  title: string
  note?: string
  meta?: string
  code?: string
}) {
  return (
    <div>
      <div className='flex items-center justify-between gap-2'>
        <span className='inline-flex items-center gap-2 text-[13px] font-medium'>
          <span
            className='grid h-5 w-5 place-items-center rounded-[6px]'
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
            <Icon className='h-3 w-3' />
          </span>
          <span>
            <span className={note ? 'site-mono text-[12.5px]' : undefined}>{title}</span>
            {note && (
              <span className='font-normal' style={{ color: 'var(--muted)' }}>
                {' '}
                {note}
              </span>
            )}
          </span>
        </span>
        {meta && (
          <span className='site-mono text-[11.5px]' style={{ color: 'var(--muted)' }}>
            {meta}
          </span>
        )}
      </div>
      {code && (
        <div className='mt-1 pl-7'>
          <Code text={code} />
        </div>
      )}
    </div>
  )
}

function Code({ text }: { text: string }) {
  return (
    <pre
      className='site-mono overflow-x-auto rounded-[8px] px-2.5 py-2 text-[11.5px] whitespace-pre-wrap'
      style={{ background: 'var(--card)', border: '1px solid var(--border)', lineHeight: 1.5 }}>
      {text}
    </pre>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ color: 'var(--muted)' }}>{label}</div>
      <div className='mt-0.5 font-medium'>{value}</div>
    </div>
  )
}
