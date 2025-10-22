import { chromium } from 'playwright'

const browser = await chromium.launch()
const page = await browser.newPage()
await page.goto('http://localhost:5005')

while (true) {
  await page.screenshot({ path: './src/water/screenshot.png' })
  await page.waitForTimeout(1000)
}
