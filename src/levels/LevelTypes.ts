import type { Vector2 } from '../entities/Entity'
import type { EnemyWaveEntry } from '../game/EnemySpawner'
import type { GridCoordinate } from '../tiles/TileGrid'
import { TileGrid } from '../tiles/TileGrid'

export type LevelMapSymbol = '.' | '#' | 'S' | 'W' | 'G' | 'I' | 'B' | 'P'

export interface LevelDefinition {
  id: string
  name: string
  tileSize: number
  map: readonly string[]
  enemySpawnPoints: readonly GridCoordinate[]
  wave: readonly EnemyWaveEntry[]
}

export interface LoadedLevel {
  id: string
  name: string
  grid: TileGrid
  playerSpawn: Vector2
  basePosition: GridCoordinate
  enemySpawnPoints: readonly Vector2[]
  enemySize: Vector2
  wave: readonly EnemyWaveEntry[]
}
