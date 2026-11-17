'use client'

import { useMemo, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { highlight, MARK_CLASS, TOKEN_CLASS, type Tok } from '@/lib/estudio/highlight'

export function Tokens({ lines }: { lines: Tok[][] }) {
  return (
    <>
      {lines.map((line, i) => (
        <span key={i}>
          {line.map((t, j) => (
            <span key={j} className={cn(TOKEN_CLASS[t.cls], t.mark && MARK_CLASS)}>{t.text}</span>
          ))}
          {i < lines.length - 1 ? '\n' : ''}
        </span>
      ))}
    </>
  )
}

export const CODE_FRAME = 'rounded-lg border bg-slate-50 dark:bg-black/30'
export const CODE_TEXT = 'font-mono text-[12.5px] leading-[1.6] sm:text-[13px]'

export function CodeBlock({ code, lang, file, className }: { code: string; lang: string; file?: string; className?: string }) {
  const lines = useMemo(() => highlight(code, lang), [code, lang])
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(code.replace(/[«»]/g, '')).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1200) })
  }
  return (
    <div className={cn(CODE_FRAME, 'group relative my-3 overflow-hidden', className)}>
      <div className='flex items-center justify-between gap-2 border-b bg-muted/40 px-3 py-1.5 text-[11px] text-muted-foreground'>
        <span className='min-w-0 truncate font-mono'>{file ?? ''}</span>
        <span className='flex shrink-0 items-center gap-2'>
          <span className='font-semibold uppercase tracking-wider'>{lang}</span>
          <button onClick={copy} title='Copiar' className='rounded p-0.5 hover:bg-muted hover:text-foreground'>
            {copied ? <Check className='h-3.5 w-3.5' /> : <Copy className='h-3.5 w-3.5' />}
          </button>
        </span>
      </div>
      <pre className={cn(CODE_TEXT, 'overflow-x-auto p-3')}><Tokens lines={lines} /></pre>
    </div>
  )
}
