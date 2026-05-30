import { describe, expect, it } from 'vitest'
import { Entity } from './Entity'

describe('Entity', () => {
  it('copies initial state and applies velocity during update', () => {
    const position = { x: 10, y: 20 }
    const size = { x: 16, y: 24 }
    const velocity = { x: 30, y: -15 }
    const entity = new Entity({
      position,
      size,
      velocity,
      direction: 'right',
    })

    position.x = 0
    size.y = 0
    velocity.x = 0
    entity.update(0.5)

    expect(entity.position).toEqual({ x: 25, y: 12.5 })
    expect(entity.size).toEqual({ x: 16, y: 24 })
    expect(entity.velocity).toEqual({ x: 30, y: -15 })
    expect(entity.direction).toBe('right')
    expect(entity.alive).toBe(true)
  })

  it('defaults velocity, direction, and alive state', () => {
    const entity = new Entity({
      position: { x: 0, y: 0 },
      size: { x: 8, y: 8 },
    })

    expect(entity.velocity).toEqual({ x: 0, y: 0 })
    expect(entity.direction).toBe('up')
    expect(entity.alive).toBe(true)
  })

  it('rejects invalid numeric state', () => {
    expect(
      () =>
        new Entity({
          position: { x: Number.NaN, y: 0 },
          size: { x: 8, y: 8 },
        }),
    ).toThrow('Entity position must contain finite x and y values.')

    expect(
      () =>
        new Entity({
          position: { x: 0, y: 0 },
          size: { x: -1, y: 8 },
        }),
    ).toThrow('Entity size cannot be negative.')

    const entity = new Entity({
      position: { x: 0, y: 0 },
      size: { x: 8, y: 8 },
    })

    expect(() => entity.update(Number.POSITIVE_INFINITY)).toThrow(
      'Entity update delta time must be finite.',
    )
  })
})
