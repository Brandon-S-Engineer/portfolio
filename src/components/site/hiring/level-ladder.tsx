import { ArrowDown } from 'lucide-react'
import type { HiringCopy } from '@/content/hiring'
import { LevelBars } from '@/components/site/demo-stage'

// Escalones del hero: cada sistema más alto que el anterior, y el más alto es
// el que corre en producción. Son anchors a sus secciones; no necesitan estado.
const STEP_H = ['h-[150px] sm:h-[168px]', 'h-[186px] sm:h-[210px]', 'h-[222px] sm:h-[252px]']

export default function LevelLadder({ copy }: { copy: HiringCopy }) {
  const steps = [
    ...copy.levels.map((l) => ({ id: l.id, verb: l.verb, name: l.name, top: false })),
    { id: 'production', verb: copy.ladder.production, name: copy.ladder.productionName, top: true },
  ]

  return (
    <div className='site-rise-delay'>
      <p className='site-kicker mb-3'>{copy.ladder.kicker}</p>
      <div className='grid grid-cols-3 items-end gap-2'>
        {steps.map((s, i) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            aria-label={`${i + 1}: ${s.name}`}
            className={`site-day site-lift flex flex-col rounded-t-2xl rounded-b-md p-2.5 sm:p-4 ${STEP_H[i]}`}
            style={{
              background: 'var(--card)',
              border: s.top ? '1px solid var(--accent)' : '1px solid var(--border)',
              boxShadow: 'var(--shadow)',
            }}>
            <LevelBars tier={i + 1} of={3} />
            <span
              className='site-mono mt-2.5 text-[10px] font-bold uppercase sm:text-[11px]'
              style={{ letterSpacing: '0.06em', color: 'var(--accent)' }}>
              0{i + 1} · {s.verb}
            </span>
            <span className='mt-1 text-[12px] leading-snug font-semibold sm:text-[14px]'>{s.name}</span>
            <span
              className='site-mono mt-auto flex items-center gap-1.5 pt-2 text-[10.5px]'
              style={{ color: 'var(--live)' }}>
              <span className='site-pulse h-1.5 w-1.5 rounded-full' style={{ background: 'var(--live)' }} />
              live
            </span>
          </a>
        ))}
      </div>
      <div className='mt-2 h-px' style={{ background: 'linear-gradient(90deg, var(--border), var(--accent))' }} />
      <p
        className='site-mono mt-3 flex items-center justify-center gap-1.5 text-[11px] uppercase'
        style={{ letterSpacing: '0.06em', color: 'var(--muted)' }}>
        {copy.ladder.hint}
        <ArrowDown className='h-3 w-3' style={{ color: 'var(--accent)' }} />
      </p>
    </div>
  )
}
