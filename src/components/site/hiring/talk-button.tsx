'use client'

import { useState } from 'react'

// Botón principal del hero: llamada de voz con el agente que responde sobre mi
// portafolio. Mientras el agente se calibra, el clic avisa en vez de fingir
// una llamada (todo lo que se muestra pega a un backend real).
export default function TalkButton({ label, sub, pending }: { label: string; sub: string; pending: string }) {
  const [clicked, setClicked] = useState(false)

  return (
    <div className='mt-8'>
      <span className='talk-wrap'>
        <span className='talk-aura' aria-hidden='true' />
        <button type='button' className='talk-btn' onClick={() => setClicked(true)}>
          <span className='talk-bars' aria-hidden='true'>
            {[0, 1, 2, 3].map((i) => (
              <span key={i} style={{ animationDelay: `${i * 0.18}s` }} />
            ))}
          </span>
          <span className='text-[16px] font-semibold'>{label}</span>
          <span className='talk-chip site-mono'>{sub}</span>
        </button>
      </span>
      <p aria-live='polite' className='mt-4 min-h-[20px] text-[13.5px]' style={{ color: 'var(--muted)' }}>
        {clicked && pending}
      </p>
    </div>
  )
}
