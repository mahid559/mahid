import type { Metadata } from "next";
import { Saira, Barlow, JetBrains_Mono, Bricolage_Grotesque } from "next/font/google";
import { SITE_META } from "@/data/content";
import "./globals.css";

const saira = Saira({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-body",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-mono",
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["800"],
  variable: "--font-loader",
  display: "swap",
});

export const metadata: Metadata = {
  title: SITE_META.title,
  description: SITE_META.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${saira.variable} ${barlow.variable} ${jetbrainsMono.variable} ${bricolage.variable} antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
