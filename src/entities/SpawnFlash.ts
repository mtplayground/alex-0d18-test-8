import { Entity, type EntityOptions, type Vector2 } from './Entity'

export interface SpawnFlashOptions {
  position: Vector2
  size: Vector2
  durationSeconds?: number
}

const DEFAULT_DURATION_SECONDS = 0.4

const assertPositiveFinite = (name: string, value: number): void => {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be greater than zero.`)
  }
}

export class SpawnFlash extends Entity {
  public readonly durationSeconds: number
  private elapsedSeconds = 0

  public constructor(options: SpawnFlashOptions) {
    const durationSeconds = options.durationSeconds ?? DEFAULT_DURATION_SECONDS
    const entityOptions: EntityOptions = {
      position: options.position,
      size: options.size,
    }

    assertPositiveFinite('Spawn flash width', options.size.x)
    assertPositiveFinite('Spawn flash height', options.size.y)
    assertPositiveFinite('Spawn flash duration', durationSeconds)
    super(entityOptions)

    this.durationSeconds = durationSeconds
  }

  public override update(dt: number): void {
    if (!Number.isFinite(dt) || dt < 0) {
      throw new Error('Spawn flash update delta time must be non-negative.')
    }

    this.elapsedSeconds += dt

    if (this.elapsedSeconds >= this.durationSeconds) {
      this.alive = false
    }
  }

  public override render(ctx: CanvasRenderingContext2D): void {
    const progress = Math.min(1, this.elapsedSeconds / this.durationSeconds)
    const inset = 3 + progress * 6

    ctx.save()
    ctx.globalAlpha = 1 - progress
    ctx.strokeStyle = '#facc15'
    ctx.lineWidth = 3
    ctx.strokeRect(
      this.position.x + inset,
      this.position.y + inset,
      Math.max(0, this.size.x - inset * 2),
      Math.max(0, this.size.y - inset * 2),
    )
    ctx.restore()
  }
}
