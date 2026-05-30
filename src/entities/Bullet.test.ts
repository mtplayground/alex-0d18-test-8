import { describe, expect, it } from 'vitest'
import { Bullet, velocityFromDirection } from './Bullet'

describe('Bullet', () => {
  it('sets velocity from direction and advances with entity update', () => {
    const bullet = new Bullet({
      position: { x: 10, y: 12 },
      direction: 'right',
      owner: 'player',
      speed: 100,
      size: { x: 4, y: 4 },
    })

    bullet.update(0.25)

    expect(bullet.position).toEqual({ x: 35, y: 12 })
    expect(bullet.velocity).toEqual({ x: 100, y: 0 })
    expect(bullet.direction).toBe('right')
    expect(bullet.owner).toBe('player')
    expect(bullet.speed).toBe(100)
  })

  it('derives velocity for each direction', () => {
    expect(velocityFromDirection('up', 50)).toEqual({ x: 0, y: -50 })
    expect(velocityFromDirection('down', 50)).toEqual({ x: 0, y: 50 })
    expect(velocityFromDirection('left', 50)).toEqual({ x: -50, y: 0 })
    expect(velocityFromDirection('right', 50)).toEqual({ x: 50, y: 0 })
  })

  it('detects when it has left world bounds', () => {
    const bullet = new Bullet({
      position: { x: -7, y: 5 },
      direction: 'left',
      owner: 'player',
      size: { x: 6, y: 6 },
    })

    expect(bullet.isOutsideBounds(100, 100)).toBe(true)

    bullet.position.x = -5

    expect(bullet.isOutsideBounds(100, 100)).toBe(false)
  })

  it('rejects invalid speed and bounds', () => {
    expect(
      () =>
        new Bullet({
          position: { x: 0, y: 0 },
          direction: 'up',
          owner: 'player',
          speed: 0,
        }),
    ).toThrow('Bullet speed must be greater than zero.')

    const bullet = new Bullet({
      position: { x: 0, y: 0 },
      direction: 'up',
      owner: 'player',
    })

    expect(() => bullet.isOutsideBounds(Number.NaN, 100)).toThrow(
      'Bullet bounds must be finite, non-negative dimensions.',
    )
  })
})
