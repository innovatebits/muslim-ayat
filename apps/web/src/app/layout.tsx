import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { PwaRegistrar } from "@/components/PwaRegistrar";
import { ReaderPreferencesProvider } from "@/components/quran/ReaderPreferences";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Muslim Ayat — Read, Listen, Understand",
    template: "%s · Muslim Ayat",
  },
  description: "A thoughtful, offline-ready space to read, listen to and learn the Quran.",
  applicationName: "Muslim Ayat",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Muslim Ayat",
  },
};

export const viewport: Viewport = {
  themeColor: "#123d32",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ReaderPreferencesProvider>
          <PwaRegistrar />
          {children}
        </ReaderPreferencesProvider>
      </body>
    </html>
  );
}