import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/Navbar";

export const metadata = {
  title: "FitWager | On-Chain Fitness Competitions",
  description: "Compete, train, and win rewards for your fitness — all powered by Solana. Create challenges, stake SOL, and let verified workout data decide the winner.",
  keywords: ["fitness", "solana", "web3", "challenge", "cryptocurrency", "workout", "competition"],
  authors: [{ name: "FitWager Team" }],
  openGraph: {
    title: "FitWager | On-Chain Fitness Competitions",
    description: "Compete, train, and win rewards for your fitness — all powered by Solana.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <Providers>
          <Navbar />
          <div className="pt-0">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
