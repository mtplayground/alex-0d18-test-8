import type { Direction, Vector2 } from '../entities/Entity'

export interface EnemyAiActor {
  position: Vector2
  size: Vector2
  direction: Direction
}

export interface EnemyAiTarget {
  position: Vector2
  size: Vector2
}

export interface EnemyAiOptions {
  minTurnIntervalSeconds?: number
  maxTurnIntervalSeconds?: number
  aimChance?: number
  alignmentTolerance?: number
}

export interface EnemyAiDecisionInput {
  enemy: EnemyAiActor
  player?: EnemyAiTarget | null
  base?: EnemyAiTarget | null
  blocked: boolean
  turnTimerSeconds: number
  dt: number
  random: () => number
  availableDirections?: readonly Direction[]
  options?: EnemyAiOptions
}

export type EnemyAiDecisionReason = 'continue' | 'blocked' | 'timer' | 'aim'

export interface EnemyAiDecision {
  direction: Direction
  nextTurnTimerSeconds: number
  shouldShoot: boolean
  reason: EnemyAiDecisionReason
}

const DIRECTIONS: readonly Direction[] = ['up', 'down', 'left', 'right']
const DEFAULT_MIN_TURN_INTERVAL_SECONDS = 0.75
const DEFAULT_MAX_TURN_INTERVAL_SECONDS = 2.25
const DEFAULT_AIM_CHANCE = 0.35
const DEFAULT_ALIGNMENT_TOLERANCE = 1

const assertFinitePoint = (name: string, point: Vector2): void => {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    throw new Error(`${name} must contain finite x and y values.`)
  }
}

const assertNonNegativeFinite = (name: string, value: number): void => {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be a finite, non-negative number.`)
  }
}

const assertProbability = (name: string, value: number): void => {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`${name} must be between 0 and 1.`)
  }
}

const readRandom = (random: () => number): number => {
  const value = random()

  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new Error('Enemy AI random values must be in the range [0, 1).')
  }

  return value
}

const getCenter = (entity: EnemyAiActor | EnemyAiTarget): Vector2 => ({
  x: entity.position.x + entity.size.x / 2,
  y: entity.position.y + entity.size.y / 2,
})

const getDirectionTowardAlignedTarget = (
  enemy: EnemyAiActor,
  target: EnemyAiTarget,
  tolerance: number,
): Direction | null => {
  const enemyCenter = getCenter(enemy)
  const targetCenter = getCenter(target)
  const horizontalDelta = targetCenter.x - enemyCenter.x
  const verticalDelta = targetCenter.y - enemyCenter.y

  if (Math.abs(horizontalDelta) <= tolerance && verticalDelta !== 0) {
    return verticalDelta < 0 ? 'up' : 'down'
  }

  if (Math.abs(verticalDelta) <= tolerance && horizontalDelta !== 0) {
    return horizontalDelta < 0 ? 'left' : 'right'
  }

  return null
}

const findAimDirection = (
  enemy: EnemyAiActor,
  targets: readonly (EnemyAiTarget | null | undefined)[],
  tolerance: number,
): Direction | null => {
  for (const target of targets) {
    if (!target) {
      continue
    }

    const direction = getDirectionTowardAlignedTarget(enemy, target, tolerance)

    if (direction) {
      return direction
    }
  }

  return null
}

const isFacingAlignedTarget = (
  enemy: EnemyAiActor,
  target: EnemyAiTarget | null | undefined,
  direction: Direction,
  tolerance: number,
): boolean => {
  if (!target) {
    return false
  }

  return getDirectionTowardAlignedTarget(enemy, target, tolerance) === direction
}

const pickRandomDirection = (
  availableDirections: readonly Direction[],
  random: () => number,
): Direction => {
  if (availableDirections.length === 0) {
    throw new Error('Enemy AI requires at least one available direction.')
  }

  const index = Math.floor(readRandom(random) * availableDirections.length)
  return availableDirections[index] ?? availableDirections[0]
}

const pickTurnInterval = (
  minTurnIntervalSeconds: number,
  maxTurnIntervalSeconds: number,
  random: () => number,
): number =>
  minTurnIntervalSeconds +
  readRandom(random) * (maxTurnIntervalSeconds - minTurnIntervalSeconds)

export const decideEnemyAiAction = ({
  enemy,
  player,
  base,
  blocked,
  turnTimerSeconds,
  dt,
  random,
  availableDirections = DIRECTIONS,
  options = {},
}: EnemyAiDecisionInput): EnemyAiDecision => {
  assertFinitePoint('Enemy AI position', enemy.position)
  assertFinitePoint('Enemy AI size', enemy.size)
  assertNonNegativeFinite('Enemy AI turn timer', turnTimerSeconds)
  assertNonNegativeFinite('Enemy AI delta time', dt)

  const minTurnIntervalSeconds =
    options.minTurnIntervalSeconds ?? DEFAULT_MIN_TURN_INTERVAL_SECONDS
  const maxTurnIntervalSeconds =
    options.maxTurnIntervalSeconds ?? DEFAULT_MAX_TURN_INTERVAL_SECONDS
  const aimChance = options.aimChance ?? DEFAULT_AIM_CHANCE
  const alignmentTolerance =
    options.alignmentTolerance ?? DEFAULT_ALIGNMENT_TOLERANCE

  assertNonNegativeFinite(
    'Enemy AI minimum turn interval',
    minTurnIntervalSeconds,
  )
  assertNonNegativeFinite(
    'Enemy AI maximum turn interval',
    maxTurnIntervalSeconds,
  )
  assertProbability('Enemy AI aim chance', aimChance)
  assertNonNegativeFinite('Enemy AI alignment tolerance', alignmentTolerance)

  if (maxTurnIntervalSeconds < minTurnIntervalSeconds) {
    throw new Error(
      'Enemy AI maximum turn interval must be greater than or equal to the minimum.',
    )
  }

  const nextTurnTimerSeconds = Math.max(0, turnTimerSeconds - dt)
  const aimDirection = findAimDirection(
    enemy,
    [player, base],
    alignmentTolerance,
  )
  const shouldAim = aimDirection !== null && readRandom(random) < aimChance
  const shouldChooseNewDirection = blocked || nextTurnTimerSeconds === 0

  if (shouldChooseNewDirection) {
    const direction =
      shouldAim && aimDirection
        ? aimDirection
        : pickRandomDirection(availableDirections, random)

    return {
      direction,
      nextTurnTimerSeconds: pickTurnInterval(
        minTurnIntervalSeconds,
        maxTurnIntervalSeconds,
        random,
      ),
      shouldShoot:
        isFacingAlignedTarget(enemy, player, direction, alignmentTolerance) ||
        isFacingAlignedTarget(enemy, base, direction, alignmentTolerance),
      reason: shouldAim && aimDirection ? 'aim' : blocked ? 'blocked' : 'timer',
    }
  }

  const direction = shouldAim && aimDirection ? aimDirection : enemy.direction

  return {
    direction,
    nextTurnTimerSeconds,
    shouldShoot:
      isFacingAlignedTarget(enemy, player, direction, alignmentTolerance) ||
      isFacingAlignedTarget(enemy, base, direction, alignmentTolerance),
    reason: shouldAim && aimDirection ? 'aim' : 'continue',
  }
}
