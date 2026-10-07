/* eslint-disable react-refresh/only-export-components */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createContext, useContext, useSyncExternalStore } from 'react';
import type {
  AssetMap,
  CanvasPatch,
  EditorDocument,
  EditorElement,
  ElementPatch,
  FormatId,
  ImageElement,
  LayerMove,
  ShapeKind,
  TextElement,
} from '../types/editor';
import { useHistory } from '../hooks/useHistory';
import { applyPatch, duplicateElement, moveElements, reorderElements } from '../utils/elements';
import { MAX_SLIDES, MIN_SLIDES, formatPreset, totalWidth } from '../utils/formats';
import { assetFromBlob, prepareImageFile } from '../utils/image';
import { collectImageIds, idbPut, loadAssets, readSavedDocument, writeDocument } from '../utils/storage';
import { createBlankDocument, createTemplateDocument, ensureTemplateHero } from '../utils/template';

export type ToastMessage = {
  id: number;
  message: string;
  tone: 'info' | 'error';
};

type Transient = { id: string; patch: ElementPatch } | null;

type Placement = { cx: number; cy: number };

function createTransientStore() {
  let current: Transient = null;
  const listeners = new Set<() => void>();
  return {
    get: () => current,
    set: (next: Transient) => {
      current = next;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

type EditorContextValue = {
  ready: boolean;
  document: EditorDocument;
  assets: AssetMap;
  selectedId: string | null;
  canUndo: boolean;
  canRedo: boolean;
  toast: ToastMessage | null;
  saveState: 'idle' | 'saved' | 'error';
  select: (id: string | null) => void;
  undo: () => void;
  redo: () => void;
  flushPending: () => void;
  patchElement: (id: string, patch: ElementPatch, mode?: 'commit' | 'preview') => void;
  deleteSelected: () => void;
  deleteElement: (id: string) => void;
  duplicateSelected: () => void;
  nudge: (dx: number, dy: number) => void;
  moveLayer: (id: string, move: LayerMove) => void;
  reorderLayer: (sourceId: string, targetId: string) => void;
  toggleVisible: (id: string) => void;
  updateCanvas: (patch: CanvasPatch, mode?: 'commit' | 'preview') => void;
  setFormat: (format: FormatId) => void;
  setSlideCount: (count: number) => void;
  setProjectName: (name: string) => void;
  addImageFiles: (files: File[]) => Promise<void>;
  addText: () => void;
  addShape: (shape: ShapeKind) => void;
  setBackgroundImage: (file: File) => Promise<void>;
  clearBackgroundImage: () => void;
  newProject: () => void;
  syncTextHeights: (patches: { id: string; height: number }[]) => void;
  registerPlacement: (getPlacement: () => Placement) => void;
  setTransient: (value: Transient) => void;
  subscribeTransient: (listener: () => void) => () => void;
  getTransient: () => Transient;
  notify: (message: string, tone?: ToastMessage['tone']) => void;
  dismissToast: () => void;
};

const EditorContext = createContext<EditorContextValue | null>(null);

let projectLoad: Promise<{ doc: EditorDocument; assets: AssetMap; missing: string[] }> | null = null;

function loadProject() {
  if (!projectLoad) {
    projectLoad = (async () => {
      const saved = readSavedDocument();
      if (!saved) {
        try {
          await ensureTemplateHero();
        } catch {
          // The template still opens if the sample image cannot be stored.
        }
      }
      const doc = saved ?? createTemplateDocument();
      const { assets, missing } = await loadAssets(collectImageIds(doc));
      return { doc, assets, missing };
    })().catch((error: unknown) => {
      projectLoad = null;
      throw error;
    });
  }
  return projectLoad;
}

function recipeFor(id: string, patch: ElementPatch) {
  return (doc: EditorDocument): EditorDocument => ({
    ...doc,
    elements: doc.elements.map((element) => (element.id === id ? applyPatch(element, patch) : element)),
  });
}

export function EditorProvider({ children }: { children: ReactNode }) {
  const history = useHistory<EditorDocument>(createBlankDocument());
  const resetHistory = history.reset;
  const snapshot = history.present;
  const [assets, setAssets] = useState<AssetMap>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle');
  const [transientStore] = useState(() => createTransientStore());
  const placementRef = useRef<() => Placement>(() => ({ cx: 540, cy: 480 }));
  const notify = useCallback((message: string, tone: ToastMessage['tone'] = 'info') => {
    setToast({ id: Date.now(), message, tone });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    let cancel = false;
    loadProject()
      .then((result) => {
        if (cancel) return;
        resetHistory(result.doc);
        setAssets(result.assets);
        setReady(true);
        if (result.missing.length > 0) {
          notify('Some images could not be restored. Those layers are marked on the canvas.', 'error');
        }
      })
      .catch(() => {
        if (cancel) return;
        resetHistory(createTemplateDocument());
        setReady(true);
        notify('The saved project could not be opened. A new canvas is ready.', 'error');
      });
    return () => {
      cancel = true;
    };
  }, [notify, resetHistory]);

  useEffect(() => {
    if (!ready) return;
    const handle = window.setTimeout(() => {
      setSaveState(writeDocument(snapshot) ? 'saved' : 'error');
    }, 400);
    return () => window.clearTimeout(handle);
  }, [ready, snapshot]);

  const select = useCallback((id: string | null) => {
    setSelectedId(id);
    transientStore.set(null);
  }, [transientStore]);

  const patchElement = useCallback(
    (id: string, patch: ElementPatch, mode: 'commit' | 'preview' = 'commit') => {
      const recipe = recipeFor(id, patch);
      if (mode === 'preview') history.preview(recipe);
      else history.commit(recipe);
    },
    [history],
  );

  const deleteElement = useCallback(
    (id: string) => {
      history.commit((doc) => ({ ...doc, elements: doc.elements.filter((element) => element.id !== id) }));
      setSelectedId((current) => (current === id ? null : current));
      transientStore.set(null);
    },
    [history, transientStore],
  );

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    deleteElement(selectedId);
  }, [deleteElement, selectedId]);

  const duplicateSelected = useCallback(() => {
    if (!selectedId) return;
    const source = history.presentRef.current.elements.find((element) => element.id === selectedId);
    if (!source) return;
    const copy = duplicateElement(source);
    history.commit((doc) => ({ ...doc, elements: [...doc.elements, copy] }));
    setSelectedId(copy.id);
  }, [history, selectedId]);

  const nudge = useCallback(
    (dx: number, dy: number) => {
      if (!selectedId) return;
      const source = history.presentRef.current.elements.find((element) => element.id === selectedId);
      if (!source || source.locked) return;
      history.preview(recipeFor(selectedId, { x: source.x + dx, y: source.y + dy }));
    },
    [history, selectedId],
  );

  const moveLayer = useCallback(
    (id: string, move: LayerMove) => {
      history.commit((doc) => ({ ...doc, elements: moveElements(doc.elements, id, move) }));
    },
    [history],
  );

  const reorderLayer = useCallback(
    (sourceId: string, targetId: string) => {
      history.commit((doc) => ({ ...doc, elements: reorderElements(doc.elements, sourceId, targetId) }));
    },
    [history],
  );

  const toggleVisible = useCallback(
    (id: string) => {
      const source = history.presentRef.current.elements.find((element) => element.id === id);
      if (!source) return;
      history.commit(recipeFor(id, { visible: !source.visible }));
    },
    [history],
  );

  const updateCanvas = useCallback(
    (patch: CanvasPatch, mode: 'commit' | 'preview' = 'commit') => {
      const recipe = (doc: EditorDocument): EditorDocument => {
        const slideCount =
          patch.slideCount == null
            ? doc.canvas.slideCount
            : Math.min(MAX_SLIDES, Math.max(MIN_SLIDES, Math.round(patch.slideCount)));
        return {
          ...doc,
          canvas: {
            ...doc.canvas,
            format: patch.format ?? doc.canvas.format,
            slideWidth: patch.slideWidth ?? doc.canvas.slideWidth,
            slideHeight: patch.slideHeight ?? doc.canvas.slideHeight,
            slideCount,
            background: { ...doc.canvas.background, ...patch.background },
          },
        };
      };
      if (mode === 'preview') history.preview(recipe);
      else history.commit(recipe);
    },
    [history],
  );

  const setFormat = useCallback(
    (format: FormatId) => {
      const preset = formatPreset(format);
      updateCanvas({ format, slideWidth: preset.width, slideHeight: preset.height });
    },
    [updateCanvas],
  );

  const setSlideCount = useCallback(
    (count: number) => {
      const doc = history.presentRef.current;
      const slideCount = Math.min(MAX_SLIDES, Math.max(MIN_SLIDES, Math.round(count)));
      const nextWidth = doc.canvas.slideWidth * slideCount;
      const outside = doc.elements.some((element) => element.x > nextWidth || element.x + element.width < 0);
      updateCanvas({ slideCount });
      if (outside) notify('Some elements now sit outside the canvas. Drag them back if you still need them.');
    },
    [history, notify, updateCanvas],
  );

  const setProjectName = useCallback(
    (name: string) => {
      const next = name.trim().slice(0, 80) || 'Untitled carousel';
      history.commit((doc) => ({ ...doc, name: next }));
    },
    [history],
  );

  const rememberAsset = useCallback(async (id: string, blob: Blob) => {
    try {
      await idbPut(id, blob);
    } catch {
      notify('This image will work until you refresh. Browser storage rejected it.', 'error');
    }
    const asset = await assetFromBlob(id, blob);
    setAssets((current) => ({ ...current, [id]: asset }));
    return asset;
  }, [notify]);

  const addImageFiles = useCallback(
    async (files: File[]) => {
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        if (!file) continue;
        try {
          const prepared = await prepareImageFile(file);
          const imageId = crypto.randomUUID();
          await rememberAsset(imageId, prepared.blob);
          const doc = history.presentRef.current;
          const { cx, cy } = placementRef.current();
          const aspect = prepared.width / prepared.height;
          let width = Math.min(prepared.width, doc.canvas.slideWidth * 1.35, totalWidth(doc.canvas));
          let height = width / aspect;
          if (height > doc.canvas.slideHeight * 0.9) {
            height = doc.canvas.slideHeight * 0.9;
            width = height * aspect;
          }
          const element: ImageElement = {
            id: crypto.randomUUID(),
            type: 'image',
            name: (file.name.replace(/\.[^.]+$/, '') || 'Image').slice(0, 80),
            x: cx - width / 2 + index * 28,
            y: cy - height / 2 + index * 28,
            width,
            height,
            rotation: 0,
            opacity: 1,
            visible: true,
            locked: false,
            imageId,
            lockAspect: true,
            aspectRatio: aspect,
          };
          history.commit((current) => ({ ...current, elements: [...current.elements, element] }));
          setSelectedId(element.id);
          if (prepared.resized) {
            notify('That image was resized to 4096px so the editor stays responsive.');
          }
        } catch (error) {
          notify(error instanceof Error ? error.message : 'Could not add that image.', 'error');
        }
      }
    },
    [history, notify, rememberAsset],
  );

  const addText = useCallback(() => {
    const doc = history.presentRef.current;
    const { cx, cy } = placementRef.current();
    const width = Math.min(doc.canvas.slideWidth * 0.72, 860);
    const element: TextElement = {
      id: crypto.randomUUID(),
      type: 'text',
      name: 'Text',
      text: 'Add a heading',
      x: cx - width / 2,
      y: cy - 40,
      width,
      height: 80,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      fontFamily: 'Outfit, sans-serif',
      fontSize: 64,
      fontWeight: 600,
      align: 'left',
      letterSpacing: 0,
      lineHeight: 1.15,
      fill: '#f4efe8',
    };
    history.commit((current) => ({ ...current, elements: [...current.elements, element] }));
    setSelectedId(element.id);
  }, [history]);

  const addShape = useCallback(
    (shape: ShapeKind) => {
      const { cx, cy } = placementRef.current();
      const width = shape === 'ellipse' ? 280 : 360;
      const height = shape === 'ellipse' ? 280 : 200;
      const element: EditorElement = {
        id: crypto.randomUUID(),
        type: 'shape',
        shape,
        name: shape === 'ellipse' ? 'Ellipse' : 'Rectangle',
        x: cx - width / 2,
        y: cy - height / 2,
        width,
        height,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        fill: shape === 'ellipse' ? '#e7c9a4' : '#8ea0ff',
        cornerRadius: shape === 'rect' ? 18 : 0,
      };
      history.commit((current) => ({ ...current, elements: [...current.elements, element] }));
      setSelectedId(element.id);
    },
    [history],
  );

  const setBackgroundImage = useCallback(
    async (file: File) => {
      try {
        const prepared = await prepareImageFile(file);
        const imageId = crypto.randomUUID();
        await rememberAsset(imageId, prepared.blob);
        updateCanvas({ background: { imageId } });
        if (prepared.resized) notify('The background image was resized to 4096px.');
      } catch (error) {
        notify(error instanceof Error ? error.message : 'Could not use that background.', 'error');
      }
    },
    [notify, rememberAsset, updateCanvas],
  );

  const clearBackgroundImage = useCallback(() => {
    updateCanvas({ background: { imageId: null } });
  }, [updateCanvas]);

  const newProject = useCallback(() => {
    history.reset(createBlankDocument());
    setSelectedId(null);
    transientStore.set(null);
  }, [history, transientStore]);

  const syncTextHeights = useCallback(
    (patches: { id: string; height: number }[]) => {
      const current = history.presentRef.current;
      let changed = false;
      const elements = current.elements.map((element) => {
        const patch = patches.find((item) => item.id === element.id);
        if (!patch || element.type !== 'text' || Math.abs(element.height - patch.height) < 0.5) return element;
        changed = true;
        return { ...element, height: Math.max(8, patch.height) };
      });
      if (changed) history.replace({ ...current, elements });
    },
    [history],
  );

  const registerPlacement = useCallback((getPlacement: () => Placement) => {
    placementRef.current = getPlacement;
  }, []);

  const setTransient = useCallback((value: Transient) => {
    transientStore.set(value);
  }, [transientStore]);

  const value = useMemo<EditorContextValue>(
    () => ({
      ready,
      document: history.present,
      assets,
      selectedId,
      canUndo: history.canUndo,
      canRedo: history.canRedo,
      toast,
      saveState,
      select,
      undo: history.undo,
      redo: history.redo,
      flushPending: history.flushPending,
      patchElement,
      deleteSelected,
      deleteElement,
      duplicateSelected,
      nudge,
      moveLayer,
      reorderLayer,
      toggleVisible,
      updateCanvas,
      setFormat,
      setSlideCount,
      setProjectName,
      addImageFiles,
      addText,
      addShape,
      setBackgroundImage,
      clearBackgroundImage,
      newProject,
      syncTextHeights,
      registerPlacement,
      setTransient,
      subscribeTransient: transientStore.subscribe,
      getTransient: transientStore.get,
      notify,
      dismissToast,
    }),
    [
      addImageFiles,
      addShape,
      addText,
      assets,
      clearBackgroundImage,
      deleteElement,
      deleteSelected,
      dismissToast,
      duplicateSelected,
      history.canRedo,
      history.canUndo,
      history.flushPending,
      history.present,
      history.redo,
      history.undo,
      moveLayer,
      newProject,
      notify,
      nudge,
      patchElement,
      ready,
      registerPlacement,
      reorderLayer,
      saveState,
      select,
      selectedId,
      setBackgroundImage,
      setFormat,
      setProjectName,
      setSlideCount,
      setTransient,
      syncTextHeights,
      toast,
      toggleVisible,
      transientStore,
      updateCanvas,
    ],
  );

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) throw new Error('useEditor must be used within EditorProvider');
  return context;
}

export function useTransientElement() {
  const { subscribeTransient, getTransient, document, selectedId } = useEditor();
  const transient = useSyncExternalStore(subscribeTransient, getTransient);
  const selected = document.elements.find((element) => element.id === selectedId) ?? null;
  if (!selected) return null;
  if (!transient || transient.id !== selected.id) return selected;
  return applyPatch(selected, transient.patch);
}
