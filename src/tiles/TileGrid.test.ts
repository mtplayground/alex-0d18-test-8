import { describe, expect, it } from 'vitest'
import { TileGrid } from './TileGrid'
import { assertTileType, isTileType, TileType } from './TileTypes'

describe('TileType', () => {
  it('defines the supported tile types', () => {
    expect(Object.values(TileType)).toEqual([
      'empty',
      'brick',
      'steel',
      'water',
      'grass',
      'ice',
      'base',
    ])
  })

  it('validates tile type values', () => {
    expect(isTileType(TileType.Brick)).toBe(true)
    expect(isTileType('lava')).toBe(false)
    expect(assertTileType(TileType.Water)).toBe(TileType.Water)
    expect(() => assertTileType('lava')).toThrow('Invalid tile type: lava.')
  })
})

describe('TileGrid', () => {
  it('creates an empty grid with dimensions and world dimensions', () => {
    const grid = new TileGrid(3, 2, 16)

    expect(grid.width).toBe(3)
    expect(grid.height).toBe(2)
    expect(grid.tileSize).toBe(16)
    expect(grid.worldWidth).toBe(48)
    expect(grid.worldHeight).toBe(32)
    expect(grid.toArray()).toEqual([
      TileType.Empty,
      TileType.Empty,
      TileType.Empty,
      TileType.Empty,
      TileType.Empty,
      TileType.Empty,
    ])
  })

  it('gets, sets, and fills tile values', () => {
    const grid = new TileGrid(2, 2, 8, TileType.Water)

    expect(grid.get(0, 0)).toBe(TileType.Water)

    grid.set(1, 0, TileType.Brick)
    grid.set(0, 1, TileType.Steel)
    grid.set(1, 1, TileType.Base)

    expect(grid.toArray()).toEqual([
      TileType.Water,
      TileType.Brick,
      TileType.Steel,
      TileType.Base,
    ])

    grid.fill(TileType.Grass)

    expect(grid.toArray()).toEqual([
      TileType.Grass,
      TileType.Grass,
      TileType.Grass,
      TileType.Grass,
    ])
  })

  it('converts between world coordinates and grid coordinates', () => {
    const grid = new TileGrid(4, 4, 16)

    expect(grid.worldToGrid({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 })
    expect(grid.worldToGrid({ x: 15.999, y: 16 })).toEqual({ x: 0, y: 1 })
    expect(grid.worldToGrid({ x: 32, y: 47.999 })).toEqual({ x: 2, y: 2 })
    expect(grid.worldToGrid({ x: -1, y: -16 })).toEqual({ x: -1, y: -1 })
    expect(grid.gridToWorld(2, 3)).toEqual({ x: 32, y: 48 })
  })

  it('checks bounds for integer grid coordinates', () => {
    const grid = new TileGrid(2, 3, 8)

    expect(grid.isInBounds(0, 0)).toBe(true)
    expect(grid.isInBounds(1, 2)).toBe(true)
    expect(grid.isInBounds(2, 0)).toBe(false)
    expect(grid.isInBounds(0, 3)).toBe(false)
    expect(grid.isInBounds(-1, 0)).toBe(false)
    expect(grid.isInBounds(0.5, 0)).toBe(false)
  })

  it('rejects invalid dimensions, coordinates, and tile values', () => {
    expect(() => new TileGrid(0, 2, 8)).toThrow(
      'TileGrid width must be a positive integer.',
    )
    expect(() => new TileGrid(2, 2, 0)).toThrow(
      'TileGrid tile size must be greater than zero.',
    )

    const grid = new TileGrid(2, 2, 8)

    expect(() => grid.get(2, 0)).toThrow(
      'Tile coordinate (2, 0) is outside the 2x2 grid.',
    )
    expect(() => grid.set(0, 0, 'lava' as TileType)).toThrow(
      'Invalid tile type: lava.',
    )
    expect(() => grid.gridToWorld(-1, 0)).toThrow(
      'Tile coordinate (-1, 0) is outside the 2x2 grid.',
    )
    expect(() => grid.worldToGrid({ x: Number.NaN, y: 0 })).toThrow(
      'World position must contain finite x and y values.',
    )
  })
})
