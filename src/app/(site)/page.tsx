import type { ComponentType, CSSProperties, ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, Download, FileText, Mail, Phone } from 'lucide-react'
import ResaleIntel from '@/components/site/resale/resale-intel'
import { getMarketSnapshot } from '@/lib/resale/market'
import CompanyAgentDemo from '@/components/site/company-agent-demo'
import LeadAgentDemo from '@/components/site/lead-agent-demo'
import LevelLadder from '@/components/site/hiring/level-ladder'
import LevelSection from '@/components/site/hiring/level-section'
import BuildDetails from '@/components/site/hiring/build-details'
import Rich from '@/components/site/hiring/rich'
import Facts from '@/components/site/hiring/facts'
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

type ContactLink = {
  href: string
  label: string
  icon: ComponentType<{ className?: string; style?: CSSProperties }>
  color?: string
  // Lo que se ve al pasar el ratón: el dato, por si prefieren copiarlo.
  detail?: string
  options?: { label: string; href: string; download?: boolean }[]
}

// mailto y tel abren su app; lo demás, en otra pestaña.
const tabProps = (href: string) => (/^(mailto|tel):/.test(href) ? {} : { target: '_blank', rel: 'noreferrer' })

// Burbuja del hover: el número, el correo o el usuario (seleccionable para
// copiar). El CV ofrece verlo o descargarlo. El clic del botón no cambia.
function Tip({ x, inverse = false }: { x: ContactLink; inverse?: boolean }) {
  return (
    <span className={`site-tip ${inverse ? 'site-tip-inv' : ''}`}>
      <span className='site-tip-in'>
        {x.options
          ? x.options.map((o) => (
              <a key={o.label} href={o.href} {...(o.download ? { download: true } : tabProps(o.href))} className='site-tip-opt'>
                {o.download ? <Download className='h-3.5 w-3.5' /> : <ArrowUpRight className='h-3.5 w-3.5' />}
                {o.label}
              </a>
            ))
          : x.detail}
      </span>
    </span>
  )
}

// Los datos del mercado de reventa se cachean 30 min (ver lib/resale/market).
export const revalidate = 1800

export default async function HomePage() {
  const copy = hiringCopy.en
  const snapshot = await getMarketSnapshot()
  const { links: l } = site.hiring
  // Marcas con su color oficial; lo demás hereda el color del texto (negro o blanco).
  // +525516516493 → +52 55 1651 6493
  const phone = l.phone.replace(/^(\+\d{2})(\d{2})(\d{4})(\d{4})$/, '$1 $2 $3 $4')
  const handle = (url: string) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
  const links: ContactLink[] = [
    { href: `https://wa.me/${l.whatsapp}`, label: 'WhatsApp', icon: WhatsAppIcon, color: '#25D366', detail: phone },
    { href: `tel:${l.phone}`, label: 'Call', icon: Phone, detail: phone },
    { href: `mailto:${l.email}`, label: 'Email', icon: Mail, detail: l.email },
    { href: l.linkedin, label: 'LinkedIn', icon: LinkedInIcon, color: '#0A66C2', detail: handle(l.linkedin) },
    { href: l.github, label: 'GitHub', icon: GitHubIcon, detail: handle(l.github) },
    {
      href: l.cv,
      label: 'CV',
      icon: FileText,
      options: [
        { label: 'Live link', href: l.cv },
        { label: 'Download', href: l.cv, download: true },
      ],
    },
  ]

  const p = copy.production

  return (
    <>
      {/* HERO: siempre oscuro (en tema claro también), para que el botón de voz
          brille. Los escalones siguen claros en tema claro. */}
      <div className='site-night'>
        <section className='mx-auto max-w-[1120px] px-6 pt-8 pb-16 sm:pt-10'>
          <div className='grid items-end gap-12 lg:grid-cols-[1.05fr_0.95fr]'>
            <div className='site-rise'>
              <div className='flex flex-wrap items-center gap-x-3 gap-y-2 lg:w-max lg:flex-nowrap'>
                <p className='site-mono text-[12.5px] whitespace-nowrap' style={{ color: 'var(--muted)' }}>
                  {site.name} · {copy.role}
                </p>
                <span
                  className='inline-flex items-center gap-1.5 rounded-full py-[3px] pr-2.5 pl-2 text-[12px] whitespace-nowrap'
                  style={{ border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--muted)' }}>
                  <span className='site-pulse h-[7px] w-[7px] rounded-full' style={{ background: 'var(--live)' }} />
                  {copy.availability}
                </span>
              </div>
              <h1
                className='site-display mt-4 font-bold'
                style={{ fontSize: 'clamp(34px,4.6vw,54px)', lineHeight: 1.05, letterSpacing: '-0.035em', textWrap: 'balance' }}>
                {copy.headline}
              </h1>
              <p className='mt-5 max-w-[54ch] text-[17px]' style={{ lineHeight: 1.55, color: 'var(--muted)', textWrap: 'pretty' }}>
                <Rich text={copy.subhead} />
              </p>
              <p className='mt-3 max-w-[54ch] text-[14px]' style={{ lineHeight: 1.6, color: 'var(--muted)' }}>
                <Rich text={copy.about} strong='var(--fg)' />
              </p>
              <TalkButton copy={copy.talk} />
            </div>
            <LevelLadder copy={copy} />
          </div>
        </section>
      </div>

      {/* LINKS: el contacto a un clic */}
      <section className='mx-auto max-w-[1120px] px-6 py-10'>
        <div className='grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-3'>
          {links.map((x) => (
            <div key={x.label} className='site-tip-host relative flex'>
              <a
                href={x.href}
                {...tabProps(x.href)}
                className='site-lift site-contact flex flex-1 flex-col items-center gap-2 rounded-[14px] px-2 py-4 text-[13.5px] font-semibold'
                style={{ background: 'var(--card)', border: '1px solid var(--border)', '--brand': x.color } as CSSProperties}>
                <x.icon className='site-contact-icon h-6 w-6' style={{ color: x.color }} />
                {x.label}
              </a>
              <Tip x={x} />
            </div>
          ))}
        </div>
      </section>

      {/* LEVELS */}
      <div id='projects' className='scroll-mt-14'>
        {copy.levels.map((lv, i) => (
          <LevelSection key={lv.id} copy={copy} level={lv} band={i % 2 === 0}>
            {DEMOS[lv.id]}
          </LevelSection>
        ))}
      </div>

      {/* IN PRODUCTION: el sistema real, embebido */}
      <section id='production' className={`scroll-mt-14 ${copy.levels.length % 2 === 0 ? 'site-band' : ''}`}>
        <div className='mx-auto max-w-[1120px] px-6 py-16 sm:py-20'>
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
          <Facts
            items={[
              ...(snapshot ? [[`${Math.floor(snapshot.totals.tracked / 1000)},000+`, copy.section.tracked] as [string, string]] : []),
              ...p.facts,
            ]}
          />
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
        </div>
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
                <span key={x.label} className='site-tip-host relative inline-flex'>
                  <a
                    href={x.href}
                    {...tabProps(x.href)}
                    className='site-btn site-talk-link h-[50px] px-[22px] text-[15px]'
                    style={{ '--brand': x.color } as CSSProperties}>
                    <x.icon className='site-contact-icon h-[18px] w-[18px]' />
                    {x.label}
                  </a>
                  <Tip x={x} inverse />
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
