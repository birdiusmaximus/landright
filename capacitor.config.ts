import type { CapacitorConfig } from "@capacitor/cli";
import { KeyboardResize } from "@capacitor/keyboard";

// Capacitor wraps the LIVE web app in a native WebView. Almost all of Landright
// stays a normal web app (built + deployed on Vercel); this native shell only
// adds App Store in-app purchases and native niceties. Web changes ship via
// Vercel and appear in the app with no resubmission — only changes to this shell
// (icon, splash, plugins, native code) need a new App Store build.
//
// SET BEFORE BUILDING:
//   • appId      → your registered Apple bundle identifier (must be unique)
//   • server.url → the deployment the app loads. For the App Store build, point
//                  it at a deployment with billing ON (NEXT_PUBLIC_BILLING_ENABLED=1)
//                  so login + the paywall are active. For a first look in the
//                  Simulator you can point it at the free site to see it run.
const config: CapacitorConfig = {
  appId: "app.landright", // ← change to your real bundle ID before `npx cap add ios`
  appName: "Landright",
  webDir: "native/www", // local fallback shown only before the remote site loads
  server: {
    // Loads the live deployment in the WebView — currently the FREE web app, so
    // the iOS app is free here too (great for sharing with friends / TestFlight).
    // For the paid App Store build, point this at a deployment with
    // NEXT_PUBLIC_BILLING_ENABLED=1 so login + the paywall (App Store IAP) are on.
    url: "https://landright-six.vercel.app",
    cleartext: false,
  },
  ios: {
    // "never" lets the page fill behind the status bar / home indicator; the web
    // app pads its content with env(safe-area-inset-*) so nothing is obscured.
    contentInset: "never",
  },
  plugins: {
    Keyboard: {
      // Resize the WebView to sit above the keyboard, so the page (and the pinned
      // "Make it land" button) stay visible while typing.
      resize: KeyboardResize.Native,
    },
  },
};

export default config;
