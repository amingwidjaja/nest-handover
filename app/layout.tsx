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
  title: "NEST Paket — Tanda Terima Digital",
  description:
    "Tanda Terima Digital yang rapi, cepat, dan 100% GRATIS. Bukti kirim jelas tanpa kertas.",
  icons: {
    icon: "/logo-nest-paket.png",
    apple: "/logo-nest-paket.png",
  },
  openGraph: {
    title: "NEST Paket — Tanda Terima Digital",
    description: "Bukti kirim jelas, tanpa kertas. Rapi, cepat, dan 100% GRATIS.",
    url: "https://paket.nest76.com",
    siteName: "NEST Paket",
    images: [
      {
        url: "/logo-nest-paket.png",
        width: 512,
        height: 512,
      },
    ],
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
