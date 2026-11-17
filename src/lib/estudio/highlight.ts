// Resaltado de sintaxis mínimo (sin dependencias) para ts/js, python, sql y
// json. Además reconoce «marcas»: lo que va entre « » es la parte clave del
// snippet y se pinta en negritas con fondo.

export type Tok = { text: string; cls: string; mark: boolean }

const KW_TS = 'const|let|var|function|return|if|else|for|while|of|in|await|async|new|try|catch|finally|throw|import|export|from|as|type|interface|class|extends|default|switch|case|break|continue|typeof|null|undefined|true|false|this|satisfies|yield'
const KW_PY = 'def|class|return|if|elif|else|for|while|in|not|and|or|is|None|True|False|import|from|as|with|async|await|try|except|finally|raise|pass|continue|break|lambda|yield'
const KW_SQL = 'SELECT|FROM|WHERE|AND|OR|NOT|ORDER|BY|GROUP|HAVING|LIMIT|JOIN|LEFT|RIGHT|INNER|OUTER|ON|AS|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|INDEX|TABLE|USING|IN|IS|NULL|LIKE|ILIKE|COUNT|SUM|AVG|MIN|MAX|DISTINCT|DESC|ASC|BEGIN|COMMIT|CONFLICT|DO|RETURNING|UNIQUE|PRIMARY|KEY|EXISTS|CASE|WHEN|THEN|ELSE|END|WITH|INTERVAL'

type Rule = [cls: string, re: string]
const NUM: Rule = ['num', String.raw`\b\d[\d_]*(?:\.\d+)?\b`]
const RULES: Record<string, { rules: Rule[]; flags: string }> = {
  ts: {
    flags: 'gm',
    rules: [
      ['com', String.raw`(?<=^|\s)\/\/[^\n]*|\/\*[\s\S]*?\*\/`],
      ['str', String.raw`'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|` + '`(?:\\\\.|[^`\\\\])*`'],
      ['kw', String.raw`\b(?:${KW_TS})\b`],
      NUM,
      ['typ', String.raw`\b[A-Z][A-Za-z0-9]*[a-z][A-Za-z0-9]*\b`],
      ['fn', String.raw`\b[A-Za-z_$][\w$]*(?=\s*\()`],
    ],
  },
  py: {
    flags: 'gm',
    rules: [
      ['com', String.raw`#[^\n]*`],
      ['str', String.raw`"""[\s\S]*?"""|f?"(?:\\.|[^"\\\n])*"|f?'(?:\\.|[^'\\\n])*'`],
      ['dec', String.raw`^\s*@[\w.]+`],
      ['kw', String.raw`\b(?:${KW_PY})\b`],
      NUM,
      ['typ', String.raw`\b[A-Z][A-Za-z0-9]*[a-z][A-Za-z0-9]*\b`],
      ['fn', String.raw`\b[A-Za-z_][\w]*(?=\s*\()`],
    ],
  },
  sql: {
    flags: 'gmi',
    rules: [
      ['com', String.raw`--[^\n]*`],
      ['str', String.raw`'(?:''|[^'\n])*'`],
      ['num', String.raw`\$\d+|\b\d+(?:\.\d+)?\b`],
      ['kw', String.raw`\b(?:${KW_SQL})\b`],
      ['fn', String.raw`\b[a-z_][\w]*(?=\s*\()`],
    ],
  },
  json: {
    flags: 'gm',
    rules: [
      ['com', String.raw`(?<=^|\s)\/\/[^\n]*`],
      ['typ', String.raw`"(?:\\.|[^"\\\n])*"(?=\s*:)`],
      ['str', String.raw`"(?:\\.|[^"\\\n])*"`],
      ['kw', String.raw`\b(?:true|false|null|POST|GET|PUT|DELETE)\b`],
      NUM,
    ],
  },
}
const ALIAS: Record<string, string> = { js: 'ts', tsx: 'ts', python: 'py', http: 'json', ndjson: 'json' }

const compiled: Record<string, { re: RegExp; classes: string[] }> = {}
function grammar(lang: string) {
  const name = ALIAS[lang] ?? lang
  const g = RULES[name]
  if (!g) return null
  return (compiled[name] ??= { re: new RegExp(g.rules.map(([, r]) => `(${r})`).join('|'), g.flags), classes: g.rules.map(([c]) => c) })
}

/** Devuelve el código ya partido en líneas de tokens. */
export function highlight(source: string, lang: string): Tok[][] {
  // 1. Quitar las marcas « » y recordar qué rangos cubrían.
  let code = ''
  const marks: [number, number][] = []
  let open = -1
  for (const ch of source) {
    if (ch === '«') open = code.length
    else if (ch === '»') { if (open >= 0) marks.push([open, code.length]); open = -1 }
    else code += ch
  }
  const marked = (i: number) => marks.some(([a, b]) => i >= a && i < b)

  // 2. Tokens de sintaxis sobre el texto limpio.
  const spans: { start: number; end: number; cls: string }[] = []
  const g = grammar(lang)
  if (g) {
    g.re.lastIndex = 0
    for (let m = g.re.exec(code); m; m = g.re.exec(code)) {
      if (!m[0]) { g.re.lastIndex++; continue }
      const k = m.slice(1).findIndex((x) => x !== undefined)
      spans.push({ start: m.index, end: m.index + m[0].length, cls: g.classes[k] })
    }
  }

  // 3. Recorrer carácter por carácter agrupando por (clase, marca) y cortando en saltos de línea.
  const lines: Tok[][] = [[]]
  let si = 0
  let cur: Tok | null = null
  for (let i = 0; i < code.length; i++) {
    while (si < spans.length && spans[si].end <= i) si++
    const cls = si < spans.length && spans[si].start <= i ? spans[si].cls : ''
    const mark = marked(i)
    if (code[i] === '\n') { lines.push([]); cur = null; continue }
    if (!cur || cur.cls !== cls || cur.mark !== mark) { cur = { text: '', cls, mark }; lines[lines.length - 1].push(cur) }
    cur.text += code[i]
  }
  return lines
}

export const TOKEN_CLASS: Record<string, string> = {
  com: 'text-slate-500 dark:text-slate-400 italic',
  str: 'text-emerald-700 dark:text-emerald-300',
  kw: 'text-violet-700 dark:text-violet-300 font-semibold',
  num: 'text-amber-700 dark:text-amber-300',
  typ: 'text-sky-700 dark:text-sky-300',
  fn: 'text-blue-700 dark:text-blue-300',
  dec: 'text-pink-700 dark:text-pink-300',
}
export const MARK_CLASS = 'font-bold bg-yellow-200/80 dark:bg-yellow-400/25 rounded-[3px] box-decoration-clone px-0.5 -mx-0.5'
