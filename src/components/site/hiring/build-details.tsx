import { ArrowRight, ChevronDown, Code2 } from 'lucide-react'
import type { Decision, HiringCopy } from '@/content/hiring'

// Capa técnica de cada nivel, cerrada por defecto para no abrumar a quien no es
// técnico. <details> nativo: funciona sin JS y es accesible por teclado.
export default function BuildDetails({
  copy,
  pipeline = [],
  decisions,
  failures = [],
  stack,
  code,
}: {
  copy: HiringCopy
  pipeline?: [string, string][]
  decisions: Decision[]
  failures?: string[]
  stack: string[]
  code?: string
}) {
  const t = copy.section
  return (
    <details
      className='group mt-4 rounded-[18px]'
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <summary className='flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden'>
        <span>
          <span className='site-display text-[16px] font-semibold' style={{ letterSpacing: '-0.02em' }}>
            {t.howBuilt}
          </span>
          <span className='ml-2 text-[13px]' style={{ color: 'var(--muted)' }}>
            {t.howBuiltHint}
          </span>
        </span>
        <ChevronDown className='h-4 w-4 shrink-0 transition-transform group-open:rotate-180' style={{ color: 'var(--muted)' }} />
      </summary>

      <div className='space-y-6 px-5 pb-6'>
        {pipeline.length > 0 && (
          <ol className='grid gap-2 sm:grid-cols-5'>
            {pipeline.map(([name, desc], i) => (
              <li
                key={name}
                className='relative rounded-[12px] px-3 py-2.5'
                style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
                <span className='site-mono text-[10.5px]' style={{ color: 'var(--accent)' }}>
                  0{i + 1}
                </span>
                <p className='text-[13px] font-medium'>{name}</p>
                <p className='mt-0.5 text-[11.5px]' style={{ color: 'var(--muted)', lineHeight: 1.4 }}>
                  {desc}
                </p>
                {i < pipeline.length - 1 && (
                  <ArrowRight
                    className='absolute top-1/2 -right-[13px] z-10 hidden h-4 w-4 -translate-y-1/2 sm:block'
                    style={{ color: 'var(--muted)' }}
                  />
                )}
              </li>
            ))}
          </ol>
        )}

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
                  {f}
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
