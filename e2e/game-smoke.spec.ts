import { expect, test } from '@playwright/test'

test('built game mounts canvas, starts, accepts input, and reports HUD counters', async ({
  page,
}) => {
  const runtimeErrors: string[] = []

  page.on('console', (message) => {
    if (message.type() === 'error') {
      runtimeErrors.push(message.text())
    }
  })
  page.on('pageerror', (error) => {
    runtimeErrors.push(error.message)
  })

  await page.goto('/')

  const canvas = page.locator('#app-canvas')
  await expect(canvas).toBeVisible()
  await page.waitForFunction(() => {
    const canvasElement =
      document.querySelector<HTMLCanvasElement>('#app-canvas')
    return (
      canvasElement !== null &&
      canvasElement.width > 0 &&
      canvasElement.height > 0
    )
  })

  await page.keyboard.press('Enter')
  await expect(canvas).toHaveAttribute('data-hud-scene', 'Playing')
  await expect(canvas).toHaveAttribute('data-hud-lives', '3')
  await expect(canvas).toHaveAttribute('data-hud-score', '0')
  await expect(canvas).toHaveAttribute('data-hud-level', '1')

  await page.keyboard.down('ArrowUp')
  await page.waitForTimeout(600)
  await page.keyboard.up('ArrowUp')
  await page.keyboard.press('Space')
  await page.keyboard.down('ArrowRight')
  await page.waitForTimeout(1_500)
  await page.keyboard.up('ArrowRight')

  const hud = await canvas.evaluate((canvasElement) => ({
    lives: Number(canvasElement.dataset.hudLives),
    score: Number(canvasElement.dataset.hudScore),
    level: Number(canvasElement.dataset.hudLevel),
    wave: Number(canvasElement.dataset.hudWave),
    scene: canvasElement.dataset.hudScene,
    label: canvasElement.getAttribute('aria-label') ?? '',
  }))

  expect(hud.lives).toBeGreaterThanOrEqual(0)
  expect(hud.score).toBeGreaterThanOrEqual(0)
  expect(hud.level).toBe(1)
  expect(hud.wave).toBeGreaterThanOrEqual(0)
  expect(hud.scene).toBeTruthy()
  expect(hud.label).toContain('Game HUD.')
  expect(runtimeErrors).toEqual([])
})
