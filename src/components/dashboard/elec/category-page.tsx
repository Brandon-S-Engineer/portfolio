import { Suspense } from 'react'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ElecClient from '@/components/dashboard/elec/elec-client'
import type { Category } from '@/lib/electronicos/categories'
import { toListingDTO, toTradeDTO, toZoneDTO } from '@/lib/electronicos/serialize'
import { LISTINGS_LIMIT, buildMarketPrices, buildPriceTable, buildRotationTable, getElecSettings, loadWindowRows } from '@/lib/electronicos/stats'
import { ensureDefaultZones } from '@/lib/electronicos/zones'
import { BASE_SCOPE } from '@/lib/electronicos/listing-scope'

/** Server component compartido por /dashboard/macbook y /dashboard/iphone. */
export async function ElecCategoryPage({ category }: { category: Category }) {
  const session = await auth()
  if (!session) redirect('/login')

  const settings = await getElecSettings()
  // Solo se bajan completos los que se ven de entrada (activos, comprados, vigilados): el resto
  // se pide al elegir "Desaparecidos" o "Todos". El mercado sale de windowRows (columnas mínimas).
  const [listings, capturedCount, trades, zones, windowRows] = await Promise.all([
    prisma.elecListing.findMany({ where: { category, oculto: false, OR: BASE_SCOPE }, include: { zone: true }, orderBy: { lastSeenAt: 'desc' }, take: LISTINGS_LIMIT }),
    prisma.elecListing.count({ where: { category, oculto: false } }),
    prisma.elecTrade.findMany({ where: { category }, include: { listing: { select: { title: true, url: true } } }, orderBy: { buyDate: 'desc' } }),
    ensureDefaultZones(),
    loadWindowRows(settings, category),
  ])

  return (
    <Suspense>
      <ElecClient
        category={category}
        listings={listings.map(toListingDTO)}
        capturedCount={capturedCount}
        market={buildMarketPrices(windowRows)}
        prices={buildPriceTable(windowRows, settings)}
        rotation={buildRotationTable(windowRows, settings)}
        trades={trades.map(toTradeDTO)}
        zones={zones.map(toZoneDTO)}
        settings={settings}
      />
    </Suspense>
  )
}
