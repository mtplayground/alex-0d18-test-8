export enum TileType {
  Empty = 'empty',
  Brick = 'brick',
  Steel = 'steel',
  Water = 'water',
  Grass = 'grass',
  Ice = 'ice',
  Base = 'base',
}

const TILE_TYPE_VALUES = Object.values(TileType) as readonly TileType[]

export const isTileType = (value: unknown): value is TileType =>
  TILE_TYPE_VALUES.includes(value as TileType)

export const assertTileType = (value: unknown): TileType => {
  if (!isTileType(value)) {
    throw new Error(`Invalid tile type: ${String(value)}.`)
  }

  return value
}
