import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, FileText, Mail, Phone } from 'lucide-react'
import ResaleIntel from '@/components/site/resale/resale-intel'
import { getMarketSnapshot } from '@/lib/resale/market'
import CompanyAgentDemo from '@/components/site/company-agent-demo'
import LeadAgentDemo from '@/components/site/lead-agent-demo'
import LevelLadder from '@/components/site/hiring/level-ladder'
import LevelSection from '@/components/site/hiring/level-section'
import BuildDetails from '@/components/site/hiring/build-details'
import Rich from '@/components/site/hiring/rich'
import TalkButton from '@/components/site/hiring/talk-button'
import { GitHubIcon, LinkedInIcon, WhatsAppIcon } from '@/components/site/brand-icons'
import { LevelBars } from '@/components/site/demo-stage'
import { hiringCopy } from '@/content/hiring'
import { site } from '@/content/site'

// Home de empleo: la escalera (qué hace cada sistema, en lenguaje llano), la
// demo real y "How it's built" para quien revisa decisiones y código.

const DEMOS: Record<string, ReactNode> = {
  answer: <CompanyAgentDemo />,
  act: <LeadAgentDemo />,
}

// Los datos del mercado de reventa se cachean 30 min (ver lib/resale/market).
export const revalidate = 1800

export default async function HomePage() {
  const copy = hiringCopy.en
  const snapshot = await getMarketSnapshot()
  const { links: l } = site.hiring
  // Marcas con su color oficial; GitHub hereda el color del texto (negro o blanco).
  const links = [
    { href: `https://wa.me/${l.whatsapp}`, label: 'WhatsApp', icon: WhatsAppIcon, color: '#25D366' },
    { href: `tel:${l.phone}`, label: 'Call', icon: Phone, color: 'var(--accent)' },
    { href: `mailto:${l.email}`, label: 'Email', icon: Mail, color: 'var(--accent)' },
    { href: l.linkedin, label: 'LinkedIn', icon: LinkedInIcon, color: '#0A66C2' },
    { href: l.github, label: 'GitHub', icon: GitHubIcon, color: undefined },
    { href: l.cv, label: 'CV', icon: FileText, color: 'var(--accent)' },
  ]
  // mailto y tel abren su app; lo demás, en otra pestaña.
  const opensTab = (href: string) => !/^(mailto|tel):/.test(href)

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
              <Rich text={copy.subhead} />
            </p>
            <TalkButton sub={copy.talk.sub} caption={copy.talk.caption} pending={copy.talk.pending} />
          </div>
          <LevelLadder copy={copy} />
        </div>

        {/* LINKS: el contacto a un clic */}
        <div className='mt-12 grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-3'>
          {links.map((x) => (
            <a
              key={x.label}
              href={x.href}
              {...(opensTab(x.href) ? { target: '_blank', rel: 'noreferrer' } : {})}
              className='site-lift flex flex-col items-center gap-2 rounded-[14px] px-2 py-4 text-[13.5px] font-semibold'
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <x.icon className='h-6 w-6' style={{ color: x.color }} />
              {x.label}
            </a>
          ))}
        </div>
      </section>

      {/* LEVELS */}
      <section id='projects' className='mx-auto max-w-[1120px] scroll-mt-20 px-6 pt-16'>
        {copy.levels.map((lv) => (
          <LevelSection key={lv.id} copy={copy} level={lv}>
            {DEMOS[lv.id]}
          </LevelSection>
        ))}
      </section>

      {/* IN PRODUCTION: el sistema real, embebido */}
      <section id='production' className='mx-auto max-w-[1120px] scroll-mt-20 px-6 pt-24'>
        <div className='max-w-[68ch]'>
          <div className='flex items-center gap-2.5'>
            <LevelBars tier={3} of={3} />
            <span className='site-kicker'>{p.kicker}</span>
          </div>
          <h2 className='site-display mt-2 font-bold' style={{ fontSize: 'clamp(24px,3vw,32px)', letterSpacing: '-0.03em' }}>
            {p.title}
          </h2>
          <p className='mt-2 text-[16px]' style={{ lineHeight: 1.55 }}>
            <Rich text={p.plain} />
          </p>
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
          <div className='p-4 sm:p-6'>
            <ResaleIntel snapshot={snapshot} embedded />
          </div>
        </div>
        <BuildDetails copy={copy} pipeline={p.pipeline} decisions={p.decisions} stack={p.stack} code={p.code} />
        <p className='site-mono mt-4 text-[12px]' style={{ color: 'var(--muted)' }}>
          {p.next}
        </p>
      </section>

      {/* SMALLER BUILDS: se muestra cuando haya alguna */}
      {copy.smallBuilds.items.length > 0 && (
        <section id='smaller' className='mx-auto max-w-[1120px] scroll-mt-20 px-6 pt-20'>
          <span className='site-kicker'>{copy.smallBuilds.kicker}</span>
          <h2 className='site-display mt-2 font-bold' style={{ fontSize: 'clamp(24px,3vw,30px)', letterSpacing: '-0.03em' }}>
            {copy.smallBuilds.title}
          </h2>
          <div className='mt-6 grid grid-cols-1 gap-4 md:grid-cols-3'>
            {copy.smallBuilds.items.map((x) => (
              <a
                key={x.name}
                href={x.href}
                target='_blank'
                rel='noreferrer'
                className={`site-lift flex flex-col rounded-[18px] p-[22px] ${x.image ? 'md:col-span-3' : ''}`}
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <h3 className='site-display text-[18px] font-semibold' style={{ letterSpacing: '-0.02em' }}>
                  {x.name}
                </h3>
                <p className='mt-2 flex-1 text-[14px]' style={{ lineHeight: 1.55, color: 'var(--muted)' }}>
                  <Rich text={x.plain} />
                </p>
                {x.status && (
                  <p className='mt-2 text-[12.5px]' style={{ color: 'var(--muted)' }}>
                    {x.status}
                  </p>
                )}
                <div className='site-mono mt-4 flex flex-wrap gap-1.5 text-[11.5px]' style={{ color: 'var(--muted)' }}>
                  {x.stack.map((t) => (
                    <span key={t} className='rounded-full px-2 py-0.5' style={{ border: '1px solid var(--border)' }}>
                      {t}
                    </span>
                  ))}
                </div>
                {x.image && (
                  <Image
                    src={x.image}
                    alt={`${x.name} workflow`}
                    width={1800}
                    height={534}
                    sizes='(min-width: 1120px) 1072px, 100vw'
                    className='mt-5 h-auto w-full rounded-[12px]'
                    style={{ border: '1px solid var(--border)' }}
                  />
                )}
              </a>
            ))}
          </div>
        </section>
      )}

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
              {copy.availability}
            </p>
            <div className='mt-8 flex flex-wrap justify-center gap-3'>
              {links.map((x) => (
                <a
                  key={x.label}
                  href={x.href}
                  {...(opensTab(x.href) ? { target: '_blank', rel: 'noreferrer' } : {})}
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
