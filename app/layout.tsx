import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "DIVERSIFY | Algo Dashboard",
  description: "Algorithmic trading dashboard and backtesting analysis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistMono.variable} antialiased bg-[var(--void)] text-[var(--text-1)] h-screen w-screen overflow-hidden selection:bg-[var(--neon-glow)] selection:text-[var(--neon)] flex flex-col`}
      >
        <div className="dot-grid" />
        <div className="scanlines pointer-events-none" />
        {children}
      </body>
    </html>
  );
}
