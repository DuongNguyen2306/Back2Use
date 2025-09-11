import { useCallback, useEffect, useRef, useState } from "react";

type Toast = { id: string; title?: string; description?: string; open: boolean };

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 4000;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const idRef = useRef(0);

  const dismiss = useCallback((toastId?: string) => {
    setToasts((prev) =>
      prev.map((t) => (toastId === undefined || t.id === toastId ? { ...t, open: false } : t))
    );
    if (toastId) addToRemoveQueue(toastId);
    else prevIds().forEach(addToRemoveQueue);
  }, []);

  const prevIds = () => toasts.map((t) => t.id);

  const addToRemoveQueue = (toastId: string) => {
    if (timeouts.current.has(toastId)) return;
    const timeout = setTimeout(() => {
      timeouts.current.delete(toastId);
      setToasts((prev) => prev.filter((t) => t.id !== toastId));
    }, TOAST_REMOVE_DELAY);
    timeouts.current.set(toastId, timeout);
  };

  const toast = useCallback(({ title, description }: { title?: string; description?: string }) => {
    idRef.current = (idRef.current + 1) % Number.MAX_SAFE_INTEGER;
    const id = String(idRef.current);
    setToasts((prev) => [{ id, title, description, open: true }, ...prev].slice(0, TOAST_LIMIT));
    return { id, dismiss: () => dismiss(id) };
  }, [dismiss]);

  useEffect(() => () => timeouts.current.forEach(clearTimeout), []);

  return { toasts, toast, dismiss };
}


