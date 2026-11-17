export type Callout = 'rem' | 'say' | 'warn' | 'senior'
export type Card = { id: string; q: string; a: string }

export type Block =
  | { t: 'p'; text: string }
  | { t: 'h'; text: string }
  | { t: 'list'; ordered: boolean; items: string[] }
  | { t: 'callout'; kind: Callout; text: string }
  | { t: 'file'; text: string }
  | { t: 'code'; lang: string; code: string; file?: string }
  | { t: 'flow'; text: string }
  | { t: 'table'; head: string[]; rows: string[][] }
  | { t: 'cards'; cards: Card[] }
  | { t: 'quiz'; id: string; q: string; options: string[]; answer: number; why: string }
  | { t: 'cloze'; id: string; prompt: string; lang: string; code: string }
  | { t: 'speak'; id: string; seconds: number; prompt: string; points: string[] }
  | { t: 'write'; id: string; lang: string; prompt: string; solution: string; points: string[] }
  | { t: 'exercise'; id: string; title: string; prompt: string[]; starter: string; solution: string; tests: string; hints: string[] }
  | { t: 'qa'; id: string; cat: string; q: string; key: string; say: string; note?: string }

export type CheckBlock = Extract<Block, { t: 'quiz' | 'cloze' | 'speak' | 'write' | 'exercise' }>
export type QaBlock = Extract<Block, { t: 'qa' }>

export type Lesson = { id: string; title: string; minutes: number; blocks: Block[] }
export type Unit = { id: string; level: string; title: string; goal: string; lessons: Lesson[] }

// Lo mínimo para pintar el mapa de unidades sin mandar todo el contenido.
export type LessonOutline = { id: string; title: string; minutes: number; checks: string[]; cards: string[] }
export type UnitOutline = { id: string; level: string; title: string; goal: string; lessons: LessonOutline[] }

export type DeckCard = Card & { lessonId: string; lessonTitle: string }
export type DeckQa = QaBlock & { lessonId: string; lessonTitle: string }

export type ProgressRow = { status: string; data?: Record<string, unknown> | null; updatedAt: string }
export type ProgressMap = Record<string, ProgressRow>

export const isCheck = (b: Block): b is CheckBlock => ['quiz', 'cloze', 'speak', 'write', 'exercise'].includes(b.t)
