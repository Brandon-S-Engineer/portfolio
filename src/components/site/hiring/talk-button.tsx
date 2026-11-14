'use client'

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import type { WebCallSession } from 'retell-client-js-sdk'
import type { HiringCopy } from '@/content/hiring'

// "Talk to my portfolio": llamada de voz en el navegador con Leo, el agente de
// Retell que responde sobre mi portafolio. El mismo botón vive en el hero y en
// el header; el del header avisa al del hero con un evento.
//
// La llamada pasa por /api/talk (la API key se queda en el servidor, que además
// aplica los topes de gasto). Si el servidor no está configurado, el botón lo
// dice en vez de fingir una llamada.
export const TALK_EVENT = 'talk:start'
export const TALK_LABEL = 'Talk to my portfolio'

// El color sigue al ratón: posición para el brillo y tono según la x.
function track(e: PointerEvent<HTMLElement>) {
  const el = e.currentTarget
  const r = el.getBoundingClientRect()
  const x = (e.clientX - r.left) / r.width
  const y = (e.clientY - r.top) / r.height
  const wrap = el.parentElement ?? el
  wrap.style.setProperty('--mx', `${x * 100}%`)
  wrap.style.setProperty('--my', `${y * 100}%`)
  wrap.style.setProperty('--talk-hue', String(225 + x * 105))
}

function reset(e: PointerEvent<HTMLElement>) {
  ;(e.currentTarget.parentElement ?? e.currentTarget).style.removeProperty('--talk-hue')
}

export function TalkPill({
  size = 'lg',
  sub,
  label = TALK_LABEL,
  live = false,
  onClick,
}: {
  size?: 'lg' | 'sm'
  sub?: string
  label?: string
  live?: boolean
  onClick: () => void
}) {
  return (
    <span className={`talk-wrap talk-${size} ${live ? 'talk-live' : ''}`}>
      <span className='talk-aura' aria-hidden='true' />
      <button type='button' className='talk-btn' onClick={onClick} onPointerMove={track} onPointerLeave={reset}>
        <span className='talk-shine' aria-hidden='true' />
        <span className='talk-bars' aria-hidden='true'>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} style={{ animationDelay: `${i * 0.18}s` }} />
          ))}
        </span>
        <span className='talk-label'>{label}</span>
        {sub && <span className='talk-chip site-mono'>{sub}</span>}
      </button>
    </span>
  )
}

// Estrellas fijas (misma semilla en servidor y cliente): blancas dentro de la
// zona oscura; afuera, menos y del color --star-out para que se vean en tema claro.
function rand(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
}
const STARS = (() => {
  const r = rand(42)
  return Array.from({ length: 90 }, () => {
    const x = r()
    const y = r()
    const d = Math.hypot((x - 0.5) / 0.5, (y - 0.5) / 0.5)
    const inside = d < 0.62
    return {
      left: `${(x * 100).toFixed(2)}%`,
      top: `${(y * 100).toFixed(2)}%`,
      size: inside ? 1 + r() * 1.6 : 1 + r() * 1.1,
      color: inside ? 'oklch(0.98 0.01 260)' : 'var(--star-out)',
      o: inside ? 0.55 + r() * 0.45 : Math.max(0, 0.75 - (d - 0.62) * 1.1),
      tw: `${(3 + r() * 4).toFixed(1)}s`,
      delay: `${(-r() * 6).toFixed(1)}s`,
    }
  }).filter((s) => s.o > 0.08)
})()

// Destellos de cuatro puntas: pocos y más grandes que las estrellas.
const SPARKS = [
  { left: '9%', top: '20%', size: 14, tw: '5.5s', delay: '-1s' },
  { left: '88%', top: '70%', size: 12, tw: '4.5s', delay: '-3s' },
  { left: '74%', top: '10%', size: 9, tw: '6.5s', delay: '-2s' },
]

// Dos órbitas finas alrededor del botón, cada una con un punto de luz.
function Orbits() {
  return (
    <span className='talk-orbits' aria-hidden='true'>
      <span className='talk-orbit talk-orbit-a'>
        <span className='talk-orbit-dot talk-star' />
      </span>
      <span className='talk-orbit talk-orbit-b'>
        <span className='talk-orbit-dot talk-star' />
      </span>
    </span>
  )
}

function Sky() {
  return (
    <span className='talk-sky' aria-hidden='true'>
      {SPARKS.map((s, i) => (
        <svg
          key={`spark-${i}`}
          className='talk-star talk-spark'
          viewBox='0 0 24 24'
          width={s.size}
          height={s.size}
          style={{ left: s.left, top: s.top, animationDelay: s.delay, '--o': 0.95, '--tw': s.tw } as CSSProperties}>
          <path d='M12 1l2.6 8.4L23 12l-8.4 2.6L12 23l-2.6-8.400L1 12l8.400-2.600z' fill='currentColor' />
        </svg>
      ))}
      {STARS.map((s, i) => (
        <span
          key={i}
          className='talk-star'
          style={
            {
              left: s.left,
              top: s.top,
              width: s.size,
              height: s.size,
              background: s.color,
              animationDelay: s.delay,
              '--o': s.o,
              '--tw': s.tw,
            } as CSSProperties
          }
        />
      ))}
    </span>
  )
}

type Status = 'idle' | 'connecting' | 'live' | 'ended' | 'limit' | 'micDenied' | 'error' | 'pending'

const MAX_SECONDS = 180

// El SDK de Retell se carga en cuanto la página está lista (no en el clic),
// para que el permiso del micrófono se pida dentro del gesto del usuario.
let sdk: Promise<typeof import('retell-client-js-sdk')> | null = null
const loadSdk = () => (sdk ??= import('retell-client-js-sdk'))

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

export default function TalkButton({ copy }: { copy: HiringCopy['talk'] }) {
  const [status, setStatus] = useState<Status>('idle')
  const [seconds, setSeconds] = useState(0)
  const call = useRef<WebCallSession | null>(null)
  const startRef = useRef<() => void>(() => {})

  async function start() {
    if (call.current) return
    setStatus('connecting')
    setSeconds(0)
    try {
      const { RetellClient, RetellApiError } = await loadSdk()
      const client = new RetellClient({
        key: 'proxy', // la llave real la pone /api/talk
        fetch: (url, init) => fetch(`/api/talk${new URL(String(url)).pathname}`, init),
      })
      const session = client.createWebCall({
        agent_id: 'set-on-server',
        hooks: {
          onStatus: (s) => {
            if (s === 'live') setStatus('live')
            if (s === 'ended') {
              call.current = null
              setStatus((prev) => (prev === 'live' || prev === 'connecting' ? 'ended' : prev))
            }
          },
          onError: (err) => {
            console.error('[talk]', err)
            const denied = err.name === 'NotAllowedError' || /permission|microphone|notallowed/i.test(err.message)
            if (denied) setStatus('micDenied')
          },
        },
      })
      call.current = session
      await session.ready.catch((err: unknown) => {
        call.current = null
        if (err instanceof RetellApiError) {
          setStatus(err.status === 429 ? 'limit' : err.status === 503 ? 'pending' : 'error')
        } else {
          const e = err as Error
          setStatus(e?.name === 'NotAllowedError' || /permission|microphone/i.test(e?.message ?? '') ? 'micDenied' : 'error')
        }
      })
    } catch (err) {
      console.error('[talk]', err)
      call.current = null
      setStatus('error')
    }
  }
  startRef.current = start

  async function hangUp() {
    const s = call.current
    call.current = null
    setStatus('ended')
    await s?.end().catch(() => {})
  }

  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((fn: () => void) => setTimeout(fn, 1500))
    idle(() => void loadSdk())
    const onTalk = () => startRef.current()
    window.addEventListener(TALK_EVENT, onTalk)
    return () => {
      window.removeEventListener(TALK_EVENT, onTalk)
      void call.current?.end()
    }
  }, [])

  useEffect(() => {
    if (status !== 'live') return
    const id = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [status])

  const live = status === 'live'
  const caption =
    status === 'idle'
      ? copy.caption
      : live
        ? `${copy.live} ${mmss(seconds)} / ${mmss(MAX_SECONDS)}`
        : copy[status]

  return (
    <div id='talk' className='talk-stage mt-4 scroll-mt-28'>
      <Sky />
      <Orbits />
      <TalkPill
        sub={live ? undefined : copy.sub}
        label={live ? copy.endCall : status === 'connecting' ? copy.connectingLabel : copy.label}
        live={live}
        onClick={() => (live || status === 'connecting' ? hangUp() : start())}
      />
      <p aria-live='polite' className='talk-caption mt-5 text-[13.5px]'>
        {caption}
      </p>
    </div>
  )
}
