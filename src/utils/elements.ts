import type { EditorElement, ElementPatch, LayerMove } from '../types/editor';
import { clamp } from './geometry';

export function applyPatch(element: EditorElement, patch: ElementPatch): EditorElement {
  const opacity = clamp(patch.opacity ?? element.opacity, 0, 1);

  if (element.type === 'image') {
    let width = patch.width ?? element.width;
    let height = patch.height ?? element.height;
    let aspectRatio = element.aspectRatio > 0 ? element.aspectRatio : width / Math.max(1, height);
    const lockAspect = patch.lockAspect ?? element.lockAspect;
    if (lockAspect) {
      if (patch.width != null && patch.height == null) height = width / aspectRatio;
      else if (patch.height != null && patch.width == null) width = height * aspectRatio;
      else if (patch.width != null && patch.height != null) aspectRatio = width / Math.max(1, height);
    } else if (patch.width != null || patch.height != null) {
      aspectRatio = width / Math.max(1, height);
    }
    return {
      ...element,
      name: patch.name ?? element.name,
      x: patch.x ?? element.x,
      y: patch.y ?? element.y,
      rotation: patch.rotation ?? element.rotation,
      visible: patch.visible ?? element.visible,
      locked: patch.locked ?? element.locked,
      lockAspect,
      opacity,
      width: Math.max(8, width),
      height: Math.max(8, height),
      aspectRatio,
    };
  }

  if (element.type === 'text') {
    return {
      ...element,
      name: patch.name ?? element.name,
      x: patch.x ?? element.x,
      y: patch.y ?? element.y,
      width: Math.max(8, patch.width ?? element.width),
      height: Math.max(8, patch.height ?? element.height),
      rotation: patch.rotation ?? element.rotation,
      visible: patch.visible ?? element.visible,
      locked: patch.locked ?? element.locked,
      opacity,
      text: patch.text ?? element.text,
      fontFamily: patch.fontFamily ?? element.fontFamily,
      fontSize: clamp(patch.fontSize ?? element.fontSize, 8, 400),
      fontWeight: patch.fontWeight ?? element.fontWeight,
      align: patch.align ?? element.align,
      letterSpacing: clamp(patch.letterSpacing ?? element.letterSpacing, -20, 200),
      lineHeight: clamp(patch.lineHeight ?? element.lineHeight, 0.6, 3),
      fill: patch.fill ?? element.fill,
    };
  }

  return {
    ...element,
    name: patch.name ?? element.name,
    x: patch.x ?? element.x,
    y: patch.y ?? element.y,
    width: Math.max(8, patch.width ?? element.width),
    height: Math.max(8, patch.height ?? element.height),
    rotation: patch.rotation ?? element.rotation,
    visible: patch.visible ?? element.visible,
    locked: patch.locked ?? element.locked,
    opacity,
    fill: patch.fill ?? element.fill,
    cornerRadius: Math.max(0, patch.cornerRadius ?? element.cornerRadius),
  };
}

export function duplicateElement(element: EditorElement): EditorElement {
  return {
    ...element,
    id: crypto.randomUUID(),
    name: `${element.name} copy`.slice(0, 80),
    x: element.x + 32,
    y: element.y + 32,
  };
}

export function moveElements(elements: EditorElement[], id: string, move: LayerMove) {
  const index = elements.findIndex((element) => element.id === id);
  if (index < 0) return elements;
  const next = elements.slice();
  const [item] = next.splice(index, 1);
  if (!item) return elements;
  if (move === 'front') next.push(item);
  else if (move === 'back') next.unshift(item);
  else if (move === 'forward') next.splice(Math.min(next.length, index + 1), 0, item);
  else next.splice(Math.max(0, index - 1), 0, item);
  return next;
}

export function reorderElements(elements: EditorElement[], sourceId: string, targetId: string) {
  if (sourceId === targetId) return elements;
  const source = elements.find((element) => element.id === sourceId);
  if (!source) return elements;
  const next = elements.filter((element) => element.id !== sourceId);
  const targetIndex = next.findIndex((element) => element.id === targetId);
  if (targetIndex < 0) return elements;
  next.splice(targetIndex, 0, source);
  return next;
}
