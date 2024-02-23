import { withAdminUserRoute } from '@/src/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import puppeteer from 'puppeteer'

async function runBrowser(req: NextApiRequest, res: NextApiResponse<string>) {
  const url = req.query.url as string
  const browser = await puppeteer.launch({
    headless: true,
    timeout: 0,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const page = await browser.newPage()

  await page.goto(url)
  await page.setViewport({ width: 1080, height: 1024 })
  await page.type('.devsite-search-field', 'automate beyond recorder')

  const searchResultSelector = '.devsite-result-item-link'
  await page.waitForSelector(searchResultSelector)
  await page.click(searchResultSelector)

  const textSelector = await page.waitForSelector('text/Customize and automate')
  const fullTitle = await textSelector?.evaluate(el => el.textContent)

  await browser.close()

  res.json(fullTitle ?? 'No title found')
}

export default withAdminUserRoute(runBrowser)
