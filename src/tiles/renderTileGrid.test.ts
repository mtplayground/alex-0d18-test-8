import { describe, expect, it } from 'vitest'
import { BrickQuadrant } from './BrickDamage'
import { TileGrid } from './TileGrid'
import { TileType } from './TileTypes'
import {
  getTileRenderLayer,
  renderTileGrid,
  TILE_RENDER_DEFINITIONS,
  TileRenderLayer,
} from './renderTileGrid'

class CanvasContextSpy {
  public fillStyle: string | CanvasGradient | CanvasPattern = '#000000'
  public readonly fillRectCalls: Array<{
    fillStyle: string | CanvasGradient | CanvasPattern
    rect: number[]
  }> = []
  public readonly drawImageCalls: unknown[][] = []

  public fillRect(x: number, y: number, width: number, height: number): void {
    this.fillRectCalls.push({
      fillStyle: this.fillStyle,
      rect: [x, y, width, height],
    })
  }

  public drawImage(...args: unknown[]): void {
    this.drawImageCalls.push(args)
  }
}

describe('renderTileGrid', () => {
  it('defines distinct fallback colors and the grass overlay layer', () => {
    const nonEmptyColors = Object.entries(TILE_RENDER_DEFINITIONS)
      .filter(([tileType]) => tileType !== TileType.Empty)
      .map(([, definition]) => definition.color)

    expect(new Set(nonEmptyColors).size).toBe(nonEmptyColors.length)
    expect(getTileRenderLayer(TileType.Grass)).toBe(TileRenderLayer.Overlay)
    expect(getTileRenderLayer(TileType.Brick)).toBe(TileRenderLayer.Base)
  })

  it('renders base-layer tiles with fallback colors and skips grass', () => {
    const context = new CanvasContextSpy()
    const grid = new TileGrid(4, 2, 16)

    grid.set(0, 0, TileType.Brick)
    grid.set(1, 0, TileType.Steel)
    grid.set(2, 0, TileType.Water)
    grid.set(3, 0, TileType.Grass)
    grid.set(0, 1, TileType.Ice)
    grid.set(1, 1, TileType.Base)

    renderTileGrid(context as unknown as CanvasRenderingContext2D, grid, {
      layer: TileRenderLayer.Base,
    })

    expect(context.fillRectCalls).toEqual([
      { fillStyle: '#b45309', rect: [0, 0, 8, 8] },
      { fillStyle: '#b45309', rect: [8, 0, 8, 8] },
      { fillStyle: '#b45309', rect: [0, 8, 8, 8] },
      { fillStyle: '#b45309', rect: [8, 8, 8, 8] },
      { fillStyle: '#6b7280', rect: [16, 0, 16, 16] },
      { fillStyle: '#2563eb', rect: [32, 0, 16, 16] },
      { fillStyle: '#a5f3fc', rect: [0, 16, 16, 16] },
      { fillStyle: '#facc15', rect: [16, 16, 16, 16] },
    ])
    expect(context.drawImageCalls).toEqual([])
  })

  it('renders only overlay-layer grass when requested', () => {
    const context = new CanvasContextSpy()
    const grid = new TileGrid(2, 1, 16)

    grid.set(0, 0, TileType.Steel)
    grid.set(1, 0, TileType.Grass)

    renderTileGrid(context as unknown as CanvasRenderingContext2D, grid, {
      layer: TileRenderLayer.Overlay,
    })

    expect(context.fillRectCalls).toEqual([
      { fillStyle: '#16a34a', rect: [16, 0, 16, 16] },
    ])
  })

  it('renders partial brick damage', () => {
    const context = new CanvasContextSpy()
    const grid = new TileGrid(1, 1, 16, TileType.Brick)

    grid.damageQuadrant(0, 0, BrickQuadrant.TopLeft)
    grid.damageQuadrant(0, 0, BrickQuadrant.BottomRight)

    renderTileGrid(context as unknown as CanvasRenderingContext2D, grid)

    expect(context.fillRectCalls).toEqual([
      { fillStyle: '#b45309', rect: [8, 0, 8, 8] },
      { fillStyle: '#b45309', rect: [0, 8, 8, 8] },
    ])
  })

  it('uses spritesheet drawing when an image is available', () => {
    const context = new CanvasContextSpy()
    const grid = new TileGrid(1, 1, 8, TileType.Steel)
    const image = {} as CanvasImageSource

    renderTileGrid(context as unknown as CanvasRenderingContext2D, grid, {
      spritesheet: image,
      spriteTileSize: 16,
    })

    expect(context.drawImageCalls).toEqual([[image, 32, 0, 16, 16, 0, 0, 8, 8]])
    expect(context.fillRectCalls).toEqual([])
  })
})
