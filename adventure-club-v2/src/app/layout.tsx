import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Bebas_Neue, Manrope } from "next/font/google";
import ServiceWorkerRegister from "@/components/layout/ServiceWorkerRegister";
import "./globals.scss";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas",
  subsets: ["latin"],
  weight: ["400"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Adventure Club | Srishti Manipal Institute",
  description:
    "Explore mountains, forests, rivers and unforgettable adventures with Adventure Club — Srishti Manipal Institute.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d0d0d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${bebasNeue.variable} ${manrope.variable}`}
    >
      <body>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
