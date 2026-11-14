// Corridas reales, guardadas. Cada demo del home abre mostrando una de estas en
// vez de un panel vacío, para que la prueba se vea sin hacer clic; desde ahí se
// invita a correrla en vivo. Son la salida tal cual de los sistemas (capturada
// el 14 de noviembre de 2026), no texto escrito a mano: si cambia un prompt o
// un modelo, vuelve a capturarlas.

import type { Msg, TraceEvent } from '@/components/site/company-agent-demo'
import type { Action, Qualification } from '@/components/site/lead-agent-demo'
import type { StepState } from '@/components/site/resale/resale-workbench'
import type { AgentId, DeskResult } from '@/lib/resale/types'

// 01 · Answer — POST /api/agent-demo
const ANSWER_Q = 'Where is order VM-1002? My email is luis@example.com'
const ANSWER_A = 'Your order VM-1002 has been shipped via DHL. The tracking number is DHL8820145567. It is an iPhone 15, 128GB, Black.'

export const answerRun: { messages: Msg[]; trace: TraceEvent[] } = {
  messages: [
    { role: 'user', content: ANSWER_Q },
    { role: 'assistant', content: ANSWER_A },
  ],
  trace: [
    { type: 'llm', step: 0, ms: 1602, input: 399, output: 25 },
    { type: 'tool_call', id: 'recorded-1', name: 'get_order', args: '{"order_id":"VM-1002","email":"luis@example.com"}' },
    {
      type: 'tool_result',
      id: 'recorded-1',
      name: 'get_order',
      ms: 1120,
      sql: 'SELECT o.id, o.status, o.total_mxn, o.created_at, o.shipped_at, o.carrier, o.tracking, p.model, p.storage_gb, p.color\nFROM agent_demo.orders o JOIN agent_demo.products p ON p.sku = o.sku\nWHERE o.id = $1 AND lower(o.customer_email) = lower($2)',
      preview: '{"id":"VM-1002","status":"shipped","carrier":"DHL","tracking":"DHL8820145567","model":"iPhone 15","storage_gb":128,"color":"Black"}',
    },
    { type: 'llm', step: 1, ms: 945, input: 522, output: 37 },
    {
      type: 'answer',
      content: ANSWER_A,
      sources: [],
      model: 'gpt-4.1-mini',
      ms: 3667,
      tokens: { input: 921, output: 62 },
      cost_usd: 0.0004676,
    },
  ],
}

// 02 · Act — POST {lead-agent}/leads, detenida en la aprobación humana.
const LEAD_REPLY =
  'Hola Carlos, tenemos el iPhone 15 Pro de 256GB en color Natural Titanium por 18,999 MXN, justo dentro de tu presupuesto. Aceptamos tu iPhone 12 a cuenta, pero el valor se confirma tras la inspección y se aplica como crédito en tienda. Podemos enviarlo esta semana con envío express si haces el pago antes de las 2 pm. ¿Quieres que te reserve uno para que puedas hacer la inspección y compra?'

export const leadRun: {
  model: string
  qualification: Qualification
  reply: string
  actions: Action[]
  // Milisegundos por nodo.
  times: Record<string, number>
} = {
  model: 'gpt-4.1-mini',
  qualification: {
    intent: 'buy',
    score: 85,
    urgency: 'this_month',
    budget_mxn: 19000,
    summary:
      'Customer wants to buy an iPhone 15 Pro with a budget of 19,000 MXN, needs it this week, and offers an iPhone 12 as trade-in.',
  },
  reply: LEAD_REPLY,
  actions: [
    {
      tool: 'upsert_contact',
      args: { contact_key: 'carlos@example.com', name: 'Carlos', interest: 'iPhone 15 Pro', budget_mxn: 19000, score: 85, source: 'whatsapp' },
      why: 'Update contact with current interest, budget, and score.',
    },
    {
      tool: 'update_stage',
      args: { contact_key: 'carlos@example.com', stage: 'quoted', reason: "Drafted reply includes a price quote within the customer's budget." },
      why: 'Move contact to quoted stage due to price mention in reply.',
    },
    {
      tool: 'log_activity',
      args: { contact_key: 'carlos@example.com', note: LEAD_REPLY, kind: 'message' },
      why: 'Log the drafted reply as a message activity.',
    },
    {
      tool: 'schedule_followup',
      args: { contact_key: 'carlos@example.com', due_in_hours: 48, note: 'Follow up with Carlos regarding iPhone 15 Pro purchase and trade-in offer.' },
      why: 'Schedule follow-up due to urgency being this_month.',
    },
  ],
  times: { qualify: 2598, lookup: 965, draft_reply: 1908, propose_actions: 2786 },
}

// 03 · Decide — POST /api/resale-desk
const DEAL_REASONING = [
  'Listing price 3800 MXN is above maxBuy 3100 MXN but within 15% range.',
  'Risk is medium due to price below market and carrier-unlocked status.',
  'Expected resale price is 5200 MXN with medium demand and 6 days to sell.',
]
const DEAL_OFFER = 'Hola, ¿sigue disponible el iPhone 12? Te puedo ofrecer 3100 MXN.'

export const dealRun: {
  steps: Partial<Record<AgentId, StepState>>
  final: { result: DeskResult; ms: number; tokens: number; cost: number | null }
} = {
  steps: {
    parse: { status: 'done', ms: 14, output: { model: 'iPhone 12', storage: '128 GB', price: 3800, confidence: 1 } },
    spec: { status: 'skipped', note: 'Parser was confident — no LLM call needed.' },
    comps: {
      status: 'done',
      ms: 383,
      output: { scope: 'exact config', n: 13, p25: 5000, p50: 5600, p75: 5600, gone: 2, medianDaysToSell: 6, ceiling: 4100 },
    },
    market: {
      status: 'done',
      ms: 1700,
      tokens: 342,
      output: {
        expectedSale: 5200,
        daysToSell: 6,
        demand: 'medium',
        summary:
          'The expected resale price for this iPhone 12 128GB is around 5200 MXN, which is below the median due to the current listing price. With 2 out of 10 comps sold recently, demand is medium and median days to sell is 6.',
      },
    },
    risk: {
      status: 'done',
      ms: 693,
      tokens: 297,
      output: {
        risk: 'medium',
        flags: ['price-below-market', 'carrier-unlocked'],
        haircutPct: 15,
        summary: 'Price is significantly below market and phone is carrier-unlocked, indicating moderate risk.',
      },
    },
    lead: { status: 'done', ms: 1120, tokens: 539, output: { verdict: 'NEGOTIATE', reasoning: DEAL_REASONING, offerMessage: DEAL_OFFER } },
  },
  final: {
    ms: 3220,
    tokens: 1178,
    cost: 0.0007256,
    result: {
      verdict: 'NEGOTIATE',
      title: 'iPhone 12 128 GB LIBERADO OFERTA $3,800',
      model: 'iPhone 12',
      price: 3800,
      maxBuy: 3100,
      expectedSale: 5200,
      margin: 2100,
      daysToSell: 6,
      reasoning: DEAL_REASONING,
      offerMessage: DEAL_OFFER,
      guardrail: null,
    },
  },
}
