import { describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_HIGH_SCORE_KEY,
  DEFAULT_TITLE,
  TitleScene,
  type TitleInput,
  type TitleStorage,
} from './TitleScene'

const createInput = (pressedKeys: readonly string[] = []): TitleInput => ({
  wasPressed: (key: string) => pressedKeys.includes(key),
})

const createContext = (): {
  ctx: CanvasRenderingContext2D
  text: string[]
} => {
  const text: string[] = []
  const gradient = {
    addColorStop: vi.fn(),
  }
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
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    createLinearGradient: vi.fn(() => gradient),
    fillText: vi.fn((value: string) => {
      text.push(value)
    }),
  } as unknown as CanvasRenderingContext2D

  return { ctx, text }
}

describe('TitleScene', () => {
  it('starts the game when Enter is pressed', () => {
    const onStart = vi.fn()
    const scene = new TitleScene({
      input: createInput(['Enter']),
      onStart,
    })

    scene.update(1 / 60)

    expect(onStart).toHaveBeenCalledOnce()
  })

  it('starts the game when Space is pressed', () => {
    const onStart = vi.fn()
    const scene = new TitleScene({
      input: createInput(['Space']),
      onStart,
    })

    scene.update(1 / 60)

    expect(onStart).toHaveBeenCalledOnce()
  })

  it('does not fire the start callback more than once before re-entering', () => {
    const onStart = vi.fn()
    const scene = new TitleScene({
      input: createInput(['Enter']),
      onStart,
    })

    scene.update(1 / 60)
    scene.update(1 / 60)

    expect(onStart).toHaveBeenCalledOnce()
  })

  it('renders the logo text, start prompt, and local high score', () => {
    const storage: TitleStorage = {
      getItem: (key: string) =>
        key === DEFAULT_HIGH_SCORE_KEY ? '2400' : null,
    }
    const scene = new TitleScene({
      input: createInput(),
      storage,
      onStart: vi.fn(),
    })
    const { ctx, text } = createContext()

    scene.render(ctx, 60)

    expect(text).toContain(DEFAULT_TITLE)
    expect(text).toContain('2400')
    expect(text).toContain('PRESS ENTER OR SPACE')
    expect(text).toContain('START GAME')
  })

  it('falls back to zero when high score storage is unavailable or invalid', () => {
    const storage: TitleStorage = {
      getItem: () => {
        throw new Error('storage unavailable')
      },
    }
    const scene = new TitleScene({
      input: createInput(),
      storage,
      onStart: vi.fn(),
    })
    const { ctx, text } = createContext()

    scene.render(ctx, 60)

    expect(text).toContain('0')
  })
})
