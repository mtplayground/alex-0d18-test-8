import {
  Entity,
  type Direction,
  type EntityOptions,
  type Vector2,
} from './Entity'

export type BulletOwner = 'player' | 'enemy'

export interface BulletOptions {
  position: Vector2
  direction: Direction
  owner: BulletOwner
  speed?: number
  size?: Vector2
  alive?: boolean
}

const DEFAULT_BULLET_SPEED = 320
const DEFAULT_BULLET_SIZE: Vector2 = { x: 6, y: 6 }

const copyVector = (vector: Vector2): Vector2 => ({
  x: vector.x,
  y: vector.y,
})

export const velocityFromDirection = (
  direction: Direction,
  speed: number,
): Vector2 => {
  if (!Number.isFinite(speed) || speed <= 0) {
    throw new Error('Bullet speed must be greater than zero.')
  }

  switch (direction) {
    case 'up':
      return { x: 0, y: -speed }
    case 'down':
      return { x: 0, y: speed }
    case 'left':
      return { x: -speed, y: 0 }
    case 'right':
      return { x: speed, y: 0 }
  }
}

export class Bullet extends Entity {
  public readonly owner: BulletOwner
  public readonly speed: number

  public constructor(options: BulletOptions) {
    const speed = options.speed ?? DEFAULT_BULLET_SPEED
    const size = copyVector(options.size ?? DEFAULT_BULLET_SIZE)
    const entityOptions: EntityOptions = {
      position: options.position,
      size,
      velocity: velocityFromDirection(options.direction, speed),
      direction: options.direction,
      alive: options.alive,
    }

    super(entityOptions)

    this.owner = options.owner
    this.speed = speed
  }

  public isOutsideBounds(width: number, height: number): boolean {
    if (
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width < 0 ||
      height < 0
    ) {
      throw new Error('Bullet bounds must be finite, non-negative dimensions.')
    }

    return (
      this.position.x + this.size.x < 0 ||
      this.position.y + this.size.y < 0 ||
      this.position.x > width ||
      this.position.y > height
    )
  }

  public override render(ctx: CanvasRenderingContext2D): void {
    ctx.save()
    ctx.fillStyle = this.owner === 'player' ? '#f8fafc' : '#f97316'
    ctx.fillRect(this.position.x, this.position.y, this.size.x, this.size.y)
    ctx.restore()
  }
}
