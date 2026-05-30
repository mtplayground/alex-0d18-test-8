import { Bullet } from '../entities/Bullet'
import type { Vector2 } from '../entities/Entity'
import { BrickQuadrant } from '../tiles/BrickDamage'
import type { GridCoordinate } from '../tiles/TileGrid'
import { TileGrid } from '../tiles/TileGrid'
import { TileType } from '../tiles/TileTypes'

export interface BulletTerrainCollisionResult {
  hit: boolean
  tileType: TileType | null
  tile: GridCoordinate | null
  brickQuadrant: BrickQuadrant | null
  baseDestroyed: boolean
}

const MISS_RESULT: BulletTerrainCollisionResult = {
  hit: false,
  tileType: null,
  tile: null,
  brickQuadrant: null,
  baseDestroyed: false,
}

const getBulletLeadingPoint = (bullet: Bullet): Vector2 => {
  const centerX = bullet.position.x + bullet.size.x / 2
  const centerY = bullet.position.y + bullet.size.y / 2

  switch (bullet.direction) {
    case 'up':
      return { x: centerX, y: bullet.position.y }
    case 'down':
      return { x: centerX, y: bullet.position.y + bullet.size.y }
    case 'left':
      return { x: bullet.position.x, y: centerY }
    case 'right':
      return { x: bullet.position.x + bullet.size.x, y: centerY }
  }
}

const getBrickQuadrantFromImpact = (
  impactPoint: Vector2,
  tile: GridCoordinate,
  tileSize: number,
): BrickQuadrant => {
  const tileX = tile.x * tileSize
  const tileY = tile.y * tileSize
  const isRight = impactPoint.x >= tileX + tileSize / 2
  const isBottom = impactPoint.y >= tileY + tileSize / 2

  if (isBottom) {
    return isRight ? BrickQuadrant.BottomRight : BrickQuadrant.BottomLeft
  }

  return isRight ? BrickQuadrant.TopRight : BrickQuadrant.TopLeft
}

const getTileForImpact = (
  grid: TileGrid,
  impactPoint: Vector2,
): GridCoordinate | null => {
  const tile = grid.worldToGrid(impactPoint)

  if (!grid.isInBounds(tile.x, tile.y)) {
    return null
  }

  return tile
}

const stopBullet = (bullet: Bullet): void => {
  bullet.alive = false
}

export const resolveBulletTerrainCollision = (
  bullet: Bullet,
  grid: TileGrid,
): BulletTerrainCollisionResult => {
  if (!bullet.alive) {
    return MISS_RESULT
  }

  const impactPoint = getBulletLeadingPoint(bullet)
  const tile = getTileForImpact(grid, impactPoint)

  if (!tile) {
    return MISS_RESULT
  }

  const tileType = grid.get(tile.x, tile.y)

  switch (tileType) {
    case TileType.Brick: {
      const brickQuadrant = getBrickQuadrantFromImpact(
        impactPoint,
        tile,
        grid.tileSize,
      )
      const brickDamage = grid.getBrickDamage(tile.x, tile.y)

      if (brickDamage?.[brickQuadrant]) {
        return MISS_RESULT
      }

      grid.damageQuadrant(tile.x, tile.y, brickQuadrant)
      stopBullet(bullet)

      return {
        hit: true,
        tileType,
        tile,
        brickQuadrant,
        baseDestroyed: false,
      }
    }

    case TileType.Steel:
      stopBullet(bullet)

      return {
        hit: true,
        tileType,
        tile,
        brickQuadrant: null,
        baseDestroyed: false,
      }

    case TileType.Base:
      grid.set(tile.x, tile.y, TileType.Empty)
      stopBullet(bullet)

      return {
        hit: true,
        tileType,
        tile,
        brickQuadrant: null,
        baseDestroyed: true,
      }

    case TileType.Empty:
    case TileType.Water:
    case TileType.Grass:
    case TileType.Ice:
      return MISS_RESULT
  }
}
