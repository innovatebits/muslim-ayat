"use client";

import { useEffect } from "react";

export function PwaRegistrar() {
  useEffect(() => {
    if (
      process.env.NEXT_PUBLIC_ENABLE_OFFLINE !== "false" &&
      "serviceWorker" in navigator
    ) {
      void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
    }
  }, []);

  return null;
}