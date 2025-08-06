import { useState, useRef, useCallback } from "react";

export function usePartialState<T extends object>(initialState: T) {
  const [state, setState] = useState<T>(initialState);
  const prevRef = useRef<T>(initialState);

  const setField = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setState((prev) => {
      if (prev[key] === value) return prev;

      const next = { ...prev, [key]: value };
      prevRef.current = next;
      return next;
    });
  }, []);

  const setFields = useCallback((partial: Partial<T>) => {
    setState((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const key in partial) {
        if (partial[key] !== prev[key]) {
          next[key] = partial[key] as T[Extract<keyof T, string>];
          changed = true;
        }
      }
      if (!changed) return prev;
      prevRef.current = next;
      return next;
    });
  }, []);

  return {
    state,
    setField,
    setFields,
  };
}
