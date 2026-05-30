import { describe, expect, it, vi } from 'vitest'
import type { Scene } from '../core/Scene'
import { PauseScene } from './PauseScene'
import type { TitleInput } from './TitleScene'

const createInput = (pressedKeys: readonly string[] = []): TitleInput => ({
  wasPressed: (key: string) => pressedKeys.includes(key),
})

const createGameScene = (): Scene => ({
  enter: vi.fn(),
  exit: vi.fn(),
  update: vi.fn(),
  render: vi.fn(),
})

const createContext = (): {
  ctx: CanvasRenderingContext2D
  text: string[]
} => {
  const text: string[] = []
  const ctx = {
    canvas: {
      clientWidth: 800,
      clientHeight: 600,
      width: 800,
      height: 600,
    },
    save: vi.fn(),
    restore: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn((value: string) => {
      text.push(value)
    }),
  } as unknown as CanvasRenderingContext2D

  return { ctx, text }
}

describe('PauseScene', () => {
  it('resumes when P is pressed', () => {
    const onResume = vi.fn()
    const scene = new PauseScene({
      input: createInput(['KeyP']),
      gameScene: createGameScene(),
      onResume,
      onReturnToTitle: vi.fn(),
    })

    scene.update(1 / 60)

    expect(onResume).toHaveBeenCalledOnce()
  })

  it('returns to title when Enter is pressed', () => {
    const onReturnToTitle = vi.fn()
    const scene = new PauseScene({
      input: createInput(['Enter']),
      gameScene: createGameScene(),
      onResume: vi.fn(),
      onReturnToTitle,
    })

    scene.update(1 / 60)

    expect(onReturnToTitle).toHaveBeenCalledOnce()
  })

  it('renders the frozen game scene behind the pause overlay', () => {
    const gameScene = createGameScene()
    const scene = new PauseScene({
      input: createInput(),
      gameScene,
      onResume: vi.fn(),
      onReturnToTitle: vi.fn(),
    })
    const { ctx, text } = createContext()

    scene.render(ctx, 60)

    expect(gameScene.render).toHaveBeenCalledWith(ctx, 60)
    expect(text).toContain('PAUSED')
    expect(text).toContain('PRESS P TO RESUME')
  })
})
