import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../styles/globals.css";
import { WalletProvider } from '@/hooks/WalletProvider';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "AI Crypto News Hub",
  description: "AI-powered cryptocurrency news curation platform on GenLayer",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
