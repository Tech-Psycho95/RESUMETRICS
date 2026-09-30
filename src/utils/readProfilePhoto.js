export async function readProfilePhoto(file) {
  if (!file) return null
  if (file.type !== 'image/jpeg' && !/\.jpe?g$/i.test(file.name)) throw new Error('Choose a JPEG image.')
  if (file.size > 12 * 1024 * 1024) throw new Error('Choose a JPEG smaller than 12 MB.')

  const objectUrl = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = objectUrl
    await image.decode()
    const scale = Math.min(1, 800 / Math.max(image.naturalWidth, image.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('This JPEG could not be processed. Choose another image.')
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.86)
  } catch {
    throw new Error('This JPEG could not be opened. Choose another image.')
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
