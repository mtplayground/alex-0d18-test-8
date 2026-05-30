import { describe, expect, it } from 'vitest'
import { evaluateLevelSceneChange, LevelSceneChangeEmitter } from './LevelState'

describe('evaluateLevelSceneChange', () => {
  it('emits game over when the base is destroyed', () => {
    expect(
      evaluateLevelSceneChange({
        levelIndex: 2,
        waveExhausted: true,
        activeEnemyCount: 0,
        playerLives: 3,
        baseDestroyed: true,
      }),
    ).toEqual({
      type: 'scene-change',
      target: 'game-over',
      levelIndex: 2,
      reason: 'base-destroyed',
    })
  })

  it('emits game over when player lives reach zero', () => {
    expect(
      evaluateLevelSceneChange({
        levelIndex: 1,
        waveExhausted: false,
        activeEnemyCount: 2,
        playerLives: 0,
        baseDestroyed: false,
      }),
    ).toEqual({
      type: 'scene-change',
      target: 'game-over',
      levelIndex: 1,
      reason: 'player-defeated',
    })
  })

  it('emits next-level when the wave is exhausted and no enemies remain', () => {
    expect(
      evaluateLevelSceneChange({
        levelIndex: 3,
        waveExhausted: true,
        activeEnemyCount: 0,
        playerLives: 1,
        baseDestroyed: false,
      }),
    ).toEqual({
      type: 'scene-change',
      target: 'next-level',
      levelIndex: 3,
      nextLevelIndex: 4,
    })
  })

  it('waits while the wave has queued or active enemies', () => {
    expect(
      evaluateLevelSceneChange({
        levelIndex: 0,
        waveExhausted: false,
        activeEnemyCount: 0,
        playerLives: 3,
        baseDestroyed: false,
      }),
    ).toBeNull()

    expect(
      evaluateLevelSceneChange({
        levelIndex: 0,
        waveExhausted: true,
        activeEnemyCount: 1,
        playerLives: 3,
        baseDestroyed: false,
      }),
    ).toBeNull()
  })

  it('gives game-over conditions priority over level completion', () => {
    expect(
      evaluateLevelSceneChange({
        levelIndex: 0,
        waveExhausted: true,
        activeEnemyCount: 0,
        playerLives: 0,
        baseDestroyed: true,
      }),
    ).toEqual({
      type: 'scene-change',
      target: 'game-over',
      levelIndex: 0,
      reason: 'base-destroyed',
    })
  })

  it('rejects invalid numeric state', () => {
    expect(() =>
      evaluateLevelSceneChange({
        levelIndex: -1,
        waveExhausted: true,
        activeEnemyCount: 0,
        playerLives: 1,
        baseDestroyed: false,
      }),
    ).toThrow('Level index must be a non-negative integer.')

    expect(() =>
      evaluateLevelSceneChange({
        levelIndex: 0,
        waveExhausted: true,
        activeEnemyCount: -1,
        playerLives: 1,
        baseDestroyed: false,
      }),
    ).toThrow('Active enemy count must be a non-negative integer.')
  })
})

describe('LevelSceneChangeEmitter', () => {
  it('emits a scene-change event only once until reset', () => {
    const emitter = new LevelSceneChangeEmitter({ initialLevelIndex: 1 })
    const snapshot = {
      waveExhausted: true,
      activeEnemyCount: 0,
      playerLives: 3,
      baseDestroyed: false,
    }

    expect(emitter.update(snapshot)).toEqual({
      type: 'scene-change',
      target: 'next-level',
      levelIndex: 1,
      nextLevelIndex: 2,
    })
    expect(emitter.getCurrentLevelIndex()).toBe(2)
    expect(emitter.update(snapshot)).toBeNull()

    emitter.resetForLevel(2)

    expect(
      emitter.update({
        waveExhausted: false,
        activeEnemyCount: 0,
        playerLives: 0,
        baseDestroyed: false,
      }),
    ).toEqual({
      type: 'scene-change',
      target: 'game-over',
      levelIndex: 2,
      reason: 'player-defeated',
    })
  })
})
