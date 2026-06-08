"use client";

// Native haptic feedback (the iPhone Taptic Engine) via the Capacitor Haptics
// plugin. Every function is fire-and-forget and never throws.
//
// Only fires inside the native app — on the web (desktop, and iOS Safari, which
// has no web-vibration support) these are no-ops, so they're safe to call from
// shared web components. The plugin is imported lazily, so it never enters the
// web bundle until actually used on device.

function isNativeApp(): boolean {
  return (
    typeof window !== "undefined" &&
    !!(window as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.()
  );
}

async function withHaptics(
  run: (m: typeof import("@capacitor/haptics")) => unknown,
): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const m = await import("@capacitor/haptics");
    await run(m);
  } catch {
    /* haptics unavailable on this device/platform — ignore */
  }
}

/** Light tap — button presses and step progression. */
export function hapticTap(): void {
  void withHaptics(({ Haptics, ImpactStyle }) => Haptics.impact({ style: ImpactStyle.Light }));
}

/** Medium thud — a primary / hero action (e.g. "Make it land"). */
export function hapticImpact(): void {
  void withHaptics(({ Haptics, ImpactStyle }) => Haptics.impact({ style: ImpactStyle.Medium }));
}

/** Soft tick — selecting a choice (audience chip, moment card). */
export function hapticSelect(): void {
  void withHaptics(({ Haptics }) => Haptics.selectionChanged());
}

/**
 * Very light tick per keystroke — keyboard-style feedback while typing. Uses the
 * selection generator (the subtlest cue, what iOS uses for keyboard feedback).
 * Fires per character; a no-op if the device's own keyboard haptics are already
 * on is not detectable, so users with that enabled may feel a double tick.
 */
export function hapticKeystroke(): void {
  void withHaptics(({ Haptics }) => Haptics.selectionChanged());
}

/** Success notification — results landed. */
export function hapticSuccess(): void {
  void withHaptics(({ Haptics, NotificationType }) => Haptics.notification({ type: NotificationType.Success }));
}

/** Error notification — something failed. */
export function hapticError(): void {
  void withHaptics(({ Haptics, NotificationType }) => Haptics.notification({ type: NotificationType.Error }));
}
