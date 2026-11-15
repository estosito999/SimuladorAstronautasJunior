import { useState, useCallback } from 'react';

export function useLocalStorage(key, initial) {
  const [val, setVal] = useState(() => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : initial; } catch { return initial; }
  });
  const set = useCallback((next) => {
    setVal((prev) => {
      const v = typeof next === 'function' ? next(prev) : next;
      try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* ignore */ }
      return v;
    });
  }, [key]);
  return [val, set];
}
