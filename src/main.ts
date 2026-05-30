import './style.css'
import { GameLoop } from './core/GameLoop'
import { input } from './core/Input'
import type { Scene } from './core/Scene'
import { SceneManager } from './core/SceneManager'
import { Bullet } from './entities/Bullet'
import { EntityManager } from './entities/EntityManager'
import { BulletFiringController } from './game/BulletFiringController'
import { resolveBulletTerrainCollision } from './game/BulletTerrainCollision'
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
const playerFiringController = new BulletFiringController()
const playerShooter = {
  position: { x: 6 * bootTileGrid.tileSize, y: 9 * bootTileGrid.tileSize },
  size: { x: bootTileGrid.tileSize, y: bootTileGrid.tileSize },
  direction: 'up' as const,
  owner: 'player' as const,
}

const getActiveBullets = (): Bullet[] =>
  bulletManager
    .getAll()
    .filter((entity): entity is Bullet => entity instanceof Bullet)

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
    resolveBulletTerrainCollision(bullet, bootTileGrid)
  }

  bulletManager.pruneDead()
}

const renderPlayerShooter = (ctx: CanvasRenderingContext2D): void => {
  ctx.save()
  ctx.fillStyle = '#38bdf8'
  ctx.fillRect(
    playerShooter.position.x,
    playerShooter.position.y,
    playerShooter.size.x,
    playerShooter.size.y,
  )
  ctx.fillStyle = '#e0f2fe'
  ctx.fillRect(
    playerShooter.position.x + playerShooter.size.x / 2 - 3,
    playerShooter.position.y - 8,
    6,
    12,
  )
  ctx.restore()
}

const bootScene: Scene = {
  enter: () => undefined,
  exit: () => undefined,
  update: (dt: number): void => {
    playerFiringController.update(dt)

    const bullet = playerFiringController.tryFire(
      input,
      getActiveBullets(),
      playerShooter,
    )

    if (bullet) {
      bulletManager.add(bullet)
    }

    bulletManager.update(dt)
    resolveBulletTerrainCollisions()
    pruneBulletsOutsideGrid()
  },
  render: (ctx: CanvasRenderingContext2D, fps: number): void => {
    clearScreen(ctx)
    renderTileGrid(ctx, bootTileGrid, { layer: TileRenderLayer.Base })
    renderPlayerShooter(ctx)
    bulletManager.render(ctx)
    renderTileGrid(ctx, bootTileGrid, { layer: TileRenderLayer.Overlay })

    ctx.save()
    ctx.fillStyle = '#f9fafb'
    ctx.font = '14px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
    ctx.textBaseline = 'top'
    ctx.fillText(`FPS: ${fps}`, 12, 12)
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
