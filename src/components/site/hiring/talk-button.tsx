'use client'

import { useEffect, useState, type PointerEvent } from 'react'

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

export default function TalkButton({ sub, caption, pending }: { sub: string; caption: string; pending: string }) {
  const [clicked, setClicked] = useState(false)

  useEffect(() => {
    const onTalk = () => setClicked(true)
    window.addEventListener(TALK_EVENT, onTalk)
    return () => window.removeEventListener(TALK_EVENT, onTalk)
  }, [])

  return (
    <div id='talk' className='talk-stage mt-8 scroll-mt-28'>
      <TalkPill sub={sub} onClick={() => setClicked(true)} />
      <p aria-live='polite' className='talk-caption mt-5 text-[13.5px]'>
        {clicked ? pending : caption}
      </p>
    </div>
  )
}
