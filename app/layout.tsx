import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { DEV_PREVIEW_BYPASS } from "@/lib/admin";
import "./globals.css";

// The Green — brand tokens for Clerk's hosted UI (sign-in/up modal, user button).
const clerkAppearance = {
  variables: {
    colorPrimary: "#111110", // ink — links/accents (readable on the light ground)
    colorText: "#111110",
    colorBackground: "#E4E4DF", // ground
    colorInputBackground: "#FFFFFF",
    colorInputText: "#111110",
    colorNeutral: "#111110",
    borderRadius: "0px", // brutalist: no rounded corners
    fontFamily: "var(--font-body), -apple-system, sans-serif",
  },
  elements: {
    // Primary action gets the signature lime block with an ink shadow.
    formButtonPrimary: {
      backgroundColor: "#C6F634",
      color: "#111110",
      border: "2px solid #111110",
      boxShadow: "4px 4px 0 #111110",
      borderRadius: "0px",
      textTransform: "uppercase" as const,
      fontFamily: "var(--font-cond), 'Arial Narrow', sans-serif",
      fontWeight: 900,
      letterSpacing: "0.05em",
    },
  },
};

export const metadata: Metadata = {
  title: "Landright",
  description: "Make your message land right.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Landright", statusBarStyle: "default" },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#E4E4DF",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">
        {/* Adobe Fonts (Typekit) — neue-haas-grotesk-display/text + acumin-pro-extra-condensed.
            React hoists this stylesheet link into <head>. */}
        <link rel="stylesheet" href="https://use.typekit.net/abe4vwg.css" />
        {/* ClerkProvider goes inside <body> (Clerk requirement for Next.js App Router).
            Omitted in the dev preview window: Clerk's dev-browser handshake redirects
            the whole page to clerk.accounts.dev, which the preview blocks. Always
            mounted in real browsers and in production. */}
        {DEV_PREVIEW_BYPASS ? children : <ClerkProvider appearance={clerkAppearance}>{children}</ClerkProvider>}
      </body>
    </html>
  );
}
