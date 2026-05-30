import './style.css'
import {
  playGameOverSound,
  playPickupSounds,
  playShootSound,
  playTankCollisionSounds,
  playTerrainHitSound,
  playVictorySound,
} from './audio/GameSoundEffects'
import { AudioManager } from './audio/AudioManager'
import { DEFAULT_AUDIO_SAMPLES } from './audio/sounds'
import { GameLoop } from './core/GameLoop'
import { input } from './core/Input'
import type { Scene } from './core/Scene'
import { SceneManager } from './core/SceneManager'
import { Bullet } from './entities/Bullet'
import { EnemyTank } from './entities/EnemyTank'
import { EntityManager } from './entities/EntityManager'
import { PlayerTank } from './entities/PlayerTank'
import { PowerUp } from './entities/PowerUp'
import { Tank } from './entities/Tank'
import { BulletFiringController } from './game/BulletFiringController'
import { resolveBulletTankCollisions } from './game/BulletTankCollision'
import { resolveBulletTerrainCollision } from './game/BulletTerrainCollision'
import { EnemySpawner } from './game/EnemySpawner'
import {
  LevelSceneChangeEmitter,
  type SceneChangeEvent,
} from './game/LevelState'
import {
  areEnemiesFrozen,
  createPowerUpDrop,
  createPowerUpEffectState,
  isBaseShieldActive,
  isWeaponUpgraded,
  resolvePowerUpPickups,
  updatePowerUpEffects,
} from './game/PowerUps'
import { loadLevel } from './levels/LevelLoader'
import { STARTER_LEVELS } from './levels/levels'
import { PauseScene } from './scenes/PauseScene'
import { ResultScene } from './scenes/ResultScene'
import { DEFAULT_HIGH_SCORE_KEY, TitleScene } from './scenes/TitleScene'
import { TileType } from './tiles/TileTypes'
import { renderTileGrid, TileRenderLayer } from './tiles/renderTileGrid'

const canvas = document.querySelector<HTMLCanvasElement>('#app-canvas')

if (!canvas) {
  throw new Error('Expected #app-canvas to exist in the document.')
}

const context = canvas.getContext('2d')

if (!context) {
  throw new Error('This browser does not support 2D canvas rendering.')
}

const clearScreen = (ctx: CanvasRenderingContext2D): void => {
  const width = canvas.clientWidth
  const height = canvas.clientHeight

  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = '#111827'
  ctx.fillRect(0, 0, width, height)
}

const getTitleStorage = (): Storage | null => {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

const persistHighScore = (score: number): void => {
  if (!Number.isFinite(score) || score <= 0) {
    return
  }

  const storage = getTitleStorage()

  if (!storage) {
    return
  }

  try {
    const currentHighScore = Number.parseInt(
      storage.getItem(DEFAULT_HIGH_SCORE_KEY) ?? '0',
      10,
    )
    const safeCurrentHighScore = Number.isFinite(currentHighScore)
      ? currentHighScore
      : 0

    if (score > safeCurrentHighScore) {
      storage.setItem(DEFAULT_HIGH_SCORE_KEY, Math.floor(score).toString())
    }
  } catch {
    return
  }
}

const createGameScene = (levelIndex: number, initialScore = 0): Scene => {
  const levelDefinition = STARTER_LEVELS[levelIndex]

  if (!levelDefinition) {
    throw new Error(`No level definition exists for index ${levelIndex}.`)
  }

  const level = loadLevel(levelDefinition)
  const tileGrid = level.grid
  const bulletManager = new EntityManager()
  const tankManager = new EntityManager()
  const effectManager = new EntityManager()
  const powerUpManager = new EntityManager()
  const playerFiringController = new BulletFiringController()
  const levelSceneChangeEmitter = new LevelSceneChangeEmitter({
    initialLevelIndex: levelIndex,
  })
  const powerUpEffects = createPowerUpEffectState()
  const gameState = {
    score: initialScore,
    baseDestroyed: false,
  }
  let latestSceneChangeEvent: SceneChangeEvent | null = null
  const enemySpawner = new EnemySpawner({
    spawnPoints: level.enemySpawnPoints,
    enemySize: level.enemySize,
    wave: level.wave,
  })
  const playerTank = tankManager.add(
    new PlayerTank({
      position: level.playerSpawn,
      size: { x: tileGrid.tileSize, y: tileGrid.tileSize },
      direction: 'up',
      lives: 3,
    }),
  )

  const getPlayerShooter = () => ({
    position: playerTank.position,
    size: playerTank.size,
    direction: playerTank.direction,
    owner: playerTank.faction,
  })

  const getActiveBullets = (): Bullet[] =>
    bulletManager
      .getAll()
      .filter((entity): entity is Bullet => entity instanceof Bullet)

  const getActivePowerUps = (): PowerUp[] =>
    powerUpManager
      .getAll()
      .filter((entity): entity is PowerUp => entity instanceof PowerUp)

  const getActiveTanks = (): Tank[] =>
    tankManager
      .getAll()
      .filter((entity): entity is Tank => entity instanceof Tank)

  const getActiveEnemies = (): EnemyTank[] =>
    tankManager
      .getAll()
      .filter((entity): entity is EnemyTank => entity instanceof EnemyTank)

  const getActiveEnemyCount = (): number =>
    getActiveEnemies().filter((enemy) => enemy.alive).length

  const spawnEnemies = (dt: number): void => {
    const result = enemySpawner.update(dt, getActiveEnemies())

    if (!result) {
      return
    }

    tankManager.add(result.enemy)
    effectManager.add(result.flash)
  }

  const pruneBulletsOutsideGrid = (): void => {
    for (const bullet of getActiveBullets()) {
      if (bullet.isOutsideBounds(tileGrid.worldWidth, tileGrid.worldHeight)) {
        bullet.alive = false
      }
    }

    bulletManager.pruneDead()
  }

  const resolveBulletTerrainCollisions = (): void => {
    for (const bullet of getActiveBullets()) {
      const result = resolveBulletTerrainCollision(bullet, tileGrid)
      playTerrainHitSound(audioManager, result)

      if (result.baseDestroyed) {
        if (isBaseShieldActive(powerUpEffects) && result.tile) {
          tileGrid.set(result.tile.x, result.tile.y, TileType.Base)
        } else {
          gameState.baseDestroyed = true
        }
      }
    }

    bulletManager.pruneDead()
  }

  const resolveBulletTankHits = (): void => {
    const results = resolveBulletTankCollisions(
      getActiveBullets(),
      getActiveTanks(),
      gameState,
    )

    playTankCollisionSounds(audioManager, results)

    for (const result of results) {
      effectManager.add(result.explosion)

      if (result.tankDestroyed && result.tank instanceof EnemyTank) {
        const powerUp = createPowerUpDrop(result.tank)

        if (powerUp) {
          powerUpManager.add(powerUp)
        }
      }
    }

    bulletManager.pruneDead()
    tankManager.pruneDead()
  }

  const resolvePlayerPowerUpPickups = (): void => {
    const results = resolvePowerUpPickups(
      getActivePowerUps(),
      playerTank,
      powerUpEffects,
    )
    playPickupSounds(audioManager, results)
    powerUpManager.pruneDead()
  }

  const emitSceneChangeEvent = (): SceneChangeEvent | null => {
    if (latestSceneChangeEvent) {
      return null
    }

    latestSceneChangeEvent = levelSceneChangeEmitter.update({
      waveExhausted: enemySpawner.isExhausted,
      activeEnemyCount: getActiveEnemyCount(),
      playerLives: playerTank.lives,
      baseDestroyed: gameState.baseDestroyed,
    })

    return latestSceneChangeEvent
  }

  const getSceneStatusText = (): string => {
    if (!latestSceneChangeEvent) {
      return 'Playing'
    }

    if (latestSceneChangeEvent.target === 'next-level') {
      return `Next level: ${latestSceneChangeEvent.nextLevelIndex + 1}`
    }

    return `Game over: ${latestSceneChangeEvent.reason}`
  }

  const getPowerUpStatusText = (): string =>
    [
      isBaseShieldActive(powerUpEffects) ? 'Shield' : null,
      isWeaponUpgraded(powerUpEffects)
        ? `Weapon ${powerUpEffects.weaponLevel}`
        : null,
      areEnemiesFrozen(powerUpEffects) ? 'Freeze' : null,
    ]
      .filter((value): value is string => value !== null)
      .join(', ') || 'None'

  const handleSceneChangeEvent = (event: SceneChangeEvent): void => {
    if (event.target === 'game-over') {
      showGameOverScene(gameState.score)
      return
    }

    if (event.nextLevelIndex >= STARTER_LEVELS.length) {
      showVictoryScene(gameState.score)
      return
    }

    sceneManager.setScene(
      createGameScene(event.nextLevelIndex, gameState.score),
    )
  }

  const gameScene: Scene = {
    enter: () => undefined,
    exit: () => undefined,
    update: (dt: number): void => {
      if (
        input.wasPressed('KeyP') ||
        input.wasPressed('p') ||
        input.wasPressed('P')
      ) {
        showPauseScene(gameScene)
        return
      }

      if (latestSceneChangeEvent) {
        effectManager.update(dt)
        updatePowerUpEffects(powerUpEffects, dt)
        return
      }

      spawnEnemies(dt)
      updatePowerUpEffects(powerUpEffects, dt)
      playerTank.updateFromInput(dt, input, tileGrid)
      playerFiringController.update(dt)

      const bullet = playerTank.alive
        ? playerFiringController.tryFire(
            input,
            getActiveBullets(),
            getPlayerShooter(),
            isWeaponUpgraded(powerUpEffects)
              ? { maxActiveBullets: 2, bulletSpeed: 420 }
              : undefined,
          )
        : null

      if (bullet) {
        bulletManager.add(bullet)
        playShootSound(audioManager)
      }

      bulletManager.update(dt)
      resolveBulletTerrainCollisions()
      resolveBulletTankHits()
      resolvePlayerPowerUpPickups()
      pruneBulletsOutsideGrid()
      effectManager.update(dt)

      const sceneChangeEvent = emitSceneChangeEvent()

      if (sceneChangeEvent) {
        handleSceneChangeEvent(sceneChangeEvent)
      }
    },
    render: (ctx: CanvasRenderingContext2D, fps: number): void => {
      clearScreen(ctx)
      renderTileGrid(ctx, tileGrid, { layer: TileRenderLayer.Base })
      tankManager.render(ctx)
      powerUpManager.render(ctx)
      bulletManager.render(ctx)
      effectManager.render(ctx)
      renderTileGrid(ctx, tileGrid, { layer: TileRenderLayer.Overlay })

      ctx.save()
      ctx.fillStyle = '#f9fafb'
      ctx.font = '14px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
      ctx.textBaseline = 'top'
      ctx.fillText(`FPS: ${fps}`, 12, 12)
      ctx.fillText(`Lives: ${playerTank.lives}`, 12, 32)
      ctx.fillText(`Score: ${gameState.score}`, 12, 52)
      ctx.fillText(`Level: ${levelIndex + 1}`, 12, 72)
      ctx.fillText(`Wave: ${enemySpawner.remainingEnemies}`, 12, 92)
      ctx.fillText(`Scene: ${getSceneStatusText()}`, 12, 112)
      ctx.fillText(`Power: ${getPowerUpStatusText()}`, 12, 132)
      ctx.restore()

      const sceneStatus = getSceneStatusText()
      canvas.dataset.hudLives = playerTank.lives.toString()
      canvas.dataset.hudScore = gameState.score.toString()
      canvas.dataset.hudLevel = (levelIndex + 1).toString()
      canvas.dataset.hudWave = enemySpawner.remainingEnemies.toString()
      canvas.dataset.hudScene = sceneStatus
      canvas.setAttribute(
        'aria-label',
        `Game HUD. Lives ${playerTank.lives}. Score ${gameState.score}. Level ${
          levelIndex + 1
        }. Wave ${enemySpawner.remainingEnemies}. Scene ${sceneStatus}.`,
      )
    },
  }

  return gameScene
}

const resizeCanvas = (): void => {
  const pixelRatio = window.devicePixelRatio || 1
  const width = Math.max(1, Math.floor(canvas.clientWidth * pixelRatio))
  const height = Math.max(1, Math.floor(canvas.clientHeight * pixelRatio))

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
  }

  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
}

const sceneManager = new SceneManager()
const audioManager = new AudioManager({
  storage: getTitleStorage(),
})

void audioManager.loadSamples(DEFAULT_AUDIO_SAMPLES).catch((error: unknown) => {
  console.warn('Audio samples could not be loaded.', error)
})

const toggleMuteIfRequested = (): void => {
  if (
    input.wasPressed('KeyM') ||
    input.wasPressed('m') ||
    input.wasPressed('M')
  ) {
    audioManager.toggleMuted()
  }
}

const showTitleScene = (): void => {
  sceneManager.setScene(
    new TitleScene({
      input,
      storage: getTitleStorage(),
      onStart: () => {
        sceneManager.setScene(createGameScene(0))
      },
    }),
  )
}

const showPauseScene = (gameScene: Scene): void => {
  sceneManager.setScene(
    new PauseScene({
      input,
      gameScene,
      onResume: () => {
        sceneManager.setScene(gameScene)
      },
      onReturnToTitle: showTitleScene,
    }),
  )
}

const showGameOverScene = (finalScore: number): void => {
  persistHighScore(finalScore)
  playGameOverSound(audioManager)
  sceneManager.setScene(
    new ResultScene({
      input,
      title: 'GAME OVER',
      finalScore,
      onReturnToTitle: showTitleScene,
    }),
  )
}

const showVictoryScene = (finalScore: number): void => {
  persistHighScore(finalScore)
  playVictorySound(audioManager)
  sceneManager.setScene(
    new ResultScene({
      input,
      title: 'VICTORY',
      finalScore,
      onReturnToTitle: showTitleScene,
    }),
  )
}

showTitleScene()

const gameLoop = new GameLoop(context, {
  update: (dt: number): void => {
    toggleMuteIfRequested()
    sceneManager.update(dt)
    input.endFrame()
  },
  render: (ctx: CanvasRenderingContext2D, fps: number): void => {
    sceneManager.render(ctx, fps)
  },
})

const resizeObserver = new ResizeObserver(resizeCanvas)

resizeObserver.observe(canvas)
resizeCanvas()
gameLoop.start()
