import { describe, expect, it } from 'vitest'
import { AssetLoader } from './AssetLoader'

class FakeImage {
  public onload: (() => void) | null = null
  public onerror: (() => void) | null = null
  private imageSource = ''

  public get src(): string {
    return this.imageSource
  }

  public set src(value: string) {
    this.imageSource = value

    queueMicrotask(() => {
      if (value.includes('missing')) {
        this.onerror?.()
        return
      }

      this.onload?.()
    })
  }
}

const createImageFactory =
  (createdImages: FakeImage[]) => (): HTMLImageElement => {
    const image = new FakeImage()
    createdImages.push(image)
    return image as unknown as HTMLImageElement
  }

describe('AssetLoader', () => {
  it('resolves after all image assets are loaded', async () => {
    const createdImages: FakeImage[] = []
    const loader = new AssetLoader({
      createImage: createImageFactory(createdImages),
    })

    await loader.loadImages([
      { key: 'tank', src: '/assets/tank.png' },
      { key: 'tiles', src: '/assets/tiles.png' },
    ])

    expect(createdImages.map((image) => image.src)).toEqual([
      '/assets/tank.png',
      '/assets/tiles.png',
    ])
    expect(loader.hasImage('tank')).toBe(true)
    expect(loader.getImage('tank')).toBe(createdImages[0])
    expect(loader.getImage('tiles')).toBe(createdImages[1])
  })

  it('reuses pending and loaded images for the same key', async () => {
    const createdImages: FakeImage[] = []
    const loader = new AssetLoader({
      createImage: createImageFactory(createdImages),
    })
    const asset = { key: 'tiles', src: '/assets/tiles.png' }

    const firstLoad = loader.loadImage(asset)
    const secondLoad = loader.loadImage(asset)
    const [firstImage, secondImage] = await Promise.all([firstLoad, secondLoad])
    const thirdImage = await loader.loadImage(asset)

    expect(createdImages).toHaveLength(1)
    expect(firstImage).toBe(secondImage)
    expect(thirdImage).toBe(firstImage)
  })

  it('rejects failed image loads and unloaded lookups', async () => {
    const loader = new AssetLoader({
      createImage: createImageFactory([]),
    })

    await expect(
      loader.loadImage({ key: 'missing', src: '/assets/missing.png' }),
    ).rejects.toThrow(
      'Failed to load image asset "missing" from "/assets/missing.png".',
    )

    expect(() => loader.getImage('missing')).toThrow(
      'Image asset "missing" has not been loaded.',
    )
  })

  it('rejects empty image asset definitions', async () => {
    const loader = new AssetLoader({
      createImage: createImageFactory([]),
    })

    await expect(
      loader.loadImage({ key: '', src: '/asset.png' }),
    ).rejects.toThrow('Image asset key cannot be empty.')
    await expect(loader.loadImage({ key: 'asset', src: '' })).rejects.toThrow(
      'Image asset "asset" source cannot be empty.',
    )
  })
})
