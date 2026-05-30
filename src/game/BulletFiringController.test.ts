import { describe, expect, it } from 'vitest'
import { Bullet } from '../entities/Bullet'
import {
  BulletFiringController,
  type FireInput,
} from './BulletFiringController'

const pressedInput = (pressed: boolean): FireInput => ({
  wasPressed: (key: string): boolean => key === 'Space' && pressed,
})

const shooter = {
  position: { x: 32, y: 64 },
  size: { x: 32, y: 32 },
  direction: 'up' as const,
  owner: 'player' as const,
}

describe('BulletFiringController', () => {
  it('fires from the shooter muzzle when Space is pressed', () => {
    const controller = new BulletFiringController({
      reloadSeconds: 0.25,
      bulletSpeed: 200,
      bulletSize: { x: 4, y: 6 },
    })

    const bullet = controller.tryFire(pressedInput(true), [], shooter)

    expect(bullet).toBeInstanceOf(Bullet)
    expect(bullet?.position).toEqual({ x: 46, y: 58 })
    expect(bullet?.velocity).toEqual({ x: 0, y: -200 })
    expect(bullet?.owner).toBe('player')
  })

  it('requires the trigger key edge', () => {
    const controller = new BulletFiringController()

    expect(controller.tryFire(pressedInput(false), [], shooter)).toBeNull()
  })

  it('enforces reload cooldown before firing again', () => {
    const controller = new BulletFiringController({ reloadSeconds: 0.5 })

    const firstBullet = controller.tryFire(pressedInput(true), [], shooter)

    expect(firstBullet).not.toBeNull()
    expect(controller.tryFire(pressedInput(true), [], shooter)).toBeNull()

    controller.update(0.25)

    expect(controller.tryFire(pressedInput(true), [], shooter)).toBeNull()

    controller.update(0.25)

    expect(controller.tryFire(pressedInput(true), [], shooter)).not.toBeNull()
  })

  it('enforces active bullet cap per owner', () => {
    const controller = new BulletFiringController({
      maxActiveBullets: 1,
      reloadSeconds: 0,
    })
    const activeBullet = new Bullet({
      position: { x: 0, y: 0 },
      direction: 'up',
      owner: 'player',
    })
    const enemyBullet = new Bullet({
      position: { x: 0, y: 0 },
      direction: 'down',
      owner: 'enemy',
    })

    expect(
      controller.tryFire(
        pressedInput(true),
        [activeBullet, enemyBullet],
        shooter,
      ),
    ).toBeNull()

    activeBullet.alive = false

    expect(
      controller.tryFire(
        pressedInput(true),
        [activeBullet, enemyBullet],
        shooter,
      ),
    ).not.toBeNull()
  })

  it('allows temporary firing overrides', () => {
    const controller = new BulletFiringController({
      maxActiveBullets: 1,
      bulletSpeed: 100,
      reloadSeconds: 0,
    })
    const activeBullet = new Bullet({
      position: { x: 0, y: 0 },
      direction: 'up',
      owner: 'player',
    })

    const bullet = controller.tryFire(
      pressedInput(true),
      [activeBullet],
      shooter,
      {
        maxActiveBullets: 2,
        bulletSpeed: 200,
      },
    )

    expect(bullet?.speed).toBe(200)
  })

  it('rejects invalid options and update deltas', () => {
    expect(() => new BulletFiringController({ maxActiveBullets: -1 })).toThrow(
      'Bullet max active bullet count must be a non-negative integer.',
    )
    expect(() => new BulletFiringController({ bulletSpeed: 0 })).toThrow(
      'Bullet speed must be greater than zero.',
    )

    const controller = new BulletFiringController()

    expect(() => controller.update(-1)).toThrow(
      'Bullet firing update delta time must be non-negative.',
    )
  })
})
