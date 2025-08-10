// app/ScriptLoader.tsx
"use client";

import { useEffect } from "react";

export default function ScriptLoader({ srcs }: { srcs: string[] }) {
  useEffect(() => {
    const created: HTMLScriptElement[] = [];

    for (const src of srcs) {
      // avoid duplicates across navigations
      if (document.querySelector(`script[src="${src}"]`)) continue;
      const s = document.createElement("script");
      s.src = src;
      s.async = false; // keep order
      document.body.appendChild(s);
      created.push(s);
    }

    // If you want strict cleanup between route changes, uncomment:
    // return () => { created.forEach(s => s.remove()); };
  }, [srcs]);

  return null;
}
