import { describe, expect, it } from 'vitest'
import { Tank } from './Tank'

describe('Tank', () => {
  it('tracks enemy hit points and score value when destroyed', () => {
    const tank = new Tank({
      position: { x: 0, y: 0 },
      size: { x: 32, y: 32 },
      faction: 'enemy',
      speed: 80,
      hitPoints: 2,
      scoreValue: 200,
    })

    expect(tank.speed).toBe(80)
    expect(tank.damage()).toEqual({
      destroyed: false,
      lifeLost: false,
      scoreValue: 0,
    })
    expect(tank.hitPoints).toBe(1)
    expect(tank.alive).toBe(true)

    expect(tank.damage()).toEqual({
      destroyed: true,
      lifeLost: false,
      scoreValue: 200,
    })
    expect(tank.hitPoints).toBe(0)
    expect(tank.alive).toBe(false)
  })

  it('decrements player lives and only dies when lives reach zero', () => {
    const tank = new Tank({
      position: { x: 0, y: 0 },
      size: { x: 32, y: 32 },
      faction: 'player',
      lives: 2,
    })

    expect(tank.damage()).toEqual({
      destroyed: false,
      lifeLost: true,
      scoreValue: 0,
    })
    expect(tank.lives).toBe(1)
    expect(tank.alive).toBe(true)

    expect(tank.damage()).toEqual({
      destroyed: true,
      lifeLost: true,
      scoreValue: 0,
    })
    expect(tank.lives).toBe(0)
    expect(tank.alive).toBe(false)
  })

  it('rejects invalid damage state', () => {
    expect(
      () =>
        new Tank({
          position: { x: 0, y: 0 },
          size: { x: 32, y: 32 },
          faction: 'enemy',
          speed: -1,
        }),
    ).toThrow('Tank speed must be a finite, non-negative number.')

    expect(
      () =>
        new Tank({
          position: { x: 0, y: 0 },
          size: { x: 32, y: 32 },
          faction: 'enemy',
          hitPoints: 0,
        }),
    ).toThrow('Tank hit points must be a positive integer.')

    const tank = new Tank({
      position: { x: 0, y: 0 },
      size: { x: 32, y: 32 },
      faction: 'enemy',
    })

    expect(() => tank.damage(0)).toThrow(
      'Tank damage amount must be a positive integer.',
    )
  })
})
