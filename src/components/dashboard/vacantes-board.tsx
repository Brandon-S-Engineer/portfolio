'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BellOff, Check, ChevronDown, ChevronRight, ExternalLink, Star, Undo2, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export type Vacante = {
  id: string
  externalId: string
  url: string
  title: string
  company: string | null
  location: string | null
  snippet: string | null
  details: string | null
  description: string | null
  expYears: number | null
  verdict: 'APLICAR' | 'ESTIRAR' | 'DESCARTAR' | 'PENDIENTE'
  score: number | null
  reasons: { pts: number; why: string; tag?: 'SILENCIADA' | 'MASIVA' | 'YA_APLICASTE' }[]
  estado: 'NUEVA' | 'GUARDADA' | 'APLICADA' | 'DESCARTADA'
  appliedAt: string | null
  firstSeenAt: string
}

// Pestañas: por veredicto mientras no la has tocado; después manda tu decisión.
const TABS = [
  { id: 'APLICAR', label: 'Aplicar', hint: 'Cumples la experiencia y el stack encaja' },
  { id: 'ESTIRAR', label: 'Estirar', hint: 'Piden 3–4 años o nivel senior: aplica si te interesa mucho' },
  { id: 'PENDIENTE', label: 'Falta leer', hint: 'Solo se capturó la tarjeta: ábrela en Indeed y la descripción se captura sola' },
  { id: 'GUARDADA', label: 'Guardadas', hint: 'Las que marcaste para después' },
  { id: 'APLICADA', label: 'Aplicadas', hint: 'Ya mandaste tu CV' },
  { id: 'DESCARTAR', label: 'Descartadas', hint: 'Fuera de alcance, de otro stack, de empresas silenciadas, o las que quitaste tú' },
] as const
type TabId = (typeof TABS)[number]['id']

const VERDICT_STYLE: Record<Vacante['verdict'], string> = {
  APLICAR: 'bg-green-600 text-white',
  ESTIRAR: 'bg-amber-500 text-white',
  DESCARTAR: 'bg-red-600 text-white',
  PENDIENTE: 'bg-muted text-muted-foreground',
}

function tabOf(v: Vacante): TabId {
  if (v.estado === 'APLICADA') return 'APLICADA'
  if (v.estado === 'GUARDADA') return 'GUARDADA'
  if (v.estado === 'DESCARTADA') return 'DESCARTAR'
  return v.verdict
}

function expLabel(v: Vacante) {
  if (v.verdict === 'PENDIENTE') return 'Años: sin leer'
  if (v.expYears == null) return 'Sin mínimo de años'
  return `Piden ${v.expYears} año${v.expYears > 1 ? 's' : ''}`
}

export default function VacantesBoard({ vacantes }: { vacantes: Vacante[] }) {
  const [rows, setRows] = useState(vacantes)
  const [tab, setTab] = useState<TabId>('APLICAR')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<string | null>(null)

  const counts = useMemo(() => {
    const c = Object.fromEntries(TABS.map((t) => [t.id, 0])) as Record<TabId, number>
    for (const r of rows) c[tabOf(r)]++
    return c
  }, [rows])

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const tagged = (r: Vacante) => (r.reasons.some((x) => x.tag) ? 1 : 0)
    // Lo de empresas que publican en masa va al final de cada pestaña.
    return rows
      .filter((r) => tabOf(r) === tab && (!needle || `${r.title} ${r.company ?? ''} ${r.location ?? ''}`.toLowerCase().includes(needle)))
      .sort((a, b) => tagged(a) - tagged(b) || (b.score ?? 0) - (a.score ?? 0))
  }, [rows, tab, q])

  // El servidor responde las vacantes afectadas (al silenciar una empresa o
  // aplicar a una republicada cambian varias a la vez).
  async function act(body: Record<string, unknown>, optimistic?: (rs: Vacante[]) => Vacante[]) {
    const prev = rows
    if (optimistic) setRows(optimistic)
    const res = await fetch('/api/empleos/accion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => null)
    if (!res?.ok) {
      setRows(prev)
      toast.error('No se pudo guardar el cambio')
      return
    }
    type Fresh = Pick<Vacante, 'id' | 'verdict' | 'score' | 'expYears' | 'estado' | 'reasons'>
    const fresh = new Map<string, Fresh>(((await res.json()).rows as Fresh[]).map((r) => [r.id, r]))
    setRows((rs) =>
      rs.map((r) => {
        const f = fresh.get(r.id)
        return f ? { ...r, verdict: f.verdict, score: f.score, expYears: f.expYears, estado: f.estado, reasons: f.reasons } : r
      }),
    )
  }

  const setEstado = (v: Vacante, estado: Vacante['estado']) =>
    act({ externalId: v.externalId, estado }, (rs) => rs.map((r) => (r.id === v.id ? { ...r, estado } : r)))

  async function mute(v: Vacante, on: boolean) {
    if (!v.company) return
    await act({ company: v.company, mute: on })
    toast.success(on ? `${v.company} silenciada: sus vacantes ya no llaman la atención` : `${v.company} reactivada`)
  }

  const current = TABS.find((t) => t.id === tab)!

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center gap-2'>
        {TABS.map((t) => (
          <button
            key={t.id}
            type='button'
            onClick={() => setTab(t.id)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-sm transition-colors',
              tab === t.id ? 'border-foreground bg-foreground text-background' : 'hover:bg-muted',
            )}>
            {t.label} <span className='ml-1 tabular-nums opacity-70'>{counts[t.id]}</span>
          </button>
        ))}
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder='Buscar título o empresa…' className='ml-auto h-9 w-full sm:w-64' />
      </div>
      <p className='text-sm text-muted-foreground'>{current.hint}.</p>

      {visible.length === 0 ? (
        <div className='rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground'>
          {rows.length === 0
            ? 'Todavía no hay vacantes. Abre una búsqueda en Indeed con la extensión activa y aparecerán aquí.'
            : 'Nada en esta pestaña.'}
        </div>
      ) : (
        <ul className='space-y-2'>
          {visible.map((v) => {
            const isOpen = open === v.id
            const tag = v.reasons.find((r) => r.tag)?.tag
            return (
              <li key={v.id} className={cn('rounded-lg border bg-card', tag && 'opacity-60')}>
                <div className='flex flex-wrap items-start gap-3 p-3'>
                  <button
                    type='button'
                    onClick={() => setOpen(isOpen ? null : v.id)}
                    aria-label={isOpen ? 'Cerrar detalle' : 'Ver detalle'}
                    className='mt-0.5 text-muted-foreground hover:text-foreground'>
                    {isOpen ? <ChevronDown className='h-4 w-4' /> : <ChevronRight className='h-4 w-4' />}
                  </button>
                  <div className='min-w-0 flex-1'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <a href={v.url} target='_blank' rel='noreferrer' className='font-medium hover:underline'>
                        {v.title}
                      </a>
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', VERDICT_STYLE[v.verdict])}>
                        {v.score ?? '–'}/10
                      </span>
                      <span className='rounded-full border px-2 py-0.5 text-xs'>{expLabel(v)}</span>
                      {tag && (
                        <span className='rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground'>
                          {tag === 'MASIVA' ? 'Publica en masa' : tag === 'SILENCIADA' ? 'Empresa silenciada' : 'Ya aplicaste (republicada)'}
                        </span>
                      )}
                    </div>
                    <p className='mt-0.5 text-sm text-muted-foreground'>
                      {[v.company, v.location, v.snippet].filter(Boolean).join(' · ')}
                    </p>
                    <p className='mt-1 text-xs text-muted-foreground'>
                      {v.reasons
                        .filter((r) => r.pts !== 0)
                        .sort((a, b) => Math.abs(b.pts) - Math.abs(a.pts))
                        .slice(0, 3)
                        .map((r) => r.why)
                        .join(' · ')}
                    </p>
                  </div>
                  <div className='flex shrink-0 flex-wrap gap-1.5'>
                    <Button variant='outline' size='sm' onClick={() => window.open(v.url, '_blank')}>
                      <ExternalLink className='h-3.5 w-3.5' /> Abrir
                    </Button>
                    {v.estado !== 'APLICADA' && (
                      <Button size='sm' onClick={() => setEstado(v, 'APLICADA')}>
                        <Check className='h-3.5 w-3.5' /> Ya apliqué
                      </Button>
                    )}
                    {v.estado === 'NUEVA' && (
                      <Button variant='outline' size='sm' onClick={() => setEstado(v, 'GUARDADA')}>
                        <Star className='h-3.5 w-3.5' /> Guardar
                      </Button>
                    )}
                    {v.estado === 'NUEVA' ? (
                      <Button variant='ghost' size='sm' onClick={() => setEstado(v, 'DESCARTADA')}>
                        <X className='h-3.5 w-3.5' /> Quitar
                      </Button>
                    ) : (
                      <Button variant='ghost' size='sm' onClick={() => setEstado(v, 'NUEVA')}>
                        <Undo2 className='h-3.5 w-3.5' /> Deshacer
                      </Button>
                    )}
                    {v.company && (
                      <Button variant='ghost' size='sm' onClick={() => mute(v, tag !== 'SILENCIADA')}>
                        <BellOff className='h-3.5 w-3.5' /> {tag === 'SILENCIADA' ? 'Reactivar empresa' : 'Silenciar empresa'}
                      </Button>
                    )}
                  </div>
                </div>
                {isOpen && (
                  <div className='space-y-3 border-t p-3 text-sm'>
                    <ul className='space-y-1'>
                      {v.reasons.map((r, i) => (
                        <li key={i} className='flex gap-2'>
                          <span
                            className={cn(
                              'w-10 shrink-0 text-right tabular-nums',
                              r.pts > 0 ? 'text-green-600' : r.pts < 0 ? 'text-red-600' : 'text-muted-foreground',
                            )}>
                            {r.pts > 0 ? `+${r.pts}` : r.pts}
                          </span>
                          <span>{r.why}</span>
                        </li>
                      ))}
                    </ul>
                    {v.details && <p className='text-muted-foreground'>{v.details}</p>}
                    {v.description ? (
                      <p className='max-h-80 overflow-y-auto whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-[13px] leading-relaxed'>
                        {v.description}
                      </p>
                    ) : (
                      <p className='text-muted-foreground'>Sin descripción todavía: ábrela en Indeed y se captura sola.</p>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
