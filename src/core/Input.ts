type KeyboardEventLike = Event & {
  readonly code?: string
  readonly key?: string
  readonly repeat?: boolean
}

const getDefaultTarget = (): EventTarget | null => {
  if (typeof window === 'undefined') {
    return null
  }

  return window
}

const getKeyIdentifiers = (event: KeyboardEventLike): string[] => {
  const identifiers = new Set<string>()

  if (event.code) {
    identifiers.add(event.code)
  }

  if (event.key) {
    identifiers.add(event.key)
  }

  return [...identifiers]
}

export class KeyboardInput {
  private readonly downKeys = new Set<string>()
  private readonly pressedKeys = new Set<string>()
  private target: EventTarget | null = null

  public constructor(target: EventTarget | null = getDefaultTarget()) {
    if (target) {
      this.attach(target)
    }
  }

  public attach(target: EventTarget): void {
    if (this.target === target) {
      return
    }

    this.detach()
    this.target = target
    this.target.addEventListener('keydown', this.handleKeyDown)
    this.target.addEventListener('keyup', this.handleKeyUp)
    this.target.addEventListener('blur', this.handleBlur)
  }

  public detach(): void {
    if (!this.target) {
      return
    }

    this.target.removeEventListener('keydown', this.handleKeyDown)
    this.target.removeEventListener('keyup', this.handleKeyUp)
    this.target.removeEventListener('blur', this.handleBlur)
    this.target = null
    this.releaseAll()
  }

  public isDown(key: string): boolean {
    return this.downKeys.has(key)
  }

  public wasPressed(key: string): boolean {
    return this.pressedKeys.has(key)
  }

  public endFrame(): void {
    this.pressedKeys.clear()
  }

  public releaseAll(): void {
    this.downKeys.clear()
    this.pressedKeys.clear()
  }

  private readonly handleKeyDown = (event: Event): void => {
    const keyboardEvent = event as KeyboardEventLike
    const identifiers = getKeyIdentifiers(keyboardEvent)

    if (identifiers.length === 0) {
      return
    }

    for (const identifier of identifiers) {
      if (!keyboardEvent.repeat && !this.downKeys.has(identifier)) {
        this.pressedKeys.add(identifier)
      }

      this.downKeys.add(identifier)
    }
  }

  private readonly handleKeyUp = (event: Event): void => {
    const identifiers = getKeyIdentifiers(event as KeyboardEventLike)

    for (const identifier of identifiers) {
      this.downKeys.delete(identifier)
    }
  }

  private readonly handleBlur = (): void => {
    this.releaseAll()
  }
}

export const input = new KeyboardInput()
