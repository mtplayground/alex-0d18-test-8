import type { Scene } from './Scene'

export class SceneManager {
  private activeScene: Scene | null = null

  public setScene(scene: Scene): void {
    if (this.activeScene === scene) {
      return
    }

    this.activeScene?.exit()
    this.activeScene = scene
    this.activeScene.enter()
  }

  public clearScene(): void {
    if (!this.activeScene) {
      return
    }

    this.activeScene.exit()
    this.activeScene = null
  }

  public getActiveScene(): Scene | null {
    return this.activeScene
  }

  public update(dt: number): void {
    this.activeScene?.update(dt)
  }

  public render(ctx: CanvasRenderingContext2D, fps: number): void {
    this.activeScene?.render(ctx, fps)
  }
}
