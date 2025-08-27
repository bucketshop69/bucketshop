import type { Metadata } from "next";
import "./globals.css";
import { PrivyWrapper } from '@/shared/components/PrivyWrapper';

export const metadata: Metadata = {
  title: "BucketShop - Crypto Trading Dashboard",
  description: "Unified Solana trading dashboard with watchlist and DeFi features",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <PrivyWrapper>
          {children}
        </PrivyWrapper>
      </body>
    </html>
  );
}