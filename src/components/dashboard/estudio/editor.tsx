'use client'

import { useMemo, useRef } from 'react'
import { cn } from '@/lib/utils'
import { highlight } from '@/lib/estudio/highlight'
import { CODE_FRAME, CODE_TEXT, Tokens } from './code-block'

// Editor ligero: un textarea transparente encima del mismo texto coloreado.
export function Editor({ value, onChange, lang = 'js', onRun }: { value: string; onChange: (v: string) => void; lang?: string; onRun?: () => void }) {
  const pre = useRef<HTMLPreElement>(null)
  const lines = useMemo(() => highlight(value.replace(/[«»]/g, ''), lang), [value, lang])

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget
    const { selectionStart: s, selectionEnd: end } = el
    const insert = (text: string) => {
      e.preventDefault()
      onChange(value.slice(0, s) + text + value.slice(end))
      requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = s + text.length })
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); onRun?.(); return }
    if (e.key === 'Tab') return insert('  ')
    if (e.key === 'Enter') {
      const line = value.slice(value.lastIndexOf('\n', s - 1) + 1, s)
      const indent = line.match(/^\s*/)?.[0] ?? ''
      return insert('\n' + indent + (/[{([]\s*$/.test(line) ? '  ' : ''))
    }
  }

  return (
    <div className={cn(CODE_FRAME, CODE_TEXT, 'relative overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/40')}>
      <pre ref={pre} aria-hidden className='pointer-events-none min-h-24 overflow-hidden whitespace-pre p-3'><Tokens lines={lines} />{'\n'}</pre>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onScroll={(e) => { if (pre.current) pre.current.scrollLeft = e.currentTarget.scrollLeft }}
        spellCheck={false}
        autoCapitalize='off'
        autoCorrect='off'
        wrap='off'
        className='absolute inset-0 h-full w-full resize-none overflow-x-auto overflow-y-hidden whitespace-pre bg-transparent p-3 text-transparent caret-foreground outline-none selection:bg-blue-500/30'
      />
    </div>
  )
}
