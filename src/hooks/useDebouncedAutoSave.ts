import { useEffect, useRef } from "react";

export function useDebouncedAutoSave(
  save: () => Promise<void>,
  deps: unknown[],
  delayMs = 1000,
) {
  const isFirstRender = useRef(true);
  const saveRef = useRef(save);
  saveRef.current = save;

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timer = window.setTimeout(() => {
      void saveRef.current();
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, deps);
}
