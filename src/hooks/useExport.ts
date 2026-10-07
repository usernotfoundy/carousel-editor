import { useEffect, useRef, useState } from 'react';
import type { AssetMap, EditorDocument, ExportFormat } from '../types/editor';
import { downloadBlob, exportCarousel, type ExportedSlide } from '../utils/export';

type ExportState =
  | { phase: 'idle' }
  | { phase: 'running'; current: number; total: number }
  | { phase: 'done'; slides: ExportedSlide[]; count: number }
  | { phase: 'error'; message: string };

export function useExport(doc: EditorDocument, assets: AssetMap) {
  const [format, setFormat] = useState<ExportFormat>('png');
  const [state, setState] = useState<ExportState>({ phase: 'idle' });
  const [savedNames, setSavedNames] = useState<string[]>([]);
  const abortRef = useRef(false);
  const slidesRef = useRef<ExportedSlide[]>([]);

  useEffect(() => {
    return () => {
      slidesRef.current.forEach((slide) => URL.revokeObjectURL(slide.url));
    };
  }, []);

  const start = async () => {
    abortRef.current = false;
    slidesRef.current.forEach((slide) => URL.revokeObjectURL(slide.url));
    slidesRef.current = [];
    setSavedNames([]);
    setState({ phase: 'running', current: 0, total: doc.canvas.slideCount });
    try {
      const result = await exportCarousel(doc, assets, format, {
        onProgress: ({ current, total }) => setState({ phase: 'running', current, total }),
        isAborted: () => abortRef.current,
      });
      if (!result) {
        setState({ phase: 'idle' });
        return;
      }
      slidesRef.current = result.slides;
      setState({ phase: 'done', ...result });
    } catch (error) {
      setState({
        phase: 'error',
        message: error instanceof Error ? error.message : 'Export failed. Try again.',
      });
    }
  };

  return {
    format,
    setFormat,
    state,
    start,
    cancel: () => {
      abortRef.current = true;
    },
    savedNames,
    downloadSlide: (slide: ExportedSlide) => {
      downloadBlob(slide.blob, slide.name);
      setSavedNames((current) => (current.includes(slide.name) ? current : [...current, slide.name]));
    },
  };
}
