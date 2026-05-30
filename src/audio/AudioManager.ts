export interface AudioSampleDefinition {
  key: string
  src: string
}

export interface AudioPreferenceStorage {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

export interface AudioFetchResponse {
  ok: boolean
  status?: number
  statusText?: string
  arrayBuffer: () => Promise<ArrayBuffer>
}

export type AudioFetcher = (src: string) => Promise<AudioFetchResponse>

type AudioBufferLike = object
type AudioNodeLike = object

export interface AudioParamLike {
  value: number
}

export interface GainNodeLike {
  gain: AudioParamLike
  connect: (destination: AudioNodeLike) => void
}

export interface AudioBufferSourceLike {
  buffer: AudioBufferLike | null
  connect: (destination: GainNodeLike) => void
  start: (when?: number) => void
}

export interface AudioContextLike {
  readonly state: string
  readonly destination: AudioNodeLike
  decodeAudioData: (audioData: ArrayBuffer) => Promise<AudioBufferLike>
  createBufferSource: () => AudioBufferSourceLike
  createGain: () => GainNodeLike
  resume: () => Promise<void>
}

export interface AudioManagerOptions {
  createContext?: () => AudioContextLike | null
  fetcher?: AudioFetcher
  storage?: AudioPreferenceStorage | null
  mutedStorageKey?: string
  volume?: number
}

export const DEFAULT_MUTED_STORAGE_KEY = 'alex-0d18-test-8.audioMuted'

type BrowserAudioContextConstructor = new () => AudioContextLike

const getBrowserAudioContextConstructor =
  (): BrowserAudioContextConstructor | null => {
    if (typeof window === 'undefined') {
      return null
    }

    const audioWindow = window as Window & {
      webkitAudioContext?: BrowserAudioContextConstructor
    }

    return (
      (window.AudioContext as unknown as BrowserAudioContextConstructor) ??
      audioWindow.webkitAudioContext ??
      null
    )
  }

const createBrowserAudioContext = (): AudioContextLike | null => {
  const AudioContextConstructor = getBrowserAudioContextConstructor()

  if (!AudioContextConstructor) {
    return null
  }

  return new AudioContextConstructor()
}

const getBrowserFetcher = (): AudioFetcher => {
  if (typeof fetch === 'undefined') {
    throw new Error('Audio sample loading requires fetch to be available.')
  }

  return fetch
}

const readStoredMutedPreference = (
  storage: AudioPreferenceStorage | null,
  mutedStorageKey: string,
): boolean => {
  if (!storage) {
    return false
  }

  try {
    const storedValue = storage.getItem(mutedStorageKey)
    return storedValue === 'true' || storedValue === '1'
  } catch {
    return false
  }
}

const assertSampleDefinition = (sample: AudioSampleDefinition): void => {
  if (sample.key.trim().length === 0) {
    throw new Error('Audio sample key cannot be empty.')
  }

  if (sample.src.trim().length === 0) {
    throw new Error(`Audio sample "${sample.key}" source cannot be empty.`)
  }
}

export class AudioManager {
  private readonly createContext: () => AudioContextLike | null
  private readonly fetcher: AudioFetcher
  private readonly storage: AudioPreferenceStorage | null
  private readonly mutedStorageKey: string
  private readonly volume: number
  private readonly buffers = new Map<string, AudioBufferLike>()
  private readonly pendingBuffers = new Map<string, Promise<AudioBufferLike>>()
  private context: AudioContextLike | null = null
  private contextUnavailable = false
  private muted: boolean

  public constructor(options: AudioManagerOptions = {}) {
    const volume = options.volume ?? 0.65

    if (!Number.isFinite(volume) || volume < 0 || volume > 1) {
      throw new Error('AudioManager volume must be between 0 and 1.')
    }

    this.createContext = options.createContext ?? createBrowserAudioContext
    this.fetcher = options.fetcher ?? getBrowserFetcher()
    this.storage = options.storage ?? null
    this.mutedStorageKey = options.mutedStorageKey ?? DEFAULT_MUTED_STORAGE_KEY
    this.volume = volume
    this.muted = readStoredMutedPreference(this.storage, this.mutedStorageKey)
  }

  public get isMuted(): boolean {
    return this.muted
  }

  public setMuted(muted: boolean): void {
    this.muted = muted

    if (!this.storage) {
      return
    }

    try {
      this.storage.setItem(this.mutedStorageKey, muted ? 'true' : 'false')
    } catch {
      return
    }
  }

  public toggleMuted(): boolean {
    this.setMuted(!this.muted)
    return this.muted
  }

  public async loadSamples(
    samples: readonly AudioSampleDefinition[],
  ): Promise<ReadonlyMap<string, AudioBufferLike>> {
    await Promise.all(samples.map((sample) => this.loadSample(sample)))
    return this.buffers
  }

  public async loadSample(sample: AudioSampleDefinition): Promise<boolean> {
    assertSampleDefinition(sample)

    if (this.buffers.has(sample.key)) {
      return true
    }

    const context = this.getContext()

    if (!context) {
      return false
    }

    const pendingBuffer = this.pendingBuffers.get(sample.key)

    if (pendingBuffer) {
      await pendingBuffer
      return true
    }

    const pendingLoad = this.fetchAndDecodeSample(context, sample)
    this.pendingBuffers.set(sample.key, pendingLoad)

    try {
      const buffer = await pendingLoad
      this.buffers.set(sample.key, buffer)
      return true
    } finally {
      this.pendingBuffers.delete(sample.key)
    }
  }

  public hasSample(key: string): boolean {
    return this.buffers.has(key)
  }

  public play(key: string): boolean {
    if (this.muted) {
      return false
    }

    const buffer = this.buffers.get(key)

    if (!buffer) {
      return false
    }

    const context = this.getContext()

    if (!context) {
      return false
    }

    if (context.state === 'suspended') {
      void context.resume().catch(() => undefined)
    }

    const source = context.createBufferSource()
    const gain = context.createGain()
    gain.gain.value = this.volume
    source.buffer = buffer
    source.connect(gain)
    gain.connect(context.destination)
    source.start(0)
    return true
  }

  private getContext(): AudioContextLike | null {
    if (this.context) {
      return this.context
    }

    if (this.contextUnavailable) {
      return null
    }

    try {
      this.context = this.createContext()
    } catch {
      this.context = null
    }

    if (!this.context) {
      this.contextUnavailable = true
    }

    return this.context
  }

  private async fetchAndDecodeSample(
    context: AudioContextLike,
    sample: AudioSampleDefinition,
  ): Promise<AudioBufferLike> {
    const response = await this.fetcher(sample.src)

    if (!response.ok) {
      const status = response.status ? ` ${response.status}` : ''
      const statusText = response.statusText ? ` ${response.statusText}` : ''
      throw new Error(
        `Failed to load audio sample "${sample.key}".${status}${statusText}`,
      )
    }

    const audioData = await response.arrayBuffer()
    return context.decodeAudioData(audioData.slice(0))
  }
}
