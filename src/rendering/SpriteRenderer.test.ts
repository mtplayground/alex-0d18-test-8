import { describe, expect, it } from 'vitest'
import { SpriteRenderer, spriteSourceFromTile } from './SpriteRenderer'

class CanvasContextSpy {
  public fillStyle: string | CanvasGradient | CanvasPattern = '#000000'
  public readonly drawImageCalls: unknown[][] = []
  public readonly fillRectCalls: number[][] = []

  public drawImage(...args: unknown[]): void {
    this.drawImageCalls.push(args)
  }

  public fillRect(x: number, y: number, width: number, height: number): void {
    this.fillRectCalls.push([x, y, width, height])
  }
}

describe('SpriteRenderer', () => {
  it('calculates spritesheet source rectangles from tile coordinates', () => {
    expect(
      spriteSourceFromTile({
        column: 2,
        row: 3,
        tileWidth: 16,
        tileHeight: 24,
      }),
    ).toEqual({ x: 32, y: 72, width: 16, height: 24 })
  })

  it('draws a sprite tile from an image source', () => {
    const context = new CanvasContextSpy()
    const renderer = new SpriteRenderer(
      context as unknown as CanvasRenderingContext2D,
    )
    const image = {} as CanvasImageSource

    renderer.drawTile({
      image,
      source: { x: 16, y: 32, width: 8, height: 8 },
      destination: { x: 40, y: 48, width: 16, height: 16 },
    })

    expect(context.drawImageCalls).toEqual([
      [image, 16, 32, 8, 8, 40, 48, 16, 16],
    ])
    expect(context.fillRectCalls).toEqual([])
  })

  it('draws a fallback rectangle when no image is available', () => {
    const context = new CanvasContextSpy()
    const renderer = new SpriteRenderer(
      context as unknown as CanvasRenderingContext2D,
    )

    renderer.drawTile({
      image: null,
      source: { x: 0, y: 0, width: 8, height: 8 },
      destination: { x: 10, y: 20, width: 30, height: 40 },
      fallbackColor: '#123456',
    })

    expect(context.fillRectCalls).toEqual([[10, 20, 30, 40]])
    expect(context.fillStyle).toBe('#000000')
    expect(context.drawImageCalls).toEqual([])
  })

  it('rejects invalid tile and rectangle values', () => {
    const context = new CanvasContextSpy()
    const renderer = new SpriteRenderer(
      context as unknown as CanvasRenderingContext2D,
    )

    expect(() =>
      spriteSourceFromTile({
        column: -1,
        row: 0,
        tileWidth: 8,
        tileHeight: 8,
      }),
    ).toThrow(
      'Sprite tile source column/row cannot be negative and tile size must be positive.',
    )

    expect(() =>
      renderer.drawTile({
        source: { x: 0, y: 0, width: -1, height: 8 },
        destination: { x: 0, y: 0, width: 8, height: 8 },
      }),
    ).toThrow('Sprite source rectangle width and height cannot be negative.')
  })
})
