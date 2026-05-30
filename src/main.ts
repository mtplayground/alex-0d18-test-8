import './style.css'
import { GameLoop } from './core/GameLoop'
import { input } from './core/Input'
import type { Scene } from './core/Scene'
import { SceneManager } from './core/SceneManager'

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

const bootScene: Scene = {
  enter: () => undefined,
  exit: () => undefined,
  update: (dt: number): void => {
    void dt
  },
  render: (ctx: CanvasRenderingContext2D, fps: number): void => {
    clearScreen(ctx)

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
