// app/ScriptLoader.tsx
"use client";

import { useEffect } from "react";

export default function ScriptLoader({ srcs }: { srcs: string[] }) {
  useEffect(() => {
    const created: HTMLScriptElement[] = [];

    for (const src of srcs) {
      // Don’t duplicate if already present
      if (document.querySelector(`script[src="${src}"]`)) continue;
      const s = document.createElement("script");
      s.src = src;
      s.async = false; // preserve order
      document.body.appendChild(s);
      created.push(s);
    }

    return () => {
      // Optional: keep scripts mounted between pages; remove if you prefer cleanups
      // created.forEach((s) => s.remove());
    };
  }, [srcs]);

  return null;
}
