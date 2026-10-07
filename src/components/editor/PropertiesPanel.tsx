import { useRef } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  ChevronsDown,
  ChevronsUp,
  Copy,
  Lock,
  Trash2,
  Unlock,
} from 'lucide-react';
import { useEditor, useTransientElement } from '../../context/EditorContext';
import { ColorField, Field, NumberField } from '../ui/Fields';
import { FONT_FAMILIES, FONT_WEIGHTS, FORMATS, SLIDE_SHORTCUTS, fontLabel, totalWidth } from '../../utils/formats';
import type { TextAlign } from '../../types/editor';

export function PropertiesPanel() {
  const editor = useEditor();
  const live = useTransientElement();
  const backgroundInput = useRef<HTMLInputElement>(null);
  const { document: doc } = editor;

  const livePatch = (patch: Parameters<typeof editor.patchElement>[1]) => {
    if (!live) return;
    editor.patchElement(live.id, patch, 'preview');
  };

  if (!live) {
    const { canvas } = doc;
    return (
      <aside className="inspector">
        <div className="inspector-scroll">
          <p className="panel-label">Canvas</p>
          <p className="concept">
            This is one continuous design. The guides show where each Instagram slide will be cut.
          </p>
          <Field label="Format">
            <div className="segment">
              {FORMATS.map((format) => (
                <button
                  key={format.id}
                  type="button"
                  className={canvas.format === format.id ? 'active' : ''}
                  onClick={() => editor.setFormat(format.id)}
                >
                  {format.label}
                </button>
              ))}
            </div>
          </Field>
          <p className="readout">
            {canvas.slideWidth} × {canvas.slideHeight}
            <span> each slide</span>
          </p>
          <Field label="Slides">
            <div className="slide-picks">
              {SLIDE_SHORTCUTS.map((count) => (
                <button
                  key={count}
                  type="button"
                  className={canvas.slideCount === count ? 'active' : ''}
                  onClick={() => editor.setSlideCount(count)}
                >
                  {count}
                </button>
              ))}
            </div>
          </Field>
          <NumberField
            label="Custom count"
            value={canvas.slideCount}
            min={1}
            max={20}
            onLive={(value) => editor.updateCanvas({ slideCount: value }, 'preview')}
            onDone={editor.flushPending}
          />
          <p className="readout">
            Total {totalWidth(canvas)} × {canvas.slideHeight}
          </p>
          <Field label="Background">
            <div className="segment">
              <button
                type="button"
                className={canvas.background.type === 'solid' ? 'active' : ''}
                onClick={() => editor.updateCanvas({ background: { type: 'solid' } })}
              >
                Solid
              </button>
              <button
                type="button"
                className={canvas.background.type === 'gradient' ? 'active' : ''}
                onClick={() => editor.updateCanvas({ background: { type: 'gradient' } })}
              >
                Gradient
              </button>
            </div>
          </Field>
          {canvas.background.type === 'solid' ? (
            <ColorField
              label="Color"
              value={canvas.background.color}
              onLive={(color) => editor.updateCanvas({ background: { color } }, 'preview')}
              onDone={editor.flushPending}
            />
          ) : (
            <>
              <ColorField
                label="From"
                value={canvas.background.gradientFrom}
                onLive={(gradientFrom) => editor.updateCanvas({ background: { gradientFrom } }, 'preview')}
                onDone={editor.flushPending}
              />
              <ColorField
                label="To"
                value={canvas.background.gradientTo}
                onLive={(gradientTo) => editor.updateCanvas({ background: { gradientTo } }, 'preview')}
                onDone={editor.flushPending}
              />
              <NumberField
                label="Angle"
                value={canvas.background.angle}
                min={0}
                max={360}
                onLive={(angle) => editor.updateCanvas({ background: { angle } }, 'preview')}
                onDone={editor.flushPending}
              />
            </>
          )}
          <div className="action-row">
            <button type="button" className="text-btn" onClick={() => backgroundInput.current?.click()}>
              Background image
            </button>
            {canvas.background.imageId && (
              <button type="button" className="text-btn" onClick={editor.clearBackgroundImage}>
                Remove
              </button>
            )}
          </div>
          <input
            ref={backgroundInput}
            className="hidden-input"
            type="file"
            accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) void editor.setBackgroundImage(file);
            }}
          />
        </div>
      </aside>
    );
  }

  const asset = live.type === 'image' ? editor.assets[live.imageId] : undefined;

  return (
    <aside className="inspector">
      <div className="inspector-scroll">
        <div className="inspector-head">
          <p className="panel-label">{live.type}</p>
          <div className="action-row">
            <button type="button" className="icon-btn" aria-label="Bring forward" onClick={() => editor.moveLayer(live.id, 'forward')}>
              <ArrowUp size={14} />
            </button>
            <button type="button" className="icon-btn" aria-label="Send backward" onClick={() => editor.moveLayer(live.id, 'backward')}>
              <ArrowDown size={14} />
            </button>
            <button type="button" className="icon-btn" aria-label="Bring to front" onClick={() => editor.moveLayer(live.id, 'front')}>
              <ChevronsUp size={14} />
            </button>
            <button type="button" className="icon-btn" aria-label="Send to back" onClick={() => editor.moveLayer(live.id, 'back')}>
              <ChevronsDown size={14} />
            </button>
            <button type="button" className="icon-btn" aria-label="Duplicate" onClick={editor.duplicateSelected}>
              <Copy size={14} />
            </button>
            <button type="button" className="icon-btn danger" aria-label="Delete" onClick={editor.deleteSelected}>
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        {asset && <img className="thumb" src={asset.url} alt="" />}
        <Field label="Name">
          <input
            type="text"
            value={live.name}
            onChange={(event) => livePatch({ name: event.target.value.slice(0, 80) })}
            onBlur={editor.flushPending}
          />
        </Field>
        {live.type === 'text' && (
          <Field label="Content">
            <textarea
              rows={4}
              value={live.text}
              onChange={(event) => livePatch({ text: event.target.value })}
              onBlur={editor.flushPending}
            />
          </Field>
        )}
        <div className="grid-2">
          <NumberField label="X" value={live.x} onLive={(x) => livePatch({ x })} onDone={editor.flushPending} />
          <NumberField label="Y" value={live.y} onLive={(y) => livePatch({ y })} onDone={editor.flushPending} />
          <NumberField label="Width" value={live.width} min={8} onLive={(width) => livePatch({ width })} onDone={editor.flushPending} />
          <NumberField
            label="Height"
            value={live.height}
            min={8}
            onLive={(height) => livePatch({ height })}
            onDone={editor.flushPending}
          />
        </div>
        <NumberField
          label="Rotation"
          value={live.rotation}
          onLive={(rotation) => livePatch({ rotation })}
          onDone={editor.flushPending}
        />
        <Field label="Opacity">
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(live.opacity * 100)}
            onChange={(event) => livePatch({ opacity: Number(event.target.value) / 100 })}
            onPointerUp={editor.flushPending}
            onBlur={editor.flushPending}
          />
        </Field>
        {live.type === 'image' && (
          <label className="check">
            <input
              type="checkbox"
              checked={live.lockAspect}
              onChange={(event) => editor.patchElement(live.id, { lockAspect: event.target.checked })}
            />
            Lock aspect ratio
            <span className="muted">Hold Shift while resizing to free the ratio.</span>
          </label>
        )}
        {live.type === 'text' && (
          <>
            <Field label="Font">
              <select
                value={live.fontFamily}
                onChange={(event) => editor.patchElement(live.id, { fontFamily: event.target.value })}
              >
                {FONT_FAMILIES.map((family) => (
                  <option key={family} value={family}>
                    {fontLabel(family)}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid-2">
              <NumberField
                label="Size"
                value={live.fontSize}
                min={8}
                max={400}
                onLive={(fontSize) => livePatch({ fontSize })}
                onDone={editor.flushPending}
              />
              <Field label="Weight">
                <select
                  value={live.fontWeight}
                  onChange={(event) => editor.patchElement(live.id, { fontWeight: Number(event.target.value) })}
                >
                  {FONT_WEIGHTS.map((weight) => (
                    <option key={weight} value={weight}>
                      {weight}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <ColorField
              label="Color"
              value={live.fill}
              onLive={(fill) => livePatch({ fill })}
              onDone={editor.flushPending}
            />
            <Field label="Alignment">
              <div className="segment">
                {(
                  [
                    ['left', AlignLeft],
                    ['center', AlignCenter],
                    ['right', AlignRight],
                  ] as const
                ).map(([align, Icon]) => (
                  <button
                    key={align}
                    type="button"
                    className={live.align === align ? 'active' : ''}
                    aria-label={`Align ${align}`}
                    onClick={() => editor.patchElement(live.id, { align: align as TextAlign })}
                  >
                    <Icon size={14} />
                  </button>
                ))}
              </div>
            </Field>
            <div className="grid-2">
              <NumberField
                label="Letter spacing"
                value={live.letterSpacing}
                onLive={(letterSpacing) => livePatch({ letterSpacing })}
                onDone={editor.flushPending}
              />
              <NumberField
                label="Line height"
                value={live.lineHeight}
                min={0.6}
                max={3}
                onLive={(lineHeight) => livePatch({ lineHeight })}
                onDone={editor.flushPending}
              />
            </div>
          </>
        )}
        {live.type === 'shape' && (
          <>
            <ColorField
              label="Fill"
              value={live.fill}
              onLive={(fill) => livePatch({ fill })}
              onDone={editor.flushPending}
            />
            {live.shape === 'rect' && (
              <NumberField
                label="Corner radius"
                value={live.cornerRadius}
                min={0}
                onLive={(cornerRadius) => livePatch({ cornerRadius })}
                onDone={editor.flushPending}
              />
            )}
          </>
        )}
        <label className="check">
          <input
            type="checkbox"
            checked={live.locked}
            onChange={(event) => editor.patchElement(live.id, { locked: event.target.checked })}
          />
          {live.locked ? <Lock size={14} /> : <Unlock size={14} />}
          Lock position
        </label>
        {!live.visible && <p className="muted">This layer is hidden and will not export.</p>}
      </div>
    </aside>
  );
}
