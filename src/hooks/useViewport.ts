import { useCallback, useEffect, useRef, useState } from 'react';
import type { CanvasSettings } from '../types/editor';
import { MAX_ZOOM, MIN_ZOOM, clamp, computeFit } from '../utils/geometry';
import { totalWidth } from '../utils/formats';

export function useViewport(canvas: CanvasSettings) {
  const [zoom, setZoom] = useState(0.25);
  const [pan, setPan] = useState({ x: 48, y: 48 });
  const [size, setSize] = useState({ w: 0, h: 0 });
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  const sizeRef = useRef(size);
  const totalW = totalWidth(canvas);
  const totalH = canvas.slideHeight;
  const totalWRef = useRef(totalW);
  const totalHRef = useRef(totalH);
  const fittedRef = useRef<string | null>(null);

  const applyView = useCallback((nextZoom: number, nextPan: { x: number; y: number }) => {
    zoomRef.current = nextZoom;
    panRef.current = nextPan;
    setZoom(nextZoom);
    setPan(nextPan);
  }, []);

  const fitTo = useCallback(
    (viewW: number, viewH: number, docW: number, docH: number) => {
      const next = computeFit(viewW, viewH, docW, docH);
      applyView(next.zoom, next.pan);
    },
    [applyView],
  );

  const onSize = useCallback(
    (w: number, h: number) => {
      if (w <= 0 || h <= 0) return;
      sizeRef.current = { w, h };
      setSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
      const key = `${totalWRef.current}x${totalHRef.current}`;
      if (fittedRef.current === key) return;
      fittedRef.current = key;
      fitTo(w, h, totalWRef.current, totalHRef.current);
    },
    [fitTo],
  );

  useEffect(() => {
    totalWRef.current = totalW;
    totalHRef.current = totalH;
    const { w, h } = sizeRef.current;
    if (!w || !h) return;
    const key = `${totalW}x${totalH}`;
    if (fittedRef.current === key) return;
    fittedRef.current = key;
    fitTo(w, h, totalW, totalH);
  }, [fitTo, totalH, totalW]);

  const zoomAt = useCallback((pointer: { x: number; y: number }, deltaY: number) => {
    const oldZoom = zoomRef.current;
    const oldPan = panRef.current;
    const factor = deltaY > 0 ? 1 / 1.08 : 1.08;
    const nextZoom = clamp(oldZoom * factor, MIN_ZOOM, MAX_ZOOM);
    const docX = (pointer.x - oldPan.x) / oldZoom;
    const docY = (pointer.y - oldPan.y) / oldZoom;
    applyView(nextZoom, {
      x: pointer.x - docX * nextZoom,
      y: pointer.y - docY * nextZoom,
    });
  }, [applyView]);

  const zoomToPoint = useCallback(
    (
      pointer: { x: number; y: number },
      nextZoom: number,
      origin: { zoom: number; pan: { x: number; y: number }; pointer: { x: number; y: number } },
    ) => {
      const zoomValue = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
      const docX = (origin.pointer.x - origin.pan.x) / origin.zoom;
      const docY = (origin.pointer.y - origin.pan.y) / origin.zoom;
      applyView(zoomValue, {
        x: pointer.x - docX * zoomValue,
        y: pointer.y - docY * zoomValue,
      });
    },
    [applyView],
  );

  const zoomAroundCenter = useCallback(
    (nextZoom: number) => {
      const oldZoom = zoomRef.current;
      const oldPan = panRef.current;
      const { w, h } = sizeRef.current;
      const zoomValue = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
      const cx = w / 2;
      const cy = h / 2;
      const docX = (cx - oldPan.x) / oldZoom;
      const docY = (cy - oldPan.y) / oldZoom;
      applyView(zoomValue, { x: cx - docX * zoomValue, y: cy - docY * zoomValue });
    },
    [applyView],
  );

  const panBy = useCallback((dx: number, dy: number) => {
    const next = { x: panRef.current.x + dx, y: panRef.current.y + dy };
    panRef.current = next;
    setPan(next);
  }, []);

  const setPanAbsolute = useCallback((next: { x: number; y: number }) => {
    panRef.current = next;
    setPan(next);
  }, []);

  const fit = useCallback(() => {
    const { w, h } = sizeRef.current;
    if (!w || !h) return;
    fittedRef.current = `${totalWRef.current}x${totalHRef.current}`;
    fitTo(w, h, totalWRef.current, totalHRef.current);
  }, [fitTo]);

  const focusSlide = useCallback(
    (index: number) => {
      const z = zoomRef.current;
      const { w, h } = sizeRef.current;
      setPanAbsolute({
        x: (w - canvas.slideWidth * z) / 2 - index * canvas.slideWidth * z,
        y: (h - canvas.slideHeight * z) / 2,
      });
    },
    [canvas.slideHeight, canvas.slideWidth, setPanAbsolute],
  );

  const getPlacement = useCallback(() => {
    const z = zoomRef.current || 1;
    const current = panRef.current;
    const { w, h } = sizeRef.current;
    return {
      cx: (w / 2 - current.x) / z,
      cy: (h / 2 - current.y) / z,
    };
  }, []);

  const centerDocX = size.w ? (size.w / 2 - pan.x) / zoom : 0;
  const activeSlide = clamp(
    Math.floor(centerDocX / canvas.slideWidth),
    0,
    Math.max(0, canvas.slideCount - 1),
  );

  return {
    zoom,
    pan,
    size,
    zoomRef,
    panRef,
    activeSlide,
    onSize,
    zoomAt,
    zoomToPoint,
    zoomAroundCenter,
    panBy,
    setPanAbsolute,
    fit,
    focusSlide,
    getPlacement,
  };
}
