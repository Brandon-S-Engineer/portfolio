import { ChevronDown, Code2 } from 'lucide-react'
import type { Decision, HiringCopy } from '@/content/hiring'
import PipelineFlow from './pipeline-flow'
import Rich from './rich'

// Capa técnica de cada sistema, abierta por defecto y con un ejemplo animado.
// <details> nativo: se puede cerrar sin JS y es accesible por teclado.
export default function BuildDetails({
  copy,
  useWhen,
  pipeline = [],
  decisions,
  failures = [],
  stack,
  code,
}: {
  copy: HiringCopy
  useWhen?: string
  pipeline?: [string, string, string][]
  decisions: Decision[]
  failures?: string[]
  stack: string[]
  code?: string
}) {
  const t = copy.section
  return (
    <details
      open
      className='group mt-4 rounded-[18px]'
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <summary className='flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden'>
        <span className='site-display text-[16px] font-bold' style={{ letterSpacing: '-0.02em' }}>
          {t.howBuilt}
        </span>
        <ChevronDown className='h-4 w-4 shrink-0 transition-transform group-open:rotate-180' style={{ color: 'var(--muted)' }} />
      </summary>

      <div className='space-y-6 px-5 pb-6'>
        {useWhen && (
          <p className='text-[14px]' style={{ lineHeight: 1.5, color: 'var(--muted)' }}>
            <span className='font-semibold' style={{ color: 'var(--fg)' }}>
              {t.useWhen}
            </span>{' '}
            {useWhen}
          </p>
        )}
        {pipeline.length > 0 && <PipelineFlow steps={pipeline} label={t.example} />}

        <div>
          <p className='site-kicker'>{t.decisions}</p>
          <div className='mt-3 grid gap-3 md:grid-cols-3'>
            {decisions.map((d) => (
              <div key={d.choice} className='rounded-[14px] p-4' style={{ border: '1px solid var(--border)' }}>
                <h4 className='text-[14.5px] font-semibold'>{d.choice}</h4>
                <p className='mt-2 text-[13px]' style={{ lineHeight: 1.5 }}>
                  <span className='site-mono text-[10.5px] font-bold uppercase' style={{ color: 'var(--live)' }}>
                    {t.why}{' '}
                  </span>
                  <span style={{ color: 'var(--muted)' }}>{d.why}</span>
                </p>
                <p className='mt-2 text-[13px]' style={{ lineHeight: 1.5 }}>
                  <span className='site-mono text-[10.5px] font-bold uppercase' style={{ color: 'var(--accent)' }}>
                    {t.tradeoff}{' '}
                  </span>
                  <span style={{ color: 'var(--muted)' }}>{d.tradeoff}</span>
                </p>
              </div>
            ))}
          </div>
        </div>

        {failures.length > 0 && (
          <div>
            <p className='site-kicker'>{t.failures}</p>
            <ul className='mt-3 space-y-1.5'>
              {failures.map((f) => (
                <li key={f} className='flex gap-2 text-[13.5px]' style={{ lineHeight: 1.5, color: 'var(--muted)' }}>
                  <span style={{ color: 'var(--accent)' }}>→</span>
                  <span>
                    <Rich text={f} />
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
            <a href={code} target='_blank' rel='noreferrer' className='site-btn site-btn-outline h-10 px-4 text-[14px]'>
              <Code2 className='h-4 w-4' />
              {t.code}
            </a>
          )}
        </div>
      </div>
    </details>
  )
}
