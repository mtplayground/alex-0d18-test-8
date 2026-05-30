import { describe, expect, it } from 'vitest'
import { TileType } from '../tiles/TileTypes'
import { loadLevel } from './LevelLoader'
import type { LevelDefinition } from './LevelTypes'
import { STARTER_LEVELS } from './levels'

const level: LevelDefinition = {
  id: 'test',
  name: 'Test Level',
  tileSize: 16,
  enemySpawnPoints: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
  ],
  wave: [{ type: 'basic', powerUpType: 'extra-life' }],
  map: ['P#S', 'WGI', '.B.'],
}

describe('loadLevel', () => {
  it('loads ASCII tiles, spawn config, and wave data', () => {
    const loaded = loadLevel(level)

    expect(loaded.id).toBe('test')
    expect(loaded.name).toBe('Test Level')
    expect(loaded.grid.width).toBe(3)
    expect(loaded.grid.height).toBe(3)
    expect(loaded.grid.tileSize).toBe(16)
    expect(loaded.playerSpawn).toEqual({ x: 0, y: 0 })
    expect(loaded.basePosition).toEqual({ x: 1, y: 2 })
    expect(loaded.enemySpawnPoints).toEqual([
      { x: 0, y: 0 },
      { x: 16, y: 0 },
      { x: 32, y: 0 },
    ])
    expect(loaded.enemySize).toEqual({ x: 16, y: 16 })
    expect(loaded.wave).toEqual(level.wave)
    expect(loaded.grid.get(0, 0)).toBe(TileType.Empty)
    expect(loaded.grid.get(1, 0)).toBe(TileType.Brick)
    expect(loaded.grid.get(2, 0)).toBe(TileType.Steel)
    expect(loaded.grid.get(0, 1)).toBe(TileType.Water)
    expect(loaded.grid.get(1, 1)).toBe(TileType.Grass)
    expect(loaded.grid.get(2, 1)).toBe(TileType.Ice)
    expect(loaded.grid.get(1, 2)).toBe(TileType.Base)
  })

  it('rejects malformed maps and spawn config', () => {
    expect(() =>
      loadLevel({
        ...level,
        map: ['P', 'BB'],
      }),
    ).toThrow('Level map rows must all have the same width.')

    expect(() =>
      loadLevel({
        ...level,
        map: ['PXB'],
      }),
    ).toThrow('Invalid level map symbol: X.')

    expect(() =>
      loadLevel({
        ...level,
        map: ['...', '.B.'],
      }),
    ).toThrow('Level map must contain exactly one player spawn.')

    expect(() =>
      loadLevel({
        ...level,
        enemySpawnPoints: [{ x: 0, y: 0 }],
      }),
    ).toThrow('Level config must define exactly three enemy spawn points.')
  })

  it('ships three loadable starter levels', () => {
    expect(STARTER_LEVELS).toHaveLength(3)

    for (const starterLevel of STARTER_LEVELS) {
      const loaded = loadLevel(starterLevel)

      expect(loaded.grid.width).toBe(13)
      expect(loaded.grid.height).toBe(13)
      expect(loaded.enemySpawnPoints).toHaveLength(3)
      expect(loaded.wave.length).toBeGreaterThan(0)
    }
  })
})
