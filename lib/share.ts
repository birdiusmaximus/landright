// Share a finished message via the most native path available, degrading
// gracefully so it works everywhere the app runs:
//   1. Capacitor Share plugin — the native iOS/Android app (true OS share sheet)
//   2. Web Share API          — mobile browsers + the iOS WKWebView
//   3. Clipboard copy         — desktop browsers with no share support
// Never throws; returns what actually happened so the button can show the right
// feedback. The native plugin is lazy-imported so the web bundle stays light and
// builds that predate the plugin simply fall through to the Web Share API.

export type ShareOutcome = "shared" | "copied" | "dismissed" | "unavailable";

type CapWindow = {
  Capacitor?: {
    isNativePlatform?: () => boolean;
    isPluginAvailable?: (name: string) => boolean;
  };
};

// The user cancelling the share sheet is a normal outcome, not a failure — so we
// stop there rather than falling through to the clipboard.
function isAbort(e: unknown): boolean {
  if (e && typeof e === "object") {
    const name = (e as { name?: string }).name;
    const msg = (e as { message?: string }).message ?? "";
    if (name === "AbortError") return true;
    if (/cancel|abort|dismiss/i.test(msg)) return true;
  }
  return false;
}

export async function shareText(text: string, title?: string): Promise<ShareOutcome> {
  if (!text) return "unavailable";

  // 1. Native Capacitor Share plugin (present only in a synced native shell).
  const cap = typeof window !== "undefined" ? (window as unknown as CapWindow).Capacitor : undefined;
  if (cap?.isNativePlatform?.() && cap.isPluginAvailable?.("Share")) {
    try {
      const { Share } = await import("@capacitor/share");
      await Share.share(title ? { text, title, dialogTitle: title } : { text });
      return "shared";
    } catch (e) {
      if (isAbort(e)) return "dismissed";
      // otherwise fall through to the Web Share API / clipboard
    }
  }

  // 2. Web Share API — works in mobile browsers and inside the iOS WKWebView,
  //    so the current TestFlight build (no native plugin yet) still gets a real
  //    share sheet.
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share(title ? { text, title } : { text });
      return "shared";
    } catch (e) {
      if (isAbort(e)) return "dismissed";
      // otherwise fall through to the clipboard
    }
  }

  // 3. Clipboard fallback (desktop browsers without a share sheet).
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return "copied";
    }
  } catch {
    /* ignore */
  }

  return "unavailable";
}
