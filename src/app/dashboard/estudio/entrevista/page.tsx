import Entrevista from '@/components/dashboard/estudio/entrevista'
import { allQa, getUnits } from '@/lib/estudio/content'

export const dynamic = 'force-dynamic'

export default async function EntrevistaPage() {
  return <Entrevista questions={allQa(await getUnits())} />
}
