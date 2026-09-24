"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { ToastItem } from "@/types/toast";

interface IotToastContextType {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, "id">) => string;
  dismissToast: (id: string) => void;
  dismissDeviceToasts: (deviceId?: string) => void;
  clearAllToasts: () => void;
}

const IotToastContext = createContext<IotToastContextType | null>(null);

export function IotToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const dismissToast = useCallback((id: string) => {
    const timer = timeoutsRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timeoutsRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissDeviceToasts = useCallback((deviceId?: string) => {
    setToasts((prev) => {
      const remaining: ToastItem[] = [];
      for (const t of prev) {
        if (!deviceId || t.deviceId === deviceId) {
          const timer = timeoutsRef.current.get(t.id);
          if (timer) {
            clearTimeout(timer);
            timeoutsRef.current.delete(t.id);
          }
        } else {
          remaining.push(t);
        }
      }
      return remaining;
    });
  }, []);

  const clearAllToasts = useCallback(() => {
    timeoutsRef.current.forEach((timer) => clearTimeout(timer));
    timeoutsRef.current.clear();
    setToasts([]);
  }, []);

  const showToast = useCallback(
    (toast: Omit<ToastItem, "id">): string => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const defaultDuration = toast.type === "error" ? 0 : 8000;
      const duration = toast.durationMs !== undefined ? toast.durationMs : defaultDuration;

      const newToast: ToastItem = {
        ...toast,
        id,
        durationMs: duration,
      };

      setToasts((prev) => {
        // Deduplicate: if a toast with identical deviceId, generation, and type exists, replace it
        if (toast.deviceId && toast.generation !== undefined) {
          const filtered = prev.filter(
            (t) => !(t.deviceId === toast.deviceId && t.generation === toast.generation && t.type === toast.type)
          );
          return [...filtered, newToast];
        }
        return [...prev, newToast];
      });

      if (duration > 0) {
        const timer = setTimeout(() => {
          dismissToast(id);
        }, duration);
        timeoutsRef.current.set(id, timer);
      }

      return id;
    },
    [dismissToast]
  );

  return (
    <IotToastContext.Provider
      value={{
        toasts,
        showToast,
        dismissToast,
        dismissDeviceToasts,
        clearAllToasts,
      }}
    >
      {children}
    </IotToastContext.Provider>
  );
}

export function useIotToast() {
  const ctx = useContext(IotToastContext);
  if (!ctx) {
    // Fallback safe dummy context if used outside provider (e.g. unit tests or isolated render)
    return {
      toasts: [],
      showToast: () => "",
      dismissToast: () => {},
      dismissDeviceToasts: () => {},
      clearAllToasts: () => {},
    };
  }
  return ctx;
}

