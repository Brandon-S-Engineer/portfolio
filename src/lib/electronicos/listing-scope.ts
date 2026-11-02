import type { Prisma } from '@prisma/client'

/** Listings que la tabla necesita completos de entrada: activos, comprados y vigilados. */
export const BASE_SCOPE: Prisma.ElecListingWhereInput[] = [{ status: 'ACTIVO' }, { comprado: true }, { vigilando: true }]
