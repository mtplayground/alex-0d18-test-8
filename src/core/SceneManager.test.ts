import { describe, expect, it } from 'vitest'
import type { Scene } from './Scene'
import { SceneManager } from './SceneManager'

const createScene = (name: string, calls: string[]): Scene => ({
  enter: () => {
    calls.push(`${name}:enter`)
  },
  exit: () => {
    calls.push(`${name}:exit`)
  },
  update: (dt: number) => {
    calls.push(`${name}:update:${dt}`)
  },
  render: (_ctx: CanvasRenderingContext2D, fps: number) => {
    calls.push(`${name}:render:${fps}`)
  },
})

describe('SceneManager', () => {
  it('enters, updates, and renders the active scene', () => {
    const calls: string[] = []
    const manager = new SceneManager()
    const scene = createScene('scene', calls)

    manager.setScene(scene)
    manager.update(1 / 60)
    manager.render({} as CanvasRenderingContext2D, 60)

    expect(manager.getActiveScene()).toBe(scene)
    expect(calls).toEqual([
      'scene:enter',
      'scene:update:0.016666666666666666',
      'scene:render:60',
    ])
  })

  it('exits the previous scene before entering the next scene', () => {
    const calls: string[] = []
    const manager = new SceneManager()
    const firstScene = createScene('first', calls)
    const secondScene = createScene('second', calls)

    manager.setScene(firstScene)
    manager.setScene(secondScene)

    expect(manager.getActiveScene()).toBe(secondScene)
    expect(calls).toEqual(['first:enter', 'first:exit', 'second:enter'])
  })

  it('does not re-enter the active scene when it is set again', () => {
    const calls: string[] = []
    const manager = new SceneManager()
    const scene = createScene('scene', calls)

    manager.setScene(scene)
    manager.setScene(scene)

    expect(calls).toEqual(['scene:enter'])
  })

  it('clears the active scene and ignores update/render with no scene', () => {
    const calls: string[] = []
    const manager = new SceneManager()
    const scene = createScene('scene', calls)

    manager.setScene(scene)
    manager.clearScene()
    manager.update(1)
    manager.render({} as CanvasRenderingContext2D, 30)

    expect(manager.getActiveScene()).toBeNull()
    expect(calls).toEqual(['scene:enter', 'scene:exit'])
  })
})
