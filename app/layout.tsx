import type { Metadata, Viewport } from "next";
import "./globals.css";

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
        {children}
      </body>
    </html>
  );
}
