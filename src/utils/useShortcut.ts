import { useEffect, useRef } from "react";

export function useShortcut(
  key: string,
  handler: () => void,
  enabled: boolean = true,
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== key) return;
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.tagName === "SELECT" ||
          t.isContentEditable)
      )
        return;
      e.preventDefault();
      handlerRef.current();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [key, enabled]);
}
