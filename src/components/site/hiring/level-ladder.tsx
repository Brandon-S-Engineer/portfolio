import { ArrowDown, ArrowRight } from 'lucide-react'
import type { HiringCopy } from '@/content/hiring'
import { LevelBars } from '@/components/site/demo-stage'

// Escalones del hero: cada sistema más alto que el anterior, y el más alto es
// el que corre en producción. Cada uno lleva su dato duro. Son anchors a sus
// secciones; no necesitan estado. En móvil son filas que se van ensanchando.
// Altura mínima, no fija: en español los textos son más largos y deben caber.
const STEP_H = ['sm:min-h-[196px]', 'sm:min-h-[236px]', 'sm:min-h-[276px]']
const ROW_INSET = ['mr-11', 'mr-[22px]', '']

export default function LevelLadder({ copy, productionFact }: { copy: HiringCopy; productionFact: [string, string] }) {
  const steps = [
    ...copy.levels.map((l) => ({ id: l.id, verb: l.verb, name: l.name, fact: l.ladderFact, top: false })),
    { id: 'production', verb: copy.ladder.production, name: copy.ladder.productionName, fact: productionFact, top: true },
  ]

  return (
    <div className='site-rise-delay'>
      <p className='site-kicker mb-3'>{copy.ladder.kicker}</p>
      <div className='flex flex-col gap-3 sm:grid sm:grid-cols-3 sm:items-end sm:gap-2'>
        {steps.map((s, i) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            aria-label={`${i + 1}: ${s.name}. ${s.fact[0]} ${s.fact[1]}`}
            className={`site-day site-lift flex items-center gap-3.5 rounded-[14px] px-4 py-3.5 sm:mr-0 sm:flex-col sm:items-stretch sm:gap-0 sm:rounded-t-2xl sm:rounded-b-md sm:p-3.5 ${ROW_INSET[i]} ${STEP_H[i]}`}
            style={{
              background: 'var(--card)',
              border: s.top ? '1.5px solid var(--accent)' : '1px solid var(--border)',
              boxShadow: 'var(--shadow)',
            }}>
            <span className='flex min-w-0 flex-1 flex-col'>
              <span className='hidden sm:block'>
                <LevelBars tier={i + 1} of={3} />
              </span>
              <span
                className='site-mono text-[10.5px] font-bold uppercase sm:mt-2.5 sm:text-[11px]'
                style={{ letterSpacing: '0.06em', color: 'var(--accent)' }}>
                0{i + 1} · {s.verb}
                <span className='sm:hidden'>{s.top ? ` · ${copy.ladder.inProduction}` : ''}</span>
              </span>
              <span className='mt-1 text-[14.5px] leading-snug font-semibold sm:text-[13.5px]'>{s.name}</span>
              {/* Móvil: el dato en una línea. */}
              <span className='mt-1 text-[12.5px] sm:hidden' style={{ color: 'var(--muted)' }}>
                {s.fact[0]} {s.fact[1]}
              </span>
              {/* Escritorio: el dato en grande, al pie del escalón. */}
              <span className='mt-auto hidden flex-col pt-2.5 sm:flex' style={{ borderTop: '1px solid var(--border)' }}>
                <span className='site-display text-[17px] leading-tight font-bold' style={{ letterSpacing: '-0.02em' }}>
                  {s.fact[0]}
                </span>
                <span className='text-[12px]' style={{ color: 'var(--muted)' }}>
                  {s.fact[1]}
                </span>
              </span>
              <span
                className='site-mono mt-2 hidden items-center gap-1.5 text-[10.5px] sm:flex'
                style={{ color: 'var(--live)' }}>
                <span className='site-pulse h-1.5 w-1.5 rounded-full' style={{ background: 'var(--live)' }} />
                {s.top ? copy.ladder.inProduction : copy.ladder.live}
              </span>
            </span>
            <ArrowRight className='h-[18px] w-[18px] shrink-0 sm:hidden' style={{ color: 'var(--accent)' }} />
          </a>
        ))}
      </div>
      <div className='mt-2 hidden h-px sm:block' style={{ background: 'linear-gradient(90deg, var(--border), var(--accent))' }} />
      <p
        className='site-mono mt-3 hidden items-center justify-center gap-1.5 text-[11px] uppercase sm:flex'
        style={{ letterSpacing: '0.06em', color: 'var(--muted)' }}>
        {copy.ladder.hint}
        <ArrowDown className='h-3 w-3' style={{ color: 'var(--accent)' }} />
      </p>
    </div>
  )
}
