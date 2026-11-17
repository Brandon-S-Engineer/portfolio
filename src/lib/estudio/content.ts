import { cache } from 'react'
import { prisma } from '@/lib/db'
import { parseUnit } from './parse'
import { isCheck, type DeckCard, type DeckQa, type Unit, type UnitOutline } from './types'

export const getUnits = cache(async (): Promise<Unit[]> => {
  const rows = await prisma.studyUnit.findMany({ orderBy: { position: 'asc' } })
  return rows.map((r) => parseUnit(r.source)).filter((u): u is Unit => !!u)
})

export function outline(units: Unit[]): UnitOutline[] {
  return units.map((u) => ({
    id: u.id, level: u.level, title: u.title, goal: u.goal,
    lessons: u.lessons.map((l) => ({
      id: l.id, title: l.title, minutes: l.minutes,
      checks: l.blocks.filter(isCheck).map((b) => b.id),
      cards: l.blocks.flatMap((b) => (b.t === 'cards' ? b.cards.map((c) => c.id) : [])),
    })),
  }))
}

export function allCards(units: Unit[]): DeckCard[] {
  return units.flatMap((u) => u.lessons.flatMap((l) => l.blocks.flatMap((b) => (b.t === 'cards' ? b.cards.map((c) => ({ ...c, lessonId: l.id, lessonTitle: l.title })) : []))))
}

export function allQa(units: Unit[]): DeckQa[] {
  return units.flatMap((u) => u.lessons.flatMap((l) => l.blocks.flatMap((b) => (b.t === 'qa' ? [{ ...b, lessonId: l.id, lessonTitle: l.title }] : []))))
}
