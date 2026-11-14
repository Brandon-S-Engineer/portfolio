// Corridas reales, guardadas. Cada demo del home abre mostrando una de estas en
// vez de un panel vacío, para que la prueba se vea sin hacer clic; desde ahí se
// invita a correrla en vivo. Son la salida tal cual de los sistemas, una por
// idioma (capturadas el 14 y 15 de noviembre de 2026), no texto escrito a mano:
// si cambia un prompt o un modelo, vuelve a capturarlas.

import type { Msg, TraceEvent } from '@/components/site/company-agent-demo'
import type { Action, Qualification } from '@/components/site/lead-agent-demo'
import type { StepState } from '@/components/site/resale/resale-workbench'
import type { AgentId, DeskResult } from '@/lib/resale/types'
import type { Locale } from '@/lib/site/locale'

type AnswerRun = { messages: Msg[]; trace: TraceEvent[] }
type LeadRun = {
  model: string
  qualification: Qualification
  reply: string
  actions: Action[]
  times: Record<string, number>
}
type DealRun = {
  steps: Partial<Record<AgentId, StepState>>
  final: {
    result: DeskResult
    ms: number
    tokens: number
    cost: number | null
  }
}

// 01 · Answer — POST /api/agent-demo
const ANSWER_Q = 'Where is order VM-1002? My email is luis@example.com'
const ANSWER_A = 'Your order VM-1002 has been shipped via DHL. The tracking number is DHL8820145567. It is an iPhone 15, 128GB, Black.'

export const answerRun: Record<Locale, AnswerRun> = {
  en: {
    messages: [
      { role: 'user', content: ANSWER_Q },
      { role: 'assistant', content: ANSWER_A },
    ],
    trace: [
      { type: 'llm', step: 0, ms: 1602, input: 399, output: 25 },
      {
        type: 'tool_call',
        id: 'recorded-1',
        name: 'get_order',
        args: '{"order_id":"VM-1002","email":"luis@example.com"}',
      },
      {
        type: 'tool_result',
        id: 'recorded-1',
        name: 'get_order',
        ms: 1120,
        sql: 'SELECT o.id, o.status, o.total_mxn, o.created_at, o.shipped_at, o.carrier, o.tracking, p.model, p.storage_gb, p.color\nFROM agent_demo.orders o JOIN agent_demo.products p ON p.sku = o.sku\nWHERE o.id = $1 AND lower(o.customer_email) = lower($2)',
        preview:
          '{"id":"VM-1002","status":"shipped","carrier":"DHL","tracking":"DHL8820145567","model":"iPhone 15","storage_gb":128,"color":"Black"}',
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
  },
  es: {
    messages: [
      {
        role: 'user',
        content: '¿Dónde está mi pedido VM-1002? Mi correo es luis@example.com',
      },
      {
        role: 'assistant',
        content:
          'Tu pedido VM-1002 fue enviado el 25 de octubre de 2026 a través de DHL. El número de seguimiento es DHL8820145567. ¿Quieres que te ayude con algo más?',
      },
    ],
    trace: [
      {
        type: 'llm',
        step: 0,
        ms: 1652,
        input: 401,
        output: 25,
      },
      {
        type: 'tool_call',
        id: 'recorded-1',
        name: 'get_order',
        args: '{"order_id":"VM-1002","email":"luis@example.com"}',
      },
      {
        type: 'tool_result',
        id: 'recorded-1',
        name: 'get_order',
        ms: 89,
        sql: 'SELECT o.id, o.status, o.total_mxn, o.created_at, o.shipped_at, o.carrier, o.tracking, p.model, p.storage_gb, p.color\nFROM agent_demo.orders o JOIN agent_demo.products p ON p.sku = o.sku\nWHERE o.id = $1 AND lower(o.customer_email) = lower($2)',
        preview:
          '{"id":"VM-1002","status":"shipped","total_mxn":12999,"created_at":"2026-10-24T00:00:00.000Z","shipped_at":"2026-10-25T00:00:00.000Z","carrier":"DHL","tracking":"DHL8820145567","model":"iPhone 15","storage_gb":128,"color":"Black"}',
      },
      {
        type: 'llm',
        step: 1,
        ms: 1079,
        input: 524,
        output: 44,
      },
      {
        type: 'answer',
        content:
          'Tu pedido VM-1002 fue enviado el 25 de octubre de 2026 a través de DHL. El número de seguimiento es DHL8820145567. ¿Quieres que te ayude con algo más?',
        sources: [],
        model: 'gpt-4.1-mini',
        ms: 2820,
        tokens: {
          input: 925,
          output: 69,
        },
        cost_usd: 0.00048039999999999997,
      },
    ] as TraceEvent[],
  },
}

// 02 · Act — POST {lead-agent}/leads, detenida en la aprobación humana.
export const leadRun: Record<Locale, LeadRun> = {
  en: {
    model: 'gpt-4.1-mini',
    qualification: {
      intent: 'buy',
      budget_mxn: 19000,
      urgency: 'now',
      score: 85,
      summary:
        'Customer wants to buy an iPhone 15 Pro with a budget of 19k MXN, needs it this week, and asks about trading in an iPhone 12.',
    },
    reply:
      'Hi Carlos! We have the iPhone 15 Pro 256GB in Natural Titanium for 18,999 MXN, which fits your budget. We do accept trade-ins for iPhone 12 devices, as long as they power on and are unlocked from iCloud; the value is confirmed after inspection and applied as store credit. We offer same-day shipping if you order before 2 pm. Would you like me to reserve one for you today?',
    actions: [
      {
        tool: 'upsert_contact',
        args: {
          contact_key: 'carlos@example.com',
          name: 'Carlos',
          interest: 'iPhone 15 Pro',
          budget_mxn: 19000,
          score: 85,
          source: 'whatsapp',
        },
        why: "Updating contact with name, interest, budget, and score based on customer's intent and details.",
      },
      {
        tool: 'update_stage',
        args: {
          contact_key: 'carlos@example.com',
          stage: 'quoted',
          reason: "Provided price information for iPhone 15 Pro within customer's budget.",
        },
        why: 'Moving contact to quoted stage because the reply includes a price.',
      },
      {
        tool: 'log_activity',
        args: {
          contact_key: 'carlos@example.com',
          note: 'Hi Carlos! We have the iPhone 15 Pro 256GB in Natural Titanium for 18,999 MXN, which fits your budget. We do accept trade-ins for iPhone 12 devices, as long as they power on and are unlocked from iCloud; the value is confirmed after inspection and applied as store credit. We offer same-day shipping if you order before 2 pm. Would you like me to reserve one for you today?',
          kind: 'message',
        },
        why: "Logging the drafted reply as a message in the contact's timeline.",
      },
      {
        tool: 'schedule_followup',
        args: {
          contact_key: 'carlos@example.com',
          due_in_hours: 24,
          note: 'Follow up on reservation and trade-in details as customer needs the phone this week.',
        },
        why: "Scheduling follow-up due to customer's urgency being 'now'.",
      },
    ],
    times: {
      qualify: 2430,
      lookup: 915,
      draft_reply: 1146,
      propose_actions: 2663,
    },
  },
  es: {
    model: 'gpt-4.1-mini',
    qualification: {
      intent: 'buy',
      budget_mxn: 19000,
      urgency: 'this_month',
      score: 85,
      summary:
        'Cliente busca un iPhone 15 Pro con un presupuesto de 19,000 MXN, lo necesita esta semana y pregunta por aceptar un iPhone 12 a cuenta.',
    },
    reply:
      'Hola Carlos, tenemos el iPhone 15 Pro de 256GB en color Natural Titanium por 18,999 MXN, justo dentro de tu presupuesto. Aceptamos tu iPhone 12 a cuenta, siempre que encienda y esté desbloqueado para confirmar su valor tras inspección. Ofrecemos envío el mismo día si haces el pago antes de las 2 pm. ¿Quieres que te reserve uno para entrega esta semana?',
    actions: [
      {
        tool: 'upsert_contact',
        args: {
          contact_key: 'carlos@example.com',
          name: 'Carlos',
          interest: 'iPhone 15 Pro',
          budget_mxn: 19000,
          score: 85,
          source: 'whatsapp',
        },
        why: 'Actualizar o crear contacto con interés, presupuesto y puntuación.',
      },
      {
        tool: 'update_stage',
        args: {
          contact_key: 'carlos@example.com',
          stage: 'quoted',
          reason: 'Se proporcionó un precio en la respuesta.',
        },
        why: 'Mover a etapa cotizada porque se mencionó un precio en la respuesta.',
      },
      {
        tool: 'log_activity',
        args: {
          contact_key: 'carlos@example.com',
          note: 'Hola Carlos, tenemos el iPhone 15 Pro de 256GB en color Natural Titanium por 18,999 MXN, justo dentro de tu presupuesto. Aceptamos tu iPhone 12 a cuenta, siempre que encienda y esté desbloqueado para confirmar su valor tras inspección. Ofrecemos envío el mismo día si haces el pago antes de las 2 pm. ¿Quieres que te reserve uno para entrega esta semana?',
          kind: 'message',
        },
        why: 'Registrar el mensaje enviado al cliente.',
      },
      {
        tool: 'schedule_followup',
        args: {
          contact_key: 'carlos@example.com',
          due_in_hours: 168,
          note: 'Seguimiento para confirmar reserva y entrega esta semana.',
        },
        why: 'El cliente tiene urgencia para este mes, se programa seguimiento.',
      },
    ],
    times: {
      qualify: 2140,
      lookup: 877,
      draft_reply: 1027,
      propose_actions: 2167,
    },
  },
}

// 03 · Decide — POST /api/resale-desk
export const dealRun: Record<Locale, DealRun> = {
  en: {
    steps: {
      parse: {
        status: 'done',
        ms: 3,
        output: {
          model: 'iPhone 12',
          storage: '128 GB',
          price: 3800,
          confidence: 1,
        },
      },
      spec: {
        status: 'skipped',
        note: 'Parser was confident — no LLM call needed.',
      },
      comps: {
        status: 'done',
        ms: 11,
        output: {
          scope: 'exact config',
          n: 13,
          p25: 5000,
          p50: 5600,
          p75: 5600,
          gone: 2,
          medianDaysToSell: 6,
          activeNow: 8,
          discountVsP25: 24,
          marginTarget: 1500,
          ceiling: 4100,
        },
      },
      market: {
        status: 'done',
        ms: 939,
        tokens: 343,
        output: {
          expectedSale: 5200,
          daysToSell: 6,
          demand: 'medium',
          summary:
            'The expected resale price for this iPhone 12 128GB is around MXN 5200, which is below the median but above the 25th percentile. With 2 out of 10 listings sold recently, demand is medium and median days to sell is 6.',
        },
      },
      risk: {
        status: 'done',
        ms: 834,
        tokens: 291,
        output: {
          risk: 'low',
          flags: ['unlocked'],
          haircutPct: 5,
          summary: 'The iPhone 12 is unlocked and priced moderately below market, presenting low risk.',
        },
      },
      lead: {
        status: 'done',
        ms: 1114,
        tokens: 536,
        output: {
          verdict: 'NEGOTIATE',
          reasoning: [
            'Listing price MXN 3800 is about 8.5% above maxBuy MXN 3500.',
            'Risk is low, so no major concerns about device condition.',
            'Expected resale price MXN 5200 supports a reasonable margin at MXN 3500 offer.',
          ],
          offerMessage: "Hi! Is the iPhone 12 still available? I can offer MXN 3500 if you're interested.",
        },
      },
    },
    final: {
      ms: 2069,
      tokens: 1170,
      cost: 0.0007188,
      result: {
        verdict: 'NEGOTIATE',
        title: 'iPhone 12 128GB unlocked, great deal $3,800',
        model: 'iPhone 12',
        price: 3800,
        maxBuy: 3500,
        expectedSale: 5200,
        margin: 1700,
        daysToSell: 6,
        reasoning: [
          'Listing price MXN 3800 is about 8.5% above maxBuy MXN 3500.',
          'Risk is low, so no major concerns about device condition.',
          'Expected resale price MXN 5200 supports a reasonable margin at MXN 3500 offer.',
        ],
        offerMessage: "Hi! Is the iPhone 12 still available? I can offer MXN 3500 if you're interested.",
        guardrail: null,
      },
    },
  } as DealRun,
  es: {
    steps: {
      parse: {
        status: 'done',
        ms: 15,
        output: {
          model: 'iPhone 12',
          storage: '128 GB',
          price: 3800,
          confidence: 1,
        },
      },
      spec: {
        status: 'skipped',
        note: 'El parser estaba seguro, no hizo falta llamar al LLM.',
      },
      comps: {
        status: 'done',
        ms: 251,
        output: {
          scope: 'configuración exacta',
          n: 13,
          p25: 5000,
          p50: 5600,
          p75: 5600,
          gone: 2,
          medianDaysToSell: 6,
          activeNow: 8,
          discountVsP25: 24,
          marginTarget: 1500,
          ceiling: 4100,
        },
      },
      market: {
        status: 'done',
        ms: 1245,
        tokens: 351,
        output: {
          expectedSale: 5000,
          daysToSell: 6,
          demand: 'medium',
          summary:
            'El precio esperado de venta para este iPhone 12 de 128GB es de 5000 MXN, basado en el percentil 25 de los comparables. La demanda es media, con 2 unidades vendidas y 8 activas, y un tiempo medio de venta de 6 días.',
        },
      },
      risk: {
        status: 'done',
        ms: 882,
        tokens: 300,
        output: {
          risk: 'medium',
          flags: ['precio bajo', 'liberado'],
          haircutPct: 15,
          summary: 'El precio está significativamente por debajo del mercado y aunque está liberado, esto puede indicar riesgo moderado.',
        },
      },
      lead: {
        status: 'done',
        ms: 1229,
        tokens: 546,
        output: {
          verdict: 'NEGOTIATE',
          reasoning: [
            'Precio listado 3800 MXN, por encima del máximo de compra 3000 MXN pero dentro del 15%.',
            'Riesgo medio debido a precio bajo y condición liberado.',
            'Demanda media con tiempo de venta esperado de 6 días.',
          ],
          offerMessage: '¿Todavía tienes disponible el iPhone 12? Te puedo ofrecer 3000 MXN por él.',
        },
      },
    },
    final: {
      ms: 2740,
      tokens: 1197,
      cost: 0.0007416,
      result: {
        verdict: 'NEGOTIATE',
        title: 'iPhone 12 128 GB LIBERADO OFERTA $3,800',
        model: 'iPhone 12',
        price: 3800,
        maxBuy: 3000,
        expectedSale: 5000,
        margin: 2000,
        daysToSell: 6,
        reasoning: [
          'Precio listado 3800 MXN, por encima del máximo de compra 3000 MXN pero dentro del 15%.',
          'Riesgo medio debido a precio bajo y condición liberado.',
          'Demanda media con tiempo de venta esperado de 6 días.',
        ],
        offerMessage: '¿Todavía tienes disponible el iPhone 12? Te puedo ofrecer 3000 MXN por él.',
        guardrail: null,
      },
    },
  } as DealRun,
}
