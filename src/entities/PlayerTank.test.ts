import { describe, expect, it } from 'vitest'
import { TileGrid } from '../tiles/TileGrid'
import { TileType } from '../tiles/TileTypes'
import {
  canTankOccupyBounds,
  isTankBlockingTile,
  PlayerTank,
  type PlayerMovementInput,
} from './PlayerTank'

const inputFor = (...keys: string[]): PlayerMovementInput => ({
  isDown: (key: string): boolean => keys.includes(key),
})

const createGrid = (): TileGrid => new TileGrid(5, 5, 32)

describe('PlayerTank', () => {
  it('moves in one input direction and updates facing', () => {
    const grid = createGrid()
    const tank = new PlayerTank({
      position: { x: 64, y: 64 },
      size: { x: 32, y: 32 },
      speed: 64,
      direction: 'up',
    })

    tank.updateFromInput(0.5, inputFor('ArrowRight'), grid)

    expect(tank.position).toEqual({ x: 96, y: 64 })
    expect(tank.direction).toBe('right')
  })

  it('prioritizes one direction and avoids diagonal movement', () => {
    const grid = createGrid()
    const tank = new PlayerTank({
      position: { x: 64, y: 64 },
      size: { x: 32, y: 32 },
      speed: 32,
      direction: 'right',
    })

    tank.updateFromInput(1, inputFor('ArrowDown', 'ArrowLeft'), grid)

    expect(tank.position).toEqual({ x: 64, y: 96 })
    expect(tank.direction).toBe('down')
  })

  it('snaps to the perpendicular grid axis while moving', () => {
    const grid = createGrid()
    const tank = new PlayerTank({
      position: { x: 64, y: 66 },
      size: { x: 32, y: 32 },
      speed: 32,
    })

    tank.updateFromInput(1, inputFor('ArrowRight'), grid)

    expect(tank.position).toEqual({ x: 96, y: 64 })
  })

  it('blocks movement into solid terrain and map edges while still facing input', () => {
    const grid = createGrid()
    grid.set(3, 2, TileType.Steel)
    const tank = new PlayerTank({
      position: { x: 64, y: 64 },
      size: { x: 32, y: 32 },
      speed: 32,
      direction: 'up',
    })

    tank.updateFromInput(1, inputFor('ArrowRight'), grid)

    expect(tank.position).toEqual({ x: 64, y: 64 })
    expect(tank.direction).toBe('right')

    tank.updateFromInput(3, inputFor('ArrowLeft'), grid)

    expect(tank.position).toEqual({ x: 64, y: 64 })
    expect(tank.direction).toBe('left')
  })

  it('passes over non-blocking terrain', () => {
    const grid = createGrid()
    grid.set(3, 2, TileType.Grass)
    grid.set(4, 2, TileType.Ice)
    const tank = new PlayerTank({
      position: { x: 64, y: 64 },
      size: { x: 32, y: 32 },
      speed: 32,
    })

    tank.updateFromInput(1, inputFor('ArrowRight'), grid)
    tank.updateFromInput(1, inputFor('ArrowRight'), grid)

    expect(tank.position).toEqual({ x: 128, y: 64 })
  })

  it('exposes blocking helpers', () => {
    expect(isTankBlockingTile(TileType.Brick)).toBe(true)
    expect(isTankBlockingTile(TileType.Steel)).toBe(true)
    expect(isTankBlockingTile(TileType.Water)).toBe(true)
    expect(isTankBlockingTile(TileType.Base)).toBe(true)
    expect(isTankBlockingTile(TileType.Empty)).toBe(false)

    const grid = createGrid()
    grid.set(1, 1, TileType.Water)

    expect(
      canTankOccupyBounds({ x: 32, y: 32, width: 32, height: 32 }, grid),
    ).toBe(false)
    expect(
      canTankOccupyBounds({ x: 64, y: 64, width: 32, height: 32 }, grid),
    ).toBe(true)
  })

  it('rejects invalid update deltas', () => {
    const tank = new PlayerTank({
      position: { x: 0, y: 0 },
      size: { x: 32, y: 32 },
    })

    expect(() =>
      tank.updateFromInput(-1, inputFor('ArrowUp'), createGrid()),
    ).toThrow('PlayerTank update delta time must be non-negative.')
  })
})
