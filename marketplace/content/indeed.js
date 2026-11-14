// ── Content script: Indeed (vacantes) ────────────────────────────────────────
//
// Manda al CRM las vacantes de la página de resultados y pinta en cada tarjeta
// el veredicto que calcula el servidor (el filtro #1 son los años de
// experiencia que piden).
//
//   - Lista de la izquierda: título, empresa, ubicación → se manda sola.
//   - Panel de la derecha: la descripción completa SOLO aparece al dar clic en
//     una vacante. Se captura cada vez que TÚ abres una.
//
// 100% pasivo: este script no hace clics ni navega. Indeed bloquea la página
// si detecta clics automáticos (probado el 13/11/2026).
//
// Selectores verificados el 13/11/2026 (usar data-testid; las clases css-xxxx cambian).

;(() => {
  if (window.__indeedCatcher) return
  window.__indeedCatcher = true

  const SEL = {
    card: '.job_seen_beacon',
    cardLink: 'a.jcs-JobTitle',
    cardJk: 'a[data-jk]',
    cardTitle: 'h2 span[title]',
    cardCompany: '[data-testid="company-name"]',
    cardLocation: '[data-testid="text-location"]',
    cardSnippet: '[data-testid="attribute_snippet_testid"]',
    paneTitle: '[data-testid="vj-job-title"]',
    paneCompany: '[data-testid="company-info-metadata"]',
    paneDetails: '[data-testid="structured-job-summary"]',
    paneDescription: '[data-testid="viewjob-job-content"]',
  }
  const COLORS = { APLICAR: '#16a34a', ESTIRAR: '#d97706', DESCARTAR: '#dc2626', PENDIENTE: '#6b7280' }
  const LABELS = { APLICAR: 'Aplicar', ESTIRAR: 'Estirar', DESCARTAR: 'Descartar', PENDIENTE: 'Falta leer' }

  const sentCards = new Set() // jk ya enviado como tarjeta
  const sentFull = new Set() // jk ya enviado con descripción
  const verdicts = new Map() // jk → { verdict, score, expYears, estado }
  const full = new Map() // jk → vacante completa (con descripción) para copiarla
  let queue = []
  let flushTimer = null
  let lastError = null

  const log = (...a) => console.log('%c[Vacantes]', 'color:#16a34a;font-weight:600', ...a)
  const text = (root, sel) => root.querySelector(sel)?.innerText.replace(/\s+/g, ' ').trim() || undefined
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  const jobUrl = (jk) => `${location.origin}/viewjob?jk=${jk}`

  // ── Lectura ────────────────────────────────────────────────────────────────

  function readCard(card) {
    const jk = card.querySelector(SEL.cardJk)?.getAttribute('data-jk')
    const title = card.querySelector(SEL.cardTitle)?.getAttribute('title') || text(card, SEL.cardLink)
    if (!jk || !title) return null
    const snippets = [...card.querySelectorAll(SEL.cardSnippet)].map((e) => e.innerText.trim()).filter(Boolean)
    return {
      jk,
      posting: {
        externalId: `indeed_${jk}`,
        url: jobUrl(jk),
        title,
        company: text(card, SEL.cardCompany),
        location: text(card, SEL.cardLocation),
        snippet: snippets.join(' · ') || undefined,
      },
    }
  }

  function cardByJk(jk) {
    return document.querySelector(`${SEL.cardJk}[data-jk="${jk}"]`)?.closest(SEL.card) ?? null
  }

  // La vacante abierta en el panel. El jk sale de la URL (?vjk= en la lista,
  // ?jk= en /viewjob); se confirma con el título para no leer el panel anterior
  // mientras el nuevo todavía carga.
  function readPane() {
    const titleEl = document.querySelector(SEL.paneTitle)
    const description = document.querySelector(SEL.paneDescription)?.innerText.trim()
    if (!titleEl || !description) return null
    const params = new URLSearchParams(location.search)
    const jk = params.get('vjk') || params.get('jk')
    if (!jk) return null
    const paneTitle = titleEl.innerText.replace(/\s*-\s*job post\s*$/i, '').replace(/\s+/g, ' ').trim()
    const card = cardByJk(jk)
    const fromCard = card ? readCard(card)?.posting : null
    if (fromCard && !paneTitle.toLowerCase().includes(fromCard.title.toLowerCase().slice(0, 25))) return null
    return {
      jk,
      posting: {
        ...(fromCard ?? { externalId: `indeed_${jk}`, url: jobUrl(jk) }),
        title: fromCard?.title ?? paneTitle,
        company: fromCard?.company ?? text(document, SEL.paneCompany),
        details: text(document, SEL.paneDetails),
        description: description.slice(0, 29000),
      },
    }
  }

  // ── Escaneo y envío ────────────────────────────────────────────────────────

  function scan() {
    for (const card of document.querySelectorAll(SEL.card)) {
      const c = readCard(card)
      if (!c) continue
      paint(card, c.jk)
      if (sentCards.has(c.jk) || sentFull.has(c.jk)) continue
      sentCards.add(c.jk)
      queue.push(c.posting)
    }
    const pane = readPane()
    if (pane) full.set(pane.jk, pane.posting)
    if (pane && !sentFull.has(pane.jk)) {
      sentFull.add(pane.jk)
      queue.push(pane.posting)
    }
    if (queue.length && !flushTimer) flushTimer = setTimeout(flush, 1200)
    renderStatus()
  }

  async function flush() {
    flushTimer = null
    const batch = queue.splice(0, 100)
    if (!batch.length) return
    try {
      const res = await chrome.runtime.sendMessage({ type: 'JOBS_INGEST', payload: batch })
      if (!res?.ok) throw new Error(res?.error ?? 'Sin respuesta de la extensión')
      lastError = null
      for (const r of res.data.results ?? []) verdicts.set(r.externalId.replace(/^indeed_/, ''), r)
      log(`✓ ${batch.length} enviadas`, res.data)
    } catch (err) {
      lastError = err.message
      // Permitir reintento en el próximo escaneo
      for (const p of batch) {
        const jk = p.externalId.replace(/^indeed_/, '')
        if (p.description) sentFull.delete(jk)
        else sentCards.delete(jk)
      }
      log('✗ error enviando:', err.message)
    }
    scan()
  }

  // ── Veredicto pintado en cada tarjeta ──────────────────────────────────────

  const TAGS = { MASIVA: 'Publica en masa', SILENCIADA: 'Empresa silenciada', YA_APLICASTE: 'Ya aplicaste (republicada)' }

  function paint(card, jk) {
    const v = verdicts.get(jk)
    if (!v) return
    const sig = `${v.verdict}|${v.score}|${v.expYears}|${v.estado}|${v.tag}`
    if (card.dataset.vacSig === sig) return
    card.dataset.vacSig = sig
    const applied = v.estado === 'APLICADA'
    // Lo que no debe llamar la atención va en gris, no en rojo ni en verde.
    const quiet = v.tag || v.estado === 'DESCARTADA'
    const color = applied ? '#2563eb' : quiet ? '#9ca3af' : COLORS[v.verdict] ?? COLORS.PENDIENTE
    card.style.boxShadow = `inset 4px 0 0 ${color}`
    card.style.opacity = !applied && (quiet || v.verdict === 'DESCARTAR') ? '0.5' : ''

    let bar = card.querySelector('.vac-bar')
    if (!bar) {
      bar = document.createElement('div')
      bar.className = 'vac-bar'
      // Por encima del enlace "estirado" de Indeed, que cubre toda la tarjeta.
      bar.style.cssText = 'position:relative;z-index:2147483000;pointer-events:auto;display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:0 0 6px 0;font:600 11px/1.5 system-ui,sans-serif'
      bar.dataset.jk = jk
      card.prepend(bar)
    }
    const read = v.verdict === 'APLICAR' || v.verdict === 'ESTIRAR'
    const exp = v.expYears != null ? ` · piden ${v.expYears} año${v.expYears > 1 ? 's' : ''}` : read ? ' · sin mínimo de años' : ''
    const label = applied ? '✓ Ya aplicaste' : v.estado === 'DESCARTADA' ? 'La quitaste' : TAGS[v.tag] ?? `${LABELS[v.verdict] ?? v.verdict} · ${v.score}/10${exp}`
    const company = readCard(card)?.posting.company
    const btn = 'padding:2px 8px;border-radius:999px;border:1px solid #9ca3af;background:#fff;color:#374151;font:inherit;cursor:pointer'
    bar.innerHTML = `<span class="vac-badge" style="padding:2px 8px;border-radius:999px;color:#fff;background:${color}">${label}</span>
      <button data-act="copy" style="${btn}">Copiar para Claude</button>
      <button data-act="apply" style="${btn}">${applied ? 'Deshacer' : 'Ya apliqué'}</button>
      ${company ? `<button data-act="mute" style="${btn}">${v.tag === 'SILENCIADA' ? 'Reactivar empresa' : 'Silenciar empresa'}</button>` : ''}`
  }

  // Los clics en la barra NO deben abrir la vacante. Indeed escucha en la
  // tarjeta entera, así que se interceptan aquí, en la ventana y en fase de
  // captura (antes que cualquier listener de la página), y ahí mismo se
  // ejecuta el botón.
  for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click', 'auxclick']) {
    window.addEventListener(type, (e) => {
      const bar = e.target instanceof Element ? e.target.closest('.vac-bar') : null
      if (!bar) return
      e.stopImmediatePropagation()
      e.preventDefault()
      if (type !== 'click') return
      const act = e.target.closest('[data-act]')?.dataset.act
      const jk = bar.dataset.jk
      const v = verdicts.get(jk)
      if (!act || !v) return
      if (act === 'copy') return copyJob(jk, e.target.closest('[data-act]'))
      if (act === 'apply') action({ externalId: `indeed_${jk}`, estado: v.estado === 'APLICADA' ? 'NUEVA' : 'APLICADA' })
      const company = readCard(bar.closest(SEL.card))?.posting.company
      if (act === 'mute' && company) action({ company, mute: v.tag !== 'SILENCIADA' })
    }, true)
  }

  // ── Copiar la vacante para pegarla en Claude ───────────────────────────────

  function jobText(p, v) {
    return [
      'Analiza esta vacante con mi contexto: ¿encajo?, ¿qué debo destacar?, y ayúdame con las preguntas de la aplicación.',
      '',
      `Puesto: ${p.title}`,
      p.company && `Empresa: ${p.company}`,
      p.location && `Ubicación: ${p.location}`,
      (p.details || p.snippet) && `Detalles: ${p.details || p.snippet}`,
      v && `Veredicto de mi CRM: ${LABELS[v.verdict] ?? v.verdict} · ${v.score}/10${v.expYears != null ? ` · piden ${v.expYears} años` : ''}`,
      `Link: ${p.url}`,
      '',
      'Descripción:',
      p.description || '(No la tengo: abre la vacante en Indeed y vuelve a copiar.)',
    ].filter((x) => x !== undefined && x !== null && x !== false).join('\n')
  }

  async function copyJob(jk, btn) {
    const card = cardByJk(jk)
    const p = full.get(jk) ?? (card ? readCard(card)?.posting : null)
    if (!p) return
    const text = jobText(p, verdicts.get(jk))
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.cssText = 'position:fixed;opacity:0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    if (btn) {
      btn.textContent = full.has(jk) ? '✓ Copiada' : '✓ Copiada (sin descripción)'
      setTimeout(() => { btn.textContent = 'Copiar para Claude' }, 1800)
    }
  }

  // Marcar "ya apliqué" o silenciar una empresa: el CRM responde todas las
  // vacantes que cambiaron (las de la misma empresa) y se repintan.
  async function action(payload) {
    try {
      const res = await chrome.runtime.sendMessage({ type: 'JOBS_ACTION', payload })
      if (!res?.ok) throw new Error(res?.error ?? 'Sin respuesta de la extensión')
      lastError = null
      for (const r of res.data.results ?? []) verdicts.set(r.externalId.replace(/^indeed_/, ''), r)
    } catch (err) {
      lastError = err.message
    }
    scan()
  }

  // ── Indicador ──────────────────────────────────────────────────────────────

  let statusEl = null
  function renderStatus() {
    const cards = [...document.querySelectorAll(SEL.card)].map(readCard).filter(Boolean)
    if (!cards.length && !sentFull.size) return
    if (!statusEl) {
      statusEl = document.createElement('div')
      statusEl.style.cssText = `position:fixed;bottom:16px;left:16px;z-index:99999;background:rgba(17,24,39,.94);color:#fff;
        font:12px/1.45 system-ui,-apple-system,sans-serif;padding:8px 11px;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,.3);max-width:270px`
      statusEl.style.pointerEvents = 'none'
      statusEl.innerHTML = '<div data-info></div>'
      document.body.appendChild(statusEl)
    }
    const count = (v) => cards.filter((c) => verdicts.get(c.jk)?.verdict === v && !verdicts.get(c.jk)?.tag).length
    const pending = cards.filter((c) => !sentFull.has(c.jk) && verdicts.get(c.jk)?.verdict !== 'DESCARTAR' && !verdicts.get(c.jk)?.tag).length
    const info = `<strong>Vacantes → CRM</strong><br>
      ${cards.length} en esta página · <span style="color:#86efac">${count('APLICAR')} aplicar</span> ·
      <span style="color:#fcd34d">${count('ESTIRAR')} estirar</span> · <span style="color:#fca5a5">${count('DESCARTAR')} descartar</span>
      <br>${pending ? `Abre ${pending === 1 ? 'la que falta' : `las ${pending} que faltan`} para leer su descripción` : '<span style="color:#86efac">Todas leídas ✓</span>'}
      ${lastError ? `<br><span style="color:#fca5a5">⚠ ${lastError}</span>` : ''}`
    // Solo tocar el DOM si cambió algo (si no, el observer se dispara solo).
    if (statusEl.dataset.sig === info) return
    statusEl.dataset.sig = info
    statusEl.querySelector('[data-info]').innerHTML = info
  }

  // ── Init ───────────────────────────────────────────────────────────────────

  let scanTimer = null
  const scheduleScan = () => { clearTimeout(scanTimer); scanTimer = setTimeout(scan, 500) }
  // Ignora los cambios que hace este mismo script (indicador y etiquetas).
  const own = (n) => n === statusEl || statusEl?.contains(n) || !!n.closest?.('.vac-bar') || n.parentElement?.closest?.('.vac-bar')
  new MutationObserver((muts) => {
    if (muts.every((m) => own(m.target) || (m.addedNodes.length > 0 && [...m.addedNodes].every(own)))) return
    scheduleScan()
  }).observe(document.body, { childList: true, subtree: true })
  window.addEventListener('pagehide', () => { if (queue.length) flush() })
  log('activo en', location.href)
  scheduleScan()
})()
