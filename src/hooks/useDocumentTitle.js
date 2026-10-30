import { useEffect } from "react";

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · Meridian` : "Meridian — Retail Operations Console";
  }, [title]);
}
