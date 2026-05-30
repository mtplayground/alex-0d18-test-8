import { describe, expect, it, vi } from 'vitest'
import type { BulletTankCollisionResult } from '../game/BulletTankCollision'
import type { BulletTerrainCollisionResult } from '../game/BulletTerrainCollision'
import type { PowerUpPickupResult } from '../game/PowerUps'
import {
  playGameOverSound,
  playPickupSounds,
  playShootSound,
  playTankCollisionSounds,
  playTerrainHitSound,
  playVictorySound,
  type SoundEffectPlayer,
} from './GameSoundEffects'

const createPlayer = (): SoundEffectPlayer & {
  play: ReturnType<typeof vi.fn>
} => ({
  play: vi.fn(() => true),
})

describe('GameSoundEffects', () => {
  it('plays player shoot sounds', () => {
    const player = createPlayer()

    expect(playShootSound(player)).toBe(true)

    expect(player.play).toHaveBeenCalledWith('player-fire')
  })

  it('plays terrain hit sounds only for actual wall hits', () => {
    const player = createPlayer()

    playTerrainHitSound(player, {
      hit: false,
    } as BulletTerrainCollisionResult)
    playTerrainHitSound(player, {
      hit: true,
    } as BulletTerrainCollisionResult)

    expect(player.play).toHaveBeenCalledTimes(1)
    expect(player.play).toHaveBeenCalledWith('terrain-hit')
  })

  it('maps tank collision results to hit and destroyed sounds', () => {
    const player = createPlayer()

    playTankCollisionSounds(player, [
      { tankDestroyed: false },
      { tankDestroyed: true },
    ] as BulletTankCollisionResult[])

    expect(player.play).toHaveBeenNthCalledWith(1, 'tank-hit')
    expect(player.play).toHaveBeenNthCalledWith(2, 'tank-destroyed')
  })

  it('plays a pickup sound for each pickup result', () => {
    const player = createPlayer()

    playPickupSounds(player, [{}, {}] as PowerUpPickupResult[])

    expect(player.play).toHaveBeenCalledTimes(2)
    expect(player.play).toHaveBeenCalledWith('power-up')
  })

  it('plays terminal scene sounds', () => {
    const player = createPlayer()

    playGameOverSound(player)
    playVictorySound(player)

    expect(player.play).toHaveBeenNthCalledWith(1, 'game-over')
    expect(player.play).toHaveBeenNthCalledWith(2, 'victory')
  })
})
