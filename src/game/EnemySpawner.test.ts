import { describe, expect, it } from 'vitest'
import { EnemyTank } from '../entities/EnemyTank'
import { SpawnFlash } from '../entities/SpawnFlash'
import { EnemySpawner } from './EnemySpawner'

const spawnPoints = [
  { x: 0, y: 0 },
  { x: 160, y: 0 },
  { x: 320, y: 0 },
]

const createSpawner = (
  options: Partial<ConstructorParameters<typeof EnemySpawner>[0]> = {},
): EnemySpawner =>
  new EnemySpawner({
    spawnPoints,
    enemySize: { x: 32, y: 32 },
    wave: [{ type: 'basic', count: 2 }, { type: 'fast' }, { type: 'armored' }],
    spawnCooldownSeconds: 0,
    ...options,
  })

describe('EnemySpawner', () => {
  it('spawns enemies from the wave queue at three top spawn points', () => {
    const spawner = createSpawner()

    const first = spawner.update(0, [])
    const second = spawner.update(0, first ? [first.enemy] : [])
    const third = spawner.update(
      0,
      [first, second].flatMap((result) => (result ? [result.enemy] : [])),
    )

    expect(first?.enemy).toBeInstanceOf(EnemyTank)
    expect(first?.flash).toBeInstanceOf(SpawnFlash)
    expect(first?.enemy.type).toBe('basic')
    expect(first?.enemy.position).toEqual(spawnPoints[0])
    expect(first?.flash.position).toEqual(spawnPoints[0])
    expect(second?.enemy.type).toBe('basic')
    expect(second?.enemy.position).toEqual(spawnPoints[1])
    expect(third?.enemy.type).toBe('fast')
    expect(third?.enemy.position).toEqual(spawnPoints[2])
    expect(spawner.remainingEnemies).toBe(1)
  })

  it('caps concurrent active enemies and keeps the wave queued', () => {
    const spawner = createSpawner({ maxActiveEnemies: 1 })
    const activeEnemy = new EnemyTank({
      position: { x: 0, y: 0 },
      size: { x: 32, y: 32 },
      type: 'basic',
    })

    expect(spawner.update(0, [activeEnemy])).toBeNull()
    expect(spawner.remainingEnemies).toBe(4)

    activeEnemy.alive = false

    const result = spawner.update(0, [activeEnemy])

    expect(result?.enemy.type).toBe('basic')
    expect(spawner.remainingEnemies).toBe(3)
  })

  it('continues spawning until the wave pool is exhausted', () => {
    const spawner = createSpawner({
      wave: [{ type: 'basic' }, { type: 'armored' }],
    })

    const first = spawner.update(0, [])
    const second = spawner.update(0, first ? [first.enemy] : [])
    const third = spawner.update(
      0,
      [first, second].flatMap((result) => (result ? [result.enemy] : [])),
    )

    expect(first?.enemy.type).toBe('basic')
    expect(second?.enemy.type).toBe('armored')
    expect(third).toBeNull()
    expect(spawner.remainingEnemies).toBe(0)
    expect(spawner.isExhausted).toBe(true)
  })

  it('waits for spawn cooldown before spawning another enemy', () => {
    const spawner = createSpawner({
      spawnCooldownSeconds: 1,
      wave: [{ type: 'basic', count: 2 }],
    })

    const first = spawner.update(0, [])

    expect(first).not.toBeNull()
    expect(spawner.update(0.5, first ? [first.enemy] : [])).toBeNull()
    expect(spawner.remainingEnemies).toBe(1)

    const second = spawner.update(0.5, first ? [first.enemy] : [])

    expect(second?.enemy.type).toBe('basic')
    expect(spawner.remainingEnemies).toBe(0)
  })

  it('rejects invalid configuration', () => {
    expect(
      () =>
        new EnemySpawner({
          spawnPoints: spawnPoints.slice(0, 2),
          enemySize: { x: 32, y: 32 },
          wave: [],
        }),
    ).toThrow('EnemySpawner requires exactly three spawn points.')

    expect(() =>
      createSpawner({
        wave: [{ type: 'basic', count: 0 }],
      }),
    ).toThrow('Enemy wave entry count must be a positive integer.')

    expect(() =>
      createSpawner({
        maxActiveEnemies: 0,
      }),
    ).toThrow('EnemySpawner max active enemy count must be a positive integer.')

    expect(() => createSpawner().update(-1, [])).toThrow(
      'EnemySpawner update delta time must be a finite, non-negative number.',
    )
  })
})
