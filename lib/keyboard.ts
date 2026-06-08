"use client";

// Tracks whether the on-screen keyboard is visible, via the Capacitor Keyboard
// plugin. Native-only: on the web there's no soft keyboard overlay to worry
// about, so this stays false (and the plugin is never imported into the bundle).
import { useEffect, useState } from "react";

function isNativeApp(): boolean {
  return (
    typeof window !== "undefined" &&
    !!(window as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.()
  );
}

export function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isNativeApp()) return;
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      try {
        const { Keyboard } = await import("@capacitor/keyboard");
        const show = await Keyboard.addListener("keyboardWillShow", () => setVisible(true));
        const hide = await Keyboard.addListener("keyboardWillHide", () => setVisible(false));
        if (cancelled) {
          show.remove();
          hide.remove();
          return;
        }
        cleanup = () => {
          show.remove();
          hide.remove();
        };
      } catch {
        /* plugin unavailable — leave it false */
      }
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return visible;
}
