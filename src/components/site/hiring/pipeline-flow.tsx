'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import type { PipelineStep } from '@/content/hiring'

const STEP_MS = 2000
const HOLD_MS = 3200

// Un ejemplo que avanza paso a paso en loop. Cada paso se lee en dos capas:
// arriba, en palabras llanas, qué pasa; abajo, en mono, la pieza técnica que lo
// hace. Sin JS, o con movimiento reducido, se ven todos los pasos fijos. Fuera
// de pantalla se detiene.
export default function PipelineFlow({
  steps,
  label,
  hint,
  input,
}: {
  steps: PipelineStep[]
  label: string
  hint?: string
  input?: string
}) {
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
      <div className='mb-3 flex flex-wrap items-center gap-x-3 gap-y-1'>
        <span className='site-kicker shrink-0'>{label}</span>
        <span className='h-[3px] min-w-[80px] flex-1 overflow-hidden rounded-full' style={{ background: 'var(--border)' }}>
          <span
            className='block h-full rounded-full'
            style={{
              width: active === null ? '100%' : `${((active + 1) / steps.length) * 100}%`,
              background: active === last ? 'var(--live)' : 'var(--accent)',
              transition: active === 0 ? 'none' : `width ${STEP_MS}ms ease-in-out, background 500ms ease`,
            }}
          />
        </span>
        {hint && (
          <span className='text-[12.5px]' style={{ color: 'var(--muted)' }}>
            {hint}
          </span>
        )}
      </div>
      {input && (
        <p className='mb-2.5 rounded-[12px] px-3.5 py-2.5 text-[14.5px]' style={{ border: '1px dashed var(--border-strong)' }}>
          {input}
        </p>
      )}
      <ol className='grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5'>
        {steps.map(([name, desc, example, plain], i) => {
          const reached = active === null || i <= active
          const current = active === i
          const tone = i === last ? 'var(--live)' : 'var(--accent)'
          return (
            <li
              key={name}
              className='relative flex flex-col rounded-[14px] p-3.5'
              style={{
                background: current ? `color-mix(in srgb, ${tone} 11%, var(--card))` : 'var(--bg-2)',
                border: `1px solid ${current ? tone : 'var(--border)'}`,
                transition: 'background 600ms ease, border-color 600ms ease',
              }}>
              <span
                className='site-mono grid h-[26px] w-[26px] place-items-center rounded-full text-[12px] font-bold'
                style={{ background: tone, color: 'var(--accent-fg)' }}>
                {i + 1}
              </span>
              <p className='mt-2 text-[15px] leading-snug font-semibold'>{plain}</p>
              <p
                className='mt-1.5 text-[13.5px]'
                style={{
                  lineHeight: 1.45,
                  color: 'var(--muted)',
                  opacity: reached ? 1 : 0,
                  transition: 'opacity 600ms ease',
                }}>
                {example}
              </p>
              <p
                className='site-mono mt-auto pt-2.5 text-[11px]'
                style={{ lineHeight: 1.5, color: 'var(--muted)' }}>
                <span className='mb-2.5 block h-px' style={{ background: 'var(--border)' }} />
                {name} · {desc}
              </p>
              {i < last && (
                <ArrowRight
                  className='absolute top-1/2 -right-[14px] z-10 hidden h-4 w-4 -translate-y-1/2 lg:block'
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
