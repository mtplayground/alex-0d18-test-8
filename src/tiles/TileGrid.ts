import type { Vector2 } from '../entities/Entity'
import { assertTileType, TileType } from './TileTypes'

export interface GridCoordinate {
  x: number
  y: number
}

const assertFinitePoint = (name: string, point: Vector2): void => {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    throw new Error(`${name} must contain finite x and y values.`)
  }
}

const assertPositiveInteger = (name: string, value: number): void => {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer.`)
  }
}

export class TileGrid {
  public readonly width: number
  public readonly height: number
  public readonly tileSize: number
  private readonly tiles: TileType[]

  public constructor(
    width: number,
    height: number,
    tileSize: number,
    fillType: TileType = TileType.Empty,
  ) {
    assertPositiveInteger('TileGrid width', width)
    assertPositiveInteger('TileGrid height', height)

    if (!Number.isFinite(tileSize) || tileSize <= 0) {
      throw new Error('TileGrid tile size must be greater than zero.')
    }

    this.width = width
    this.height = height
    this.tileSize = tileSize
    this.tiles = new Array<TileType>(width * height).fill(
      assertTileType(fillType),
    )
  }

  public get worldWidth(): number {
    return this.width * this.tileSize
  }

  public get worldHeight(): number {
    return this.height * this.tileSize
  }

  public get(x: number, y: number): TileType {
    return this.tiles[this.getIndex(x, y)]
  }

  public set(x: number, y: number, type: TileType): void {
    this.tiles[this.getIndex(x, y)] = assertTileType(type)
  }

  public fill(type: TileType): void {
    this.tiles.fill(assertTileType(type))
  }

  public isInBounds(x: number, y: number): boolean {
    return (
      Number.isInteger(x) &&
      Number.isInteger(y) &&
      x >= 0 &&
      y >= 0 &&
      x < this.width &&
      y < this.height
    )
  }

  public worldToGrid(position: Vector2): GridCoordinate {
    assertFinitePoint('World position', position)

    return {
      x: Math.floor(position.x / this.tileSize),
      y: Math.floor(position.y / this.tileSize),
    }
  }

  public gridToWorld(x: number, y: number): Vector2 {
    this.assertInBounds(x, y)

    return {
      x: x * this.tileSize,
      y: y * this.tileSize,
    }
  }

  public toArray(): readonly TileType[] {
    return [...this.tiles]
  }

  private getIndex(x: number, y: number): number {
    this.assertInBounds(x, y)
    return y * this.width + x
  }

  private assertInBounds(x: number, y: number): void {
    if (!this.isInBounds(x, y)) {
      throw new Error(
        `Tile coordinate (${String(x)}, ${String(y)}) is outside the ${this.width}x${this.height} grid.`,
      )
    }
  }
}
