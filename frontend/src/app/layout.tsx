import type { Metadata } from "next";
import { DM_Sans, Inter } from "next/font/google";
import { Providers } from "./providers";
import { SmoothScroll } from "@/components/animation/smooth-scroll";
import "@/styles.css";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });
const geist = Inter({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "Dimension — The AI coworker that never sleeps",
  description: "Dimension collates overnight updates from your connected integrations into a single briefing so you start your day with clarity.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${dmSans.variable} ${geist.variable} font-sans bg-void text-bone antialiased selection:bg-indigo-haze/30`}>
        <Providers>
          <SmoothScroll>
            {children}
          </SmoothScroll>
        </Providers>
      </body>
    </html>
  );
}
