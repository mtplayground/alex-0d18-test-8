import {
  SpriteRenderer,
  spriteSourceFromTile,
  type SpriteRect,
} from '../rendering/SpriteRenderer'
import { createIntactBrickDamage, renderPartialBrick } from './BrickDamage'
import { TileGrid } from './TileGrid'
import { TileType } from './TileTypes'

export enum TileRenderLayer {
  Base = 'base',
  Overlay = 'overlay',
}

export interface TileRenderDefinition {
  color: string
  layer: TileRenderLayer
  spriteColumn: number
  spriteRow: number
}

export interface RenderTileGridOptions {
  layer?: TileRenderLayer | 'all'
  spritesheet?: CanvasImageSource | null
  spriteTileSize?: number
  spriteRenderer?: SpriteRenderer
}

export const TILE_RENDER_DEFINITIONS: Record<TileType, TileRenderDefinition> = {
  [TileType.Empty]: {
    color: 'transparent',
    layer: TileRenderLayer.Base,
    spriteColumn: 0,
    spriteRow: 0,
  },
  [TileType.Brick]: {
    color: '#b45309',
    layer: TileRenderLayer.Base,
    spriteColumn: 1,
    spriteRow: 0,
  },
  [TileType.Steel]: {
    color: '#6b7280',
    layer: TileRenderLayer.Base,
    spriteColumn: 2,
    spriteRow: 0,
  },
  [TileType.Water]: {
    color: '#2563eb',
    layer: TileRenderLayer.Base,
    spriteColumn: 3,
    spriteRow: 0,
  },
  [TileType.Grass]: {
    color: '#16a34a',
    layer: TileRenderLayer.Overlay,
    spriteColumn: 4,
    spriteRow: 0,
  },
  [TileType.Ice]: {
    color: '#a5f3fc',
    layer: TileRenderLayer.Base,
    spriteColumn: 5,
    spriteRow: 0,
  },
  [TileType.Base]: {
    color: '#facc15',
    layer: TileRenderLayer.Base,
    spriteColumn: 6,
    spriteRow: 0,
  },
}

export const getTileRenderLayer = (tileType: TileType): TileRenderLayer =>
  TILE_RENDER_DEFINITIONS[tileType].layer

const getSpriteSource = (
  definition: TileRenderDefinition,
  spriteTileSize: number,
): SpriteRect =>
  spriteSourceFromTile({
    column: definition.spriteColumn,
    row: definition.spriteRow,
    tileWidth: spriteTileSize,
    tileHeight: spriteTileSize,
  })

const shouldRenderTile = (
  tileType: TileType,
  requestedLayer: TileRenderLayer | 'all',
): boolean =>
  tileType !== TileType.Empty &&
  (requestedLayer === 'all' ||
    TILE_RENDER_DEFINITIONS[tileType].layer === requestedLayer)

export const renderTileGrid = (
  ctx: CanvasRenderingContext2D,
  grid: TileGrid,
  options: RenderTileGridOptions = {},
): void => {
  const layer = options.layer ?? 'all'
  const spriteTileSize = options.spriteTileSize ?? grid.tileSize
  const spriteRenderer = options.spriteRenderer ?? new SpriteRenderer(ctx)

  for (let y = 0; y < grid.height; y += 1) {
    for (let x = 0; x < grid.width; x += 1) {
      const tileType = grid.get(x, y)

      if (!shouldRenderTile(tileType, layer)) {
        continue
      }

      const definition = TILE_RENDER_DEFINITIONS[tileType]
      const destination = {
        x: x * grid.tileSize,
        y: y * grid.tileSize,
        width: grid.tileSize,
        height: grid.tileSize,
      }

      if (tileType === TileType.Brick) {
        renderPartialBrick(ctx, {
          x: destination.x,
          y: destination.y,
          tileSize: grid.tileSize,
          damage: grid.getBrickDamage(x, y) ?? createIntactBrickDamage(),
          color: definition.color,
        })
        continue
      }

      spriteRenderer.drawTile({
        image: options.spritesheet,
        source: getSpriteSource(definition, spriteTileSize),
        destination,
        fallbackColor: definition.color,
      })
    }
  }
}
