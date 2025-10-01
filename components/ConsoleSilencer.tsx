"use client";

import { useEffect } from "react";

export default function ConsoleSilencer() {
  useEffect(() => {
    try {
      const noop = () => {};
      const c = window.console;
      if (!c) return;
      c.log = noop;
      c.info = noop;
      c.debug = noop;
      c.warn = noop;
      // Intentionally keep console.error to surface real errors. If you want to silence errors too, uncomment the next line.
      // c.error = noop;
    } catch {
      // ignore
    }
  }, []);

  return null;
}








