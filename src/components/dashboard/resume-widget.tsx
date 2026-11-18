'use client'

import { useEffect, useState } from 'react'
import { ExternalLink, FileText, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const CV = { en: '/cv/Brandon-Soria-CV-EN.pdf', es: '/cv/Brandon-Soria-CV-ES.pdf' } as const
type Lang = keyof typeof CV

// CV a la mano mientras estudias: un click lo abre grande, otro lo cierra.
// Va arriba de la burbuja del chat y solo se monta en /dashboard/estudio.
export default function ResumeWidget() {
  const [open, setOpen] = useState(false)
  const [lang, setLang] = useState<Lang>('en')

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      {open && (
        <div
          className={cn(
            'fixed z-50 flex flex-col overflow-hidden bg-popover text-popover-foreground shadow-2xl',
            // Celular: pantalla completa. Desktop: panel alto a la izquierda de las burbujas.
            'inset-0 sm:inset-auto sm:top-4 sm:bottom-4 sm:right-24 sm:rounded-xl sm:border sm:border-border',
            'sm:w-[min(920px,calc(100vw-8rem))]',
          )}>
          <div className='flex items-center gap-2 border-b px-3 py-2'>
            <FileText className='h-4 w-4 text-muted-foreground' />
            <span className='text-sm font-medium'>Mi CV</span>
            <div className='ml-2 flex rounded-md border p-0.5 text-xs'>
              {(Object.keys(CV) as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={cn('rounded px-2 py-0.5 uppercase', lang === l ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>
                  {l}
                </button>
              ))}
            </div>
            <a
              href={CV[lang]}
              target='_blank'
              rel='noreferrer'
              className='ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground'>
              <ExternalLink className='h-3.5 w-3.5' />
              <span className='hidden sm:inline'>Abrir en pestaña</span>
            </a>
            <button onClick={() => setOpen(false)} className='rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground' aria-label='Cerrar CV'>
              <X className='h-4 w-4' />
            </button>
          </div>
          {/* FitH = ajusta la página al ancho del panel, así el texto sale grande y no diminuto */}
          <iframe key={lang} src={`${CV[lang]}#view=FitH&navpanes=0&pagemode=none`} title='CV' className='flex-1 w-full bg-white' />
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'fixed bottom-[4.75rem] right-4 sm:bottom-[5.5rem] sm:right-6 z-[60]',
          'h-12 w-12 rounded-full border border-border bg-background text-foreground shadow-lg',
          'flex items-center justify-center',
          'transition-all duration-200 hover:scale-105 active:scale-95',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          open && 'bg-primary text-primary-foreground',
        )}
        aria-label={open ? 'Cerrar CV' : 'Ver mi CV'}
        title={open ? 'Cerrar CV' : 'Ver mi CV'}>
        {open ? <X className='h-5 w-5' /> : <FileText className='h-5 w-5' />}
      </button>
    </>
  )
}
