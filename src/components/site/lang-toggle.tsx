'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Languages, Loader2 } from 'lucide-react'
import { LOCALE_COOKIE } from '@/lib/site/locale'
import { useLocale } from './locale-context'

// Un botón: muestra el idioma al que cambia, escrito en ese idioma. La
// elección queda en una cookie por un año y el servidor vuelve a pintar.
export default function LangToggle() {
  const locale = useLocale()
  const router = useRouter()
  const [pending, start] = useTransition()
  const next = locale === 'es' ? 'en' : 'es'
  return (
    <button
      type='button'
      disabled={pending}
      lang={next}
      onClick={() => {
        document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`
        start(() => router.refresh())
      }}
      aria-label={next === 'en' ? 'Switch to English' : 'Cambiar a español'}
      className='inline-flex h-9 items-center gap-1.5 rounded-[9px] border px-2.5 text-[13px] font-medium transition-colors'
      style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--fg)' }}>
      {pending ? <Loader2 className='h-4 w-4 animate-spin' /> : <Languages className='h-4 w-4' style={{ color: 'var(--accent)' }} />}
      {next === 'en' ? 'English' : 'Español'}
    </button>
  )
}
