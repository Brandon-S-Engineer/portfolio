import type { Block, Callout, Lesson, Unit } from './types'

// Formato de una unidad (texto plano, pensado para escribirse rápido):
//
//   @unit id | Nivel | Título | Meta en una línea
//   @lesson id | Título | minutos
//   Párrafo. **negritas**, `código`, ==número==.
//   - lista            1. lista numerada         ### subtítulo
//   !rem / !say / !warn / !senior / !file   (una línea cada uno)
//   | a | b |          tabla; la primera fila es el encabezado
//   ```ts [ruta/archivo.ts]     código; «así» se resalta una parte clave
//   ```flow                     diagrama de texto
//   :::cards | :::quiz | :::cloze | :::speak 60 | :::write sql | :::exercise Título | :::qa categoría
//   :::                         cierra el bloque
//
// Los ids de tarjetas y ejercicios salen del id de la lección y su posición.

type Fence = { info: string; body: string }

function splitFences(lines: string[]): { text: string[]; fences: Fence[] } {
  const text: string[] = []
  const fences: Fence[] = []
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith('```')) { text.push(lines[i]); continue }
    const info = lines[i].slice(3).trim()
    const body: string[] = []
    for (i++; i < lines.length && !lines[i].startsWith('```'); i++) body.push(lines[i])
    fences.push({ info, body: body.join('\n') })
  }
  return { text, fences }
}

const field = (lines: string[], name: string) => {
  const l = lines.find((x) => x.startsWith(name + ':'))
  return l ? l.slice(name.length + 1).trim() : ''
}
const bullets = (lines: string[], mark = '- ') => lines.filter((l) => l.startsWith(mark)).map((l) => l.slice(mark.length).trim())
const prose = (lines: string[]) => lines.filter((l) => l.trim() && !/^(- |\* |\? )/.test(l)).join(' ').trim()

function container(kind: string, arg: string, lines: string[], id: (t: string) => string): Block | null {
  const { text, fences } = splitFences(lines)
  switch (kind) {
    case 'cards': {
      const cards = []
      for (let i = 0; i < text.length; i++) {
        if (!text[i].startsWith('Q:')) continue
        const a = text.slice(i + 1).find((l) => l.startsWith('A:'))
        cards.push({ id: id('card'), q: text[i].slice(2).trim(), a: a ? a.slice(2).trim() : '' })
      }
      return { t: 'cards', cards }
    }
    case 'quiz': {
      const opts = text.filter((l) => l.startsWith('- ') || l.startsWith('* '))
      return { t: 'quiz', id: id('quiz'), q: field(text, 'Q'), options: opts.map((o) => o.slice(2).trim()), answer: opts.findIndex((o) => o.startsWith('* ')), why: field(text, 'Why') }
    }
    case 'cloze':
      return { t: 'cloze', id: id('cloze'), prompt: prose(text), lang: fences[0]?.info ?? '', code: fences[0]?.body ?? '' }
    case 'speak':
      return { t: 'speak', id: id('speak'), seconds: Number(arg) || 60, prompt: prose(text), points: bullets(text) }
    case 'write':
      return { t: 'write', id: id('write'), lang: arg || fences[0]?.info || '', prompt: prose(text), solution: fences[0]?.body ?? '', points: bullets(text) }
    case 'exercise': {
      const part = (n: string) => fences.find((f) => f.info.split(/\s+/)[1] === n)?.body ?? ''
      return {
        t: 'exercise', id: id('ex'), title: arg,
        prompt: text.join('\n').split(/\n\s*\n/).map((p) => p.split('\n').filter((l) => !l.startsWith('? ')).join(' ').trim()).filter(Boolean),
        starter: part('starter'), solution: part('solution'), tests: part('tests'), hints: bullets(text, '? '),
      }
    }
    case 'qa':
      return { t: 'qa', id: id('qa'), cat: arg || 'technical', q: field(text, 'Q'), key: field(text, 'Key'), say: field(text, 'Say'), note: field(text, 'Note') || undefined }
  }
  return null
}

function parseBlocks(lines: string[], lessonId: string): Block[] {
  const blocks: Block[] = []
  const counters: Record<string, number> = {}
  const id = (t: string) => `${lessonId}.${t}${(counters[t] = (counters[t] ?? 0) + 1)}`
  let para: string[] = []
  const flush = () => { if (para.length) blocks.push({ t: 'p', text: para.join(' ') }); para = [] }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith(':::')) {
      flush()
      const [kind, ...rest] = line.slice(3).trim().split(' ')
      const inner: string[] = []
      for (i++; i < lines.length && lines[i].trim() !== ':::'; i++) inner.push(lines[i])
      const b = container(kind, rest.join(' ').trim(), inner, id)
      if (b) blocks.push(b)
      continue
    }
    if (line.startsWith('```')) {
      flush()
      const info = line.slice(3).trim()
      const body: string[] = []
      for (i++; i < lines.length && !lines[i].startsWith('```'); i++) body.push(lines[i])
      const m = info.match(/^(\S*)\s*(?:\[(.+)\])?$/)
      const lang = m?.[1] ?? ''
      if (lang === 'flow') blocks.push({ t: 'flow', text: body.join('\n') })
      else blocks.push({ t: 'code', lang, code: body.join('\n'), file: m?.[2] })
      continue
    }
    const call = line.match(/^!(rem|say|warn|senior|file)\s+(.*)$/)
    if (call) {
      flush()
      blocks.push(call[1] === 'file' ? { t: 'file', text: call[2] } : { t: 'callout', kind: call[1] as Callout, text: call[2] })
      continue
    }
    if (line.startsWith('### ')) { flush(); blocks.push({ t: 'h', text: line.slice(4).trim() }); continue }
    const ordered = /^\d+\.\s/.test(line)
    if (line.startsWith('- ') || ordered) {
      flush()
      const items: string[] = []
      const re = ordered ? /^\d+\.\s+/ : /^- /
      for (; i < lines.length && re.test(lines[i]); i++) items.push(lines[i].replace(re, '').trim())
      i--
      blocks.push({ t: 'list', ordered, items })
      continue
    }
    if (line.startsWith('|')) {
      flush()
      const rows: string[][] = []
      for (; i < lines.length && lines[i].startsWith('|'); i++) rows.push(lines[i].replace(/^\||\|\s*$/g, '').split('|').map((c) => c.trim()))
      i--
      blocks.push({ t: 'table', head: rows[0] ?? [], rows: rows.slice(1) })
      continue
    }
    if (!line.trim()) { flush(); continue }
    para.push(line.trim())
  }
  flush()
  return blocks
}

export function parseUnit(source: string): Unit | null {
  const lines = source.replace(/\r/g, '').split('\n')
  let unit: Unit | null = null
  let current: { lesson: Lesson; lines: string[] } | null = null
  let fenced = false
  const close = () => {
    if (!current || !unit) return
    current.lesson.blocks = parseBlocks(current.lines, current.lesson.id)
    unit.lessons.push(current.lesson)
    current = null
  }
  for (const line of lines) {
    if (line.startsWith('```')) fenced = !fenced
    if (!fenced && line.startsWith('@unit ')) {
      const [id, level, title, goal] = line.slice(6).split('|').map((s) => s.trim())
      unit = { id, level, title, goal: goal ?? '', lessons: [] }
      continue
    }
    if (!fenced && line.startsWith('@lesson ')) {
      close()
      const [id, title, minutes] = line.slice(8).split('|').map((s) => s.trim())
      current = { lesson: { id, title, minutes: Number(minutes) || 5, blocks: [] }, lines: [] }
      continue
    }
    current?.lines.push(line)
  }
  close()
  return unit
}
