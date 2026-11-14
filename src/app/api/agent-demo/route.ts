// Endpoint público del demo "Company Data Agent". Corre un loop de tool calling
// y transmite cada paso como NDJSON para que la UI muestre la traza en vivo:
// qué tool llamó, con qué argumentos, el SQL que ejecutó, las fuentes del RAG,
// tokens, costo y latencia.

import { z } from 'zod'
import { DEFAULT_MODEL, MODELS, chatStream, costUsd, type ChatMessage, type ModelId } from '@/lib/agent-demo/openai'
import { SYSTEM_PROMPT, toolSpecs } from '@/lib/agent-demo/specs'
import { runTool, type Source } from '@/lib/agent-demo/tools'

export const runtime = 'nodejs'
export const maxDuration = 60

const bodySchema = z.object({
  model: z.enum(Object.keys(MODELS) as [ModelId, ...ModelId[]]).default(DEFAULT_MODEL),
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().min(1).max(1000) }))
    .min(1)
    .max(12),
  // Solo cambia los mensajes de error; el agente ya responde en el idioma de la pregunta.
  lang: z.enum(['en', 'es']).default('en'),
})

const ERR = {
  en: {
    limit: 'Demo limit reached for this hour. Try again later.',
    steps: 'The agent took too many steps. Try a more specific question.',
    failed: 'The agent failed to answer. Please try again.',
  },
  es: {
    limit: 'Llegaste al límite de la demo por esta hora. Intenta más tarde.',
    steps: 'El agente necesitó demasiados pasos. Prueba con una pregunta más concreta.',
    failed: 'El agente no pudo responder. Intenta de nuevo.',
  },
}

// Límite por IP en memoria. En serverless es aproximado (por instancia), pero
// basta para que nadie queme los créditos de la API desde el portafolio.
const WINDOW_MS = 60 * 60 * 1000
const MAX_PER_WINDOW = 25
const hits = new Map<string, number[]>()

function rateLimited(ip: string) {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= MAX_PER_WINDOW) return true
  recent.push(now)
  hits.set(ip, recent)
  return false
}

const MAX_STEPS = 5

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'Invalid request' }, { status: 400 })
  const err = ERR[parsed.data.lang]
  if (rateLimited(ip)) return Response.json({ error: err.limit }, { status: 429 })

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: Record<string, unknown>) => controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'))
      const started = Date.now()
      const model = parsed.data.model
      const totals = { input: 0, output: 0 }
      const sources: Source[] = []
      const messages: ChatMessage[] = [{ role: 'system', content: SYSTEM_PROMPT }, ...parsed.data.messages]

      try {
        for (let step = 0; step < MAX_STEPS; step++) {
          const t0 = Date.now()
          const { message, usage } = await chatStream(model, messages, [...toolSpecs], (text) =>
            send({ type: 'delta', text }),
          )
          totals.input += usage.prompt_tokens
          totals.output += usage.completion_tokens
          send({ type: 'llm', step, ms: Date.now() - t0, input: usage.prompt_tokens, output: usage.completion_tokens })

          if (!message.tool_calls?.length) {
            send({
              type: 'answer',
              content: message.content ?? '',
              sources,
              model,
              ms: Date.now() - started,
              tokens: totals,
              cost_usd: costUsd(model, totals.input, totals.output),
            })
            controller.close()
            return
          }

          messages.push({ role: 'assistant', content: message.content, tool_calls: message.tool_calls })
          for (const call of message.tool_calls) {
            const t1 = Date.now()
            send({ type: 'tool_call', id: call.id, name: call.function.name, args: call.function.arguments })
            const out = await runTool(call.function.name, call.function.arguments)
            if (out.sources) sources.push(...out.sources.filter((s) => !sources.some((x) => x.id === s.id)))
            send({
              type: 'tool_result',
              id: call.id,
              name: call.function.name,
              ms: Date.now() - t1,
              sql: out.sql,
              sources: out.sources,
              rows: Array.isArray(out.result) ? out.result.length : undefined,
              preview: JSON.stringify(out.result).slice(0, 600),
            })
            messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(out.result) })
          }
        }
        send({ type: 'error', message: err.steps })
      } catch (e) {
        console.error('[agent-demo]', e)
        send({ type: 'error', message: err.failed })
      }
      controller.close()
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}
