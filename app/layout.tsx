import type { Metadata } from "next";
import { Condiment } from "next/font/google";
import "./globals.css";
import MainHeader from "@/components/header/main-header";
import Providers from "@/components/providers/providers";

const condiment = Condiment({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Savage Pet",
  description: " A NFT marketplace for Savage Pet NFTs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <MainHeader />
          <div className={condiment.className}>{children}</div>
        </Providers>
      </body>
    </html>
  );
}
