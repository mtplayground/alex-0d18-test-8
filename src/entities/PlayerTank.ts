import type { Direction, Vector2 } from './Entity'
import { Tank } from './Tank'
import type { TileGrid } from '../tiles/TileGrid'
import { TileType } from '../tiles/TileTypes'

export interface PlayerMovementInput {
  isDown: (key: string) => boolean
}

export interface PlayerTankOptions {
  position: Vector2
  size: Vector2
  direction?: Direction
  speed?: number
  lives?: number
  alive?: boolean
}

interface Bounds {
  x: number
  y: number
  width: number
  height: number
}

const DEFAULT_PLAYER_SPEED = 96
const MOVEMENT_KEYS: Record<Direction, readonly string[]> = {
  up: ['ArrowUp', 'KeyW', 'w', 'W'],
  down: ['ArrowDown', 'KeyS', 's', 'S'],
  left: ['ArrowLeft', 'KeyA', 'a', 'A'],
  right: ['ArrowRight', 'KeyD', 'd', 'D'],
}

const DIRECTION_ORDER: readonly Direction[] = ['up', 'down', 'left', 'right']

const getInputDirection = (input: PlayerMovementInput): Direction | null => {
  for (const direction of DIRECTION_ORDER) {
    if (MOVEMENT_KEYS[direction].some((key) => input.isDown(key))) {
      return direction
    }
  }

  return null
}

const getMovementDelta = (direction: Direction, distance: number): Vector2 => {
  switch (direction) {
    case 'up':
      return { x: 0, y: -distance }
    case 'down':
      return { x: 0, y: distance }
    case 'left':
      return { x: -distance, y: 0 }
    case 'right':
      return { x: distance, y: 0 }
  }
}

export const isTankBlockingTile = (tileType: TileType): boolean =>
  tileType === TileType.Brick ||
  tileType === TileType.Steel ||
  tileType === TileType.Water ||
  tileType === TileType.Base

const getOccupiedTileRange = (
  bounds: Bounds,
  tileSize: number,
): { minX: number; maxX: number; minY: number; maxY: number } => ({
  minX: Math.floor(bounds.x / tileSize),
  maxX: Math.floor((bounds.x + bounds.width - 0.001) / tileSize),
  minY: Math.floor(bounds.y / tileSize),
  maxY: Math.floor((bounds.y + bounds.height - 0.001) / tileSize),
})

export const canTankOccupyBounds = (
  bounds: Bounds,
  grid: TileGrid,
): boolean => {
  if (
    bounds.x < 0 ||
    bounds.y < 0 ||
    bounds.x + bounds.width > grid.worldWidth ||
    bounds.y + bounds.height > grid.worldHeight
  ) {
    return false
  }

  const range = getOccupiedTileRange(bounds, grid.tileSize)

  for (let y = range.minY; y <= range.maxY; y += 1) {
    for (let x = range.minX; x <= range.maxX; x += 1) {
      if (!grid.isInBounds(x, y) || isTankBlockingTile(grid.get(x, y))) {
        return false
      }
    }
  }

  return true
}

const snapPerpendicularAxis = (
  position: Vector2,
  direction: Direction,
  tileSize: number,
): Vector2 => {
  if (direction === 'left' || direction === 'right') {
    return {
      x: position.x,
      y: Math.round(position.y / tileSize) * tileSize,
    }
  }

  return {
    x: Math.round(position.x / tileSize) * tileSize,
    y: position.y,
  }
}

export class PlayerTank extends Tank {
  public constructor(options: PlayerTankOptions) {
    super({
      position: options.position,
      size: options.size,
      faction: 'player',
      direction: options.direction,
      speed: options.speed ?? DEFAULT_PLAYER_SPEED,
      lives: options.lives,
      alive: options.alive,
    })
  }

  public updateFromInput(
    dt: number,
    input: PlayerMovementInput,
    grid: TileGrid,
  ): void {
    if (!Number.isFinite(dt) || dt < 0) {
      throw new Error('PlayerTank update delta time must be non-negative.')
    }

    const nextDirection = getInputDirection(input)

    if (!nextDirection || !this.alive) {
      return
    }

    this.direction = nextDirection

    const snappedPosition = snapPerpendicularAxis(
      this.position,
      nextDirection,
      grid.tileSize,
    )
    const delta = getMovementDelta(nextDirection, this.speed * dt)
    const nextPosition = {
      x: snappedPosition.x + delta.x,
      y: snappedPosition.y + delta.y,
    }

    if (
      canTankOccupyBounds(
        {
          x: nextPosition.x,
          y: nextPosition.y,
          width: this.size.x,
          height: this.size.y,
        },
        grid,
      )
    ) {
      this.position = nextPosition
    }
  }
}
