import type React from "react";
import type { Metadata } from "next";
import { Geist_Mono as GeistMono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistMono = GeistMono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PROSPEC",
  description: "Tactical command and control system",
  other: {
    "color-scheme": "dark",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" data-color-scheme="dark" style={{ colorScheme: "dark" }}>
      <body
        className={`${geistMono.className} bg-black text-white antialiased`}
      >
        <Script src="https://api.tempo.build/proxy-asset?url=https://storage.googleapis.com/tempo-public-assets/error-handling.js" />
        {children}
      </body>
    </html>
  );
}
