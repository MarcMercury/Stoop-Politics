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
  title: "Stoop Politics — Jessie Mercury",
  description: "Real talk from the stoop. NYC politics, culture, and neighborhood gossip with Jessie Mercury.",
  openGraph: {
    title: "Stoop Politics — Jessie Mercury",
    description: "Real talk from the stoop. NYC politics, culture, and neighborhood gossip with Jessie Mercury.",
    siteName: "Stoop Politics",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stoop Politics — Jessie Mercury",
    description: "Real talk from the stoop. NYC politics, culture, and neighborhood gossip.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
