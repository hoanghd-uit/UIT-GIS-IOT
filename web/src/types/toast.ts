export type ToastType = "info" | "warning" | "error";

export interface ToastItem {
  id: string;
  type: ToastType;
  deviceId?: string;
  title?: string;
  message: string;
  generation?: number;
  durationMs?: number; // 0 means do not auto-dismiss (used for errors requiring retry/manual close)
  onRetry?: () => void;
}

