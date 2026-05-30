export interface Vector2 {
  x: number
  y: number
}

export type Direction = 'up' | 'down' | 'left' | 'right'

export interface EntityOptions {
  position: Vector2
  size: Vector2
  velocity?: Vector2
  direction?: Direction
  alive?: boolean
}

const copyVector = (vector: Vector2): Vector2 => ({
  x: vector.x,
  y: vector.y,
})

const assertFiniteVector = (name: string, vector: Vector2): void => {
  if (!Number.isFinite(vector.x) || !Number.isFinite(vector.y)) {
    throw new Error(`${name} must contain finite x and y values.`)
  }
}

export class Entity {
  public position: Vector2
  public size: Vector2
  public velocity: Vector2
  public direction: Direction
  public alive: boolean

  public constructor(options: EntityOptions) {
    assertFiniteVector('Entity position', options.position)
    assertFiniteVector('Entity size', options.size)

    if (options.size.x < 0 || options.size.y < 0) {
      throw new Error('Entity size cannot be negative.')
    }

    this.position = copyVector(options.position)
    this.size = copyVector(options.size)
    this.velocity = copyVector(options.velocity ?? { x: 0, y: 0 })
    this.direction = options.direction ?? 'up'
    this.alive = options.alive ?? true

    assertFiniteVector('Entity velocity', this.velocity)
  }

  public update(dt: number): void {
    if (!Number.isFinite(dt)) {
      throw new Error('Entity update delta time must be finite.')
    }

    this.position.x += this.velocity.x * dt
    this.position.y += this.velocity.y * dt
  }

  public render(ctx: CanvasRenderingContext2D): void {
    void ctx
  }
}
