import { Entity, type EntityOptions, type Vector2 } from './Entity'

export type PowerUpType =
  | 'extra-life'
  | 'base-shield'
  | 'weapon-upgrade'
  | 'freeze-enemies'

export interface PowerUpDefinition {
  color: string
  label: string
  durationSeconds: number | null
}

export interface PowerUpOptions {
  position: Vector2
  type: PowerUpType
  size?: Vector2
  alive?: boolean
}

const DEFAULT_POWER_UP_SIZE: Vector2 = { x: 24, y: 24 }

export const POWER_UP_DEFINITIONS: Record<PowerUpType, PowerUpDefinition> = {
  'extra-life': {
    color: '#22c55e',
    label: '+',
    durationSeconds: null,
  },
  'base-shield': {
    color: '#38bdf8',
    label: 'S',
    durationSeconds: 10,
  },
  'weapon-upgrade': {
    color: '#facc15',
    label: 'W',
    durationSeconds: 8,
  },
  'freeze-enemies': {
    color: '#a78bfa',
    label: 'F',
    durationSeconds: 5,
  },
}

const POWER_UP_TYPES = Object.keys(POWER_UP_DEFINITIONS) as PowerUpType[]

export const isPowerUpType = (value: unknown): value is PowerUpType =>
  POWER_UP_TYPES.includes(value as PowerUpType)

export const assertPowerUpType = (value: unknown): PowerUpType => {
  if (!isPowerUpType(value)) {
    throw new Error(`Invalid power-up type: ${String(value)}.`)
  }

  return value
}

export class PowerUp extends Entity {
  public readonly type: PowerUpType

  public constructor(options: PowerUpOptions) {
    const size = options.size ?? DEFAULT_POWER_UP_SIZE
    const entityOptions: EntityOptions = {
      position: options.position,
      size,
      alive: options.alive,
    }

    super(entityOptions)

    this.type = assertPowerUpType(options.type)
  }

  public override render(ctx: CanvasRenderingContext2D): void {
    const definition = POWER_UP_DEFINITIONS[this.type]

    ctx.save()
    ctx.fillStyle = definition.color
    ctx.fillRect(this.position.x, this.position.y, this.size.x, this.size.y)
    ctx.fillStyle = '#111827'
    ctx.font = '16px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(
      definition.label,
      this.position.x + this.size.x / 2,
      this.position.y + this.size.y / 2,
    )
    ctx.restore()
  }
}
