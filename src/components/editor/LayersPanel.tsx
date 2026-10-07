import { useState } from 'react';
import { ChevronDown, ChevronUp, Circle, Eye, EyeOff, GripVertical, Image as ImageIcon, Square, Trash2, Type } from 'lucide-react';
import { useEditor } from '../../context/EditorContext';
import type { EditorElement } from '../../types/editor';

function LayerIcon({ element }: { element: EditorElement }) {
  if (element.type === 'image') return <ImageIcon size={14} />;
  if (element.type === 'text') return <Type size={14} />;
  if (element.shape === 'ellipse') return <Circle size={14} />;
  return <Square size={14} />;
}

export function LayersPanel() {
  const { document: doc, selectedId, select, deleteElement, toggleVisible, reorderLayer, moveLayer } = useEditor();
  const [dragId, setDragId] = useState<string | null>(null);
  const layers = [...doc.elements].reverse();

  return (
    <div className="layers">
      <p className="panel-label">Layers</p>
      {layers.length === 0 && <p className="muted">No layers yet.</p>}
      <ul>
        {layers.map((element) => {
          const index = doc.elements.findIndex((item) => item.id === element.id);
          return (
            <li
              key={element.id}
              className={`layer-row ${selectedId === element.id ? 'selected' : ''} ${element.visible ? '' : 'hidden'} ${dragId === element.id ? 'dragging' : ''}`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const sourceId = event.dataTransfer.getData('text/plain') || dragId;
                if (sourceId) reorderLayer(sourceId, element.id);
                setDragId(null);
              }}
            >
              <button
                type="button"
                className="layer-main"
                onClick={() => select(element.id)}
              >
                <span
                  className="grip"
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData('text/plain', element.id);
                    event.dataTransfer.effectAllowed = 'move';
                    setDragId(element.id);
                  }}
                  onDragEnd={() => setDragId(null)}
                  aria-hidden="true"
                >
                  <GripVertical size={14} />
                </span>
                <LayerIcon element={element} />
                <span className="layer-name">{element.name}</span>
              </button>
              <span className="layer-actions">
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="Bring forward"
                  disabled={index === doc.elements.length - 1}
                  onClick={() => moveLayer(element.id, 'forward')}
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="Send backward"
                  disabled={index === 0}
                  onClick={() => moveLayer(element.id, 'backward')}
                >
                  <ChevronDown size={14} />
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={element.visible ? 'Hide layer' : 'Show layer'}
                  onClick={() => toggleVisible(element.id)}
                >
                  {element.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button
                  type="button"
                  className="icon-btn danger"
                  aria-label="Delete layer"
                  onClick={() => deleteElement(element.id)}
                >
                  <Trash2 size={14} />
                </button>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
