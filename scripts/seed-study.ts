// Carga el contenido de Estudio a la base. Uso:
//   npm run seed:study -- ~/Documents/interview-guide/study
// Cada archivo .md es una unidad; el prefijo numérico del nombre da el orden.
// Reemplaza todas las unidades (el progreso no se toca: vive en otra tabla).
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PrismaClient } from '@prisma/client'
import { parseUnit } from '../src/lib/estudio/parse'
import { isCheck } from '../src/lib/estudio/types'

const dir = process.argv[2]
if (!dir) { console.error('Falta la carpeta con los .md'); process.exit(1) }

const prisma = new PrismaClient()

async function main() {
  const files = readdirSync(dir).filter((f) => f.endsWith('.md')).sort()
  const seen = new Set<string>()
  const units = files.map((f, position) => {
    const source = readFileSync(join(dir, f), 'utf8')
    const unit = parseUnit(source)
    if (!unit || !unit.lessons.length) throw new Error(`${f}: no tiene @unit o lecciones`)
    for (const l of unit.lessons) {
      if (seen.has(l.id) || ['repaso', 'entrevista'].includes(l.id)) throw new Error(`${f}: id de lección repetido o reservado: ${l.id}`)
      seen.add(l.id)
      for (const b of l.blocks) {
        if (b.t === 'quiz' && (b.answer < 0 || !b.q)) throw new Error(`${l.id}: quiz sin pregunta o sin respuesta marcada con *`)
        if (b.t === 'exercise' && (!b.starter || !b.solution || !b.tests)) throw new Error(`${l.id}: ejercicio "${b.title}" incompleto`)
        if (b.t === 'qa' && (!b.q || !b.say)) throw new Error(`${l.id}: qa incompleta`)
        if (b.t === 'cloze' && !b.code.includes('[[')) throw new Error(`${l.id}: cloze sin huecos`)
      }
    }
    const count = (t: string) => unit.lessons.reduce((n, l) => n + l.blocks.filter((b) => b.t === t).length, 0)
    console.log(`${f.padEnd(26)} ${String(unit.lessons.length).padStart(2)} lecciones · ${unit.lessons.reduce((n, l) => n + l.blocks.filter(isCheck).length, 0)} ejercicios · ${count('qa')} preguntas`)
    return { id: unit.id, position, source }
  })
  await prisma.$transaction([prisma.studyUnit.deleteMany(), prisma.studyUnit.createMany({ data: units })])
  console.log(`Listo: ${units.length} unidades.`)
}

main().catch((e) => { console.error(e.message); process.exit(1) }).finally(() => prisma.$disconnect())
