import { EnemyTank } from '../entities/EnemyTank'
import type { Vector2 } from '../entities/Entity'
import {
  PowerUp,
  POWER_UP_DEFINITIONS,
  type PowerUpType,
} from '../entities/PowerUp'
import { Tank } from '../entities/Tank'
import { boxesOverlap, type AABB } from '../physics/aabb'

export interface PowerUpEffectState {
  baseShieldRemainingSeconds: number
  weaponUpgradeRemainingSeconds: number
  freezeEnemiesRemainingSeconds: number
  weaponLevel: number
}

export interface PowerUpPickupResult {
  powerUp: PowerUp
  type: PowerUpType
}

export const createPowerUpEffectState = (): PowerUpEffectState => ({
  baseShieldRemainingSeconds: 0,
  weaponUpgradeRemainingSeconds: 0,
  freezeEnemiesRemainingSeconds: 0,
  weaponLevel: 1,
})

const entityToAabb = (entity: {
  position: { x: number; y: number }
  size: { x: number; y: number }
}): AABB => ({
  x: entity.position.x,
  y: entity.position.y,
  width: entity.size.x,
  height: entity.size.y,
})

const getEntityCenter = (entity: {
  position: { x: number; y: number }
  size: { x: number; y: number }
}): Vector2 => ({
  x: entity.position.x + entity.size.x / 2,
  y: entity.position.y + entity.size.y / 2,
})

const assertNonNegativeFinite = (name: string, value: number): void => {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be a finite, non-negative number.`)
  }
}

const setDuration = (state: PowerUpEffectState, type: PowerUpType): void => {
  const duration = POWER_UP_DEFINITIONS[type].durationSeconds

  if (duration === null) {
    return
  }

  switch (type) {
    case 'base-shield':
      state.baseShieldRemainingSeconds = Math.max(
        state.baseShieldRemainingSeconds,
        duration,
      )
      return
    case 'weapon-upgrade':
      state.weaponUpgradeRemainingSeconds = Math.max(
        state.weaponUpgradeRemainingSeconds,
        duration,
      )
      state.weaponLevel = 2
      return
    case 'freeze-enemies':
      state.freezeEnemiesRemainingSeconds = Math.max(
        state.freezeEnemiesRemainingSeconds,
        duration,
      )
      return
    case 'extra-life':
      return
  }
}

export const applyPowerUpEffect = (
  type: PowerUpType,
  player: Tank,
  state: PowerUpEffectState,
): void => {
  if (type === 'extra-life') {
    player.lives += 1
    return
  }

  setDuration(state, type)
}

export const updatePowerUpEffects = (
  state: PowerUpEffectState,
  dt: number,
): void => {
  assertNonNegativeFinite('Power-up effect delta time', dt)

  state.baseShieldRemainingSeconds = Math.max(
    0,
    state.baseShieldRemainingSeconds - dt,
  )
  state.weaponUpgradeRemainingSeconds = Math.max(
    0,
    state.weaponUpgradeRemainingSeconds - dt,
  )
  state.freezeEnemiesRemainingSeconds = Math.max(
    0,
    state.freezeEnemiesRemainingSeconds - dt,
  )

  if (state.weaponUpgradeRemainingSeconds === 0) {
    state.weaponLevel = 1
  }
}

export const isBaseShieldActive = (state: PowerUpEffectState): boolean =>
  state.baseShieldRemainingSeconds > 0

export const areEnemiesFrozen = (state: PowerUpEffectState): boolean =>
  state.freezeEnemiesRemainingSeconds > 0

export const isWeaponUpgraded = (state: PowerUpEffectState): boolean =>
  state.weaponUpgradeRemainingSeconds > 0

export const createPowerUpDrop = (enemy: EnemyTank): PowerUp | null => {
  if (!enemy.powerUpType) {
    return null
  }

  const size = { x: 24, y: 24 }
  const center = getEntityCenter(enemy)

  return new PowerUp({
    position: {
      x: center.x - size.x / 2,
      y: center.y - size.y / 2,
    },
    size,
    type: enemy.powerUpType,
  })
}

export const resolvePowerUpPickups = (
  powerUps: readonly PowerUp[],
  player: Tank,
  state: PowerUpEffectState,
): PowerUpPickupResult[] => {
  if (!player.alive) {
    return []
  }

  const results: PowerUpPickupResult[] = []
  const playerBox = entityToAabb(player)

  for (const powerUp of powerUps) {
    if (!powerUp.alive || !boxesOverlap(playerBox, entityToAabb(powerUp))) {
      continue
    }

    powerUp.alive = false
    applyPowerUpEffect(powerUp.type, player, state)
    results.push({
      powerUp,
      type: powerUp.type,
    })
  }

  return results
}
