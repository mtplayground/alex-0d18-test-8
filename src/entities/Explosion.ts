import { Entity, type EntityOptions, type Vector2 } from './Entity'

export interface ExplosionOptions {
  position: Vector2
  size?: Vector2
  durationSeconds?: number
}

const DEFAULT_EXPLOSION_SIZE: Vector2 = { x: 36, y: 36 }
const DEFAULT_DURATION_SECONDS = 0.25

const assertPositiveFinite = (name: string, value: number): void => {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be greater than zero.`)
  }
}

export class Explosion extends Entity {
  public readonly durationSeconds: number
  private elapsedSeconds = 0

  public constructor(options: ExplosionOptions) {
    const size = options.size ?? DEFAULT_EXPLOSION_SIZE
    const durationSeconds = options.durationSeconds ?? DEFAULT_DURATION_SECONDS
    const entityOptions: EntityOptions = {
      position: {
        x: options.position.x - size.x / 2,
        y: options.position.y - size.y / 2,
      },
      size,
    }

    assertPositiveFinite('Explosion width', size.x)
    assertPositiveFinite('Explosion height', size.y)
    assertPositiveFinite('Explosion duration', durationSeconds)
    super(entityOptions)

    this.durationSeconds = durationSeconds
  }

  public override update(dt: number): void {
    if (!Number.isFinite(dt) || dt < 0) {
      throw new Error('Explosion update delta time must be non-negative.')
    }

    this.elapsedSeconds += dt

    if (this.elapsedSeconds >= this.durationSeconds) {
      this.alive = false
    }
  }

  public override render(ctx: CanvasRenderingContext2D): void {
    const progress = Math.min(1, this.elapsedSeconds / this.durationSeconds)
    const radius = (Math.max(this.size.x, this.size.y) / 2) * (0.5 + progress)

    ctx.save()
    ctx.globalAlpha = 1 - progress
    ctx.fillStyle = '#f97316'
    ctx.beginPath()
    ctx.arc(
      this.position.x + this.size.x / 2,
      this.position.y + this.size.y / 2,
      radius,
      0,
      Math.PI * 2,
    )
    ctx.fill()
    ctx.restore()
  }
}
