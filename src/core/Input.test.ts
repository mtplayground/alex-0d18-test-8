import { describe, expect, it } from 'vitest'
import { KeyboardInput } from './Input'

const keyboardEvent = (
  type: 'keydown' | 'keyup',
  options: { code?: string; key?: string; repeat?: boolean },
): Event => {
  const event = new Event(type)

  Object.defineProperties(event, {
    code: {
      value: options.code,
    },
    key: {
      value: options.key,
    },
    repeat: {
      value: options.repeat ?? false,
    },
  })

  return event
}

describe('KeyboardInput', () => {
  it('tracks keys by code and key while they are down', () => {
    const target = new EventTarget()
    const input = new KeyboardInput(target)

    target.dispatchEvent(keyboardEvent('keydown', { code: 'KeyA', key: 'a' }))

    expect(input.isDown('KeyA')).toBe(true)
    expect(input.isDown('a')).toBe(true)
    expect(input.wasPressed('KeyA')).toBe(true)
    expect(input.wasPressed('a')).toBe(true)

    target.dispatchEvent(keyboardEvent('keyup', { code: 'KeyA', key: 'a' }))

    expect(input.isDown('KeyA')).toBe(false)
    expect(input.isDown('a')).toBe(false)
  })

  it('keeps wasPressed edge-triggered until the frame ends', () => {
    const target = new EventTarget()
    const input = new KeyboardInput(target)

    target.dispatchEvent(
      keyboardEvent('keydown', { code: 'ArrowLeft', key: 'ArrowLeft' }),
    )
    target.dispatchEvent(
      keyboardEvent('keydown', {
        code: 'ArrowLeft',
        key: 'ArrowLeft',
        repeat: true,
      }),
    )

    expect(input.wasPressed('ArrowLeft')).toBe(true)

    input.endFrame()

    expect(input.isDown('ArrowLeft')).toBe(true)
    expect(input.wasPressed('ArrowLeft')).toBe(false)
  })

  it('releases all keys on blur', () => {
    const target = new EventTarget()
    const input = new KeyboardInput(target)

    target.dispatchEvent(keyboardEvent('keydown', { code: 'Space', key: ' ' }))
    target.dispatchEvent(new Event('blur'))

    expect(input.isDown('Space')).toBe(false)
    expect(input.wasPressed('Space')).toBe(false)
  })
})
