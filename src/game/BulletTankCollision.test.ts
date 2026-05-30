import { describe, expect, it } from 'vitest'
import { Bullet } from '../entities/Bullet'
import { Explosion } from '../entities/Explosion'
import { Tank } from '../entities/Tank'
import { resolveBulletTankCollisions } from './BulletTankCollision'

const createBullet = (owner: 'player' | 'enemy'): Bullet =>
  new Bullet({
    position: { x: 12, y: 12 },
    size: { x: 6, y: 6 },
    direction: 'right',
    owner,
    speed: 100,
  })

const createTank = (
  faction: 'player' | 'enemy',
  options: Partial<ConstructorParameters<typeof Tank>[0]> = {},
): Tank =>
  new Tank({
    position: { x: 0, y: 0 },
    size: { x: 32, y: 32 },
    faction,
    ...options,
  })

describe('resolveBulletTankCollisions', () => {
  it('destroys an enemy tank, despawns the bullet, awards score, and spawns an explosion', () => {
    const bullet = createBullet('player')
    const enemy = createTank('enemy', { scoreValue: 100 })
    const scoreState = { score: 25 }

    const results = resolveBulletTankCollisions([bullet], [enemy], scoreState)

    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({
      bullet,
      tank: enemy,
      tankDestroyed: true,
      playerLifeLost: false,
      scoreAwarded: 100,
    })
    expect(results[0]?.explosion).toBeInstanceOf(Explosion)
    expect(bullet.alive).toBe(false)
    expect(enemy.alive).toBe(false)
    expect(scoreState.score).toBe(125)
  })

  it('damages but does not score for an enemy that survives', () => {
    const bullet = createBullet('player')
    const enemy = createTank('enemy', { hitPoints: 2, scoreValue: 100 })
    const scoreState = { score: 0 }

    const results = resolveBulletTankCollisions([bullet], [enemy], scoreState)

    expect(results).toHaveLength(1)
    expect(results[0]?.tankDestroyed).toBe(false)
    expect(results[0]?.scoreAwarded).toBe(0)
    expect(enemy.hitPoints).toBe(1)
    expect(enemy.alive).toBe(true)
    expect(scoreState.score).toBe(0)
  })

  it('makes the player lose a life when hit by an enemy bullet', () => {
    const bullet = createBullet('enemy')
    const player = createTank('player', { lives: 3 })
    const scoreState = { score: 0 }

    const results = resolveBulletTankCollisions([bullet], [player], scoreState)

    expect(results).toHaveLength(1)
    expect(results[0]?.playerLifeLost).toBe(true)
    expect(results[0]?.tankDestroyed).toBe(false)
    expect(player.lives).toBe(2)
    expect(player.alive).toBe(true)
    expect(scoreState.score).toBe(0)
    expect(bullet.alive).toBe(false)
  })

  it('ignores friendly fire', () => {
    const playerBullet = createBullet('player')
    const enemyBullet = createBullet('enemy')
    const player = createTank('player', { lives: 3 })
    const enemy = createTank('enemy', { scoreValue: 100 })

    const results = resolveBulletTankCollisions(
      [playerBullet, enemyBullet],
      [player, enemy],
      { score: 0 },
    )

    expect(results).toHaveLength(2)
    expect(results.map((result) => result.tank.faction)).toEqual([
      'enemy',
      'player',
    ])
    expect(player.lives).toBe(2)
    expect(enemy.alive).toBe(false)
  })

  it('does not consume bullets or damage tanks for same-faction collisions', () => {
    const bullet = createBullet('player')
    const player = createTank('player', { lives: 3 })

    const results = resolveBulletTankCollisions([bullet], [player], {
      score: 0,
    })

    expect(results).toEqual([])
    expect(bullet.alive).toBe(true)
    expect(player.lives).toBe(3)
    expect(player.alive).toBe(true)
  })

  it('does nothing when bullets do not overlap tanks', () => {
    const bullet = createBullet('player')
    const enemy = createTank('enemy', {
      position: { x: 100, y: 100 },
      scoreValue: 100,
    })

    const results = resolveBulletTankCollisions([bullet], [enemy], { score: 0 })

    expect(results).toEqual([])
    expect(bullet.alive).toBe(true)
    expect(enemy.alive).toBe(true)
  })
})
