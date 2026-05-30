import type { Scene } from '../core/Scene'

export interface TitleInput {
  wasPressed: (key: string) => boolean
}

export interface TitleStorage {
  getItem: (key: string) => string | null
}

export interface TitleSceneOptions {
  input: TitleInput
  onStart: () => void
  storage?: TitleStorage | null
  title?: string
  highScoreKey?: string
}

export const DEFAULT_TITLE = 'alex-0d18-test-8'
export const DEFAULT_HIGH_SCORE_KEY = 'alex-0d18-test-8.highScore'

const START_KEYS = ['Enter', 'Space']

const getSafeHighScore = (
  storage: TitleStorage | null,
  highScoreKey: string,
): number => {
  if (!storage) {
    return 0
  }

  try {
    const rawScore = storage.getItem(highScoreKey)

    if (rawScore === null) {
      return 0
    }

    const score = Number.parseInt(rawScore, 10)
    return Number.isFinite(score) && score > 0 ? score : 0
  } catch {
    return 0
  }
}

const getCanvasSize = (
  ctx: CanvasRenderingContext2D,
): { width: number; height: number } => {
  const canvas = ctx.canvas
  const width = canvas.clientWidth || canvas.width
  const height = canvas.clientHeight || canvas.height

  return {
    width: Math.max(1, width),
    height: Math.max(1, height),
  }
}

export class TitleScene implements Scene {
  private readonly input: TitleInput
  private readonly onStart: () => void
  private readonly title: string
  private readonly highScore: number
  private hasStarted = false
  private elapsedSeconds = 0

  public constructor(options: TitleSceneOptions) {
    this.input = options.input
    this.onStart = options.onStart
    this.title = options.title ?? DEFAULT_TITLE
    this.highScore = getSafeHighScore(
      options.storage ?? null,
      options.highScoreKey ?? DEFAULT_HIGH_SCORE_KEY,
    )
  }

  public enter(): void {
    this.hasStarted = false
    this.elapsedSeconds = 0
  }

  public exit(): void {
    this.hasStarted = false
  }

  public update(dt: number): void {
    if (!Number.isFinite(dt) || dt < 0) {
      throw new Error('TitleScene update delta time must be non-negative.')
    }

    this.elapsedSeconds += dt

    if (this.hasStarted) {
      return
    }

    if (START_KEYS.some((key) => this.input.wasPressed(key))) {
      this.hasStarted = true
      this.onStart()
    }
  }

  public render(ctx: CanvasRenderingContext2D, _fps: number): void {
    void _fps

    const { width, height } = getCanvasSize(ctx)
    const centerX = width / 2
    const centerY = height / 2
    const promptVisible = Math.floor(this.elapsedSeconds * 2) % 2 === 0

    ctx.save()
    ctx.clearRect(0, 0, width, height)

    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, '#0f172a')
    gradient.addColorStop(0.52, '#111827')
    gradient.addColorStop(1, '#020617')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)'
    ctx.lineWidth = 1
    for (let x = 0; x <= width; x += 32) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
    for (let y = 0; y <= height; y += 32) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#f8fafc'
    ctx.font = '700 42px Inter, ui-sans-serif, system-ui, sans-serif'
    ctx.fillText(this.title, centerX, centerY - 88)

    ctx.fillStyle = '#38bdf8'
    ctx.font = '700 18px Inter, ui-sans-serif, system-ui, sans-serif'
    ctx.fillText('HIGH SCORE', centerX, centerY - 18)

    ctx.fillStyle = '#e2e8f0'
    ctx.font = '700 28px ui-monospace, SFMono-Regular, Menlo, monospace'
    ctx.fillText(this.highScore.toString(), centerX, centerY + 18)

    if (promptVisible) {
      ctx.fillStyle = '#facc15'
      ctx.font = '700 20px Inter, ui-sans-serif, system-ui, sans-serif'
      ctx.fillText('PRESS ENTER OR SPACE', centerX, centerY + 92)
    }

    ctx.fillStyle = '#94a3b8'
    ctx.font = '14px Inter, ui-sans-serif, system-ui, sans-serif'
    ctx.fillText('START GAME', centerX, centerY + 124)
    ctx.restore()
  }
}
