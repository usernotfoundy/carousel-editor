import { useCallback, useRef, useState } from 'react';

const HISTORY_LIMIT = 80;

function sameSnapshot<T>(a: T, b: T) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function useHistory<T>(initial: T) {
  const [present, setPresent] = useState(initial);
  const presentRef = useRef(initial);
  const pastRef = useRef<T[]>([]);
  const futureRef = useRef<T[]>([]);
  const pendingRef = useRef<T | null>(null);
  const [counts, setCounts] = useState({ undo: 0, redo: 0 });

  const bump = useCallback(() => {
    setCounts({ undo: pastRef.current.length, redo: futureRef.current.length });
  }, []);

  const flushPending = useCallback(() => {
    const before = pendingRef.current;
    if (!before) return;
    pendingRef.current = null;
    if (sameSnapshot(before, presentRef.current)) return;
    pastRef.current.push(before);
    if (pastRef.current.length > HISTORY_LIMIT) pastRef.current.shift();
    futureRef.current = [];
    bump();
  }, [bump]);

  const commit = useCallback(
    (recipe: (current: T) => T) => {
      flushPending();
      const before = presentRef.current;
      const next = recipe(before);
      if (sameSnapshot(before, next)) return;
      pastRef.current.push(structuredClone(before));
      if (pastRef.current.length > HISTORY_LIMIT) pastRef.current.shift();
      futureRef.current = [];
      presentRef.current = next;
      setPresent(next);
      bump();
    },
    [bump, flushPending],
  );

  const preview = useCallback((recipe: (current: T) => T) => {
    const next = recipe(presentRef.current);
    if (sameSnapshot(presentRef.current, next)) return;
    if (!pendingRef.current) pendingRef.current = structuredClone(presentRef.current);
    presentRef.current = next;
    setPresent(next);
  }, []);

  const undo = useCallback(() => {
    flushPending();
    const previous = pastRef.current.pop();
    if (!previous) return;
    futureRef.current.push(structuredClone(presentRef.current));
    presentRef.current = previous;
    setPresent(previous);
    bump();
  }, [bump, flushPending]);

  const redo = useCallback(() => {
    flushPending();
    const next = futureRef.current.pop();
    if (!next) return;
    pastRef.current.push(structuredClone(presentRef.current));
    presentRef.current = next;
    setPresent(next);
    bump();
  }, [bump, flushPending]);

  const reset = useCallback(
    (next: T) => {
      pendingRef.current = null;
      pastRef.current = [];
      futureRef.current = [];
      presentRef.current = next;
      setPresent(next);
      bump();
    },
    [bump],
  );

  const replace = useCallback((next: T) => {
    presentRef.current = next;
    setPresent(next);
  }, []);

  return {
    present,
    presentRef,
    commit,
    preview,
    undo,
    redo,
    reset,
    replace,
    flushPending,
    canUndo: counts.undo > 0,
    canRedo: counts.redo > 0,
  };
}
