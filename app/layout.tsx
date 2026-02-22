// app/layout.tsx
// This is the "wrapper" file — it wraps around every single page in the app.
// Think of it like the cover of a magazine: the spine, the binding, the overall format.
// Everything inside (the actual content) goes in the {children} slot.
// We set up fonts here, global metadata, and the background colour.

import type { Metadata } from "next";
import { EB_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";

// EB Garamond is our headline font — from the same Garamond family as Adobe Garamond Pro,
// which is the font Vogue uses. It has beautiful high-contrast thin and thick strokes
// that feel elegant, refined, and distinctly editorial. Much sharper than Playfair Display.
const playfair = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-playfair",  // We keep the same CSS variable name — nothing else needs to change
  display: "swap",
});

// DM Sans is our body and label font — lightweight, geometric, very clean.
// It's closer to the refined label style you see in Vogue ("BY AUTHOR NAME") than Inter is.
const inter = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-inter",     // Same variable name as before — all components keep working
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
