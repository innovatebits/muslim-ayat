"use client";

import { useEffect } from "react";
import { featureFlags } from "@/lib/features";

export function PwaRegistrar() {
  useEffect(() => {
    if (
      featureFlags.offline &&
      "serviceWorker" in navigator
    ) {
      void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
    }
  }, []);

  return null;
}