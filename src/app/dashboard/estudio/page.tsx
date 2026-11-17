import StudyHome from '@/components/dashboard/estudio/home'
import { allQa, getUnits, outline } from '@/lib/estudio/content'

export const dynamic = 'force-dynamic'

export default async function EstudioPage() {
  const units = await getUnits()
  return <StudyHome units={outline(units)} qaCount={allQa(units).length} />
}
