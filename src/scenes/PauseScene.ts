import type { Scene } from '../core/Scene'
import type { TitleInput } from './TitleScene'

export interface PauseSceneOptions {
  input: TitleInput
  gameScene: Scene
  onResume: () => void
  onReturnToTitle: () => void
}

const PAUSE_KEYS = ['KeyP', 'p', 'P']
const TITLE_KEYS = ['Enter', 'Space']

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

export class PauseScene implements Scene {
  private readonly input: TitleInput
  private readonly gameScene: Scene
  private readonly onResume: () => void
  private readonly onReturnToTitle: () => void
  private hasCompleted = false

  public constructor(options: PauseSceneOptions) {
    this.input = options.input
    this.gameScene = options.gameScene
    this.onResume = options.onResume
    this.onReturnToTitle = options.onReturnToTitle
  }

  public enter(): void {
    this.hasCompleted = false
  }

  public exit(): void {
    this.hasCompleted = false
  }

  public update(dt: number): void {
    if (!Number.isFinite(dt) || dt < 0) {
      throw new Error('PauseScene update delta time must be non-negative.')
    }

    if (this.hasCompleted) {
      return
    }

    if (PAUSE_KEYS.some((key) => this.input.wasPressed(key))) {
      this.hasCompleted = true
      this.onResume()
      return
    }

    if (TITLE_KEYS.some((key) => this.input.wasPressed(key))) {
      this.hasCompleted = true
      this.onReturnToTitle()
    }
  }

  public render(ctx: CanvasRenderingContext2D, fps: number): void {
    this.gameScene.render(ctx, fps)

    const { width, height } = getCanvasSize(ctx)
    const centerX = width / 2
    const centerY = height / 2

    ctx.save()
    ctx.fillStyle = 'rgba(2, 6, 23, 0.72)'
    ctx.fillRect(0, 0, width, height)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#f8fafc'
    ctx.font = '700 40px Inter, ui-sans-serif, system-ui, sans-serif'
    ctx.fillText('PAUSED', centerX, centerY - 32)
    ctx.fillStyle = '#facc15'
    ctx.font = '700 18px Inter, ui-sans-serif, system-ui, sans-serif'
    ctx.fillText('PRESS P TO RESUME', centerX, centerY + 24)
    ctx.fillStyle = '#cbd5e1'
    ctx.font = '14px Inter, ui-sans-serif, system-ui, sans-serif'
    ctx.fillText('ENTER OR SPACE RETURNS TO TITLE', centerX, centerY + 58)
    ctx.restore()
  }
}
