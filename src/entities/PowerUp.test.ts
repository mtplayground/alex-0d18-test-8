import { describe, expect, it } from 'vitest'
import {
  assertPowerUpType,
  isPowerUpType,
  PowerUp,
  POWER_UP_DEFINITIONS,
} from './PowerUp'

describe('PowerUp', () => {
  it('stores its type and uses the shared definition table', () => {
    const powerUp = new PowerUp({
      position: { x: 10, y: 20 },
      size: { x: 24, y: 24 },
      type: 'weapon-upgrade',
    })

    expect(powerUp.type).toBe('weapon-upgrade')
    expect(POWER_UP_DEFINITIONS['weapon-upgrade'].durationSeconds).toBe(8)
  })

  it('exposes type guards and rejects invalid types', () => {
    expect(isPowerUpType('extra-life')).toBe(true)
    expect(isPowerUpType('base-shield')).toBe(true)
    expect(isPowerUpType('weapon-upgrade')).toBe(true)
    expect(isPowerUpType('freeze-enemies')).toBe(true)
    expect(isPowerUpType('invalid')).toBe(false)
    expect(assertPowerUpType('extra-life')).toBe('extra-life')
    expect(() => assertPowerUpType('invalid')).toThrow(
      'Invalid power-up type: invalid.',
    )
  })
})
