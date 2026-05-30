import type { Vector2 } from '../entities/Entity'

export interface AABB {
  x: number
  y: number
  width: number
  height: number
}

export type Point = Vector2

const assertFinitePoint = (name: string, point: Point): void => {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    throw new Error(`${name} must contain finite x and y values.`)
  }
}

const assertValidBox = (name: string, box: AABB): void => {
  if (
    !Number.isFinite(box.x) ||
    !Number.isFinite(box.y) ||
    !Number.isFinite(box.width) ||
    !Number.isFinite(box.height)
  ) {
    throw new Error(`${name} must contain finite x, y, width, and height.`)
  }

  if (box.width < 0 || box.height < 0) {
    throw new Error(`${name} width and height cannot be negative.`)
  }
}

export const boxesOverlap = (first: AABB, second: AABB): boolean => {
  assertValidBox('First box', first)
  assertValidBox('Second box', second)

  if (
    first.width === 0 ||
    first.height === 0 ||
    second.width === 0 ||
    second.height === 0
  ) {
    return false
  }

  return (
    first.x < second.x + second.width &&
    first.x + first.width > second.x &&
    first.y < second.y + second.height &&
    first.y + first.height > second.y
  )
}

export const pointInBox = (point: Point, box: AABB): boolean => {
  assertFinitePoint('Point', point)
  assertValidBox('Box', box)

  return (
    point.x >= box.x &&
    point.x <= box.x + box.width &&
    point.y >= box.y &&
    point.y <= box.y + box.height
  )
}

export const findOverlappingBoxes = <T extends AABB>(
  box: AABB,
  boxes: readonly T[],
): T[] => {
  assertValidBox('Query box', box)
  return boxes.filter((candidate) => boxesOverlap(box, candidate))
}

export const boxOverlapsAny = (box: AABB, boxes: readonly AABB[]): boolean => {
  assertValidBox('Query box', box)
  return boxes.some((candidate) => boxesOverlap(box, candidate))
}
