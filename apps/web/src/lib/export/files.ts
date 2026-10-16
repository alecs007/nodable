import { type ExportResult } from '@nodable/sdk'

const PIXEL_SCALE = 2

function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()

    image.addEventListener('load', () => {
      resolve(image)
    })
    image.addEventListener('error', () => {
      reject(new Error('The drawing could not be rasterized'))
    })
    image.src = source
  })
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob === null) {
        reject(new Error('The drawing could not be encoded'))

        return
      }

      resolve(blob)
    }, 'image/png')
  })
}

async function rasterize(svg: string, width: number, height: number): Promise<Blob> {
  const source = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))

  try {
    const image = await loadImage(source)
    const canvas = document.createElement('canvas')

    canvas.width = width * PIXEL_SCALE
    canvas.height = height * PIXEL_SCALE

    const context = canvas.getContext('2d')

    if (context === null) {
      throw new Error('The drawing could not be rasterized')
    }

    context.drawImage(image, 0, 0, canvas.width, canvas.height)

    return await toBlob(canvas)
  } finally {
    URL.revokeObjectURL(source)
  }
}

export async function saveExport(result: ExportResult): Promise<void> {
  if (result.kind === 'text') {
    saveBlob(new Blob([result.content], { type: result.mimeType }), result.fileName)

    return
  }

  saveBlob(await rasterize(result.svg, result.width, result.height), result.fileName)
}

export async function copyExport(result: ExportResult): Promise<void> {
  if (result.kind === 'text') {
    await navigator.clipboard.writeText(result.content)
  }
}

export function pickTextFile(accept: string): Promise<string | undefined> {
  return new Promise((resolve) => {
    const picker = document.createElement('input')

    picker.type = 'file'
    picker.accept = accept
    picker.addEventListener('change', () => {
      const file = picker.files?.item(0)

      resolve(file === null || file === undefined ? undefined : file.text())
    })
    picker.addEventListener('cancel', () => {
      resolve(undefined)
    })
    picker.click()
  })
}
