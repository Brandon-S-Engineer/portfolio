import type { ProgressRow } from './types'

// Repaso espaciado tipo Leitner: cada acierto sube la tarjeta una caja y la
// aleja en el tiempo; un fallo la regresa a mañana.
export const INTERVAL_DAYS = [0, 1, 3, 7, 16, 35]
const DAY = 86_400_000

export function rate(prev: ProgressRow | undefined, knew: boolean, now = Date.now()) {
  const box = knew ? Math.min(((prev?.data?.box as number) ?? 0) + 1, INTERVAL_DAYS.length - 1) : 1
  return { status: knew ? 'known' : 'again', data: { box, due: now + INTERVAL_DAYS[box] * DAY } }
}

/** Cuándo toca repasar. Una tarjeta nunca calificada de una lección palomeada
 *  toca a los 3 días: así se comprueba lo que marcaste como "ya me lo sé". */
export function dueAt(row: ProgressRow | undefined, lessonDone: ProgressRow | undefined): number | null {
  if (row?.data?.due) return row.data.due as number
  if (lessonDone) return new Date(lessonDone.updatedAt).getTime() + 3 * DAY
  return null
}
