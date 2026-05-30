import { Bullet } from '../entities/Bullet'
import { Explosion } from '../entities/Explosion'
import { Tank } from '../entities/Tank'
import { boxesOverlap, type AABB } from '../physics/aabb'

export interface ScoreState {
  score: number
}

export interface BulletTankCollisionResult {
  bullet: Bullet
  tank: Tank
  explosion: Explosion
  tankDestroyed: boolean
  playerLifeLost: boolean
  scoreAwarded: number
}

const entityToAabb = (entity: {
  position: { x: number; y: number }
  size: { x: number; y: number }
}): AABB => ({
  x: entity.position.x,
  y: entity.position.y,
  width: entity.size.x,
  height: entity.size.y,
})

const getEntityCenter = (entity: {
  position: { x: number; y: number }
  size: { x: number; y: number }
}): { x: number; y: number } => ({
  x: entity.position.x + entity.size.x / 2,
  y: entity.position.y + entity.size.y / 2,
})

const canBulletDamageTank = (bullet: Bullet, tank: Tank): boolean =>
  bullet.alive && tank.alive && bullet.owner !== tank.faction

export const resolveBulletTankCollisions = (
  bullets: readonly Bullet[],
  tanks: readonly Tank[],
  scoreState?: ScoreState,
): BulletTankCollisionResult[] => {
  const results: BulletTankCollisionResult[] = []

  for (const bullet of bullets) {
    if (!bullet.alive) {
      continue
    }

    for (const tank of tanks) {
      if (!canBulletDamageTank(bullet, tank)) {
        continue
      }

      if (!boxesOverlap(entityToAabb(bullet), entityToAabb(tank))) {
        continue
      }

      bullet.alive = false

      const damageResult = tank.damage()
      const scoreAwarded =
        bullet.owner === 'player' && damageResult.destroyed
          ? damageResult.scoreValue
          : 0

      if (scoreState) {
        scoreState.score += scoreAwarded
      }

      results.push({
        bullet,
        tank,
        explosion: new Explosion({ position: getEntityCenter(tank) }),
        tankDestroyed: damageResult.destroyed,
        playerLifeLost: damageResult.lifeLost,
        scoreAwarded,
      })

      break
    }
  }

  return results
}
