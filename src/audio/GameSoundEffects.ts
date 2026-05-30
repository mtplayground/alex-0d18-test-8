import type { BulletTankCollisionResult } from '../game/BulletTankCollision'
import type { BulletTerrainCollisionResult } from '../game/BulletTerrainCollision'
import type { PowerUpPickupResult } from '../game/PowerUps'
import type { SoundEffectId } from './sounds'

export interface SoundEffectPlayer {
  play: (key: SoundEffectId) => boolean
}

export const playShootSound = (player: SoundEffectPlayer): boolean =>
  player.play('player-fire')

export const playTerrainHitSound = (
  player: SoundEffectPlayer,
  result: BulletTerrainCollisionResult,
): boolean => (result.hit ? player.play('terrain-hit') : false)

export const playTankCollisionSounds = (
  player: SoundEffectPlayer,
  results: readonly BulletTankCollisionResult[],
): void => {
  for (const result of results) {
    player.play(result.tankDestroyed ? 'tank-destroyed' : 'tank-hit')
  }
}

export const playPickupSounds = (
  player: SoundEffectPlayer,
  results: readonly PowerUpPickupResult[],
): void => {
  for (let index = 0; index < results.length; index += 1) {
    player.play('power-up')
  }
}

export const playGameOverSound = (player: SoundEffectPlayer): boolean =>
  player.play('game-over')

export const playVictorySound = (player: SoundEffectPlayer): boolean =>
  player.play('victory')
