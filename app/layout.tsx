import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "NEST76 — Where Ideas Hatch",
    template: "%s | NEST76",
  },
  description: "PT Technology Digital Kreasi. Teknologi yang lahir dari pengalaman nyata di lapangan.",
  openGraph: {
    title: "NEST76 — Where Ideas Hatch",
    description: "Teknologi yang lahir dari pengalaman nyata. POS, Marketplace, Accounting, Factory OS.",
    url: "https://nest76.com",
    siteName: "NEST76",
    locale: "id_ID",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
