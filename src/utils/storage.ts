import type { AssetMap, CanvasSettings, EditorDocument, EditorElement, FormatId } from '../types/editor';
import { MAX_SLIDES, MIN_SLIDES, totalWidth } from './formats';
import { assetFromBlob } from './image';

const DB_NAME = 'continuum-carousel';
const STORE = 'images';
const STORAGE_KEY = 'continuum.project.v1';

function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open image storage.'));
  });
}

export async function idbPut(id: string, blob: Blob) {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(blob, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Could not store the image.'));
    });
  } finally {
    db.close();
  }
}

export async function idbGet(id: string) {
  const db = await openDb();
  try {
    return await new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const request = tx.objectStore(STORE).get(id);
      request.onsuccess = () => resolve((request.result as Blob | undefined) ?? null);
      request.onerror = () => reject(request.error ?? new Error('Could not read the image.'));
    });
  } finally {
    db.close();
  }
}

function finite(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function isFormat(value: unknown): value is FormatId {
  return value === 'portrait' || value === 'square' || value === 'landscape';
}

function sanitizeBackground(value: unknown): CanvasSettings['background'] {
  const background = (value ?? {}) as Partial<CanvasSettings['background']>;
  return {
    type: background.type === 'gradient' ? 'gradient' : 'solid',
    color: typeof background.color === 'string' ? background.color : '#141820',
    gradientFrom: typeof background.gradientFrom === 'string' ? background.gradientFrom : '#1a2333',
    gradientTo: typeof background.gradientTo === 'string' ? background.gradientTo : '#3d2c28',
    angle: finite(background.angle, 90),
    imageId: typeof background.imageId === 'string' ? background.imageId : null,
  };
}

function sanitizeElement(value: unknown): EditorElement | null {
  if (!value || typeof value !== 'object') return null;
  const element = value as Partial<EditorElement> & { type?: string };
  if (element.type !== 'image' && element.type !== 'text' && element.type !== 'shape') return null;
  if (typeof element.id !== 'string') return null;
  const base = {
    id: element.id,
    name: typeof element.name === 'string' ? element.name.slice(0, 80) : 'Layer',
    x: finite(element.x, 0),
    y: finite(element.y, 0),
    width: Math.max(8, finite(element.width, 200)),
    height: Math.max(8, finite(element.height, 80)),
    rotation: finite(element.rotation, 0),
    opacity: Math.min(1, Math.max(0, finite(element.opacity, 1))),
    visible: element.visible !== false,
    locked: element.locked === true,
  };
  if (element.type === 'image') {
    const image = element as Partial<Extract<EditorElement, { type: 'image' }>>;
    if (typeof image.imageId !== 'string') return null;
    const aspect = finite(image.aspectRatio, base.width / base.height);
    return { ...base, type: 'image', imageId: image.imageId, lockAspect: image.lockAspect !== false, aspectRatio: aspect || 1 };
  }
  if (element.type === 'text') {
    const text = element as Partial<Extract<EditorElement, { type: 'text' }>>;
    const align = text.align === 'center' || text.align === 'right' ? text.align : 'left';
    return {
      ...base,
      type: 'text',
      text: typeof text.text === 'string' ? text.text : 'Text',
      fontFamily: typeof text.fontFamily === 'string' ? text.fontFamily : 'Outfit, sans-serif',
      fontSize: Math.min(400, Math.max(8, finite(text.fontSize, 48))),
      fontWeight: finite(text.fontWeight, 600),
      align,
      letterSpacing: finite(text.letterSpacing, 0),
      lineHeight: finite(text.lineHeight, 1.15),
      fill: typeof text.fill === 'string' ? text.fill : '#ffffff',
    };
  }
  const shape = element as Partial<Extract<EditorElement, { type: 'shape' }>>;
  return {
    ...base,
    type: 'shape',
    shape: shape.shape === 'ellipse' ? 'ellipse' : 'rect',
    fill: typeof shape.fill === 'string' ? shape.fill : '#8ea0ff',
    cornerRadius: Math.max(0, finite(shape.cornerRadius, 0)),
  };
}

export function sanitizeDocument(value: unknown): EditorDocument | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Partial<EditorDocument>;
  if (!raw.canvas || typeof raw.canvas !== 'object') return null;
  const canvas = raw.canvas as Partial<CanvasSettings>;
  const slideWidth = Math.max(1, finite(canvas.slideWidth, 1080));
  const slideHeight = Math.max(1, finite(canvas.slideHeight, 1350));
  const slideCount = Math.min(MAX_SLIDES, Math.max(MIN_SLIDES, Math.round(finite(canvas.slideCount, 3))));
  const elements = Array.isArray(raw.elements)
    ? raw.elements.map(sanitizeElement).filter((element): element is EditorElement => element !== null)
    : [];
  return {
    name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.slice(0, 80) : 'Untitled carousel',
    canvas: {
      format: isFormat(canvas.format) ? canvas.format : 'portrait',
      slideWidth,
      slideHeight,
      slideCount,
      background: sanitizeBackground(canvas.background),
    },
    elements,
  };
}

export function readSavedDocument() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { version?: number; document?: unknown };
    if (parsed?.version !== 1) return null;
    return sanitizeDocument(parsed.document);
  } catch {
    return null;
  }
}

export function writeDocument(document: EditorDocument) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, document }));
    return true;
  } catch {
    return false;
  }
}

export function collectImageIds(document: EditorDocument) {
  const ids = new Set<string>();
  if (document.canvas.background.imageId) ids.add(document.canvas.background.imageId);
  for (const element of document.elements) {
    if (element.type === 'image') ids.add(element.imageId);
  }
  return [...ids];
}

export async function loadAssets(ids: string[]) {
  const assets: AssetMap = {};
  const missing: string[] = [];
  await Promise.all(
    ids.map(async (id) => {
      try {
        const blob = await idbGet(id);
        if (!blob) {
          missing.push(id);
          return;
        }
        assets[id] = await assetFromBlob(id, blob);
      } catch {
        missing.push(id);
      }
    }),
  );
  return { assets, missing };
}

export function documentHasPixels(document: EditorDocument) {
  return totalWidth(document.canvas) > 0 && document.canvas.slideHeight > 0;
}
