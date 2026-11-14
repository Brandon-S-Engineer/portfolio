import { ChevronDown, Code2, Layers } from 'lucide-react'
import type { Decision, Failure, HiringCopy, PipelineStep } from '@/content/hiring'
import PipelineFlow from './pipeline-flow'

// Capa técnica de cada sistema, pensada para leerse en dos niveles: primero en
// palabras llanas (qué hace, por qué, qué pasa si falla) y debajo la pieza
// técnica. Cerrada por defecto para que la página se recorra rápido.
// <details> nativo: se puede cerrar sin JS y es accesible por teclado.
export default function BuildDetails({
  copy,
  summary,
  useWhen,
  exampleInput,
  pipeline = [],
  decisions,
  failures = [],
  stack,
  code,
}: {
  copy: HiringCopy
  summary?: string
  useWhen?: string
  exampleInput?: string
  pipeline?: PipelineStep[]
  decisions: Decision[]
  failures?: Failure[]
  stack: string[]
  code?: string
}) {
  const t = copy.section
  return (
    <details className='site-built group mt-4 rounded-[18px]'>
      <summary className='flex cursor-pointer list-none items-center gap-3.5 px-5 py-4 [&::-webkit-details-marker]:hidden'>
        <span
          className='grid h-10 w-10 shrink-0 place-items-center rounded-[11px]'
          style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
          <Layers className='h-5 w-5' />
        </span>
        <span className='min-w-0 flex-1'>
          <span className='site-display block text-[16px] font-bold' style={{ letterSpacing: '-0.02em' }}>
            {t.howBuilt}
          </span>
          <span className='block text-[13px] group-open:hidden' style={{ color: 'var(--muted)' }}>
            {t.howBuiltHint}
          </span>
        </span>
        <span className='site-btn site-btn-accent site-cta site-built-btn h-11 shrink-0 px-4 text-[14px] whitespace-nowrap'>
          <span className='group-open:hidden'>{t.open}</span>
          <span className='hidden group-open:inline'>{t.close}</span>
          <ChevronDown className='h-4 w-4 transition-transform group-open:rotate-180' />
        </span>
      </summary>

      <div className='space-y-8 px-5 pt-2 pb-6'>
        {(summary || useWhen) && (
          <div className='flex flex-wrap gap-x-8 gap-y-3'>
            {summary && (
              <p className='min-w-0 flex-[1.4_1_380px] text-[17px] sm:text-[18px]' style={{ lineHeight: 1.5, textWrap: 'pretty' }}>
                <strong className='font-semibold'>{t.inOne}</strong> {summary}
              </p>
            )}
            {useWhen && (
              <p
                className='min-w-0 flex-[1_1_280px] self-start rounded-[12px] px-4 py-3 text-[14px]'
                style={{ lineHeight: 1.5, color: 'var(--muted)', background: 'var(--bg-2)' }}>
                <span className='font-semibold' style={{ color: 'var(--fg)' }}>
                  {t.useWhen}
                </span>{' '}
                {useWhen}
              </p>
            )}
          </div>
        )}

        {pipeline.length > 0 && <PipelineFlow steps={pipeline} label={t.example} hint={t.layers} input={exampleInput} />}

        <div>
          <p className='site-kicker'>{t.decisions}</p>
          <div className='mt-3 grid gap-3 md:grid-cols-3'>
            {decisions.map((d) => (
              <div key={d.question} className='flex flex-col gap-2.5 rounded-[14px] p-4' style={{ border: '1px solid var(--border)' }}>
                <h4 className='text-[15.5px] leading-snug font-semibold'>{d.question}</h4>
                <p className='site-mono text-[11px]' style={{ color: 'var(--muted)' }}>
                  {t.decision} {d.choice}
                </p>
                <p className='text-[13.5px]' style={{ lineHeight: 1.5 }}>
                  <strong className='font-semibold' style={{ color: 'var(--live)' }}>
                    {t.why}{' '}
                  </strong>
                  {d.why}
                </p>
                <p className='text-[13.5px]' style={{ lineHeight: 1.5 }}>
                  <strong className='font-semibold' style={{ color: 'var(--accent)' }}>
                    {t.tradeoff}{' '}
                  </strong>
                  {d.tradeoff}
                </p>
              </div>
            ))}
          </div>
        </div>

        {failures.length > 0 && (
          <div>
            <p className='site-kicker'>{t.failures}</p>
            <ul className='mt-3' style={{ borderBottom: '1px solid var(--border)' }}>
              {failures.map(([when, then, tech]) => (
                <li
                  key={when}
                  className='flex flex-wrap items-baseline gap-x-3.5 gap-y-1 py-3'
                  style={{ borderTop: '1px solid var(--border)' }}>
                  <span className='flex-[1_1_240px] text-[14px]' style={{ color: 'var(--muted)' }}>
                    {when}
                  </span>
                  <span className='flex-[1.4_1_300px] text-[14px] font-semibold'>{then}</span>
                  <span className='site-mono flex-[0_1_190px] text-[11px]' style={{ color: 'var(--muted)' }}>
                    {tech}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div className='site-mono flex flex-wrap gap-2 text-[12px]' style={{ color: 'var(--muted)' }}>
            {stack.map((s) => (
              <span key={s} className='rounded-full px-2.5 py-0.5' style={{ border: '1px solid var(--border)' }}>
                {s}
              </span>
            ))}
          </div>
          {code && (
            <a href={code} target='_blank' rel='noreferrer' className='site-btn site-btn-outline h-11 px-4 text-[14px]'>
              <Code2 className='h-4 w-4' />
              {t.code}
            </a>
          )}
        </div>
      </div>
    </details>
  )
}
