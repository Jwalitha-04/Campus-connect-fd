import type { Metadata } from "next";
import { Archivo_Black, Space_Grotesk, Permanent_Marker, Space_Mono } from "next/font/google";
import "./globals.css";
import NotificationListener from "@/components/shared/NotificationListener";
import AmbientOverlay from "@/components/shared/AmbientOverlay";

const archivoBlack = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-archivo-black",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const permanentMarker = Permanent_Marker({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-permanent-marker",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
});

export const metadata: Metadata = {
  title: "Campus Connect — Digital Notice Board",
  description: "A digital campus notice board for finding lost items, exchanging skills, and connecting with peers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${archivoBlack.variable} ${spaceGrotesk.variable} ${permanentMarker.variable} ${spaceMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper-stock text-[#201D1A] font-sans">
        <NotificationListener />
        <AmbientOverlay>{children}</AmbientOverlay>
      </body>
    </html>
  );
}
