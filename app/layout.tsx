import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/bodoni-moda/opsz.css";
import "@fontsource-variable/playfair-display";
import "@fontsource-variable/cormorant-garamond";
import "./globals.css";
import { BODY_FONTS, HEADING_FONTS } from "@/lib/fields";
import { getSiteData } from "@/lib/services/content";
import { rootMetadata } from "@/lib/seo/metadata";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return rootMetadata(await getSiteData());
}

export async function generateViewport(): Promise<Viewport> {
  const { settings } = await getSiteData();
  return { themeColor: settings.colorBackground, width: "device-width", initialScale: 1 };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { settings } = await getSiteData();
  const theme = {
    "--c-bg": settings.colorBackground,
    "--c-panel": settings.colorPanel,
    "--c-soft": settings.colorSoft,
    "--c-ink": settings.colorInk,
    "--c-muted": settings.colorMuted,
    "--f-display": (HEADING_FONTS.find((f) => f.value === settings.headingFont) ?? HEADING_FONTS[0]).stack,
    "--f-body": (BODY_FONTS.find((f) => f.value === settings.bodyFont) ?? BODY_FONTS[0]).stack,
  } as React.CSSProperties;
  return (
    <html lang="en" style={theme}>
      <body>{children}</body>
    </html>
  );
}
