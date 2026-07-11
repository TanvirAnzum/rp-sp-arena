import { useCallback, useEffect, useRef } from "react";

/**
 * Returns a debounced version of `fn` that only fires after `delay` ms of inactivity.
 * Safe to use in React — the ref-based timer survives re-renders without stale closures.
 * Pending timer is cleared automatically on unmount.
 */
export function useDebouncedCallback(fn, delay) {
  const timer = useRef(null);

  // Clear any pending call when the component unmounts
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return useCallback(
    (...args) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay],
  );
}
