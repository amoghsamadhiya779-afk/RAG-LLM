import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ChatProvider } from "@/context/ChatContext";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aether - AI Inference Platform",
  description: "Next-generation large language model playground and workspace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} font-sans antialiased bg-[#050816] text-[#F8FAFC] transition-colors duration-300 w-screen h-screen overflow-hidden select-none`}
      >
        <ChatProvider>{children}</ChatProvider>
      </body>
    </html>
  );
}
