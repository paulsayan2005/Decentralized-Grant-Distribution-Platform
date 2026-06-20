import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-primary",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "GrantFlow — Decentralized Grant Distribution on Stellar",
  description:
    "A transparent, trustless grant distribution platform built on Stellar Soroban smart contracts. Create grants, donate in XLM, and track funding in real time.",
  keywords: ["Stellar", "Soroban", "DeFi", "grants", "blockchain", "Web3", "XLM"],
  openGraph: {
    title: "GrantFlow — Decentralized Grant Distribution on Stellar",
    description: "Transparent, trustless grant distribution on Stellar Soroban.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${jakarta.variable}`}>
      <body className="antialiased">
        <Providers>
          <Navbar />
          <main className="min-h-screen pt-16">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
