"use client";

import { WalletConnectionProvider } from "@/components/WalletConnectionProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return <WalletConnectionProvider>{children}</WalletConnectionProvider>;
}
