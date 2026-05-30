import { describe, expect, it } from 'vitest'
import {
  assertEnemyTankType,
  EnemyTank,
  ENEMY_TANK_DEFINITIONS,
  isEnemyTankType,
} from './EnemyTank'
import { Tank } from './Tank'

const baseOptions = {
  position: { x: 10, y: 20 },
  size: { x: 32, y: 32 },
}

describe('EnemyTank', () => {
  it('defaults to the basic enemy variant', () => {
    const tank = new EnemyTank(baseOptions)
    const definition = ENEMY_TANK_DEFINITIONS.basic

    expect(tank).toBeInstanceOf(Tank)
    expect(tank.type).toBe('basic')
    expect(tank.faction).toBe('enemy')
    expect(tank.speed).toBe(definition.speed)
    expect(tank.hitPoints).toBe(definition.hitPoints)
    expect(tank.scoreValue).toBe(definition.scoreValue)
    expect(tank.powerUpType).toBeNull()
  })

  it('applies fast and armored variant stats', () => {
    const fast = new EnemyTank({ ...baseOptions, type: 'fast' })
    const armored = new EnemyTank({ ...baseOptions, type: 'armored' })

    expect(fast.speed).toBe(ENEMY_TANK_DEFINITIONS.fast.speed)
    expect(fast.hitPoints).toBe(ENEMY_TANK_DEFINITIONS.fast.hitPoints)
    expect(fast.scoreValue).toBe(ENEMY_TANK_DEFINITIONS.fast.scoreValue)
    expect(armored.speed).toBe(ENEMY_TANK_DEFINITIONS.armored.speed)
    expect(armored.hitPoints).toBe(ENEMY_TANK_DEFINITIONS.armored.hitPoints)
    expect(armored.scoreValue).toBe(ENEMY_TANK_DEFINITIONS.armored.scoreValue)
  })

  it('can be flagged to drop a power-up', () => {
    const tank = new EnemyTank({
      ...baseOptions,
      powerUpType: 'extra-life',
    })

    expect(tank.powerUpType).toBe('extra-life')
  })

  it('exposes type guards and rejects invalid types', () => {
    expect(isEnemyTankType('basic')).toBe(true)
    expect(isEnemyTankType('fast')).toBe(true)
    expect(isEnemyTankType('armored')).toBe(true)
    expect(isEnemyTankType('heavy')).toBe(false)
    expect(assertEnemyTankType('fast')).toBe('fast')
    expect(() => assertEnemyTankType('heavy')).toThrow(
      'Invalid enemy tank type: heavy.',
    )
  })
})
