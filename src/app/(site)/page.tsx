import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowDown, ArrowRight, ArrowUpRight, Check, Code2, FileText, Mail, MessageCircle, UserRound } from 'lucide-react'
import ResaleIntel from '@/components/site/resale/resale-intel'
import { getMarketSnapshot } from '@/lib/resale/market'
import CompanyAgentDemo from '@/components/site/company-agent-demo'
import LeadAgentDemo from '@/components/site/lead-agent-demo'
import LevelLadder from '@/components/site/hiring/level-ladder'
import LevelSection from '@/components/site/hiring/level-section'
import BuildDetails from '@/components/site/hiring/build-details'
import { hiringCopy } from '@/content/hiring'
import { site } from '@/content/site'

// Home de empleo. Se lee en dos capas: la escalera (qué hace cada nivel, en
// lenguaje llano) para quien no es técnico, y "How it's built" en cada nivel
// para quien revisa decisiones y código. Todo lo que se prueba aquí es real.

const DEMOS: Record<string, ReactNode> = {
  'level-3': <CompanyAgentDemo />,
  'level-4': <LeadAgentDemo />,
}

// Los datos del mercado de reventa se cachean 30 min (ver lib/resale/market).
export const revalidate = 1800

export default async function HomePage() {
  const copy = hiringCopy.en
  const snapshot = await getMarketSnapshot()
  const { links: l } = site.hiring
  const links = [
    { href: l.github, label: 'GitHub', icon: Code2 },
    { href: l.linkedin, label: 'LinkedIn', icon: UserRound },
    { href: l.cv, label: 'CV (PDF)', icon: FileText },
    { href: l.email ? `mailto:${l.email}` : '', label: 'Email', icon: Mail },
    { href: l.whatsapp ? `https://wa.me/${l.whatsapp}` : '', label: 'WhatsApp', icon: MessageCircle },
  ].filter((x) => x.href)

  const liveCount = copy.levels.filter((x) => x.status === 'live').length + 1
  const built = copy.levels.filter((x) => x.status === 'building')
  const live = copy.levels.filter((x) => x.status === 'live')
  const p = copy.production

  return (
    <>
      {/* HERO: quién soy + la escalera completa en una vista */}
      <section className='mx-auto max-w-[1120px] px-6 pt-14 pb-8 sm:pt-20'>
        <div className='grid items-end gap-12 lg:grid-cols-[1.05fr_0.95fr]'>
          <div className='site-rise'>
            <span
              className='inline-flex items-center gap-2.5 rounded-full py-1.5 pr-3 pl-2.5 text-[12.5px]'
              style={{ border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--muted)' }}>
              <span className='site-pulse h-[7px] w-[7px] rounded-full' style={{ background: 'var(--live)' }} />
              {copy.availability}
            </span>
            <p className='site-mono mt-6 text-[13px]' style={{ color: 'var(--muted)' }}>
              {site.name} · {copy.role}
            </p>
            <h1
              className='site-display mt-3 font-bold'
              style={{ fontSize: 'clamp(34px,4.6vw,54px)', lineHeight: 1.05, letterSpacing: '-0.035em', textWrap: 'balance' }}>
              {copy.headline}
            </h1>
            <p className='mt-5 max-w-[54ch] text-[17px]' style={{ lineHeight: 1.55, color: 'var(--muted)', textWrap: 'pretty' }}>
              {copy.subhead}
            </p>
            <div className='mt-7 flex flex-wrap gap-3'>
              <a href='#levels' className='site-btn site-btn-accent h-12 px-[22px] text-[15.5px]'>
                {copy.cta}
                <ArrowDown className='h-[17px] w-[17px]' />
              </a>
              {links.map((x) => (
                <a
                  key={x.label}
                  href={x.href}
                  target={x.href.startsWith('mailto:') ? undefined : '_blank'}
                  rel='noreferrer'
                  className='site-btn site-btn-outline h-12 px-[16px] text-[14.5px]'>
                  <x.icon className='h-4 w-4' />
                  {x.label}
                </a>
              ))}
            </div>
            <div className='mt-6 flex flex-wrap gap-x-5 gap-y-2'>
              {[...copy.meta, copy.proof.code].map((m) => (
                <span key={m} className='inline-flex items-center gap-1.5 text-[13.5px]' style={{ color: 'var(--muted)' }}>
                  <Check className='h-3.5 w-3.5' style={{ color: 'var(--live)' }} strokeWidth={2.8} />
                  {m}
                </span>
              ))}
            </div>
          </div>
          <LevelLadder copy={copy} />
        </div>

        {/* PROOF STRIP */}
        <div className='mt-12 grid grid-cols-3 gap-2 sm:gap-3'>
          {[
            [String(liveCount), copy.proof.live],
            [snapshot ? `${(Math.floor(snapshot.totals.tracked / 1000) * 1000).toLocaleString('en-US')}+` : '—', copy.proof.listings],
            ['4', copy.proof.levels],
          ].map(([v, k]) => (
            <div key={k} className='rounded-[14px] px-3 py-3 sm:px-4' style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <p className='site-display text-[20px] font-bold sm:text-[26px]' style={{ letterSpacing: '-0.03em' }}>
                {v}
              </p>
              <p className='text-[11.5px] leading-snug sm:text-[13px]' style={{ color: 'var(--muted)' }}>
                {k}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* LEVELS */}
      <section id='levels' className='mx-auto max-w-[1120px] scroll-mt-20 px-6 pt-16'>
        <div className='max-w-[64ch]'>
          <span className='site-kicker'>{copy.levelsIntro.kicker}</span>
          <h2 className='site-display mt-2 font-bold' style={{ fontSize: 'clamp(24px,3vw,32px)', letterSpacing: '-0.03em' }}>
            {copy.levelsIntro.title}
          </h2>
          <p className='mt-2 text-[15.5px]' style={{ lineHeight: 1.55, color: 'var(--muted)' }}>
            {copy.levelsIntro.body}
          </p>
        </div>
        {built.length > 0 && (
          <div className='mt-6 grid grid-cols-1 gap-4 md:grid-cols-2'>
            {built.map((lv) => (
              <LevelSection key={lv.id} copy={copy} level={lv} />
            ))}
          </div>
        )}
        {live.map((lv) => (
          <LevelSection key={lv.id} copy={copy} level={lv}>
            {DEMOS[lv.id]}
          </LevelSection>
        ))}
      </section>

      {/* IN PRODUCTION: el sistema real, embebido */}
      <section id='production' className='mx-auto max-w-[1120px] scroll-mt-20 px-6 pt-24'>
        <div className='max-w-[68ch]'>
          <span className='site-kicker'>{p.kicker}</span>
          <h2 className='site-display mt-2 font-bold' style={{ fontSize: 'clamp(24px,3vw,32px)', letterSpacing: '-0.03em' }}>
            {p.title}
          </h2>
        </div>
        <div className='mt-6 overflow-hidden rounded-[20px]' style={{ border: '1px solid var(--border)', background: 'var(--bg)' }}>
          <div className='flex items-center gap-3 px-4 py-2.5' style={{ borderBottom: '1px solid var(--border)', background: 'var(--card)' }}>
            <span className='flex gap-1.5'>
              {[0, 1, 2].map((i) => (
                <span key={i} className='h-[10px] w-[10px] rounded-full' style={{ background: 'var(--border)' }} />
              ))}
            </span>
            <span
              className='site-mono min-w-0 flex-1 truncate rounded-full px-3 py-1 text-center text-[12px]'
              style={{ background: 'var(--bg-2)', color: 'var(--muted)' }}>
              brandon-s-engineer.com/resale
            </span>
            <Link href='/resale' className='inline-flex shrink-0 items-center gap-1 text-[12.5px]' style={{ color: 'var(--accent)' }}>
              Full page <ArrowUpRight className='h-3.5 w-3.5' />
            </Link>
          </div>
          <div className='max-h-[860px] overflow-y-auto p-4 sm:p-6'>
            <ResaleIntel snapshot={snapshot} />
          </div>
        </div>
        <BuildDetails copy={copy} decisions={p.decisions} stack={p.stack} code={p.code} />
        <p className='site-mono mt-4 text-[12px]' style={{ color: 'var(--muted)' }}>
          {p.next}
        </p>
      </section>

      {/* HOW I BUILD: cada principio apunta a donde se ve */}
      <section id='how' className='mx-auto max-w-[1120px] scroll-mt-20 px-6 pt-20'>
        <span className='site-kicker'>{copy.principles.kicker}</span>
        <h2 className='site-display mt-2 font-bold' style={{ fontSize: 'clamp(24px,3vw,30px)', letterSpacing: '-0.03em' }}>
          {copy.principles.title}
        </h2>
        <div className='mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {copy.principles.items.map((x) => (
            <a
              key={x.title}
              href={x.href}
              className='site-lift flex flex-col rounded-[18px] p-[20px]'
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <h3 className='site-display text-[16.5px] font-semibold' style={{ letterSpacing: '-0.02em' }}>
                {x.title}
              </h3>
              <p className='mt-2 flex-1 text-[14px]' style={{ lineHeight: 1.55, color: 'var(--muted)' }}>
                {x.body}
              </p>
              <span className='mt-3 inline-flex items-center gap-1 text-[13px] font-semibold'>
                {copy.principles.see}
                <ArrowRight className='h-3.5 w-3.5' style={{ color: 'var(--accent)' }} />
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* FULL-STACK FOUNDATIONS */}
      <section className='mx-auto max-w-[1120px] px-6 pt-20'>
        <span className='site-kicker'>{copy.foundations.kicker}</span>
        <h2 className='site-display mt-2 font-bold' style={{ fontSize: 'clamp(24px,3vw,30px)', letterSpacing: '-0.03em' }}>
          {copy.foundations.title}
        </h2>
        <p className='mt-2 max-w-[64ch] text-[15px]' style={{ lineHeight: 1.55, color: 'var(--muted)' }}>
          {copy.foundations.body}
        </p>
        <div className='mt-6 grid grid-cols-1 gap-4 md:grid-cols-3'>
          {copy.foundations.items.map((x) => (
            <a
              key={x.name}
              href={x.href}
              target={x.href.startsWith('http') ? '_blank' : undefined}
              rel='noreferrer'
              className='site-lift flex flex-col rounded-[18px] p-[22px]'
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <h3 className='site-display text-[18px] font-semibold' style={{ letterSpacing: '-0.02em' }}>
                {x.name}
              </h3>
              <p className='mt-2 flex-1 text-[14px]' style={{ lineHeight: 1.55, color: 'var(--muted)' }}>
                {x.body}
              </p>
              <span className='mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold'>
                {copy.foundations.open}
                <ArrowUpRight className='h-3.5 w-3.5' style={{ color: 'var(--accent)' }} />
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* CONTACT */}
      <section id='contact' className='mx-auto max-w-[1120px] scroll-mt-20 px-6 pt-20 pb-24'>
        <div
          className='relative overflow-hidden rounded-[26px] px-8 py-14 text-center sm:px-12'
          style={{ background: 'var(--fg)', color: 'var(--bg)' }}>
          <div
            className='absolute inset-0'
            style={{ background: 'radial-gradient(60% 120% at 50% -10%, var(--accent-soft), transparent)', opacity: 0.9 }}
          />
          <div className='relative'>
            <h2
              className='site-display font-bold'
              style={{ fontSize: 'clamp(28px,4vw,42px)', letterSpacing: '-0.03em', textWrap: 'balance' }}>
              {copy.contact.title}
            </h2>
            <p className='mx-auto mt-4 max-w-[52ch] text-[16.5px]' style={{ lineHeight: 1.55, opacity: 0.72 }}>
              {copy.availability}. {copy.contact.body}
            </p>
            <div className='mt-8 flex flex-wrap justify-center gap-3'>
              {links.map((x) => (
                <a
                  key={x.label}
                  href={x.href}
                  target={x.href.startsWith('mailto:') ? undefined : '_blank'}
                  rel='noreferrer'
                  className='site-btn h-[50px] px-[22px] text-[15px]'
                  style={{ background: 'transparent', color: 'var(--bg)', border: '1px solid color-mix(in oklch, var(--bg) 40%, transparent)' }}>
                  <x.icon className='h-4 w-4' />
                  {x.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
