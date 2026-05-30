import { EnemyTank, type EnemyTankType } from '../entities/EnemyTank'
import type { Vector2 } from '../entities/Entity'
import type { PowerUpType } from '../entities/PowerUp'
import { SpawnFlash } from '../entities/SpawnFlash'

export interface EnemyWaveEntry {
  type: EnemyTankType
  count?: number
  powerUpType?: PowerUpType | null
}

export interface EnemySpawnerOptions {
  spawnPoints: readonly Vector2[]
  wave: readonly EnemyWaveEntry[]
  enemySize: Vector2
  maxActiveEnemies?: number
  spawnCooldownSeconds?: number
  flashDurationSeconds?: number
}

export interface EnemySpawnResult {
  enemy: EnemyTank
  flash: SpawnFlash
  spawnPoint: Vector2
  remainingEnemies: number
}

const DEFAULT_MAX_ACTIVE_ENEMIES = 4
const DEFAULT_SPAWN_COOLDOWN_SECONDS = 1.25
const DEFAULT_FLASH_DURATION_SECONDS = 0.4

const copyVector = (vector: Vector2): Vector2 => ({
  x: vector.x,
  y: vector.y,
})

const assertFiniteVector = (name: string, vector: Vector2): void => {
  if (!Number.isFinite(vector.x) || !Number.isFinite(vector.y)) {
    throw new Error(`${name} must contain finite x and y values.`)
  }
}

const assertPositiveInteger = (name: string, value: number): void => {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer.`)
  }
}

const assertNonNegativeFinite = (name: string, value: number): void => {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be a finite, non-negative number.`)
  }
}

const assertPositiveFinite = (name: string, value: number): void => {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be greater than zero.`)
  }
}

interface EnemySpawnSpec {
  type: EnemyTankType
  powerUpType: PowerUpType | null
}

const expandWave = (wave: readonly EnemyWaveEntry[]): EnemySpawnSpec[] => {
  const queue: EnemySpawnSpec[] = []

  for (const entry of wave) {
    const count = entry.count ?? 1
    assertPositiveInteger('Enemy wave entry count', count)

    for (let index = 0; index < count; index += 1) {
      queue.push({
        type: entry.type,
        powerUpType: entry.powerUpType ?? null,
      })
    }
  }

  return queue
}

export class EnemySpawner {
  public readonly spawnPoints: readonly Vector2[]
  public readonly enemySize: Vector2
  public readonly maxActiveEnemies: number
  public readonly spawnCooldownSeconds: number
  public readonly flashDurationSeconds: number
  private readonly queue: EnemySpawnSpec[]
  private spawnPointIndex = 0
  private cooldownRemainingSeconds = 0

  public constructor(options: EnemySpawnerOptions) {
    if (options.spawnPoints.length !== 3) {
      throw new Error('EnemySpawner requires exactly three spawn points.')
    }

    const maxActiveEnemies =
      options.maxActiveEnemies ?? DEFAULT_MAX_ACTIVE_ENEMIES
    const spawnCooldownSeconds =
      options.spawnCooldownSeconds ?? DEFAULT_SPAWN_COOLDOWN_SECONDS
    const flashDurationSeconds =
      options.flashDurationSeconds ?? DEFAULT_FLASH_DURATION_SECONDS

    assertPositiveInteger(
      'EnemySpawner max active enemy count',
      maxActiveEnemies,
    )
    assertNonNegativeFinite('EnemySpawner spawn cooldown', spawnCooldownSeconds)
    assertPositiveFinite('EnemySpawner flash duration', flashDurationSeconds)
    assertFiniteVector('EnemySpawner enemy size', options.enemySize)

    for (const spawnPoint of options.spawnPoints) {
      assertFiniteVector('EnemySpawner spawn point', spawnPoint)
    }

    this.spawnPoints = options.spawnPoints.map(copyVector)
    this.enemySize = copyVector(options.enemySize)
    this.maxActiveEnemies = maxActiveEnemies
    this.spawnCooldownSeconds = spawnCooldownSeconds
    this.flashDurationSeconds = flashDurationSeconds
    this.queue = expandWave(options.wave)
  }

  public get remainingEnemies(): number {
    return this.queue.length
  }

  public get isExhausted(): boolean {
    return this.queue.length === 0
  }

  public update(
    dt: number,
    activeEnemies: readonly EnemyTank[],
  ): EnemySpawnResult | null {
    assertNonNegativeFinite('EnemySpawner update delta time', dt)

    this.cooldownRemainingSeconds = Math.max(
      0,
      this.cooldownRemainingSeconds - dt,
    )

    if (
      this.cooldownRemainingSeconds > 0 ||
      this.queue.length === 0 ||
      this.countActiveEnemies(activeEnemies) >= this.maxActiveEnemies
    ) {
      return null
    }

    const spec = this.queue.shift()

    if (!spec) {
      return null
    }

    const spawnPoint = this.nextSpawnPoint()
    const enemy = new EnemyTank({
      position: spawnPoint,
      size: this.enemySize,
      type: spec.type,
      powerUpType: spec.powerUpType,
      direction: 'down',
    })
    const flash = new SpawnFlash({
      position: spawnPoint,
      size: this.enemySize,
      durationSeconds: this.flashDurationSeconds,
    })

    this.cooldownRemainingSeconds = this.spawnCooldownSeconds

    return {
      enemy,
      flash,
      spawnPoint,
      remainingEnemies: this.queue.length,
    }
  }

  private countActiveEnemies(activeEnemies: readonly EnemyTank[]): number {
    return activeEnemies.filter((enemy) => enemy.alive).length
  }

  private nextSpawnPoint(): Vector2 {
    const spawnPoint = this.spawnPoints[this.spawnPointIndex]
    this.spawnPointIndex = (this.spawnPointIndex + 1) % this.spawnPoints.length
    return copyVector(spawnPoint ?? this.spawnPoints[0])
  }
}
