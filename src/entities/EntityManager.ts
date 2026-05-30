import { Entity } from './Entity'

export class EntityManager {
  private entities: Entity[] = []

  public add<T extends Entity>(entity: T): T {
    if (!this.entities.includes(entity)) {
      this.entities.push(entity)
    }

    return entity
  }

  public remove(entity: Entity): boolean {
    const index = this.entities.indexOf(entity)

    if (index === -1) {
      return false
    }

    this.entities.splice(index, 1)
    return true
  }

  public clear(): void {
    this.entities = []
  }

  public update(dt: number): void {
    for (const entity of this.entities) {
      if (entity.alive) {
        entity.update(dt)
      }
    }

    this.pruneDead()
  }

  public render(ctx: CanvasRenderingContext2D): void {
    for (const entity of this.entities) {
      if (entity.alive) {
        entity.render(ctx)
      }
    }
  }

  public pruneDead(): number {
    const previousCount = this.entities.length
    this.entities = this.entities.filter((entity) => entity.alive)
    return previousCount - this.entities.length
  }

  public forEach(callback: (entity: Entity, index: number) => void): void {
    this.entities.forEach(callback)
  }

  public getAll(): readonly Entity[] {
    return this.entities
  }

  public get count(): number {
    return this.entities.length
  }
}
