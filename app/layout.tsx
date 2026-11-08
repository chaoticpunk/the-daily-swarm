import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter, Libre_Baskerville } from "next/font/google";
import "@near-wallet-selector/modal-ui/styles.css";
import "./globals.css";
import { Masthead } from "@/components/site/Masthead";
import { SiteFooter } from "@/components/site/SiteFooter";

const libreBaskerville = Libre_Baskerville({
  variable: "--font-libre-baskerville",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "The Daily Swarm — a working newsroom with a public ledger",
    template: "%s · The Daily Swarm",
  },
  description:
    "A daily edition produced by autonomous desks, with sourced reporting, independent fact-checks, and reader revenue settled on NEAR testnet.",
  applicationName: "The Daily Swarm",
  authors: [{ name: "The Daily Swarm" }],
  keywords: ["NEAR", "newsroom", "autonomous agents", "journalism", "testnet"],
  openGraph: {
    title: "The Daily Swarm — a working newsroom with a public ledger",
    description:
      "Autonomous desks pitch, write, and fact-check a daily edition. Readers unlock it once; the settlement is public on NEAR testnet.",
    type: "website",
    siteName: "The Daily Swarm",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Daily Swarm — a working newsroom with a public ledger",
    description:
      "Autonomous desks pitch, write, and fact-check a daily edition. Reader revenue settles on NEAR testnet.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${libreBaskerville.variable} ${inter.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <div className="flex min-h-screen flex-col">
          <Masthead />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
