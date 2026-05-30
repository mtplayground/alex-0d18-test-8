export interface ImageAssetDefinition {
  key: string
  src: string
}

export interface AssetLoaderOptions {
  createImage?: () => HTMLImageElement
}

const createBrowserImage = (): HTMLImageElement => {
  if (typeof Image === 'undefined') {
    throw new Error('Image loading is only available in browser environments.')
  }

  return new Image()
}

const assertAssetDefinition = (asset: ImageAssetDefinition): void => {
  if (asset.key.trim().length === 0) {
    throw new Error('Image asset key cannot be empty.')
  }

  if (asset.src.trim().length === 0) {
    throw new Error(`Image asset "${asset.key}" source cannot be empty.`)
  }
}

export class AssetLoader {
  private readonly createImage: () => HTMLImageElement
  private readonly images = new Map<string, HTMLImageElement>()
  private readonly pendingImages = new Map<string, Promise<HTMLImageElement>>()

  public constructor(options: AssetLoaderOptions = {}) {
    this.createImage = options.createImage ?? createBrowserImage
  }

  public async loadImages(
    assets: readonly ImageAssetDefinition[],
  ): Promise<ReadonlyMap<string, HTMLImageElement>> {
    await Promise.all(assets.map((asset) => this.loadImage(asset)))
    return this.images
  }

  public async loadImage(
    asset: ImageAssetDefinition,
  ): Promise<HTMLImageElement> {
    assertAssetDefinition(asset)

    const loadedImage = this.images.get(asset.key)

    if (loadedImage) {
      return Promise.resolve(loadedImage)
    }

    const pendingImage = this.pendingImages.get(asset.key)

    if (pendingImage) {
      return pendingImage
    }

    const image = this.createImage()
    const pendingLoad = new Promise<HTMLImageElement>((resolve, reject) => {
      const cleanup = (): void => {
        image.onload = null
        image.onerror = null
        this.pendingImages.delete(asset.key)
      }

      image.onload = (): void => {
        cleanup()
        this.images.set(asset.key, image)
        resolve(image)
      }

      image.onerror = (): void => {
        cleanup()
        reject(
          new Error(
            `Failed to load image asset "${asset.key}" from "${asset.src}".`,
          ),
        )
      }

      image.src = asset.src
    })

    this.pendingImages.set(asset.key, pendingLoad)
    return pendingLoad
  }

  public hasImage(key: string): boolean {
    return this.images.has(key)
  }

  public getImage(key: string): HTMLImageElement {
    const image = this.images.get(key)

    if (!image) {
      throw new Error(`Image asset "${key}" has not been loaded.`)
    }

    return image
  }
}
