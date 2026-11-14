// Idioma del sitio público. Sin elección guardada, sale del país del visitante
// (cabecera de Vercel) y, si no hay, del idioma del navegador: quien entra
// desde México o cualquier país hispanohablante ve español.

export type Locale = 'en' | 'es'
export const LOCALE_COOKIE = 'site-lang'

const SPANISH_COUNTRIES = new Set([
  'MX', 'ES', 'AR', 'CO', 'CL', 'PE', 'VE', 'EC', 'GT', 'CU', 'BO', 'DO', 'HN', 'PY', 'SV', 'NI', 'CR', 'PA', 'UY', 'PR', 'GQ',
])

export function pickLocale(cookie?: string, country?: string | null, acceptLanguage?: string | null): Locale {
  if (cookie === 'en' || cookie === 'es') return cookie
  if (country) return SPANISH_COUNTRIES.has(country.toUpperCase()) ? 'es' : 'en'
  return /^es\b/i.test(acceptLanguage?.trim() ?? '') ? 'es' : 'en'
}
