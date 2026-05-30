export interface GameLoopHooks {
  update: (dt: number) => void
  render: (ctx: CanvasRenderingContext2D, fps: number) => void
}

export interface GameLoopOptions {
  fixedTimestep?: number
  maxFrameTime?: number
  requestFrame?: (callback: FrameRequestCallback) => number
  cancelFrame?: (handle: number) => void
}

const DEFAULT_FIXED_TIMESTEP = 1 / 60
const DEFAULT_MAX_FRAME_TIME = 0.25

export class GameLoop {
  private readonly ctx: CanvasRenderingContext2D
  private readonly hooks: GameLoopHooks
  private readonly fixedTimestep: number
  private readonly maxFrameTime: number
  private readonly requestFrame: (callback: FrameRequestCallback) => number
  private readonly cancelFrame: (handle: number) => void

  private accumulator = 0
  private currentFps = 0
  private frameCount = 0
  private fpsElapsed = 0
  private frameRequestId: number | null = null
  private lastTimestamp: number | null = null

  public constructor(
    ctx: CanvasRenderingContext2D,
    hooks: GameLoopHooks,
    options: GameLoopOptions = {},
  ) {
    this.ctx = ctx
    this.hooks = hooks
    this.fixedTimestep = options.fixedTimestep ?? DEFAULT_FIXED_TIMESTEP
    this.maxFrameTime = options.maxFrameTime ?? DEFAULT_MAX_FRAME_TIME
    this.requestFrame =
      options.requestFrame ?? window.requestAnimationFrame.bind(window)
    this.cancelFrame =
      options.cancelFrame ?? window.cancelAnimationFrame.bind(window)

    if (this.fixedTimestep <= 0) {
      throw new Error('GameLoop fixed timestep must be greater than zero.')
    }

    if (this.maxFrameTime <= 0) {
      throw new Error('GameLoop max frame time must be greater than zero.')
    }
  }

  public start(): void {
    if (this.frameRequestId !== null) {
      return
    }

    this.lastTimestamp = null
    this.frameRequestId = this.requestFrame(this.runFrame)
  }

  public stop(): void {
    if (this.frameRequestId === null) {
      return
    }

    this.cancelFrame(this.frameRequestId)
    this.frameRequestId = null
    this.lastTimestamp = null
    this.accumulator = 0
  }

  public getFps(): number {
    return this.currentFps
  }

  private readonly runFrame = (timestamp: number): void => {
    this.frameRequestId = this.requestFrame(this.runFrame)

    const elapsed =
      this.lastTimestamp === null
        ? 0
        : Math.min((timestamp - this.lastTimestamp) / 1000, this.maxFrameTime)

    this.lastTimestamp = timestamp
    this.accumulator += elapsed

    while (this.accumulator >= this.fixedTimestep) {
      this.hooks.update(this.fixedTimestep)
      this.accumulator -= this.fixedTimestep
    }

    this.updateFps(elapsed)
    this.hooks.render(this.ctx, this.currentFps)
  }

  private updateFps(elapsed: number): void {
    this.frameCount += 1
    this.fpsElapsed += elapsed

    if (this.fpsElapsed < 0.5) {
      return
    }

    this.currentFps = Math.round(this.frameCount / this.fpsElapsed)
    this.frameCount = 0
    this.fpsElapsed = 0
  }
}
