import { describe, expect, it } from 'vitest'
import { Explosion } from './Explosion'

describe('Explosion', () => {
  it('centers around its origin and expires after its duration', () => {
    const explosion = new Explosion({
      position: { x: 50, y: 80 },
      size: { x: 20, y: 30 },
      durationSeconds: 0.5,
    })

    expect(explosion.position).toEqual({ x: 40, y: 65 })
    expect(explosion.alive).toBe(true)

    explosion.update(0.25)

    expect(explosion.alive).toBe(true)

    explosion.update(0.25)

    expect(explosion.alive).toBe(false)
  })

  it('rejects invalid duration and update deltas', () => {
    expect(
      () =>
        new Explosion({
          position: { x: 0, y: 0 },
          durationSeconds: 0,
        }),
    ).toThrow('Explosion duration must be greater than zero.')

    const explosion = new Explosion({ position: { x: 0, y: 0 } })

    expect(() => explosion.update(-1)).toThrow(
      'Explosion update delta time must be non-negative.',
    )
  })
})
