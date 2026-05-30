import { describe, expect, it } from 'vitest'
import { decideEnemyAiAction } from './EnemyAi'

const randomSequence = (values: number[]): (() => number) => {
  let index = 0

  return (): number => {
    const value = values[index]
    index += 1

    if (value === undefined) {
      throw new Error('Random sequence was exhausted.')
    }

    return value
  }
}

const enemy = {
  position: { x: 32, y: 32 },
  size: { x: 32, y: 32 },
  direction: 'left' as const,
}

describe('decideEnemyAiAction', () => {
  it('keeps moving in the current direction while not blocked and timer remains', () => {
    const decision = decideEnemyAiAction({
      enemy,
      blocked: false,
      turnTimerSeconds: 1,
      dt: 0.25,
      random: randomSequence([]),
    })

    expect(decision).toEqual({
      direction: 'left',
      nextTurnTimerSeconds: 0.75,
      shouldShoot: false,
      reason: 'continue',
    })
  })

  it('picks a random direction when blocked and resets the turn timer', () => {
    const decision = decideEnemyAiAction({
      enemy,
      blocked: true,
      turnTimerSeconds: 1,
      dt: 0.25,
      random: randomSequence([0.75, 0.5]),
      options: {
        minTurnIntervalSeconds: 1,
        maxTurnIntervalSeconds: 3,
      },
    })

    expect(decision).toEqual({
      direction: 'right',
      nextTurnTimerSeconds: 2,
      shouldShoot: false,
      reason: 'blocked',
    })
  })

  it('picks a random direction when the turn timer expires', () => {
    const decision = decideEnemyAiAction({
      enemy,
      blocked: false,
      turnTimerSeconds: 0.1,
      dt: 0.2,
      random: randomSequence([0.25, 0]),
      options: {
        minTurnIntervalSeconds: 1,
        maxTurnIntervalSeconds: 2,
      },
    })

    expect(decision).toEqual({
      direction: 'down',
      nextTurnTimerSeconds: 1,
      shouldShoot: false,
      reason: 'timer',
    })
  })

  it('occasionally aims toward an aligned player and shoots', () => {
    const decision = decideEnemyAiAction({
      enemy,
      player: {
        position: { x: 32, y: 96 },
        size: { x: 32, y: 32 },
      },
      blocked: false,
      turnTimerSeconds: 1,
      dt: 0.1,
      random: randomSequence([0.1]),
      options: {
        aimChance: 1,
      },
    })

    expect(decision).toEqual({
      direction: 'down',
      nextTurnTimerSeconds: 0.9,
      shouldShoot: true,
      reason: 'aim',
    })
  })

  it('aims at the base when the player is not aligned', () => {
    const decision = decideEnemyAiAction({
      enemy,
      player: {
        position: { x: 0, y: 0 },
        size: { x: 32, y: 32 },
      },
      base: {
        position: { x: 96, y: 32 },
        size: { x: 32, y: 32 },
      },
      blocked: false,
      turnTimerSeconds: 1,
      dt: 0,
      random: randomSequence([0]),
      options: {
        aimChance: 1,
      },
    })

    expect(decision.direction).toBe('right')
    expect(decision.shouldShoot).toBe(true)
    expect(decision.reason).toBe('aim')
  })

  it('shoots when already facing an aligned target without changing direction', () => {
    const decision = decideEnemyAiAction({
      enemy: {
        ...enemy,
        direction: 'up',
      },
      player: {
        position: { x: 32, y: -32 },
        size: { x: 32, y: 32 },
      },
      blocked: false,
      turnTimerSeconds: 1,
      dt: 0,
      random: randomSequence([0.5]),
      options: {
        aimChance: 0,
      },
    })

    expect(decision).toEqual({
      direction: 'up',
      nextTurnTimerSeconds: 1,
      shouldShoot: true,
      reason: 'continue',
    })
  })

  it('uses an aimed direction instead of random direction when blocked', () => {
    const decision = decideEnemyAiAction({
      enemy,
      player: {
        position: { x: 32, y: -32 },
        size: { x: 32, y: 32 },
      },
      blocked: true,
      turnTimerSeconds: 1,
      dt: 0,
      random: randomSequence([0.1, 0.5]),
      options: {
        aimChance: 1,
        minTurnIntervalSeconds: 1,
        maxTurnIntervalSeconds: 2,
      },
    })

    expect(decision).toEqual({
      direction: 'up',
      nextTurnTimerSeconds: 1.5,
      shouldShoot: true,
      reason: 'aim',
    })
  })

  it('rejects invalid options and random values', () => {
    expect(() =>
      decideEnemyAiAction({
        enemy,
        blocked: false,
        turnTimerSeconds: 0,
        dt: -1,
        random: randomSequence([]),
      }),
    ).toThrow('Enemy AI delta time must be a finite, non-negative number.')

    expect(() =>
      decideEnemyAiAction({
        enemy,
        blocked: true,
        turnTimerSeconds: 0,
        dt: 0,
        random: randomSequence([]),
        availableDirections: [],
      }),
    ).toThrow('Enemy AI requires at least one available direction.')

    expect(() =>
      decideEnemyAiAction({
        enemy,
        blocked: true,
        turnTimerSeconds: 0,
        dt: 0,
        random: randomSequence([1]),
      }),
    ).toThrow('Enemy AI random values must be in the range [0, 1).')

    expect(() =>
      decideEnemyAiAction({
        enemy,
        blocked: false,
        turnTimerSeconds: 0,
        dt: 0,
        random: randomSequence([]),
        options: {
          minTurnIntervalSeconds: 2,
          maxTurnIntervalSeconds: 1,
        },
      }),
    ).toThrow(
      'Enemy AI maximum turn interval must be greater than or equal to the minimum.',
    )
  })
})
