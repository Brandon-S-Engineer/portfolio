import type { ReactNode } from 'react'
import type { HiringCopy, Level } from '@/content/hiring'
import { LevelBars } from '@/components/site/demo-stage'
import BuildDetails from './build-details'
import Rich from './rich'

// Un sistema destacado: título y una línea arriba, la demo real en medio y
// la capa técnica (ejemplo animado, decisiones, fallas) abierta abajo.
export default function LevelSection({ copy, level, children }: { copy: HiringCopy; level: Level; children?: ReactNode }) {
  return (
    <section id={level.id} className='scroll-mt-20 pt-16'>
      <div className='max-w-[68ch]'>
        <div className='flex items-center gap-2.5'>
          <LevelBars tier={level.step} of={3} />
          <span className='site-kicker'>
            0{level.step} · {level.verb}
          </span>
          <span className='site-mono inline-flex items-center gap-1.5 text-[11px]' style={{ color: 'var(--live)' }}>
            <span className='site-pulse h-1.5 w-1.5 rounded-full' style={{ background: 'var(--live)' }} />
            live
          </span>
        </div>
        <h3
          className='site-display mt-2 font-bold'
          style={{ fontSize: 'clamp(22px,2.8vw,30px)', letterSpacing: '-0.03em' }}>
          {level.name}
        </h3>
        <p className='mt-2 text-[16px]' style={{ lineHeight: 1.55 }}>
          <Rich text={level.plain} />
        </p>
      </div>
      <div className='mt-6'>{children}</div>
      <BuildDetails
        copy={copy}
        useWhen={level.useWhen}
        pipeline={level.pipeline}
        decisions={level.decisions}
        failures={level.failures}
        stack={level.stack}
        code={level.code}
      />
    </section>
  )
}
