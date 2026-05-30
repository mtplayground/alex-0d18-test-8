import { describe, expect, it, vi } from 'vitest'
import {
  formatHudAriaLabel,
  renderHud,
  writeHudAttributes,
  type HudSnapshot,
} from './HudRenderer'

class CanvasContextSpy {
  public fillStyle: string | CanvasGradient | CanvasPattern = '#000000'
  public strokeStyle: string | CanvasGradient | CanvasPattern = '#000000'
  public lineWidth = 0
  public textBaseline: CanvasTextBaseline = 'alphabetic'
  public textAlign: CanvasTextAlign = 'start'
  public font = ''
  public readonly fillRectCalls: number[][] = []
  public readonly strokeRectCalls: number[][] = []
  public readonly fillTextCalls: Array<[string, number, number]> = []

  public save = vi.fn()
  public restore = vi.fn()

  public fillRect(x: number, y: number, width: number, height: number): void {
    this.fillRectCalls.push([x, y, width, height])
  }

  public strokeRect(x: number, y: number, width: number, height: number): void {
    this.strokeRectCalls.push([x, y, width, height])
  }

  public fillText(text: string, x: number, y: number): void {
    this.fillTextCalls.push([text, x, y])
  }
}

const snapshot: HudSnapshot = {
  lives: 3,
  score: 1200,
  level: 2,
  enemiesRemaining: 5,
}

describe('HudRenderer', () => {
  it('renders the HUD panel and counter rows', () => {
    const context = new CanvasContextSpy()

    renderHud(context as unknown as CanvasRenderingContext2D, snapshot)

    expect(context.save).toHaveBeenCalledOnce()
    expect(context.restore).toHaveBeenCalledOnce()
    expect(context.fillRectCalls[0]).toEqual([12, 12, 184, 132])
    expect(context.strokeRectCalls[0]).toEqual([12.5, 12.5, 183, 131])
    expect(context.fillTextCalls.map(([text]) => text)).toEqual([
      'STATUS',
      'LIVES',
      '3',
      'SCORE',
      '1200',
      'LEVEL',
      '2',
      'ENEMIES',
      '5',
    ])
  })

  it('formats and writes accessible HUD state to the canvas', () => {
    const attributes = new Map<string, string>()
    const canvas = {
      dataset: {},
      setAttribute: (name: string, value: string) => {
        attributes.set(name, value)
      },
      getAttribute: (name: string) => attributes.get(name) ?? null,
    } as unknown as HTMLCanvasElement

    writeHudAttributes(canvas, snapshot)

    expect(canvas.dataset.hudLives).toBe('3')
    expect(canvas.dataset.hudScore).toBe('1200')
    expect(canvas.dataset.hudLevel).toBe('2')
    expect(canvas.dataset.hudEnemiesRemaining).toBe('5')
    expect(canvas.dataset.hudWave).toBe('5')
    expect(canvas.dataset.hudScene).toBe('Playing')
    expect(canvas.getAttribute('aria-label')).toBe(formatHudAriaLabel(snapshot))
  })

  it('rejects invalid HUD snapshots', () => {
    expect(() =>
      renderHud({} as CanvasRenderingContext2D, {
        ...snapshot,
        level: 0,
      }),
    ).toThrow('HUD level must be a positive integer.')

    expect(() =>
      formatHudAriaLabel({
        ...snapshot,
        enemiesRemaining: -1,
      }),
    ).toThrow('HUD enemies remaining must be a non-negative integer.')
  })
})
