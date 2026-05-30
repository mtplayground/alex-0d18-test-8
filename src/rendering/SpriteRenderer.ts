export interface SpriteRect {
  x: number
  y: number
  width: number
  height: number
}

export interface SpriteTileSource {
  column: number
  row: number
  tileWidth: number
  tileHeight: number
}

export interface DrawSpriteTileOptions {
  image?: CanvasImageSource | null
  source: SpriteRect
  destination: SpriteRect
  fallbackColor?: string
}

const DEFAULT_FALLBACK_COLOR = '#ff00ff'

const assertFiniteRect = (name: string, rect: SpriteRect): void => {
  if (
    !Number.isFinite(rect.x) ||
    !Number.isFinite(rect.y) ||
    !Number.isFinite(rect.width) ||
    !Number.isFinite(rect.height)
  ) {
    throw new Error(`${name} must contain finite x, y, width, and height.`)
  }

  if (rect.width < 0 || rect.height < 0) {
    throw new Error(`${name} width and height cannot be negative.`)
  }
}

export const spriteSourceFromTile = ({
  column,
  row,
  tileWidth,
  tileHeight,
}: SpriteTileSource): SpriteRect => {
  if (
    !Number.isInteger(column) ||
    !Number.isInteger(row) ||
    !Number.isFinite(tileWidth) ||
    !Number.isFinite(tileHeight)
  ) {
    throw new Error(
      'Sprite tile source requires integer column/row and finite tile size.',
    )
  }

  if (column < 0 || row < 0 || tileWidth <= 0 || tileHeight <= 0) {
    throw new Error(
      'Sprite tile source column/row cannot be negative and tile size must be positive.',
    )
  }

  return {
    x: column * tileWidth,
    y: row * tileHeight,
    width: tileWidth,
    height: tileHeight,
  }
}

export class SpriteRenderer {
  private readonly ctx: CanvasRenderingContext2D

  public constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx
  }

  public drawTile({
    image,
    source,
    destination,
    fallbackColor = DEFAULT_FALLBACK_COLOR,
  }: DrawSpriteTileOptions): void {
    assertFiniteRect('Sprite source rectangle', source)
    assertFiniteRect('Sprite destination rectangle', destination)

    if (image) {
      this.ctx.drawImage(
        image,
        source.x,
        source.y,
        source.width,
        source.height,
        destination.x,
        destination.y,
        destination.width,
        destination.height,
      )
      return
    }

    const previousFillStyle = this.ctx.fillStyle
    this.ctx.fillStyle = fallbackColor
    this.ctx.fillRect(
      destination.x,
      destination.y,
      destination.width,
      destination.height,
    )
    this.ctx.fillStyle = previousFillStyle
  }
}
