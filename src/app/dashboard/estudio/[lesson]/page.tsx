import { notFound } from 'next/navigation'
import LessonView from '@/components/dashboard/estudio/lesson-view'
import { getUnits } from '@/lib/estudio/content'

export const dynamic = 'force-dynamic'

export default async function LessonPage({ params }: { params: Promise<{ lesson: string }> }) {
  const { lesson: id } = await params
  const units = await getUnits()
  const flat = units.flatMap((u) => u.lessons.map((l) => ({ l, u })))
  const i = flat.findIndex((x) => x.l.id === id)
  if (i < 0) notFound()
  const { l, u } = flat[i]
  const nav = (x?: (typeof flat)[number]) => (x ? { id: x.l.id, title: x.l.title } : null)
  return (
    <LessonView
      key={l.id}
      lesson={l}
      unit={{ title: u.title, level: u.level }}
      siblings={u.lessons.map((s) => ({ id: s.id, title: s.title }))}
      prev={nav(flat[i - 1])}
      next={nav(flat[i + 1])}
    />
  )
}
