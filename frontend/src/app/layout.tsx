import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../styles/globals.css";
import { WalletProvider } from '@/context/WalletProvider';

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
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
