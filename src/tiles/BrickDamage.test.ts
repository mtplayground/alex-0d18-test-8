import { describe, expect, it } from 'vitest'
import {
  BrickQuadrant,
  createIntactBrickDamage,
  damageBrickQuadrant,
  getIntactBrickQuadrants,
  isBrickFullyDestroyed,
  renderPartialBrick,
} from './BrickDamage'
import { TileGrid } from './TileGrid'
import { TileType } from './TileTypes'

class CanvasContextSpy {
  public fillStyle: string | CanvasGradient | CanvasPattern = '#000000'
  public readonly fillRectCalls: number[][] = []

  public fillRect(x: number, y: number, width: number, height: number): void {
    this.fillRectCalls.push([x, y, width, height])
  }
}

describe('BrickDamage', () => {
  it('tracks destroyed quadrants independently', () => {
    const intact = createIntactBrickDamage()
    const damaged = damageBrickQuadrant(intact, BrickQuadrant.TopLeft)

    expect(intact[BrickQuadrant.TopLeft]).toBe(false)
    expect(damaged[BrickQuadrant.TopLeft]).toBe(true)
    expect(damaged[BrickQuadrant.TopRight]).toBe(false)
    expect(getIntactBrickQuadrants(damaged)).toEqual([
      BrickQuadrant.TopRight,
      BrickQuadrant.BottomLeft,
      BrickQuadrant.BottomRight,
    ])
    expect(isBrickFullyDestroyed(damaged)).toBe(false)
  })

  it('damages brick quadrants through TileGrid', () => {
    const grid = new TileGrid(2, 2, 16)
    grid.set(1, 1, TileType.Brick)

    expect(grid.damageQuadrant(1, 1, BrickQuadrant.TopLeft)).toBe(true)
    expect(grid.damageQuadrant(1, 1, BrickQuadrant.TopLeft)).toBe(false)
    expect(grid.get(1, 1)).toBe(TileType.Brick)
    expect(grid.getBrickDamage(1, 1)).toEqual({
      [BrickQuadrant.TopLeft]: true,
      [BrickQuadrant.TopRight]: false,
      [BrickQuadrant.BottomLeft]: false,
      [BrickQuadrant.BottomRight]: false,
    })
  })

  it('ignores damage for non-brick tiles and removes fully destroyed bricks', () => {
    const grid = new TileGrid(1, 1, 16, TileType.Brick)

    expect(grid.damageQuadrant(0, 0, BrickQuadrant.TopLeft)).toBe(true)
    expect(grid.damageQuadrant(0, 0, BrickQuadrant.TopRight)).toBe(true)
    expect(grid.damageQuadrant(0, 0, BrickQuadrant.BottomLeft)).toBe(true)
    expect(grid.damageQuadrant(0, 0, BrickQuadrant.BottomRight)).toBe(true)
    expect(grid.get(0, 0)).toBe(TileType.Empty)
    expect(grid.getBrickDamage(0, 0)).toBeNull()
    expect(grid.damageQuadrant(0, 0, BrickQuadrant.TopLeft)).toBe(false)
  })

  it('clears brick damage when a tile is reset or the grid is filled', () => {
    const grid = new TileGrid(1, 1, 16, TileType.Brick)

    grid.damageQuadrant(0, 0, BrickQuadrant.TopLeft)
    grid.set(0, 0, TileType.Brick)

    expect(grid.getBrickDamage(0, 0)).toEqual(createIntactBrickDamage())

    grid.damageQuadrant(0, 0, BrickQuadrant.TopRight)
    grid.fill(TileType.Steel)

    expect(grid.getBrickDamage(0, 0)).toBeNull()
    expect(grid.get(0, 0)).toBe(TileType.Steel)
  })

  it('renders only intact brick quadrants', () => {
    const context = new CanvasContextSpy()
    const damage = {
      ...createIntactBrickDamage(),
      [BrickQuadrant.TopLeft]: true,
      [BrickQuadrant.BottomRight]: true,
    }

    renderPartialBrick(context as unknown as CanvasRenderingContext2D, {
      x: 10,
      y: 20,
      tileSize: 16,
      damage,
      color: '#884422',
    })

    expect(context.fillRectCalls).toEqual([
      [18, 20, 8, 8],
      [10, 28, 8, 8],
    ])
    expect(context.fillStyle).toBe('#000000')
  })

  it('rejects invalid quadrants and render positions', () => {
    const context = new CanvasContextSpy()

    expect(() =>
      damageBrickQuadrant(createIntactBrickDamage(), 'center' as BrickQuadrant),
    ).toThrow('Invalid brick quadrant: center.')

    expect(() =>
      renderPartialBrick(context as unknown as CanvasRenderingContext2D, {
        x: Number.NaN,
        y: 0,
        tileSize: 16,
        damage: createIntactBrickDamage(),
      }),
    ).toThrow('Brick render position must contain finite x and y values.')
  })
})
