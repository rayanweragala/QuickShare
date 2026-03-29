/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo } from "react";
import { toast as sonnerToast } from "sonner";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const value = useMemo(
    () => ({
      success: (message) => sonnerToast.success(message),
      error: (message) => sonnerToast.error(message),
      warning: (message) => sonnerToast.warning(message),
      info: (message) => sonnerToast.info(message),
    }),
    []
  );
  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}
