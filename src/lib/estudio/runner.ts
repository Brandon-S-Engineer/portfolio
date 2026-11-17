'use client'

// Corre el código del ejercicio contra sus pruebas dentro de un Web Worker:
// no toca la página y, si se cicla, se corta a los 4 segundos.

export type TestResult = { name: string; pass: boolean; error?: string }
export type RunResult = { results: TestResult[]; logs: string[]; fatal?: string }

const WORKER = `
const fmt = (v) => { try { return typeof v === 'string' ? JSON.stringify(v) : typeof v === 'function' ? '[function]' : JSON.stringify(v) ?? String(v) } catch { return String(v) } }
const same = (a, b) => {
  if (Object.is(a, b)) return true
  if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  const ka = Object.keys(a), kb = Object.keys(b)
  return ka.length === kb.length && ka.every((k) => same(a[k], b[k]))
}
self.onmessage = async (e) => {
  const logs = [], queue = [], results = []
  const console = { log: (...a) => logs.push(a.map(fmt).join(' ')), error: (...a) => logs.push(a.map(fmt).join(' ')) }
  const test = (name, fn) => queue.push({ name, fn })
  const eq = (got, want) => { if (!same(got, want)) throw new Error('esperaba ' + fmt(want) + ', recibí ' + fmt(got)) }
  const ok = (v, msg) => { if (!v) throw new Error(msg || 'esperaba un valor verdadero') }
  const near = (got, want, tol = 1e-6) => { if (typeof got !== 'number' || Math.abs(got - want) > tol) throw new Error('esperaba ≈ ' + want + ', recibí ' + fmt(got)) }
  const throws = async (fn) => { try { await fn() } catch { return } throw new Error('esperaba un error y no lo hubo') }
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  try {
    new Function('test', 'eq', 'ok', 'near', 'throws', 'sleep', 'console', e.data.code + '\\n;' + e.data.tests)(test, eq, ok, near, throws, sleep, console)
  } catch (err) { self.postMessage({ results, logs, fatal: String(err) }); return }
  for (const t of queue) {
    try { await t.fn(); results.push({ name: t.name, pass: true }) }
    catch (err) { results.push({ name: t.name, pass: false, error: err && err.message ? err.message : String(err) }) }
  }
  self.postMessage({ results, logs })
}
`

export function runTests(code: string, tests: string, timeoutMs = 4000): Promise<RunResult> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(new Blob([WORKER], { type: 'text/javascript' }))
    const worker = new Worker(url)
    const done = (r: RunResult) => { clearTimeout(timer); worker.terminate(); URL.revokeObjectURL(url); resolve(r) }
    const timer = setTimeout(() => done({ results: [], logs: [], fatal: 'Se pasó de 4 segundos. ¿Hay un ciclo que no termina?' }), timeoutMs)
    worker.onmessage = (e) => done(e.data as RunResult)
    worker.onerror = (e) => done({ results: [], logs: [], fatal: e.message })
    worker.postMessage({ code, tests })
  })
}
