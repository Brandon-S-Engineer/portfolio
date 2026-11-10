'use client'

import { useEffect, useState, type CSSProperties, type PointerEvent } from 'react'

// "Talk to my portfolio": llamada de voz con el agente que responde sobre mi
// portafolio. El mismo botón vive en el hero y en el header; el del header
// avisa al del hero con un evento. Mientras el agente se calibra, el clic avisa
// en vez de fingir una llamada (todo lo que se muestra pega a un backend real).
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

export function TalkPill({ size = 'lg', sub, onClick }: { size?: 'lg' | 'sm'; sub?: string; onClick: () => void }) {
  return (
    <span className={`talk-wrap talk-${size}`}>
      <span className='talk-aura' aria-hidden='true' />
      <button type='button' className='talk-btn' onClick={onClick} onPointerMove={track} onPointerLeave={reset}>
        <span className='talk-shine' aria-hidden='true' />
        <span className='talk-bars' aria-hidden='true'>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} style={{ animationDelay: `${i * 0.18}s` }} />
          ))}
        </span>
        <span className='talk-label'>{TALK_LABEL}</span>
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

function Sky() {
  return (
    <span className='talk-sky' aria-hidden='true'>
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

export default function TalkButton({ sub, caption, pending }: { sub: string; caption: string; pending: string }) {
  const [clicked, setClicked] = useState(false)

  useEffect(() => {
    const onTalk = () => setClicked(true)
    window.addEventListener(TALK_EVENT, onTalk)
    return () => window.removeEventListener(TALK_EVENT, onTalk)
  }, [])

  return (
    <div id='talk' className='talk-stage mt-4 scroll-mt-28'>
      <Sky />
      <TalkPill sub={sub} onClick={() => setClicked(true)} />
      <p aria-live='polite' className='talk-caption mt-5 text-[13.5px]'>
        {clicked ? pending : caption}
      </p>
    </div>
  )
}
