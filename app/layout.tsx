// app/layout.tsx
// This is the "wrapper" file — it wraps around every single page in the app.
// Think of it like the cover of a magazine: the spine, the binding, the overall format.
// Everything inside (the actual content) goes in the {children} slot.
// We set up fonts here, global metadata, and the background colour.

import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

// Playfair Display is our headline font — a classic editorial serif.
// You see this kind of font in Vogue, The Atlantic, The New Yorker.
// It gives our magazine that "quality publication" feel.
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",  // This creates a CSS variable we can use anywhere
  display: "swap",              // "swap" means show fallback text while font loads (no invisible text)
});

// Inter is our body font — clean, modern, easy to read at any size.
// It's the font used by many well-designed products (Linear, Vercel, etc.)
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// This metadata appears in browser tabs and when you share the link
export const metadata: Metadata = {
  title: "Morning Brief",
  description: "Your personal read, curated fresh.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // lang="en" helps screen readers and search engines understand this is English
    <html lang="en">
      <body
        // Apply both fonts and the antialiased class (makes text look sharper on screen)
        className={`${playfair.variable} ${inter.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
