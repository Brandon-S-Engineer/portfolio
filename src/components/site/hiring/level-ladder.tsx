import { ArrowDown, Sparkles } from 'lucide-react'
import type { HiringCopy } from '@/content/hiring'
import { LevelBars } from '@/components/site/demo-stage'

// Escalones del hero: cada nivel más alto que el anterior y, arriba, el sistema
// en producción. Son anchors a sus secciones; no necesitan estado.
const STEP_H = ['h-[124px] sm:h-[148px]', 'h-[150px] sm:h-[176px]', 'h-[176px] sm:h-[204px]', 'h-[202px] sm:h-[232px]']

export default function LevelLadder({ copy }: { copy: HiringCopy }) {
  return (
    <div className='site-rise-delay'>
      <p className='site-kicker mb-3'>{copy.ladder.kicker}</p>
      <a
        href='#production'
        className='site-lift mb-2 flex items-center gap-3 rounded-2xl px-3.5 py-3'
        style={{ background: 'var(--card)', border: '1px solid var(--accent)', boxShadow: 'var(--shadow)' }}>
        <span
          className='grid h-8 w-8 shrink-0 place-items-center rounded-[9px]'
          style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
          <Sparkles className='h-4 w-4' />
        </span>
        <span className='min-w-0'>
          <span
            className='site-mono flex items-center gap-1.5 text-[10.5px] font-bold uppercase'
            style={{ letterSpacing: '0.06em', color: 'var(--accent)' }}>
            <span className='site-pulse h-1.5 w-1.5 rounded-full' style={{ background: 'var(--live)' }} />
            {copy.ladder.production}
          </span>
          <span className='block text-[13px] leading-snug font-semibold'>{copy.ladder.productionName}</span>
        </span>
      </a>
      <div className='grid grid-cols-4 items-end gap-2'>
        {copy.levels.map((l) => {
          const live = l.status === 'live'
          return (
            <a
              key={l.id}
              href={`#${l.id}`}
              aria-label={`Level ${l.tier}: ${l.name}`}
              className={`site-lift flex flex-col rounded-t-2xl rounded-b-md p-2 sm:p-3.5 ${STEP_H[l.tier - 1]}`}
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                boxShadow: live ? 'var(--shadow)' : 'none',
                opacity: live ? 1 : 0.72,
              }}>
              <LevelBars tier={l.tier} />
              <span
                className='site-mono mt-2.5 text-[10px] font-bold uppercase sm:text-[10.5px]'
                style={{ letterSpacing: '0.06em', color: 'var(--accent)' }}>
                {l.tier} · {l.verb}
              </span>
              <span className='mt-1 text-[11px] leading-snug font-semibold sm:text-[13px]'>{l.name}</span>
              <span
                className='site-mono mt-auto hidden items-center gap-1 pt-2 text-[10.5px] sm:flex'
                style={{ color: live ? 'var(--live)' : 'var(--muted)' }}>
                {live ? (
                  <>
                    <span className='h-1.5 w-1.5 rounded-full' style={{ background: 'var(--live)' }} />
                    live
                  </>
                ) : (
                  copy.ladder.building
                )}
              </span>
            </a>
          )
        })}
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
