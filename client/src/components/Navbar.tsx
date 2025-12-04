"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import ConnectWalletButton from "./ConnectWalletButton";
import { shortenPublicKey } from "@/utils/pda";

const NAV_ITEMS = [
  { 
    href: "/dashboard", 
    label: "Home",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )
  },
  { 
    href: "/challenges/public", 
    label: "Explore",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    )
  },
  { 
    href: "/challenges/create", 
    label: "Create",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    ),
    highlight: true
  },
];

export function Navbar() {
  const pathname = usePathname();
  const { publicKey, connected } = useWallet();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <>
        {/* Top bar skeleton */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-[#0f0f13]/95 backdrop-blur-lg border-b border-white/5">
          <div className="flex items-center justify-between h-[60px] px-4 max-w-7xl mx-auto">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl">🏋️</span>
              <span className="text-lg font-bold text-white">FitWager</span>
            </Link>
          </div>
        </header>
        {/* Bottom nav skeleton */}
        <nav className="bottom-nav md:hidden">
          <div className="bottom-nav-inner" />
        </nav>
      </>
    );
  }

  return (
    <>
      {/* Top Header Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0f0f13]/95 backdrop-blur-lg border-b border-white/5">
        <div className="flex items-center justify-between h-[60px] px-4 max-w-7xl mx-auto">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">🏋️</span>
            <span className="text-lg font-bold text-white">FitWager</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || 
                (item.href === "/challenges/public" && pathname?.startsWith("/challenges/") && pathname !== "/challenges/create");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-violet-500/15 text-violet-400"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side - Wallet */}
          <div className="flex items-center gap-3">
            {connected && publicKey && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs text-gray-400 font-mono">
                  {shortenPublicKey(publicKey)}
                </span>
              </div>
            )}
            <ConnectWalletButton />
          </div>
        </div>
      </header>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="bottom-nav md:hidden">
        <div className="bottom-nav-inner">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || 
              (item.href === "/challenges/public" && pathname?.startsWith("/challenges/") && pathname !== "/challenges/create" && pathname !== "/dashboard");
            
            if (item.highlight) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-center w-14 h-14 -mt-5 rounded-full bg-violet-500 text-white shadow-lg shadow-violet-500/30"
                >
                  <div className="w-6 h-6">{item.icon}</div>
                </Link>
              );
            }
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`bottom-nav-item ${isActive ? "active" : ""}`}
              >
                <div className="w-6 h-6">{item.icon}</div>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

export default Navbar;
