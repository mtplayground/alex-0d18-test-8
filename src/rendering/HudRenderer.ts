export interface HudSnapshot {
  lives: number
  score: number
  level: number
  enemiesRemaining: number
}

export interface RenderHudOptions {
  x?: number
  y?: number
  width?: number
}

const DEFAULT_HUD_X = 12
const DEFAULT_HUD_Y = 12
const DEFAULT_HUD_WIDTH = 184
const HUD_ROW_HEIGHT = 22
const HUD_PADDING = 12

const assertNonNegativeInteger = (name: string, value: number): void => {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative integer.`)
  }
}

const assertPositiveInteger = (name: string, value: number): void => {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer.`)
  }
}

const assertHudSnapshot = (snapshot: HudSnapshot): void => {
  assertNonNegativeInteger('HUD lives', snapshot.lives)
  assertNonNegativeInteger('HUD score', snapshot.score)
  assertPositiveInteger('HUD level', snapshot.level)
  assertNonNegativeInteger('HUD enemies remaining', snapshot.enemiesRemaining)
}

const getHudRows = (snapshot: HudSnapshot): readonly [string, string][] => [
  ['LIVES', snapshot.lives.toString()],
  ['SCORE', snapshot.score.toString()],
  ['LEVEL', snapshot.level.toString()],
  ['ENEMIES', snapshot.enemiesRemaining.toString()],
]

export const formatHudAriaLabel = (snapshot: HudSnapshot): string => {
  assertHudSnapshot(snapshot)

  return `Game HUD. Lives ${snapshot.lives}. Score ${snapshot.score}. Level ${snapshot.level}. Enemies remaining ${snapshot.enemiesRemaining}.`
}

export const writeHudAttributes = (
  canvas: HTMLCanvasElement,
  snapshot: HudSnapshot,
): void => {
  assertHudSnapshot(snapshot)

  canvas.dataset.hudLives = snapshot.lives.toString()
  canvas.dataset.hudScore = snapshot.score.toString()
  canvas.dataset.hudLevel = snapshot.level.toString()
  canvas.dataset.hudEnemiesRemaining = snapshot.enemiesRemaining.toString()
  canvas.dataset.hudWave = snapshot.enemiesRemaining.toString()
  canvas.dataset.hudScene = 'Playing'
  canvas.setAttribute('aria-label', formatHudAriaLabel(snapshot))
}

export const renderHud = (
  ctx: CanvasRenderingContext2D,
  snapshot: HudSnapshot,
  options: RenderHudOptions = {},
): void => {
  assertHudSnapshot(snapshot)

  const x = options.x ?? DEFAULT_HUD_X
  const y = options.y ?? DEFAULT_HUD_Y
  const width = options.width ?? DEFAULT_HUD_WIDTH
  const rows = getHudRows(snapshot)
  const height = HUD_PADDING * 2 + 20 + rows.length * HUD_ROW_HEIGHT

  ctx.save()
  ctx.fillStyle = 'rgba(2, 6, 23, 0.78)'
  ctx.fillRect(x, y, width, height)
  ctx.strokeStyle = 'rgba(226, 232, 240, 0.28)'
  ctx.lineWidth = 1
  ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1)

  ctx.textBaseline = 'top'
  ctx.fillStyle = '#f8fafc'
  ctx.font = '700 13px Inter, ui-sans-serif, system-ui, sans-serif'
  ctx.fillText('STATUS', x + HUD_PADDING, y + HUD_PADDING)

  ctx.font = '700 14px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
  rows.forEach(([label, value], index) => {
    const rowY = y + HUD_PADDING + 24 + index * HUD_ROW_HEIGHT

    ctx.fillStyle = '#94a3b8'
    ctx.textAlign = 'left'
    ctx.fillText(label, x + HUD_PADDING, rowY)
    ctx.fillStyle = '#f8fafc'
    ctx.textAlign = 'right'
    ctx.fillText(value, x + width - HUD_PADDING, rowY)
  })

  ctx.restore()
}
