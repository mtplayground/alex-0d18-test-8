import { describe, expect, it } from 'vitest'
import { SpawnFlash } from './SpawnFlash'

describe('SpawnFlash', () => {
  it('expires after its configured duration', () => {
    const flash = new SpawnFlash({
      position: { x: 10, y: 20 },
      size: { x: 32, y: 32 },
      durationSeconds: 0.5,
    })

    expect(flash.position).toEqual({ x: 10, y: 20 })
    expect(flash.alive).toBe(true)

    flash.update(0.25)

    expect(flash.alive).toBe(true)

    flash.update(0.25)

    expect(flash.alive).toBe(false)
  })

  it('rejects invalid options and update deltas', () => {
    expect(
      () =>
        new SpawnFlash({
          position: { x: 0, y: 0 },
          size: { x: 0, y: 32 },
        }),
    ).toThrow('Spawn flash width must be greater than zero.')

    const flash = new SpawnFlash({
      position: { x: 0, y: 0 },
      size: { x: 32, y: 32 },
    })

    expect(() => flash.update(-1)).toThrow(
      'Spawn flash update delta time must be non-negative.',
    )
  })
})
