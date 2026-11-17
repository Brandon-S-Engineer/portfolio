import Repaso from '@/components/dashboard/estudio/repaso'
import { allCards, getUnits } from '@/lib/estudio/content'

export const dynamic = 'force-dynamic'

export default async function RepasoPage() {
  return <Repaso cards={allCards(await getUnits())} />
}
