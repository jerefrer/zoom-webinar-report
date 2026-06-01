import { useMemo } from "react";
import { decodeReport } from "@/core/shareUrl";
import type { ShareableReport } from "@/types/report";

export function useSharedReport(): ShareableReport | null {
  return useMemo(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (!hash.startsWith("#report=")) return null;
    return decodeReport(hash.slice("#report=".length));
  }, []);
}
