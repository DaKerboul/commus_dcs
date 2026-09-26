function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>(resolve => canvas.toBlob(resolve, type, quality))
}

function toDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Downscales an image in the browser and returns it as a data URI — WebP when
 * the browser can encode it, JPEG otherwise. Uploads are stored inline, so this
 * is what keeps a gallery from weighing megabytes.
 */
export async function compressImage(file: File, maxWidth = 1280, quality = 0.75): Promise<string> {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()

    const scale = Math.min(1, maxWidth / img.naturalWidth)
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.naturalWidth * scale)
    canvas.height = Math.round(img.naturalHeight * scale)
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)

    // Browsers without a WebP encoder silently hand back a (large) PNG instead.
    const webp = await toBlob(canvas, 'image/webp', quality)
    const blob = webp?.type === 'image/webp' ? webp : await toBlob(canvas, 'image/jpeg', quality)
    return blob ? toDataUrl(blob) : canvas.toDataURL('image/jpeg', quality)
  } finally {
    URL.revokeObjectURL(url)
  }
}
