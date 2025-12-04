"use client";

import { WalletConnectionProvider } from "@/components/WalletConnectionProvider";
import { ToastContainer } from "@/components/ToastContainer";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WalletConnectionProvider>
      {children}
      <ToastContainer />
    </WalletConnectionProvider>
  );
}
