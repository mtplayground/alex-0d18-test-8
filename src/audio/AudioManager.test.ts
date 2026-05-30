import { describe, expect, it, vi } from 'vitest'
import {
  AudioManager,
  DEFAULT_MUTED_STORAGE_KEY,
  type AudioContextLike,
  type AudioFetchResponse,
  type AudioPreferenceStorage,
} from './AudioManager'

class MemoryStorage implements AudioPreferenceStorage {
  public readonly values = new Map<string, string>()

  public constructor(initialValues: Record<string, string> = {}) {
    for (const [key, value] of Object.entries(initialValues)) {
      this.values.set(key, value)
    }
  }

  public getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  public setItem(key: string, value: string): void {
    this.values.set(key, value)
  }
}

const createFetchResponse = (ok = true): AudioFetchResponse => ({
  ok,
  status: ok ? 200 : 404,
  statusText: ok ? 'OK' : 'Not Found',
  arrayBuffer: async () => new ArrayBuffer(8),
})

const createContext = (): {
  context: AudioContextLike
  started: number
  decoded: number
} => {
  const stats = {
    started: 0,
    decoded: 0,
  }
  const context: AudioContextLike = {
    state: 'running',
    destination: {},
    decodeAudioData: vi.fn(async () => {
      stats.decoded += 1
      return {}
    }),
    createBufferSource: vi.fn(() => ({
      buffer: null,
      connect: vi.fn(),
      start: vi.fn(() => {
        stats.started += 1
      }),
    })),
    createGain: vi.fn(() => ({
      gain: { value: 0 },
      connect: vi.fn(),
    })),
    resume: vi.fn(async () => undefined),
  }

  return {
    context,
    get started() {
      return stats.started
    },
    get decoded() {
      return stats.decoded
    },
  }
}

describe('AudioManager', () => {
  it('loads, decodes, stores, and plays audio samples by key', async () => {
    const fakeContext = createContext()
    const fetcher = vi.fn(async () => createFetchResponse())
    const manager = new AudioManager({
      createContext: () => fakeContext.context,
      fetcher,
    })

    await manager.loadSamples([{ key: 'fire', src: '/sounds/fire.wav' }])
    const didPlay = manager.play('fire')

    expect(fetcher).toHaveBeenCalledWith('/sounds/fire.wav')
    expect(fakeContext.decoded).toBe(1)
    expect(manager.hasSample('fire')).toBe(true)
    expect(didPlay).toBe(true)
    expect(fakeContext.started).toBe(1)
  })

  it('reuses pending and decoded samples for the same key', async () => {
    const fakeContext = createContext()
    const fetcher = vi.fn(async () => createFetchResponse())
    const manager = new AudioManager({
      createContext: () => fakeContext.context,
      fetcher,
    })
    const sample = { key: 'hit', src: '/sounds/hit.wav' }

    await Promise.all([manager.loadSample(sample), manager.loadSample(sample)])
    await manager.loadSample(sample)

    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(fakeContext.decoded).toBe(1)
  })

  it('persists mute preference and suppresses playback while muted', async () => {
    const fakeContext = createContext()
    const storage = new MemoryStorage()
    const manager = new AudioManager({
      createContext: () => fakeContext.context,
      fetcher: async () => createFetchResponse(),
      storage,
    })

    await manager.loadSample({ key: 'fire', src: '/sounds/fire.wav' })

    expect(manager.toggleMuted()).toBe(true)
    expect(storage.getItem(DEFAULT_MUTED_STORAGE_KEY)).toBe('true')
    expect(manager.play('fire')).toBe(false)
    expect(fakeContext.started).toBe(0)

    manager.setMuted(false)

    expect(storage.getItem(DEFAULT_MUTED_STORAGE_KEY)).toBe('false')
    expect(manager.play('fire')).toBe(true)
  })

  it('restores mute preference from storage', () => {
    const manager = new AudioManager({
      createContext: () => null,
      fetcher: async () => createFetchResponse(),
      storage: new MemoryStorage({ [DEFAULT_MUTED_STORAGE_KEY]: 'true' }),
    })

    expect(manager.isMuted).toBe(true)
  })

  it('acts as a no-op when Web Audio is unavailable', async () => {
    const manager = new AudioManager({
      createContext: () => null,
      fetcher: async () => createFetchResponse(),
    })

    await expect(
      manager.loadSample({ key: 'fire', src: '/sounds/fire.wav' }),
    ).resolves.toBe(false)
    expect(manager.play('fire')).toBe(false)
  })

  it('rejects failed sample requests and invalid definitions', async () => {
    const fakeContext = createContext()
    const manager = new AudioManager({
      createContext: () => fakeContext.context,
      fetcher: async () => createFetchResponse(false),
    })

    await expect(
      manager.loadSample({ key: 'missing', src: '/sounds/missing.wav' }),
    ).rejects.toThrow('Failed to load audio sample "missing". 404 Not Found')
    await expect(
      manager.loadSample({ key: '', src: '/x.wav' }),
    ).rejects.toThrow('Audio sample key cannot be empty.')
    await expect(manager.loadSample({ key: 'x', src: '' })).rejects.toThrow(
      'Audio sample "x" source cannot be empty.',
    )
  })
})
