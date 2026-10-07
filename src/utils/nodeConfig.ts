import type Konva from 'konva';
import type { CanvasSettings, ImageElement, ShapeElement, TextElement } from '../types/editor';
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

export function imageConfig(element: ImageElement, image: CanvasImageSource, shiftX = 0) {
  return {
    ...shiftedBox(element, shiftX),
    image,
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
