# Landright iOS (Capacitor) wrapper

This wraps the **live web app** in a native iOS shell. Capacitor opens a
full-screen WebView pointed at your deployment (`server.url`) and adds the things
a website can't do — chiefly **App Store in-app purchases**.

**Key consequence:** you keep building Landright as a normal web app (Claude Code
→ Vercel). Web changes appear in the iOS app automatically, **no resubmission**.
Only changes to the *native shell* (icon, splash, plugins, native code) need a
new App Store build.

```
Web app (Next.js on Vercel) ──loads──►  iOS WebView (this wrapper) ──►  App Store IAP
        free, no login                    login + paywall ON                (StoreKit)
```

## Billing model
- **Web** stays free: `NEXT_PUBLIC_BILLING_ENABLED` unset → no login, no paywall.
- **iOS** turns billing on by loading a deployment built with
  `NEXT_PUBLIC_BILLING_ENABLED=1` (login + paywall active). The purchase itself
  goes through **App Store StoreKit** via the RevenueCat Capacitor plugin —
  `lib/billing.ts` auto-detects the native shell and uses it instead of Stripe.
- Same RevenueCat project + `Plus` entitlement, keyed by the Clerk user id, so a
  subscription is recognised across web and app.

## What's already wired (this branch)
- Capacitor 8 + `@revenuecat/purchases-capacitor` installed
- `capacitor.config.ts` (set `appId` + `server.url` before building)
- `lib/billing.ts` — unified web/native billing; call sites already use it
- `native/www/index.html` — offline/loading fallback
- `assets/` icon + splash sources → `npm run cap:assets`
- npm scripts (see bottom)

## Prerequisites (you)
1. **Xcode** from the Mac App Store (~12 GB). Then point the CLI at it:
   `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`
2. **CocoaPods**: `sudo gem install cocoapods` (or `brew install cocoapods`)
3. **Apple Developer Program** enrolment ($99/yr)

## One-time setup
1. **Set your bundle id** in `capacitor.config.ts` (`appId`) — must match the App
   ID you register in your Apple account.
2. **Set `server.url`** in `capacitor.config.ts`:
   - First Simulator run: point at the free site to confirm the shell works.
   - For the store build: point at a **billing-on deployment** (see below).
3. Generate the native project + assets:
   ```
   npm run cap:add:ios     # creates ios/ (needs Xcode + CocoaPods)
   npm run cap:assets      # writes app icons + splash from assets/
   npm run cap:sync        # syncs config/plugins
   npm run cap:ios         # opens Xcode
   ```
4. In Xcode: select your **Team** (Signing & Capabilities), then Run ▶ on a
   Simulator or device.

## Billing-on deployment (for the store build)
The app needs a URL where billing is ON. Easiest: a **second Vercel project**
from the same repo (or a separate environment) with these env vars:
- `NEXT_PUBLIC_BILLING_ENABLED=1`
- `NEXT_PUBLIC_REVENUECAT_IOS_KEY=appl_…` (the RevenueCat **Apple** public key)
- the existing Clerk keys + `REVENUECAT_SECRET_KEY` + `NEXT_PUBLIC_ADMIN_USER_IDS`

Point `server.url` at that deployment's URL. The public web app stays free.

## Remaining native-IAP steps (when you're ready to charge)
1. **App Store Connect** → create the app record + an auto-renewing subscription
   product; sign the Paid Apps / banking & tax agreements.
2. **RevenueCat** → add an **App Store** app, paste its public SDK key
   (`appl_…`) into the billing-on deployment as `NEXT_PUBLIC_REVENUECAT_IOS_KEY`,
   and attach the new product to the `default` offering's Monthly package +
   the `Plus` entitlement.
3. Test the purchase (see below), then submit for review.

## Testing
- **Web UI** (≈90% of the app): browser / Claude preview, exactly as now.
- **Native shell + purchase flow**: **Xcode iOS Simulator** — add a local
  *StoreKit configuration file* to test buying without real money or App Store
  Connect.
- **Full IAP sandbox**: a **real iPhone via TestFlight** before submitting.
- The Claude preview **cannot** run the iOS app (it's a web-only browser frame).

## Commands
| Command | What |
|---|---|
| `npm run native:assets` | regenerate `assets/` icon + splash from the logo |
| `npm run cap:add:ios` | create the `ios/` Xcode project (needs Xcode + CocoaPods) |
| `npm run cap:assets` | generate app icons + splash into `ios/` |
| `npm run cap:sync` | copy config + update native plugins |
| `npm run cap:ios` | open the project in Xcode |
| `npm run cap:doctor` | check the Capacitor setup |

## Notes
- **Commit the `ios/` folder** once generated (Capacitor adds its own
  `.gitignore` for `Pods/`/build artefacts) so native customisations persist.
- **Voice input:** the app records audio via the browser API. In a WebView that
  needs `NSMicrophoneUsageDescription` in `ios/App/App/Info.plist` — add it
  before submitting, or mic capture will silently fail on device.
- **Clerk login on native:** OAuth (Google, etc.) opens an external browser and
  returns via a deep link — set up Associated Domains / a URL scheme when you
  wire login on device.
