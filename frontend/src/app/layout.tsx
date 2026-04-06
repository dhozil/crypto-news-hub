import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../styles/globals.css";
import Link from "next/link";

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

export default function Navbar() {
  return (
    <nav>
      <Link href="/">Home</Link>
      <Link href="/news">News Feed</Link>
    </nav>
  );
}
