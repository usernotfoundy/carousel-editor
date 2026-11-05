import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import {
  Group,
  Image as KonvaImage,
  Layer,
  Line,
  Rect,
  Shape,
  Stage,
  Text as KonvaText,
  Transformer,
} from 'react-konva';
import { ImagePlus, LayoutTemplate, Lock } from 'lucide-react';
import type { EditorElement } from '../../types/editor';
import type { useViewport } from '../../hooks/useViewport';
import { useEditor } from '../../context/EditorContext';
import { totalWidth } from '../../utils/formats';
import { QuickControls } from './QuickControls';
import {
  MISSING_IMAGE_FILL,
  backgroundImageConfig,
  backgroundRectConfig,
  ellipseConfig,
  imageConfig,
  paintEllipse,
  rectConfig,
  textConfig,
} from '../../utils/nodeConfig';

type Viewport = ReturnType<typeof useViewport>;

function readBox(node: Konva.Node, element: EditorElement) {
  const width = Math.max(8, Math.abs(element.width * node.scaleX()));
  const height = Math.max(8, Math.abs(element.height * node.scaleY()));
  node.scaleX(1);
  node.scaleY(1);
  if (element.type === 'text') {
    node.width(width);
    return {
      x: node.x(),
      y: node.y(),
      width,
      height: Math.max(8, node.height()),
      rotation: node.rotation(),
    };
  }
  if (typeof node.width === 'function') {
    node.width(width);
    node.height(height);
  }
  return { x: node.x(), y: node.y(), width, height, rotation: node.rotation() };
}

export function CanvasStage({ viewport, onTemplates }: { viewport: Viewport; onTemplates?: () => void }) {
  const {
    document: doc,
    assets,
    selectedId,
    select,
    patchElement,
    setTransient,
    addImageFiles,
    syncTextHeights,
    openGallery,
    galleryTarget,
  } = useEditor();
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const spaceRef = useRef(false);
  const [spacePressed, setSpacePressed] = useState(false);
  const [shiftKey, setShiftKey] = useState(false);
  const [panning, setPanning] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fontTick, setFontTick] = useState(0);
  const dragDepth = useRef(0);
  const panSession = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const { zoomRef, panRef, zoomToPoint } = viewport;

  const { canvas } = doc;
  const docWidth = totalWidth(canvas);
  const docHeight = canvas.slideHeight;
  const selected = doc.elements.find((element) => element.id === selectedId) ?? null;
  const editing = doc.elements.find((element) => element.id === editingId && element.type === 'text');

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const observer = new ResizeObserver(() => viewport.onSize(wrap.clientWidth, wrap.clientHeight));
    observer.observe(wrap);
    viewport.onSize(wrap.clientWidth, wrap.clientHeight);
    return () => observer.disconnect();
  }, [viewport]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? wrap.clientHeight : 1;
      if (event.ctrlKey || event.metaKey) {
        const rect = wrap.getBoundingClientRect();
        viewport.zoomAt(
          { x: event.clientX - rect.left, y: event.clientY - rect.top },
          event.deltaY * unit,
        );
        return;
      }
      viewport.panBy(-event.deltaX * unit, -event.deltaY * unit);
    };
    wrap.addEventListener('wheel', onWheel, { passive: false });
    return () => wrap.removeEventListener('wheel', onWheel);
  }, [viewport]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const blockGesture = (event: Event) => event.preventDefault();
    const pinch: {
      distance: number;
      zoom: number;
      panX: number;
      panY: number;
      midX: number;
      midY: number;
    } | null = { distance: 0, zoom: 1, panX: 0, panY: 0, midX: 0, midY: 0 };
    let active = false;

    const pointOf = (touch: Touch, rect: DOMRect) => ({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    });

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length < 2) return;
      event.preventDefault();
      event.stopPropagation();
      const [first, second] = [event.touches[0], event.touches[1]];
      const rect = wrap.getBoundingClientRect();
      const mid = {
        x: (pointOf(first, rect).x + pointOf(second, rect).x) / 2,
        y: (pointOf(first, rect).y + pointOf(second, rect).y) / 2,
      };
      pinch.distance = Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY);
      pinch.zoom = zoomRef.current;
      pinch.panX = panRef.current.x;
      pinch.panY = panRef.current.y;
      pinch.midX = mid.x;
      pinch.midY = mid.y;
      active = pinch.distance > 0;
      panSession.current = null;
      setPanning(false);
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!active || event.touches.length < 2) return;
      event.preventDefault();
      event.stopPropagation();
      const [first, second] = [event.touches[0], event.touches[1]];
      const rect = wrap.getBoundingClientRect();
      const distance = Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY);
      const mid = {
        x: (pointOf(first, rect).x + pointOf(second, rect).x) / 2,
        y: (pointOf(first, rect).y + pointOf(second, rect).y) / 2,
      };
      zoomToPoint(mid, pinch.zoom * (distance / pinch.distance), {
        zoom: pinch.zoom,
        pan: { x: pinch.panX, y: pinch.panY },
        pointer: { x: pinch.midX, y: pinch.midY },
      });
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (event.touches.length >= 2) return;
      active = false;
    };

    wrap.addEventListener('touchstart', onTouchStart, { passive: false, capture: true });
    wrap.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
    wrap.addEventListener('touchend', onTouchEnd);
    wrap.addEventListener('touchcancel', onTouchEnd);
    document.addEventListener('gesturestart', blockGesture, { passive: false });
    document.addEventListener('gesturechange', blockGesture, { passive: false });
    return () => {
      wrap.removeEventListener('touchstart', onTouchStart, { capture: true });
      wrap.removeEventListener('touchmove', onTouchMove, { capture: true });
      wrap.removeEventListener('touchend', onTouchEnd);
      wrap.removeEventListener('touchcancel', onTouchEnd);
      document.removeEventListener('gesturestart', blockGesture);
      document.removeEventListener('gesturechange', blockGesture);
    };
  }, [panRef, zoomRef, zoomToPoint]);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.code === 'Space' && !event.repeat) {
        const target = event.target;
        if (target instanceof HTMLElement && target.closest('input, textarea, select')) return;
        spaceRef.current = true;
        setSpacePressed(true);
        event.preventDefault();
      }
      if (event.key === 'Shift') setShiftKey(true);
    };
    const up = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        spaceRef.current = false;
        setSpacePressed(false);
      }
      if (event.key === 'Shift') setShiftKey(false);
    };
    const blur = () => {
      spaceRef.current = false;
      setSpacePressed(false);
      setShiftKey(false);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, []);

  useEffect(() => {
    if (!panning) return;
    const move = (event: MouseEvent) => {
      const session = panSession.current;
      if (!session) return;
      viewport.setPanAbsolute({
        x: session.panX + event.clientX - session.x,
        y: session.panY + event.clientY - session.y,
      });
    };
    const up = () => {
      panSession.current = null;
      setPanning(false);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }, [panning, viewport]);

  useEffect(() => {
    const onFonts = () => setFontTick((tick) => tick + 1);
    document.fonts.addEventListener('loadingdone', onFonts);
    void document.fonts.load('600 96px Fraunces');
    void document.fonts.load('600 64px Outfit');
    return () => document.fonts.removeEventListener('loadingdone', onFonts);
  }, []);

  const textSignature = doc.elements
    .filter((element) => element.type === 'text')
    .map(
      (element) =>
        `${element.id}:${element.text}:${element.width}:${element.fontSize}:${element.fontFamily}:${element.fontWeight}:${element.lineHeight}:${element.letterSpacing}`,
    )
    .join('|');

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const patches: { id: string; height: number }[] = [];
    for (const element of doc.elements) {
      if (element.type !== 'text') continue;
      const node = stage.findOne(`#${CSS.escape(element.id)}`);
      if (!node) continue;
      const height = node.height();
      if (height > 0 && Math.abs(height - element.height) > 0.5) patches.push({ id: element.id, height });
    }
    if (patches.length) syncTextHeights(patches);
  }, [doc.elements, fontTick, syncTextHeights, textSignature]);

  useLayoutEffect(() => {
    const transformer = transformerRef.current;
    const stage = stageRef.current;
    if (!transformer || !stage) return;
    const element = doc.elements.find((item) => item.id === selectedId);
    if (!element || !element.visible || editingId === element.id) {
      transformer.nodes([]);
    } else {
      const node = stage.findOne(
        (candidate: Konva.Node) => candidate.id() === selectedId && candidate.name() === 'element',
      );
      transformer.nodes(node ? [node] : []);
    }
    transformer.getLayer()?.batchDraw();
  }, [doc.elements, editingId, fontTick, selectedId, viewport.pan.x, viewport.pan.y, viewport.zoom]);

  const guides = Array.from({ length: canvas.slideCount + 1 }, (_, index) => index * canvas.slideWidth);
  const backgroundImage = canvas.background.imageId ? assets[canvas.background.imageId] : undefined;

  const stageWidth = viewport.size.w;
  const isMobile = stageWidth > 0 ? stageWidth < 640 : (typeof window !== 'undefined' ? window.innerWidth < 640 : false);
  const isTablet = stageWidth > 0 ? stageWidth < 1024 : (typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

  const resizerConfig = isMobile
    ? {
        borderStrokeWidth: 1,
        anchorSize: 7,
        anchorStrokeWidth: 1,
        anchorCornerRadius: 2,
        rotateAnchorOffset: 18,
      }
    : isTablet
      ? {
          borderStrokeWidth: 1.25,
          anchorSize: 8,
          anchorStrokeWidth: 1,
          anchorCornerRadius: 2,
          rotateAnchorOffset: 22,
        }
      : {
          borderStrokeWidth: 1.5,
          anchorSize: 9,
          anchorStrokeWidth: 1.2,
          anchorCornerRadius: 2.5,
          rotateAnchorOffset: 26,
        };

  const startPan = (event: MouseEvent | PointerEvent) => {
    panSession.current = {
      x: event.clientX,
      y: event.clientY,
      panX: viewport.panRef.current.x,
      panY: viewport.panRef.current.y,
    };
    setPanning(true);
  };

  return (
    <div className="workspace">
      <div className="ruler">
        <div className="ruler-track">
          {Array.from({ length: canvas.slideCount }, (_, index) => (
            <button
              key={index}
              type="button"
              className={`ruler-slide ${viewport.activeSlide === index ? 'active' : ''}`}
              style={{
                left: viewport.pan.x + index * canvas.slideWidth * viewport.zoom,
                width: Math.max(0, canvas.slideWidth * viewport.zoom),
              }}
              onClick={() => viewport.focusSlide(index)}
            >
              Slide {index + 1}
            </button>
          ))}
        </div>
      </div>
      <div
        ref={wrapRef}
        className={`stage-wrap ${panning ? 'panning' : ''} ${spacePressed ? 'space' : ''} ${dragOver ? 'dragover' : ''}`}
        onDragEnter={(event) => {
          event.preventDefault();
          dragDepth.current += 1;
          setDragOver(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => {
          dragDepth.current -= 1;
          if (dragDepth.current <= 0) {
            dragDepth.current = 0;
            setDragOver(false);
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          dragDepth.current = 0;
          setDragOver(false);
          const files = Array.from(event.dataTransfer.files);
          if (files.length) void addImageFiles(files);
        }}
      >
        {viewport.size.w > 0 && viewport.size.h > 0 && (
          <Stage
            ref={stageRef}
            width={viewport.size.w}
            height={viewport.size.h}
            onMouseDown={(event) => {
              const stage = event.target.getStage();
              if (!stage) return;
              const empty = event.target === stage || event.target.name() === 'canvas-bg';
              const panIntent = event.evt.button === 1 || spaceRef.current;
              if (panIntent || (empty && event.evt.button === 0)) {
                if (event.evt.button === 1) event.evt.preventDefault();
                if (empty) select(null);
                if (editingId) setEditingId(null);
                startPan(event.evt);
              }
            }}
            onTouchStart={(event) => {
              const stage = event.target.getStage();
              if (!stage) return;
              const empty = event.target === stage || event.target.name() === 'canvas-bg';
              if (empty) {
                select(null);
                if (editingId) setEditingId(null);
              }
            }}
          >
            <Layer>
              <Group x={viewport.pan.x} y={viewport.pan.y} scaleX={viewport.zoom} scaleY={viewport.zoom}>
                {/* Canvas content clipped strictly to canvas bounds to prevent overflowing into workspace */}
                <Group clipX={0} clipY={0} clipWidth={docWidth} clipHeight={docHeight}>
                  <Rect name="canvas-bg" {...backgroundRectConfig(canvas)} />
                  {backgroundImage && (
                    <KonvaImage name="canvas-bg" {...backgroundImageConfig(canvas, backgroundImage)} />
                  )}
                  {doc.elements.map((element) =>
                    element.visible ? (
                      <DesignNode
                        key={element.id}
                        element={element}
                        image={element.type === 'image' ? assets[element.imageId]?.image : undefined}
                        isSelected={selectedId === element.id}
                        spacePressed={spacePressed}
                        onSelect={() => select(element.id)}
                        onEdit={() => {
                          select(element.id);
                          if (element.type === 'text' && !element.locked) setEditingId(element.id);
                          if (element.type === 'image' && !element.locked) openGallery(element);
                        }}
                        onLive={(patch) => setTransient({ id: element.id, patch })}
                        onCommit={(patch) => {
                          setTransient(null);
                          patchElement(element.id, patch);
                        }}
                      />
                    ) : null,
                  )}
                </Group>
                <Rect
                  listening={false}
                  strokeScaleEnabled={false}
                  x={0}
                  y={0}
                  width={docWidth}
                  height={docHeight}
                  stroke="rgba(255, 255, 255, 0.22)"
                  strokeWidth={1}
                />
                {guides.map((x) => (
                  <Line
                    key={x}
                    listening={false}
                    strokeScaleEnabled={false}
                    points={[x, 0, x, docHeight]}
                    stroke="rgba(126, 182, 255, 0.95)"
                    strokeWidth={1.5}
                    dash={[7, 6]}
                  />
                ))}
                <Transformer
                  ref={transformerRef}
                  rotateEnabled={!selected?.locked}
                  resizeEnabled={!selected?.locked}
                  flipEnabled={false}
                  borderStroke={selected?.locked ? '#f07178' : '#7eb6ff'}
                  borderDash={selected?.locked ? [4, 4] : undefined}
                  anchorFill="#ffffff"
                  anchorStroke={selected?.locked ? '#f07178' : '#6ea2e8'}
                  anchorStrokeWidth={resizerConfig.anchorStrokeWidth}
                  anchorSize={selected?.locked ? 0 : resizerConfig.anchorSize}
                  anchorCornerRadius={resizerConfig.anchorCornerRadius}
                  rotateAnchorOffset={resizerConfig.rotateAnchorOffset}
                  keepRatio={
                    selected?.type === 'image'
                      ? selected.lockAspect && !shiftKey
                      : selected?.type === 'shape'
                        ? shiftKey
                        : false
                  }
                  enabledAnchors={
                    selected?.type === 'text' ? ['middle-left', 'middle-right'] : undefined
                  }
                  rotationSnaps={shiftKey ? [0, 45, 90, 135, 180, 225, 270, 315] : []}
                  rotationSnapTolerance={shiftKey ? 8 : 0}
                  boundBoxFunc={(oldBox, newBox) => {
                    const minPx = Math.max(8, 8 * viewport.zoom);
                    if (Math.abs(newBox.width) < minPx || Math.abs(newBox.height) < minPx) return oldBox;
                    return newBox;
                  }}
                />
              </Group>
            </Layer>
          </Stage>
        )}
        {Array.from({ length: canvas.slideCount }, (_, index) => (
          <div
            key={index}
            className="slide-badge"
            style={{
              transform: `translate(${viewport.pan.x + index * canvas.slideWidth * viewport.zoom + 10}px, ${viewport.pan.y + 10}px)`,
            }}
          >
            {index + 1}
          </div>
        ))}
        {doc.elements.map((el) => {
          if (!el.locked || !el.visible) return null;
          return (
            <button
              key={`lock-${el.id}`}
              type="button"
              className="canvas-lock-indicator"
              style={{
                transform: `translate(${viewport.pan.x + (el.x + el.width) * viewport.zoom - 24}px, ${viewport.pan.y + el.y * viewport.zoom + 4}px)`,
              }}
              title={`${el.name} is locked (click to select and unlock)`}
              onClick={(e) => {
                e.stopPropagation();
                select(el.id);
              }}
            >
              <Lock size={12} />
            </button>
          );
        })}
        {selected && !galleryTarget && (
          <QuickControls
            element={selected}
            zoom={viewport.zoom}
            pan={viewport.pan}
            stageSize={viewport.size}
            onOpenGallery={selected.type === 'image' ? () => openGallery(selected) : undefined}
          />
        )}
        {selected && selected.type === 'image' && !selected.locked && !galleryTarget && (
          <div
            className="canvas-image-action-pill"
            style={{
              transform: `translate(${viewport.pan.x + (selected.x + selected.width / 2) * viewport.zoom}px, ${viewport.pan.y + selected.y * viewport.zoom + 12}px)`,
            }}
          >
            <button
              type="button"
              className="canvas-pill-btn"
              onClick={() => openGallery(selected)}
              title="Replace with your photo from gallery or device"
            >
              <ImagePlus size={13} />
              Replace Photo
            </button>
          </div>
        )}
        {dragOver && <div className="drop-overlay">Drop images onto the continuous canvas</div>}
        {doc.elements.length === 0 && (
          <div className="empty-hint">
            <p>Add an image or text. Anything you place can cross the guides — export cuts this one canvas into slides.</p>
            {onTemplates && (
              <button type="button" className="primary-btn empty-templates-btn" onClick={onTemplates}>
                <LayoutTemplate size={14} />
                Browse Templates
              </button>
            )}
          </div>
        )}
      </div>
      {editing && editing.type === 'text' && (
        <TextOverlay
          element={editing}
          stageRef={stageRef}
          pan={viewport.pan}
          zoom={viewport.zoom}
          onChange={(text) => patchElement(editing.id, { text, name: text.split('\n')[0]?.slice(0, 32) || 'Text' }, 'preview')}
          onClose={() => {
            setEditingId(null);
          }}
        />
      )}
    </div>
  );
}

function DesignNode({
  element,
  image,
  isSelected,
  spacePressed,
  onSelect,
  onEdit,
  onLive,
  onCommit,
}: {
  element: EditorElement;
  image?: CanvasImageSource;
  isSelected: boolean;
  spacePressed: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onLive: (patch: { x?: number; y?: number; width?: number; height?: number; rotation?: number }) => void;
  onCommit: (patch: { x: number; y: number; width?: number; height?: number; rotation?: number }) => void;
}) {
  const isInteractive = !element.locked || isSelected;
  const draggable = isSelected && !element.locked && !spacePressed;
  const handlers = {
    name: 'element',
    id: element.id,
    listening: isInteractive,
    draggable,
    onMouseDown: (event: KonvaEventObject<MouseEvent>) => {
      if (spacePressed || event.evt.button === 1 || !isInteractive) return;
      event.cancelBubble = true;
      onSelect();
    },
    onTouchStart: (event: KonvaEventObject<TouchEvent>) => {
      if (spacePressed || !isInteractive) return;
      event.cancelBubble = true;
      onSelect();
    },
    onMouseEnter: (event: KonvaEventObject<MouseEvent>) => {
      const stage = event.target.getStage();
      if (stage) stage.container().style.cursor = element.locked || spacePressed ? 'grab' : isSelected ? 'move' : 'pointer';
    },
    onMouseLeave: (event: KonvaEventObject<MouseEvent>) => {
      const stage = event.target.getStage();
      if (stage) stage.container().style.cursor = '';
    },
    onDragMove: (event: KonvaEventObject<DragEvent>) => {
      onLive({ x: event.target.x(), y: event.target.y() });
    },
    onDragEnd: (event: KonvaEventObject<DragEvent>) => {
      onCommit({ x: event.target.x(), y: event.target.y() });
    },
    onTransform: (event: KonvaEventObject<Event>) => {
      const node = event.target;
      onLive({
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
        width: Math.max(8, Math.abs(element.width * node.scaleX())),
        height: Math.max(8, Math.abs(element.height * node.scaleY())),
      });
    },
    onTransformEnd: (event: KonvaEventObject<Event>) => {
      onCommit(readBox(event.target, element));
    },
  };

  const dblHandlers = {
    onDblClick: (event: KonvaEventObject<MouseEvent>) => {
      if (element.locked) return;
      event.cancelBubble = true;
      onEdit();
    },
    onDblTap: (event: KonvaEventObject<TouchEvent>) => {
      if (element.locked) return;
      event.cancelBubble = true;
      onEdit();
    },
  };

  if (element.type === 'image' && image) {
    return <KonvaImage {...imageConfig(element, image)} {...handlers} {...dblHandlers} />;
  }
  if (element.type === 'image') {
    return <Rect {...handlers} {...dblHandlers} x={element.x} y={element.y} width={element.width} height={element.height} rotation={element.rotation} opacity={element.opacity} fill={MISSING_IMAGE_FILL} />;
  }
  if (element.type === 'text') {
    return (
      <KonvaText
        {...textConfig(element)}
        {...handlers}
        onDblClick={(event) => {
          if (element.locked) return;
          event.cancelBubble = true;
          onEdit();
        }}
        onDblTap={(event) => {
          if (element.locked) return;
          event.cancelBubble = true;
          onEdit();
        }}
      />
    );
  }
  if (element.shape === 'ellipse') {
    return <Shape {...ellipseConfig(element)} {...handlers} sceneFunc={paintEllipse} hitFunc={paintEllipse} />;
  }
  return <Rect {...rectConfig(element)} {...handlers} />;
}

function TextOverlay({
  element,
  stageRef,
  pan,
  zoom,
  onChange,
  onClose,
}: {
  element: Extract<EditorElement, { type: 'text' }>;
  stageRef: RefObject<Konva.Stage | null>;
  pan: { x: number; y: number };
  zoom: number;
  onChange: (text: string) => void;
  onClose: () => void;
}) {
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const [style, setStyle] = useState<CSSProperties>({});
  const { flushPending } = useEditor();

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const node = stage?.findOne(`#${CSS.escape(element.id)}`);
    if (!stage || !node) return;
    const abs = node.getAbsolutePosition();
    const rect = stage.container().getBoundingClientRect();
    const scale = node.getAbsoluteScale().x || zoom;
    setStyle({
      left: rect.left + abs.x,
      top: rect.top + abs.y,
      width: Math.max(24, element.width * scale),
      fontSize: element.fontSize * scale,
      fontFamily: element.fontFamily,
      fontWeight: element.fontWeight,
      lineHeight: element.lineHeight,
      letterSpacing: `${element.letterSpacing * scale}px`,
      textAlign: element.align,
      transform: `rotate(${element.rotation}deg)`,
      caretColor: element.fill,
    });
  }, [element, pan.x, pan.y, stageRef, zoom]);

  useEffect(() => {
    areaRef.current?.focus();
    areaRef.current?.select();
  }, [element.id]);

  return createPortal(
    <textarea
      ref={areaRef}
      className="text-editor"
      style={style}
      value={element.text}
      aria-label="Edit text"
      onChange={(event) => onChange(event.target.value)}
      onBlur={() => {
        flushPending();
        onClose();
      }}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === 'Escape') {
          event.preventDefault();
          event.currentTarget.blur();
        }
      }}
    />,
    document.body,
  );
}
