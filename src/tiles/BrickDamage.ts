export enum BrickQuadrant {
  TopLeft = 'topLeft',
  TopRight = 'topRight',
  BottomLeft = 'bottomLeft',
  BottomRight = 'bottomRight',
}

export type BrickDamageState = Record<BrickQuadrant, boolean>

export interface RenderPartialBrickOptions {
  x: number
  y: number
  tileSize: number
  damage: BrickDamageState
  color?: string
}

const BRICK_QUADRANTS = Object.values(BrickQuadrant) as readonly BrickQuadrant[]
const DEFAULT_BRICK_COLOR = '#b45309'

export const isBrickQuadrant = (value: unknown): value is BrickQuadrant =>
  BRICK_QUADRANTS.includes(value as BrickQuadrant)

export const assertBrickQuadrant = (value: unknown): BrickQuadrant => {
  if (!isBrickQuadrant(value)) {
    throw new Error(`Invalid brick quadrant: ${String(value)}.`)
  }

  return value
}

export const createIntactBrickDamage = (): BrickDamageState => ({
  [BrickQuadrant.TopLeft]: false,
  [BrickQuadrant.TopRight]: false,
  [BrickQuadrant.BottomLeft]: false,
  [BrickQuadrant.BottomRight]: false,
})

export const damageBrickQuadrant = (
  damage: BrickDamageState,
  quadrant: BrickQuadrant,
): BrickDamageState => ({
  ...damage,
  [assertBrickQuadrant(quadrant)]: true,
})

export const isBrickFullyDestroyed = (damage: BrickDamageState): boolean =>
  BRICK_QUADRANTS.every((quadrant) => damage[quadrant])

export const getIntactBrickQuadrants = (
  damage: BrickDamageState,
): BrickQuadrant[] => BRICK_QUADRANTS.filter((quadrant) => !damage[quadrant])

const assertRenderOptions = ({
  x,
  y,
  tileSize,
}: RenderPartialBrickOptions): void => {
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    throw new Error('Brick render position must contain finite x and y values.')
  }

  if (!Number.isFinite(tileSize) || tileSize <= 0) {
    throw new Error('Brick render tile size must be greater than zero.')
  }
}

const getQuadrantRect = (
  x: number,
  y: number,
  tileSize: number,
  quadrant: BrickQuadrant,
): { x: number; y: number; width: number; height: number } => {
  const halfSize = tileSize / 2
  const isRight =
    quadrant === BrickQuadrant.TopRight ||
    quadrant === BrickQuadrant.BottomRight
  const isBottom =
    quadrant === BrickQuadrant.BottomLeft ||
    quadrant === BrickQuadrant.BottomRight

  return {
    x: isRight ? x + halfSize : x,
    y: isBottom ? y + halfSize : y,
    width: halfSize,
    height: halfSize,
  }
}

export const renderPartialBrick = (
  ctx: CanvasRenderingContext2D,
  options: RenderPartialBrickOptions,
): void => {
  assertRenderOptions(options)

  const previousFillStyle = ctx.fillStyle
  ctx.fillStyle = options.color ?? DEFAULT_BRICK_COLOR

  for (const quadrant of getIntactBrickQuadrants(options.damage)) {
    const rect = getQuadrantRect(
      options.x,
      options.y,
      options.tileSize,
      quadrant,
    )
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height)
  }

  ctx.fillStyle = previousFillStyle
}
