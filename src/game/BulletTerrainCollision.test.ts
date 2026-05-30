import { describe, expect, it } from 'vitest'
import { Bullet } from '../entities/Bullet'
import { BrickQuadrant } from '../tiles/BrickDamage'
import { TileGrid } from '../tiles/TileGrid'
import { TileType } from '../tiles/TileTypes'
import { resolveBulletTerrainCollision } from './BulletTerrainCollision'

const createGridWithTile = (tileType: TileType): TileGrid => {
  const grid = new TileGrid(3, 3, 32)
  grid.set(1, 1, tileType)
  return grid
}

const createBulletAtTile = (
  options: Partial<ConstructorParameters<typeof Bullet>[0]> = {},
): Bullet =>
  new Bullet({
    position: { x: 42, y: 58 },
    size: { x: 4, y: 4 },
    direction: 'up',
    owner: 'player',
    speed: 100,
    ...options,
  })

describe('resolveBulletTerrainCollision', () => {
  it('damages the impacted brick quadrant and despawns the bullet', () => {
    const grid = createGridWithTile(TileType.Brick)
    const bullet = createBulletAtTile()

    const result = resolveBulletTerrainCollision(bullet, grid)

    expect(result).toMatchObject({
      hit: true,
      tileType: TileType.Brick,
      tile: { x: 1, y: 1 },
      brickQuadrant: BrickQuadrant.BottomLeft,
      baseDestroyed: false,
    })
    expect(bullet.alive).toBe(false)
    expect(grid.get(1, 1)).toBe(TileType.Brick)
    expect(grid.getBrickDamage(1, 1)).toEqual({
      [BrickQuadrant.TopLeft]: false,
      [BrickQuadrant.TopRight]: false,
      [BrickQuadrant.BottomLeft]: true,
      [BrickQuadrant.BottomRight]: false,
    })
  })

  it('passes through an already destroyed brick quadrant', () => {
    const grid = createGridWithTile(TileType.Brick)
    const bullet = createBulletAtTile()
    grid.damageQuadrant(1, 1, BrickQuadrant.BottomLeft)

    const result = resolveBulletTerrainCollision(bullet, grid)

    expect(result.hit).toBe(false)
    expect(bullet.alive).toBe(true)
    expect(grid.get(1, 1)).toBe(TileType.Brick)
    expect(grid.getBrickDamage(1, 1)?.[BrickQuadrant.BottomLeft]).toBe(true)
  })

  it('leaves steel intact while despawning the bullet', () => {
    const grid = createGridWithTile(TileType.Steel)
    const bullet = createBulletAtTile()

    const result = resolveBulletTerrainCollision(bullet, grid)

    expect(result).toMatchObject({
      hit: true,
      tileType: TileType.Steel,
      tile: { x: 1, y: 1 },
      brickQuadrant: null,
      baseDestroyed: false,
    })
    expect(bullet.alive).toBe(false)
    expect(grid.get(1, 1)).toBe(TileType.Steel)
  })

  it.each([TileType.Water, TileType.Grass, TileType.Empty, TileType.Ice])(
    'lets bullets pass over %s',
    (tileType) => {
      const grid = createGridWithTile(tileType)
      const bullet = createBulletAtTile()

      const result = resolveBulletTerrainCollision(bullet, grid)

      expect(result.hit).toBe(false)
      expect(bullet.alive).toBe(true)
      expect(grid.get(1, 1)).toBe(tileType)
    },
  )

  it('destroys the base and despawns the bullet', () => {
    const grid = createGridWithTile(TileType.Base)
    const bullet = createBulletAtTile()

    const result = resolveBulletTerrainCollision(bullet, grid)

    expect(result).toMatchObject({
      hit: true,
      tileType: TileType.Base,
      tile: { x: 1, y: 1 },
      brickQuadrant: null,
      baseDestroyed: true,
    })
    expect(bullet.alive).toBe(false)
    expect(grid.get(1, 1)).toBe(TileType.Empty)
  })

  it('does nothing when the bullet impact point is outside the grid', () => {
    const grid = createGridWithTile(TileType.Steel)
    const bullet = createBulletAtTile({
      position: { x: -20, y: -20 },
    })

    const result = resolveBulletTerrainCollision(bullet, grid)

    expect(result.hit).toBe(false)
    expect(bullet.alive).toBe(true)
    expect(grid.get(1, 1)).toBe(TileType.Steel)
  })
})
