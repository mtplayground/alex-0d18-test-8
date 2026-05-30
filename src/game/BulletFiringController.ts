import { Bullet, type BulletOwner } from '../entities/Bullet'
import type { Direction, Vector2 } from '../entities/Entity'

export interface FireInput {
  wasPressed: (key: string) => boolean
}

export interface ShooterState {
  position: Vector2
  size: Vector2
  direction: Direction
  owner: BulletOwner
}

export interface BulletFiringControllerOptions {
  triggerKey?: string
  reloadSeconds?: number
  maxActiveBullets?: number
  bulletSpeed?: number
  bulletSize?: Vector2
}

const DEFAULT_TRIGGER_KEY = 'Space'
const DEFAULT_RELOAD_SECONDS = 0.35
const DEFAULT_MAX_ACTIVE_BULLETS = 1
const DEFAULT_BULLET_SPEED = 320
const DEFAULT_BULLET_SIZE: Vector2 = { x: 6, y: 6 }

const assertFinitePositive = (name: string, value: number): void => {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be greater than zero.`)
  }
}

const assertNonNegativeInteger = (name: string, value: number): void => {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative integer.`)
  }
}

const getMuzzlePosition = (
  shooter: ShooterState,
  bulletSize: Vector2,
): Vector2 => {
  const centerX = shooter.position.x + shooter.size.x / 2
  const centerY = shooter.position.y + shooter.size.y / 2

  switch (shooter.direction) {
    case 'up':
      return {
        x: centerX - bulletSize.x / 2,
        y: shooter.position.y - bulletSize.y,
      }
    case 'down':
      return {
        x: centerX - bulletSize.x / 2,
        y: shooter.position.y + shooter.size.y,
      }
    case 'left':
      return {
        x: shooter.position.x - bulletSize.x,
        y: centerY - bulletSize.y / 2,
      }
    case 'right':
      return {
        x: shooter.position.x + shooter.size.x,
        y: centerY - bulletSize.y / 2,
      }
  }
}

export class BulletFiringController {
  public readonly triggerKey: string
  public readonly reloadSeconds: number
  public readonly maxActiveBullets: number
  public readonly bulletSpeed: number
  public readonly bulletSize: Vector2
  private reloadRemaining = 0

  public constructor(options: BulletFiringControllerOptions = {}) {
    this.triggerKey = options.triggerKey ?? DEFAULT_TRIGGER_KEY
    this.reloadSeconds = options.reloadSeconds ?? DEFAULT_RELOAD_SECONDS
    this.maxActiveBullets =
      options.maxActiveBullets ?? DEFAULT_MAX_ACTIVE_BULLETS
    this.bulletSpeed = options.bulletSpeed ?? DEFAULT_BULLET_SPEED
    this.bulletSize = { ...(options.bulletSize ?? DEFAULT_BULLET_SIZE) }

    if (this.reloadSeconds < 0 || !Number.isFinite(this.reloadSeconds)) {
      throw new Error('Bullet reload seconds must be finite and non-negative.')
    }

    assertNonNegativeInteger(
      'Bullet max active bullet count',
      this.maxActiveBullets,
    )
    assertFinitePositive('Bullet speed', this.bulletSpeed)
    assertFinitePositive('Bullet width', this.bulletSize.x)
    assertFinitePositive('Bullet height', this.bulletSize.y)
  }

  public update(dt: number): void {
    if (!Number.isFinite(dt) || dt < 0) {
      throw new Error('Bullet firing update delta time must be non-negative.')
    }

    this.reloadRemaining = Math.max(0, this.reloadRemaining - dt)
  }

  public canFire(
    activeBullets: readonly Bullet[],
    shooter: ShooterState,
  ): boolean {
    if (this.reloadRemaining > 0) {
      return false
    }

    return (
      activeBullets.filter(
        (bullet) => bullet.alive && bullet.owner === shooter.owner,
      ).length < this.maxActiveBullets
    )
  }

  public tryFire(
    input: FireInput,
    activeBullets: readonly Bullet[],
    shooter: ShooterState,
  ): Bullet | null {
    if (
      !input.wasPressed(this.triggerKey) ||
      !this.canFire(activeBullets, shooter)
    ) {
      return null
    }

    const bullet = new Bullet({
      position: getMuzzlePosition(shooter, this.bulletSize),
      size: this.bulletSize,
      direction: shooter.direction,
      owner: shooter.owner,
      speed: this.bulletSpeed,
    })

    this.reloadRemaining = this.reloadSeconds

    return bullet
  }
}
