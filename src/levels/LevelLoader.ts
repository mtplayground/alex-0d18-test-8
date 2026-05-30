import type { Vector2 } from '../entities/Entity'
import { TileGrid, type GridCoordinate } from '../tiles/TileGrid'
import { TileType } from '../tiles/TileTypes'
import type { LevelDefinition, LevelMapSymbol, LoadedLevel } from './LevelTypes'

const LEVEL_SYMBOL_TILES: Record<LevelMapSymbol, TileType> = {
  '.': TileType.Empty,
  '#': TileType.Brick,
  S: TileType.Steel,
  W: TileType.Water,
  G: TileType.Grass,
  I: TileType.Ice,
  B: TileType.Base,
  P: TileType.Empty,
}

const isLevelMapSymbol = (value: string): value is LevelMapSymbol =>
  Object.hasOwn(LEVEL_SYMBOL_TILES, value)

const assertPositiveInteger = (name: string, value: number): void => {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer.`)
  }
}

const assertGridCoordinate = (
  name: string,
  coordinate: GridCoordinate,
): void => {
  if (
    !Number.isInteger(coordinate.x) ||
    !Number.isInteger(coordinate.y) ||
    coordinate.x < 0 ||
    coordinate.y < 0
  ) {
    throw new Error(`${name} must contain non-negative integer x and y values.`)
  }
}

const gridToWorld = (
  coordinate: GridCoordinate,
  tileSize: number,
): Vector2 => ({
  x: coordinate.x * tileSize,
  y: coordinate.y * tileSize,
})

export const loadLevel = (definition: LevelDefinition): LoadedLevel => {
  assertPositiveInteger('Level tile size', definition.tileSize)

  if (definition.map.length === 0) {
    throw new Error('Level map must contain at least one row.')
  }

  const width = definition.map[0]?.length ?? 0

  if (width === 0) {
    throw new Error('Level map rows must not be empty.')
  }

  const grid = new TileGrid(width, definition.map.length, definition.tileSize)
  let playerSpawn: GridCoordinate | null = null
  let basePosition: GridCoordinate | null = null

  definition.map.forEach((row, y) => {
    if (row.length !== width) {
      throw new Error('Level map rows must all have the same width.')
    }

    Array.from(row).forEach((symbol, x) => {
      if (!isLevelMapSymbol(symbol)) {
        throw new Error(`Invalid level map symbol: ${symbol}.`)
      }

      if (symbol === 'P') {
        if (playerSpawn) {
          throw new Error('Level map must contain exactly one player spawn.')
        }

        playerSpawn = { x, y }
      }

      if (symbol === 'B') {
        if (basePosition) {
          throw new Error('Level map must contain exactly one base tile.')
        }

        basePosition = { x, y }
      }

      grid.set(x, y, LEVEL_SYMBOL_TILES[symbol])
    })
  })

  if (!playerSpawn) {
    throw new Error('Level map must contain exactly one player spawn.')
  }

  if (!basePosition) {
    throw new Error('Level map must contain exactly one base tile.')
  }

  if (definition.enemySpawnPoints.length !== 3) {
    throw new Error(
      'Level config must define exactly three enemy spawn points.',
    )
  }

  for (const spawnPoint of definition.enemySpawnPoints) {
    assertGridCoordinate('Enemy spawn point', spawnPoint)

    if (!grid.isInBounds(spawnPoint.x, spawnPoint.y)) {
      throw new Error('Enemy spawn point must be inside the level map.')
    }
  }

  return {
    id: definition.id,
    name: definition.name,
    grid,
    playerSpawn: gridToWorld(playerSpawn, definition.tileSize),
    basePosition,
    enemySpawnPoints: definition.enemySpawnPoints.map((spawnPoint) =>
      gridToWorld(spawnPoint, definition.tileSize),
    ),
    enemySize: { x: definition.tileSize, y: definition.tileSize },
    wave: definition.wave,
  }
}
