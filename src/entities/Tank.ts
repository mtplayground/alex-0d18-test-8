import {
  Entity,
  type Direction,
  type EntityOptions,
  type Vector2,
} from './Entity'
import type { BulletOwner } from './Bullet'

export type TankFaction = BulletOwner

export interface TankOptions {
  position: Vector2
  size: Vector2
  faction: TankFaction
  direction?: Direction
  speed?: number
  hitPoints?: number
  lives?: number
  scoreValue?: number
  alive?: boolean
}

export interface TankDamageResult {
  destroyed: boolean
  lifeLost: boolean
  scoreValue: number
}

const assertPositiveInteger = (name: string, value: number): void => {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer.`)
  }
}

const assertNonNegativeInteger = (name: string, value: number): void => {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative integer.`)
  }
}

const assertNonNegativeFinite = (name: string, value: number): void => {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be a finite, non-negative number.`)
  }
}

export class Tank extends Entity {
  public readonly faction: TankFaction
  public readonly speed: number
  public hitPoints: number
  public lives: number
  public readonly scoreValue: number

  public constructor(options: TankOptions) {
    const speed = options.speed ?? 0
    const hitPoints = options.hitPoints ?? 1
    const lives = options.lives ?? 1
    const scoreValue = options.scoreValue ?? 0
    const entityOptions: EntityOptions = {
      position: options.position,
      size: options.size,
      direction: options.direction,
      alive: options.alive,
    }

    assertNonNegativeFinite('Tank speed', speed)
    assertPositiveInteger('Tank hit points', hitPoints)
    assertPositiveInteger('Tank lives', lives)
    assertNonNegativeInteger('Tank score value', scoreValue)
    super(entityOptions)

    this.faction = options.faction
    this.speed = speed
    this.hitPoints = hitPoints
    this.lives = lives
    this.scoreValue = scoreValue
  }

  public damage(amount = 1): TankDamageResult {
    assertPositiveInteger('Tank damage amount', amount)

    if (!this.alive) {
      return {
        destroyed: true,
        lifeLost: false,
        scoreValue: this.scoreValue,
      }
    }

    if (this.faction === 'player') {
      this.lives = Math.max(0, this.lives - amount)
      this.alive = this.lives > 0

      return {
        destroyed: !this.alive,
        lifeLost: true,
        scoreValue: 0,
      }
    }

    this.hitPoints = Math.max(0, this.hitPoints - amount)
    this.alive = this.hitPoints > 0

    return {
      destroyed: !this.alive,
      lifeLost: false,
      scoreValue: this.alive ? 0 : this.scoreValue,
    }
  }

  public override render(ctx: CanvasRenderingContext2D): void {
    const centerX = this.position.x + this.size.x / 2
    const centerY = this.position.y + this.size.y / 2
    const barrel =
      this.direction === 'up'
        ? { x: centerX - 3, y: this.position.y - 8, width: 6, height: 12 }
        : this.direction === 'down'
          ? {
              x: centerX - 3,
              y: this.position.y + this.size.y - 4,
              width: 6,
              height: 12,
            }
          : this.direction === 'left'
            ? { x: this.position.x - 8, y: centerY - 3, width: 12, height: 6 }
            : {
                x: this.position.x + this.size.x - 4,
                y: centerY - 3,
                width: 12,
                height: 6,
              }

    ctx.save()
    ctx.fillStyle = this.faction === 'player' ? '#38bdf8' : '#ef4444'
    ctx.fillRect(this.position.x, this.position.y, this.size.x, this.size.y)
    ctx.fillStyle = this.faction === 'player' ? '#e0f2fe' : '#fee2e2'
    ctx.fillRect(barrel.x, barrel.y, barrel.width, barrel.height)
    ctx.restore()
  }
}
