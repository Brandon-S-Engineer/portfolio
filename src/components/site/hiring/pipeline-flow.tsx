'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'

const STEP_MS = 2000
const HOLD_MS = 3200

// Un ejemplo que avanza paso a paso en loop. Sin JS, o con movimiento reducido,
// se ven todos los pasos fijos. Fuera de pantalla se detiene.
export default function PipelineFlow({ steps, label }: { steps: [string, string, string][]; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<number | null>(null)
  const [visible, setVisible] = useState(false)
  const last = steps.length - 1

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !ref.current) return
    const observer = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.2 })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!visible) return
    const id = setTimeout(
      () => setActive((a) => (a === null || a >= last ? 0 : a + 1)),
      active === null ? 300 : active === last ? HOLD_MS : STEP_MS,
    )
    return () => clearTimeout(id)
  }, [visible, active, last])

  return (
    <div ref={ref}>
      <div className='mb-3 flex items-center gap-3'>
        <span className='site-kicker shrink-0'>{label}</span>
        <span className='h-[3px] flex-1 overflow-hidden rounded-full' style={{ background: 'var(--border)' }}>
          <span
            className='block h-full rounded-full'
            style={{
              width: active === null ? '100%' : `${((active + 1) / steps.length) * 100}%`,
              background: active === last ? 'var(--live)' : 'var(--accent)',
              transition: active === 0 ? 'none' : `width ${STEP_MS}ms ease-in-out, background 500ms ease`,
            }}
          />
        </span>
      </div>
      <ol className='grid gap-2 sm:grid-cols-5'>
        {steps.map(([name, desc, example], i) => {
          const reached = active === null || i <= active
          const current = active === i
          const tone = i === last ? 'var(--live)' : 'var(--accent)'
          return (
            <li
              key={name}
              className='relative flex flex-col rounded-[12px] px-3 py-2.5'
              style={{
                background: current ? `color-mix(in oklch, ${tone} 11%, var(--card))` : 'var(--bg-2)',
                border: `1px solid ${current ? tone : 'var(--border)'}`,
                transition: 'background 600ms ease, border-color 600ms ease',
              }}>
              <span
                className='site-mono text-[10.5px] font-bold'
                style={{ color: current ? tone : 'var(--accent)', transition: 'color 600ms ease' }}>
                0{i + 1}
              </span>
              <p className='text-[13px] font-semibold'>{name}</p>
              <p className='mt-0.5 text-[11.5px]' style={{ color: 'var(--muted)', lineHeight: 1.4 }}>
                {desc}
              </p>
              <p
                className='mt-2 pt-2 text-[12px]'
                style={{
                  borderTop: '1px solid var(--border)',
                  lineHeight: 1.4,
                  fontWeight: current ? 600 : 400,
                  opacity: reached ? 1 : 0,
                  transition: 'opacity 600ms ease',
                }}>
                {example}
              </p>
              {i < last && (
                <ArrowRight
                  className='absolute top-1/2 -right-[13px] z-10 hidden h-4 w-4 -translate-y-1/2 sm:block'
                  style={{ color: active !== null && i < active ? 'var(--accent)' : 'var(--muted)', transition: 'color 600ms ease' }}
                />
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
