import './style.css'

const canvas = document.querySelector<HTMLCanvasElement>('#app-canvas')

if (!canvas) {
  throw new Error('Expected #app-canvas to exist in the document.')
}

const context = canvas.getContext('2d')

if (!context) {
  throw new Error('This browser does not support 2D canvas rendering.')
}

const render = (): void => {
  const width = canvas.clientWidth
  const height = canvas.clientHeight

  context.clearRect(0, 0, width, height)
  context.fillStyle = '#111827'
  context.fillRect(0, 0, width, height)
}

const resizeCanvas = (): void => {
  const pixelRatio = window.devicePixelRatio || 1
  const width = Math.max(1, Math.floor(canvas.clientWidth * pixelRatio))
  const height = Math.max(1, Math.floor(canvas.clientHeight * pixelRatio))

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
  }

  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  render()
}

const resizeObserver = new ResizeObserver(resizeCanvas)

resizeObserver.observe(canvas)
resizeCanvas()
