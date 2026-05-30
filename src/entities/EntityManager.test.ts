import { describe, expect, it } from 'vitest'
import { Entity } from './Entity'
import { EntityManager } from './EntityManager'

class TestEntity extends Entity {
  public updateCount = 0
  public renderCount = 0

  public override update(dt: number): void {
    this.updateCount += 1
    super.update(dt)
  }

  public override render(ctx: CanvasRenderingContext2D): void {
    void ctx
    this.renderCount += 1
  }
}

const createEntity = (): TestEntity =>
  new TestEntity({
    position: { x: 0, y: 0 },
    size: { x: 4, y: 4 },
    velocity: { x: 10, y: 0 },
  })

describe('EntityManager', () => {
  it('adds, iterates, and removes entities by identity', () => {
    const manager = new EntityManager()
    const first = createEntity()
    const second = createEntity()
    const seen: Entity[] = []

    expect(manager.add(first)).toBe(first)
    manager.add(first)
    manager.add(second)
    manager.forEach((entity) => seen.push(entity))

    expect(manager.count).toBe(2)
    expect(manager.getAll()).toEqual([first, second])
    expect(seen).toEqual([first, second])
    expect(manager.remove(first)).toBe(true)
    expect(manager.remove(first)).toBe(false)
    expect(manager.getAll()).toEqual([second])
  })

  it('updates and renders only live entities', () => {
    const manager = new EntityManager()
    const live = createEntity()
    const dead = createEntity()
    dead.alive = false

    manager.add(live)
    manager.add(dead)
    manager.update(0.5)
    manager.render({} as CanvasRenderingContext2D)

    expect(live.updateCount).toBe(1)
    expect(live.renderCount).toBe(1)
    expect(live.position.x).toBe(5)
    expect(dead.updateCount).toBe(0)
    expect(dead.renderCount).toBe(0)
    expect(manager.getAll()).toEqual([live])
  })

  it('prunes dead entities and clears all entities', () => {
    const manager = new EntityManager()
    const first = createEntity()
    const second = createEntity()

    manager.add(first)
    manager.add(second)
    second.alive = false

    expect(manager.pruneDead()).toBe(1)
    expect(manager.getAll()).toEqual([first])

    manager.clear()

    expect(manager.count).toBe(0)
    expect(manager.getAll()).toEqual([])
  })
})
