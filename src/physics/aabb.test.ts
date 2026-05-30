import { describe, expect, it } from 'vitest'
import {
  boxOverlapsAny,
  boxesOverlap,
  findOverlappingBoxes,
  pointInBox,
  type AABB,
} from './aabb'

describe('AABB collision helpers', () => {
  it('detects overlapping boxes', () => {
    const first: AABB = { x: 0, y: 0, width: 10, height: 10 }
    const second: AABB = { x: 5, y: 5, width: 10, height: 10 }

    expect(boxesOverlap(first, second)).toBe(true)
    expect(boxesOverlap(second, first)).toBe(true)
  })

  it('treats boxes that only touch edges as not overlapping', () => {
    const first: AABB = { x: 0, y: 0, width: 10, height: 10 }
    const touchingRight: AABB = { x: 10, y: 0, width: 10, height: 10 }
    const touchingBottom: AABB = { x: 0, y: 10, width: 10, height: 10 }

    expect(boxesOverlap(first, touchingRight)).toBe(false)
    expect(boxesOverlap(first, touchingBottom)).toBe(false)
  })

  it('rejects separated boxes and zero-area boxes', () => {
    const box: AABB = { x: 0, y: 0, width: 10, height: 10 }
    const separated: AABB = { x: 12, y: 0, width: 10, height: 10 }
    const zeroWidth: AABB = { x: 5, y: 5, width: 0, height: 10 }

    expect(boxesOverlap(box, separated)).toBe(false)
    expect(boxesOverlap(box, zeroWidth)).toBe(false)
  })

  it('detects contained boxes as overlapping', () => {
    const outer: AABB = { x: 0, y: 0, width: 20, height: 20 }
    const inner: AABB = { x: 5, y: 5, width: 5, height: 5 }

    expect(boxesOverlap(outer, inner)).toBe(true)
    expect(boxesOverlap(inner, outer)).toBe(true)
  })

  it('checks whether points are inside a box, including boundaries', () => {
    const box: AABB = { x: 10, y: 20, width: 30, height: 40 }

    expect(pointInBox({ x: 10, y: 20 }, box)).toBe(true)
    expect(pointInBox({ x: 40, y: 60 }, box)).toBe(true)
    expect(pointInBox({ x: 25, y: 35 }, box)).toBe(true)
    expect(pointInBox({ x: 9, y: 35 }, box)).toBe(false)
    expect(pointInBox({ x: 25, y: 61 }, box)).toBe(false)
  })

  it('queries overlaps against a box list', () => {
    const query: AABB = { x: 0, y: 0, width: 10, height: 10 }
    const overlapping: AABB = { x: 8, y: 8, width: 4, height: 4 }
    const touching: AABB = { x: 10, y: 0, width: 4, height: 4 }
    const separated: AABB = { x: 20, y: 20, width: 4, height: 4 }
    const contained: AABB = { x: 2, y: 2, width: 2, height: 2 }
    const boxes = [overlapping, touching, separated, contained]

    expect(findOverlappingBoxes(query, boxes)).toEqual([overlapping, contained])
    expect(boxOverlapsAny(query, boxes)).toBe(true)
    expect(boxOverlapsAny(query, [touching, separated])).toBe(false)
  })

  it('rejects invalid boxes and points', () => {
    expect(() =>
      boxesOverlap(
        { x: 0, y: 0, width: -1, height: 1 },
        { x: 0, y: 0, width: 1, height: 1 },
      ),
    ).toThrow('First box width and height cannot be negative.')

    expect(() =>
      pointInBox({ x: Number.NaN, y: 0 }, { x: 0, y: 0, width: 1, height: 1 }),
    ).toThrow('Point must contain finite x and y values.')
  })
})
