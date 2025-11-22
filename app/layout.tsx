import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CollaborativeSessionProvider } from "@/lib/context/CollaborativeSessionContext";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Collaboration Dashboard",
  description: "Simple cross‑tab presence, chat, and counter demo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <CollaborativeSessionProvider>
          {children}
        </CollaborativeSessionProvider>
      </body>
    </html>
  );
}
