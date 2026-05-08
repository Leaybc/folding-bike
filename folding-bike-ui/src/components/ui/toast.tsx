"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

type ToastContextValue = {
  show: (message: string, opts?: { tone?: "default" | "error" | "success" }) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<
    { id: number; message: string; tone: "default" | "error" | "success" }[]
  >([]);

  const show = React.useCallback<ToastContextValue["show"]>((message, opts) => {
    const id = Date.now() + Math.random();
    const tone = opts?.tone ?? "default";
    setItems((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 2400);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4">
        {items.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto rounded-md px-4 py-2 text-sm shadow-lg",
              t.tone === "error" && "bg-destructive text-destructive-foreground",
              t.tone === "success" && "bg-emerald-600 text-white",
              t.tone === "default" && "bg-foreground text-background",
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
