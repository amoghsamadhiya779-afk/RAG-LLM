import type { Metadata } from "next";
import { Inter, Space_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Navbar } from "@/components/shared/Navbar";
import { BlobBackdrop } from "@/components/animations/BlobBackdrop";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Drew - Shape your digital presence",
  description: "Next-generation career intelligence playground and workspace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${spaceMono.variable} antialiased w-screen min-h-screen overflow-x-hidden`}
      >
        <ThemeProvider>
          <BlobBackdrop />
          <Navbar />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
