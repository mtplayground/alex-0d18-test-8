import type { Direction, Vector2 } from './Entity'
import type { PowerUpType } from './PowerUp'
import { Tank } from './Tank'

export type EnemyTankType = 'basic' | 'fast' | 'armored'

export interface EnemyTankDefinition {
  speed: number
  hitPoints: number
  scoreValue: number
}

export interface EnemyTankOptions {
  position: Vector2
  size: Vector2
  type?: EnemyTankType
  powerUpType?: PowerUpType | null
  direction?: Direction
  alive?: boolean
}

export const ENEMY_TANK_DEFINITIONS: Record<
  EnemyTankType,
  EnemyTankDefinition
> = {
  basic: {
    speed: 72,
    hitPoints: 1,
    scoreValue: 100,
  },
  fast: {
    speed: 112,
    hitPoints: 1,
    scoreValue: 150,
  },
  armored: {
    speed: 56,
    hitPoints: 3,
    scoreValue: 300,
  },
}

const ENEMY_TANK_TYPES = Object.keys(ENEMY_TANK_DEFINITIONS) as EnemyTankType[]

export const isEnemyTankType = (value: unknown): value is EnemyTankType =>
  ENEMY_TANK_TYPES.includes(value as EnemyTankType)

export const assertEnemyTankType = (value: unknown): EnemyTankType => {
  if (!isEnemyTankType(value)) {
    throw new Error(`Invalid enemy tank type: ${String(value)}.`)
  }

  return value
}

export class EnemyTank extends Tank {
  public readonly type: EnemyTankType
  public readonly powerUpType: PowerUpType | null

  public constructor(options: EnemyTankOptions) {
    const type = assertEnemyTankType(options.type ?? 'basic')
    const definition = ENEMY_TANK_DEFINITIONS[type]

    super({
      position: options.position,
      size: options.size,
      faction: 'enemy',
      direction: options.direction,
      speed: definition.speed,
      hitPoints: definition.hitPoints,
      scoreValue: definition.scoreValue,
      alive: options.alive,
    })

    this.type = type
    this.powerUpType = options.powerUpType ?? null
  }
}
