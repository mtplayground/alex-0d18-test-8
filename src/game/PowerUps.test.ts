import { describe, expect, it } from 'vitest'
import { EnemyTank } from '../entities/EnemyTank'
import { PowerUp } from '../entities/PowerUp'
import { Tank } from '../entities/Tank'
import {
  applyPowerUpEffect,
  areEnemiesFrozen,
  createPowerUpDrop,
  createPowerUpEffectState,
  isBaseShieldActive,
  isWeaponUpgraded,
  resolvePowerUpPickups,
  updatePowerUpEffects,
} from './PowerUps'

const createPlayer = (): Tank =>
  new Tank({
    position: { x: 0, y: 0 },
    size: { x: 32, y: 32 },
    faction: 'player',
    lives: 3,
  })

describe('PowerUps', () => {
  it('applies extra life immediately', () => {
    const player = createPlayer()
    const state = createPowerUpEffectState()

    applyPowerUpEffect('extra-life', player, state)

    expect(player.lives).toBe(4)
    expect(state).toEqual(createPowerUpEffectState())
  })

  it('applies and expires duration-based effects', () => {
    const player = createPlayer()
    const state = createPowerUpEffectState()

    applyPowerUpEffect('base-shield', player, state)
    applyPowerUpEffect('weapon-upgrade', player, state)
    applyPowerUpEffect('freeze-enemies', player, state)

    expect(isBaseShieldActive(state)).toBe(true)
    expect(isWeaponUpgraded(state)).toBe(true)
    expect(areEnemiesFrozen(state)).toBe(true)
    expect(state.weaponLevel).toBe(2)

    updatePowerUpEffects(state, 10)

    expect(isBaseShieldActive(state)).toBe(false)
    expect(isWeaponUpgraded(state)).toBe(false)
    expect(areEnemiesFrozen(state)).toBe(false)
    expect(state.weaponLevel).toBe(1)
  })

  it('keeps the longer remaining duration when reapplying an effect', () => {
    const player = createPlayer()
    const state = createPowerUpEffectState()
    state.baseShieldRemainingSeconds = 20

    applyPowerUpEffect('base-shield', player, state)

    expect(state.baseShieldRemainingSeconds).toBe(20)
  })

  it('creates drops only for flagged enemies', () => {
    const flagged = new EnemyTank({
      position: { x: 10, y: 20 },
      size: { x: 32, y: 32 },
      type: 'basic',
      powerUpType: 'base-shield',
    })
    const unflagged = new EnemyTank({
      position: { x: 10, y: 20 },
      size: { x: 32, y: 32 },
      type: 'basic',
    })

    const drop = createPowerUpDrop(flagged)

    expect(drop).toBeInstanceOf(PowerUp)
    expect(drop?.type).toBe('base-shield')
    expect(drop?.position).toEqual({ x: 14, y: 24 })
    expect(createPowerUpDrop(unflagged)).toBeNull()
  })

  it('picks up overlapping power-ups and marks them dead', () => {
    const player = createPlayer()
    const state = createPowerUpEffectState()
    const overlapping = new PowerUp({
      position: { x: 16, y: 16 },
      size: { x: 24, y: 24 },
      type: 'extra-life',
    })
    const separate = new PowerUp({
      position: { x: 100, y: 100 },
      size: { x: 24, y: 24 },
      type: 'freeze-enemies',
    })

    const results = resolvePowerUpPickups(
      [overlapping, separate],
      player,
      state,
    )

    expect(results).toHaveLength(1)
    expect(results[0]?.type).toBe('extra-life')
    expect(overlapping.alive).toBe(false)
    expect(separate.alive).toBe(true)
    expect(player.lives).toBe(4)
  })

  it('rejects invalid effect update deltas', () => {
    expect(() => updatePowerUpEffects(createPowerUpEffectState(), -1)).toThrow(
      'Power-up effect delta time must be a finite, non-negative number.',
    )
  })
})
