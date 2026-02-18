import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#030712",
};

export const metadata: Metadata = {
  title: "Laila - Your Personal AI Assistant",
  description: "Laila is your smart, friendly personal AI assistant that can help you with anything.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Laila AI",
  },
  applicationName: "Laila AI",
  keywords: ["AI", "assistant", "voice", "chatbot", "productivity"],
  creator: "Saqib Nawaz Khan",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-950 text-gray-100`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
