import { Fragment } from 'react'

// Texto con formato mínimo: **negritas**, `código` y ==dato clave==.
export function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|==[^=]+==)/g)
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith('**')) return <strong key={i} className='font-semibold text-foreground'>{p.slice(2, -2)}</strong>
        if (p.startsWith('`')) return <code key={i} className='rounded bg-muted px-1 py-0.5 font-mono text-[0.86em] text-sky-800 dark:text-sky-200'>{p.slice(1, -1)}</code>
        if (p.startsWith('==')) return <strong key={i} className='font-bold text-purple-700 dark:text-purple-300'>{p.slice(2, -2)}</strong>
        return <Fragment key={i}>{p}</Fragment>
      })}
    </>
  )
}
