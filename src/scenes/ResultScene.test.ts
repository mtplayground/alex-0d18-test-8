import { describe, expect, it, vi } from 'vitest'
import { ResultScene } from './ResultScene'
import type { TitleInput } from './TitleScene'

const createInput = (pressedKeys: readonly string[] = []): TitleInput => ({
  wasPressed: (key: string) => pressedKeys.includes(key),
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
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn((value: string) => {
      text.push(value)
    }),
  } as unknown as CanvasRenderingContext2D

  return { ctx, text }
}

describe('ResultScene', () => {
  it('returns to title when Enter is pressed', () => {
    const onReturnToTitle = vi.fn()
    const scene = new ResultScene({
      input: createInput(['Enter']),
      title: 'GAME OVER',
      finalScore: 1200,
      onReturnToTitle,
    })

    scene.update(1 / 60)

    expect(onReturnToTitle).toHaveBeenCalledOnce()
  })

  it('returns to title when Space is pressed', () => {
    const onReturnToTitle = vi.fn()
    const scene = new ResultScene({
      input: createInput(['Space']),
      title: 'VICTORY',
      finalScore: 2400,
      onReturnToTitle,
    })

    scene.update(1 / 60)

    expect(onReturnToTitle).toHaveBeenCalledOnce()
  })

  it('renders the result title, final score, and restart prompt', () => {
    const scene = new ResultScene({
      input: createInput(),
      title: 'GAME OVER',
      finalScore: 300,
      onReturnToTitle: vi.fn(),
    })
    const { ctx, text } = createContext()

    scene.render(ctx, 60)

    expect(text).toContain('GAME OVER')
    expect(text).toContain('FINAL SCORE')
    expect(text).toContain('300')
    expect(text).toContain('RETURN TO TITLE TO RESTART')
  })
})
