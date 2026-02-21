import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0a0f",
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('laila_theme');if(t==='light'){document.documentElement.setAttribute('data-theme','light')}}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
        style={{ background: "var(--background)", color: "var(--foreground)" }}
        suppressHydrationWarning
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
