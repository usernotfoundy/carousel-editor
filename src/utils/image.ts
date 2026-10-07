const ACCEPTED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const MAX_BYTES = 25 * 1024 * 1024;
const MAX_EDGE = 4096;

export function loadHtmlImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('That image could not be read.'));
    image.src = url;
  });
}

function isAccepted(file: File) {
  if (ACCEPTED_TYPES.has(file.type)) return true;
  return /\.(png|jpe?g|webp)$/i.test(file.name);
}

async function decodeFile(file: File): Promise<CanvasImageSource & { width: number; height: number; close?: () => void }> {
  try {
    const bitmap = await createImageBitmap(file);
    return bitmap;
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const image = await loadHtmlImage(url);
      return image;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

export async function prepareImageFile(file: File) {
  if (!isAccepted(file)) {
    throw new Error('Use a PNG, JPG, or WebP image.');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('That image is larger than 25 MB.');
  }
  if (file.size === 0) {
    throw new Error('That file is empty.');
  }

  let source: CanvasImageSource & { width: number; height: number; close?: () => void };
  try {
    source = await decodeFile(file);
  } catch {
    throw new Error('That file is not a valid PNG, JPG, or WebP image.');
  }

  try {
    let width = source.width;
    let height = source.height;
    if (!width || !height) throw new Error('That image has no visible pixels.');
    let resized = false;
    if (width > MAX_EDGE || height > MAX_EDGE) {
      const scale = MAX_EDGE / Math.max(width, height);
      width = Math.max(1, Math.round(width * scale));
      height = Math.max(1, Math.round(height * scale));
      resized = true;
    }

    if (!resized && ACCEPTED_TYPES.has(file.type)) {
      return { blob: file, width: source.width, height: source.height, resized: false };
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not process that image.');
    context.drawImage(source, 0, 0, width, height);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => {
        if (result) resolve(result);
        else reject(new Error('Could not process that image.'));
      }, 'image/png');
    });
    return { blob, width, height, resized };
  } finally {
    source.close?.();
  }
}

export async function assetFromBlob(id: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  try {
    const image = await loadHtmlImage(url);
    return {
      id,
      url,
      image,
      width: image.naturalWidth || image.width,
      height: image.naturalHeight || image.height,
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}
