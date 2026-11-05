// Genera los PDF del CV en public/cv. Uso: node docs/cv/render.mjs
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const dir = dirname(fileURLToPath(import.meta.url))
const browser = await chromium.launch({ channel: 'chrome' })
const page = await browser.newPage()
for (const lang of ['en', 'es']) {
  await page.goto(`file://${join(dir, `cv-${lang}.html`)}`)
  await page.pdf({
    path: join(dir, '../../public/cv', `Brandon-Soria-CV-${lang.toUpperCase()}.pdf`),
    format: 'Letter',
    preferCSSPageSize: true,
    printBackground: true,
  })
}
await browser.close()
