import './style.css'
import { GameLoop } from './core/GameLoop'
import { input } from './core/Input'
import type { Scene } from './core/Scene'
import { SceneManager } from './core/SceneManager'
import { Bullet } from './entities/Bullet'
import { EnemyTank } from './entities/EnemyTank'
import { EntityManager } from './entities/EntityManager'
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
import { BrickQuadrant } from './tiles/BrickDamage'
import { TileGrid } from './tiles/TileGrid'
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

const createBootTileGrid = (): TileGrid => {
  const grid = new TileGrid(13, 13, 32)

  for (let x = 0; x < grid.width; x += 1) {
    grid.set(x, 0, TileType.Steel)
    grid.set(x, grid.height - 1, TileType.Steel)
  }

  for (let y = 1; y < grid.height - 1; y += 1) {
    grid.set(0, y, TileType.Steel)
    grid.set(grid.width - 1, y, TileType.Steel)
  }

  grid.set(2, 2, TileType.Brick)
  grid.set(3, 2, TileType.Brick)
  grid.set(4, 2, TileType.Brick)
  grid.set(2, 3, TileType.Water)
  grid.set(3, 3, TileType.Water)
  grid.set(8, 3, TileType.Grass)
  grid.set(9, 3, TileType.Grass)
  grid.set(6, 6, TileType.Ice)
  grid.set(7, 6, TileType.Ice)
  grid.set(6, 10, TileType.Base)
  grid.damageQuadrant(3, 2, BrickQuadrant.TopLeft)
  grid.damageQuadrant(3, 2, BrickQuadrant.BottomRight)

  return grid
}

const bootTileGrid = createBootTileGrid()
const bulletManager = new EntityManager()
const tankManager = new EntityManager()
const effectManager = new EntityManager()
const powerUpManager = new EntityManager()
const playerFiringController = new BulletFiringController()
const levelSceneChangeEmitter = new LevelSceneChangeEmitter()
const powerUpEffects = createPowerUpEffectState()
const gameState = {
  score: 0,
  baseDestroyed: false,
}
let latestSceneChangeEvent: SceneChangeEvent | null = null
const topSpawnPoints = [
  { x: bootTileGrid.tileSize, y: bootTileGrid.tileSize },
  { x: 6 * bootTileGrid.tileSize, y: bootTileGrid.tileSize },
  { x: 11 * bootTileGrid.tileSize, y: bootTileGrid.tileSize },
]
const enemySpawner = new EnemySpawner({
  spawnPoints: topSpawnPoints,
  enemySize: { x: bootTileGrid.tileSize, y: bootTileGrid.tileSize },
  wave: [
    { type: 'basic', powerUpType: 'extra-life' },
    { type: 'basic', powerUpType: 'base-shield' },
    { type: 'fast', powerUpType: 'freeze-enemies' },
    { type: 'armored', powerUpType: 'weapon-upgrade' },
  ],
})
const playerTank = tankManager.add(
  new Tank({
    position: { x: 6 * bootTileGrid.tileSize, y: 9 * bootTileGrid.tileSize },
    size: { x: bootTileGrid.tileSize, y: bootTileGrid.tileSize },
    faction: 'player',
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
    if (
      bullet.isOutsideBounds(bootTileGrid.worldWidth, bootTileGrid.worldHeight)
    ) {
      bullet.alive = false
    }
  }

  bulletManager.pruneDead()
}

const resolveBulletTerrainCollisions = (): void => {
  for (const bullet of getActiveBullets()) {
    const result = resolveBulletTerrainCollision(bullet, bootTileGrid)

    if (result.baseDestroyed) {
      if (isBaseShieldActive(powerUpEffects) && result.tile) {
        bootTileGrid.set(result.tile.x, result.tile.y, TileType.Base)
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
  resolvePowerUpPickups(getActivePowerUps(), playerTank, powerUpEffects)
  powerUpManager.pruneDead()
}

const emitSceneChangeEvents = (): void => {
  if (latestSceneChangeEvent) {
    return
  }

  latestSceneChangeEvent = levelSceneChangeEmitter.update({
    waveExhausted: enemySpawner.isExhausted,
    activeEnemyCount: getActiveEnemyCount(),
    playerLives: playerTank.lives,
    baseDestroyed: gameState.baseDestroyed,
  })
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

const bootScene: Scene = {
  enter: () => undefined,
  exit: () => undefined,
  update: (dt: number): void => {
    if (latestSceneChangeEvent) {
      effectManager.update(dt)
      updatePowerUpEffects(powerUpEffects, dt)
      return
    }

    spawnEnemies(dt)
    updatePowerUpEffects(powerUpEffects, dt)
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
    }

    bulletManager.update(dt)
    resolveBulletTerrainCollisions()
    resolveBulletTankHits()
    resolvePlayerPowerUpPickups()
    pruneBulletsOutsideGrid()
    effectManager.update(dt)
    emitSceneChangeEvents()
  },
  render: (ctx: CanvasRenderingContext2D, fps: number): void => {
    clearScreen(ctx)
    renderTileGrid(ctx, bootTileGrid, { layer: TileRenderLayer.Base })
    tankManager.render(ctx)
    powerUpManager.render(ctx)
    bulletManager.render(ctx)
    effectManager.render(ctx)
    renderTileGrid(ctx, bootTileGrid, { layer: TileRenderLayer.Overlay })

    ctx.save()
    ctx.fillStyle = '#f9fafb'
    ctx.font = '14px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
    ctx.textBaseline = 'top'
    ctx.fillText(`FPS: ${fps}`, 12, 12)
    ctx.fillText(`Lives: ${playerTank.lives}`, 12, 32)
    ctx.fillText(`Score: ${gameState.score}`, 12, 52)
    ctx.fillText(`Wave: ${enemySpawner.remainingEnemies}`, 12, 72)
    ctx.fillText(`Scene: ${getSceneStatusText()}`, 12, 92)
    ctx.fillText(`Power: ${getPowerUpStatusText()}`, 12, 112)
    ctx.restore()
  },
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
sceneManager.setScene(bootScene)

const gameLoop = new GameLoop(context, {
  update: (dt: number): void => {
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
