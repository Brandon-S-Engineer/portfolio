import type { ReactNode } from 'react'
import type { HiringCopy, Level } from '@/content/hiring'
import { LevelBars } from '@/components/site/demo-stage'
import BuildDetails from './build-details'
import Facts from './facts'
import Rich from './rich'

// Un sistema destacado: título y una línea arriba (con sus datos duros al
// lado), la demo real en medio y la capa técnica cerrada abajo. Cada sistema
// ocupa su propia banda a todo el ancho; las bandas alternan de fondo para que
// se note dónde termina uno y empieza el otro.
export default function LevelSection({
  copy,
  level,
  band = false,
  children,
}: {
  copy: HiringCopy
  level: Level
  band?: boolean
  children?: ReactNode
}) {
  return (
    <section id={level.id} className={`scroll-mt-14 ${band ? 'site-band' : ''}`}>
      <div className='mx-auto max-w-[1120px] px-6 py-16 sm:py-20'>
        <div className='flex flex-wrap items-end justify-between gap-x-8 gap-y-5'>
          <div className='max-w-[60ch] min-w-0'>
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
          <Facts items={level.facts} />
        </div>
        <div className='mt-6'>{children}</div>
        <BuildDetails
          copy={copy}
          summary={level.summary}
          useWhen={level.useWhen}
          exampleInput={level.exampleInput}
          pipeline={level.pipeline}
          decisions={level.decisions}
          failures={level.failures}
          stack={level.stack}
          code={level.code}
        />
      </div>
    </section>
  )
}
