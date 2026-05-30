import type { Scene } from '../core/Scene'
import type { TitleInput } from './TitleScene'

export interface ResultSceneOptions {
  input: TitleInput
  title: string
  finalScore: number
  onReturnToTitle: () => void
}

const RETURN_KEYS = ['Enter', 'Space']

const getCanvasSize = (
  ctx: CanvasRenderingContext2D,
): { width: number; height: number } => {
  const width = ctx.canvas.clientWidth || ctx.canvas.width
  const height = ctx.canvas.clientHeight || ctx.canvas.height

  return {
    width: Math.max(1, width),
    height: Math.max(1, height),
  }
}

export class ResultScene implements Scene {
  private readonly input: TitleInput
  private readonly title: string
  private readonly finalScore: number
  private readonly onReturnToTitle: () => void
  private hasCompleted = false
  private elapsedSeconds = 0

  public constructor(options: ResultSceneOptions) {
    if (!Number.isFinite(options.finalScore) || options.finalScore < 0) {
      throw new Error('ResultScene final score must be non-negative.')
    }

    this.input = options.input
    this.title = options.title
    this.finalScore = Math.floor(options.finalScore)
    this.onReturnToTitle = options.onReturnToTitle
  }

  public enter(): void {
    this.hasCompleted = false
    this.elapsedSeconds = 0
  }

  public exit(): void {
    this.hasCompleted = false
  }

  public update(dt: number): void {
    if (!Number.isFinite(dt) || dt < 0) {
      throw new Error('ResultScene update delta time must be non-negative.')
    }

    this.elapsedSeconds += dt

    if (this.hasCompleted) {
      return
    }

    if (RETURN_KEYS.some((key) => this.input.wasPressed(key))) {
      this.hasCompleted = true
      this.onReturnToTitle()
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
    ctx.fillStyle = '#020617'
    ctx.fillRect(0, 0, width, height)

    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#f8fafc'
    ctx.font = '700 44px Inter, ui-sans-serif, system-ui, sans-serif'
    ctx.fillText(this.title, centerX, centerY - 72)

    ctx.fillStyle = '#38bdf8'
    ctx.font = '700 18px Inter, ui-sans-serif, system-ui, sans-serif'
    ctx.fillText('FINAL SCORE', centerX, centerY - 6)

    ctx.fillStyle = '#e2e8f0'
    ctx.font = '700 30px ui-monospace, SFMono-Regular, Menlo, monospace'
    ctx.fillText(this.finalScore.toString(), centerX, centerY + 32)

    if (promptVisible) {
      ctx.fillStyle = '#facc15'
      ctx.font = '700 18px Inter, ui-sans-serif, system-ui, sans-serif'
      ctx.fillText('PRESS ENTER OR SPACE', centerX, centerY + 104)
    }

    ctx.fillStyle = '#94a3b8'
    ctx.font = '14px Inter, ui-sans-serif, system-ui, sans-serif'
    ctx.fillText('RETURN TO TITLE TO RESTART', centerX, centerY + 134)
    ctx.restore()
  }
}
