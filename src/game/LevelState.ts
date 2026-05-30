export type GameOverReason = 'base-destroyed' | 'player-defeated'

export type SceneChangeEvent =
  | {
      type: 'scene-change'
      target: 'next-level'
      levelIndex: number
      nextLevelIndex: number
    }
  | {
      type: 'scene-change'
      target: 'game-over'
      levelIndex: number
      reason: GameOverReason
    }

export interface LevelStateSnapshot {
  levelIndex: number
  waveExhausted: boolean
  activeEnemyCount: number
  playerLives: number
  baseDestroyed: boolean
}

export interface LevelSceneChangeEmitterOptions {
  initialLevelIndex?: number
}

const assertNonNegativeInteger = (name: string, value: number): void => {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative integer.`)
  }
}

const assertSnapshot = (snapshot: LevelStateSnapshot): void => {
  assertNonNegativeInteger('Level index', snapshot.levelIndex)
  assertNonNegativeInteger('Active enemy count', snapshot.activeEnemyCount)
  assertNonNegativeInteger('Player lives', snapshot.playerLives)
}

export const evaluateLevelSceneChange = (
  snapshot: LevelStateSnapshot,
): SceneChangeEvent | null => {
  assertSnapshot(snapshot)

  if (snapshot.baseDestroyed) {
    return {
      type: 'scene-change',
      target: 'game-over',
      levelIndex: snapshot.levelIndex,
      reason: 'base-destroyed',
    }
  }

  if (snapshot.playerLives === 0) {
    return {
      type: 'scene-change',
      target: 'game-over',
      levelIndex: snapshot.levelIndex,
      reason: 'player-defeated',
    }
  }

  if (snapshot.waveExhausted && snapshot.activeEnemyCount === 0) {
    return {
      type: 'scene-change',
      target: 'next-level',
      levelIndex: snapshot.levelIndex,
      nextLevelIndex: snapshot.levelIndex + 1,
    }
  }

  return null
}

export class LevelSceneChangeEmitter {
  private levelIndex: number
  private hasPendingSceneChange = false

  public constructor(options: LevelSceneChangeEmitterOptions = {}) {
    const initialLevelIndex = options.initialLevelIndex ?? 0
    assertNonNegativeInteger('Initial level index', initialLevelIndex)
    this.levelIndex = initialLevelIndex
  }

  public getCurrentLevelIndex(): number {
    return this.levelIndex
  }

  public resetForLevel(levelIndex = this.levelIndex): void {
    assertNonNegativeInteger('Level index', levelIndex)
    this.levelIndex = levelIndex
    this.hasPendingSceneChange = false
  }

  public update(
    snapshot: Omit<LevelStateSnapshot, 'levelIndex'>,
  ): SceneChangeEvent | null {
    if (this.hasPendingSceneChange) {
      return null
    }

    const event = evaluateLevelSceneChange({
      ...snapshot,
      levelIndex: this.levelIndex,
    })

    if (!event) {
      return null
    }

    this.hasPendingSceneChange = true

    if (event.target === 'next-level') {
      this.levelIndex = event.nextLevelIndex
    }

    return event
  }
}
