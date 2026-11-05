import type Konva from 'konva';
import type { CanvasSettings, CropPosition, CustomCrop, ImageElement, ShapeElement, TextElement } from '../types/editor';
import type { ImageAsset } from '../types/editor';
import { coverRect, gradientPoints } from './geometry';
import { totalWidth } from './formats';

type Box = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
};

export function shiftedBox(element: Box, shiftX: number) {
  return {
    x: element.x + shiftX,
    y: element.y,
    width: element.width,
    height: element.height,
    rotation: element.rotation,
    opacity: element.opacity,
  };
}

export function computeImageCoverCrop(
  srcWidth: number,
  srcHeight: number,
  targetWidth: number,
  targetHeight: number,
  cropPosition: CropPosition = 'center',
  customCrop?: CustomCrop,
) {
  if (srcWidth <= 0 || srcHeight <= 0 || targetWidth <= 0 || targetHeight <= 0) {
    return { x: 0, y: 0, width: srcWidth, height: srcHeight };
  }

  if (customCrop) {
    return customCrop;
  }

  const srcRatio = srcWidth / srcHeight;
  const targetRatio = targetWidth / targetHeight;

  if (Math.abs(srcRatio - targetRatio) < 0.001) {
    return { x: 0, y: 0, width: srcWidth, height: srcHeight };
  }

  if (srcRatio > targetRatio) {
    // Source image is wider than target frame: preserve height, crop sides
    const cropWidth = srcHeight * targetRatio;
    let cropX = (srcWidth - cropWidth) / 2;
    if (cropPosition === 'left') cropX = 0;
    if (cropPosition === 'right') cropX = srcWidth - cropWidth;
    return {
      x: Math.round(Math.max(0, cropX)),
      y: 0,
      width: Math.round(Math.min(srcWidth, cropWidth)),
      height: Math.round(srcHeight),
    };
  } else {
    // Source image is taller than target frame: preserve width, crop top/bottom
    const cropHeight = srcWidth / targetRatio;
    let cropY = (srcHeight - cropHeight) / 2;
    if (cropPosition === 'top') cropY = 0;
    if (cropPosition === 'bottom') cropY = srcHeight - cropHeight;
    return {
      x: 0,
      y: Math.round(Math.max(0, cropY)),
      width: Math.round(srcWidth),
      height: Math.round(Math.min(srcHeight, cropHeight)),
    };
  }
}

export function imageConfig(element: ImageElement, image: CanvasImageSource, shiftX = 0) {
  const imgWidth = (image as any).naturalWidth || (image as any).width || 0;
  const imgHeight = (image as any).naturalHeight || (image as any).height || 0;

  const crop =
    imgWidth > 0 && imgHeight > 0
      ? computeImageCoverCrop(
          imgWidth,
          imgHeight,
          element.width,
          element.height,
          element.cropPosition,
          element.crop,
        )
      : undefined;

  return {
    ...shiftedBox(element, shiftX),
    image,
    ...(crop ? { crop } : {}),
  };
}

export function textConfig(element: TextElement, shiftX = 0) {
  return {
    x: element.x + shiftX,
    y: element.y,
    width: element.width,
    rotation: element.rotation,
    opacity: element.opacity,
    text: element.text,
    fontFamily: element.fontFamily,
    fontSize: element.fontSize,
    fontStyle: String(element.fontWeight),
    align: element.align,
    letterSpacing: element.letterSpacing,
    lineHeight: element.lineHeight,
    fill: element.fill,
    wrap: 'word' as const,
  };
}

export function rectConfig(element: ShapeElement, shiftX = 0) {
  return {
    ...shiftedBox(element, shiftX),
    fill: element.fill,
    cornerRadius: element.cornerRadius,
  };
}

export function ellipseConfig(element: ShapeElement, shiftX = 0) {
  return {
    ...shiftedBox(element, shiftX),
    fill: element.fill,
  };
}

export function paintEllipse(context: Konva.Context, shape: Konva.Shape) {
  const width = shape.width();
  const height = shape.height();
  context.beginPath();
  context.ellipse(
    width / 2,
    height / 2,
    Math.max(0.01, width / 2),
    Math.max(0.01, height / 2),
    0,
    0,
    Math.PI * 2,
  );
  context.fillStrokeShape(shape);
}

export function backgroundRectConfig(canvas: CanvasSettings, shiftX = 0) {
  const width = totalWidth(canvas);
  const height = canvas.slideHeight;
  const base = { x: shiftX, y: 0, width, height };
  if (canvas.background.type === 'gradient') {
    const points = gradientPoints(width, height, canvas.background.angle);
    return {
      ...base,
      fillLinearGradientStartPoint: points.start,
      fillLinearGradientEndPoint: points.end,
      fillLinearGradientColorStops: [0, canvas.background.gradientFrom, 1, canvas.background.gradientTo] as (
        | string
        | number
      )[],
    };
  }
  return { ...base, fill: canvas.background.color };
}

export function backgroundImageConfig(canvas: CanvasSettings, asset: ImageAsset, shiftX = 0) {
  const frame = coverRect(asset.width, asset.height, totalWidth(canvas), canvas.slideHeight);
  return {
    x: frame.x + shiftX,
    y: frame.y,
    width: frame.width,
    height: frame.height,
    image: asset.image,
  };
}

export const MISSING_IMAGE_FILL = '#2c3344';
