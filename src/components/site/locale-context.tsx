'use client'

import { createContext, useContext, useEffect, type ReactNode } from 'react'
import type { Locale } from '@/lib/site/locale'

const LocaleContext = createContext<Locale>('en')

// El idioma lo decide el servidor; aquí solo se reparte a los componentes de
// cliente y se refleja en <html lang> (el layout raíz es compartido).
export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
}

export const useLocale = () => useContext(LocaleContext)
