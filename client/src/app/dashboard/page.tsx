"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";

export default function DashboardPage() {
  const { publicKey } = useWallet();

  // Safe SSR-friendly wallet shortening
  const shortAddress = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
    : "Not connected";

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black text-slate-100">
      <section className="max-w-5xl mx-auto px-6 py-16 space-y-12">

        {/* ---------- HEADER ---------- */}
        <header className="text-center space-y-3">
          <p className="text-xs font-semibold tracking-[0.35em] text-purple-300/80 uppercase">
            Dashboard
          </p>

          <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Your FitWager Dashboard
          </h1>

          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Track your progress, challenges, and rewards — all on Solana.
          </p>
        </header>

        {/* ---------- BACK TO HOME ---------- */}
        <div className="flex justify-center">
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-slate-200 underline underline-offset-4 transition"
          >
            ← Back to home
          </Link>
        </div>

        {/* ---------- STATS GRID ---------- */}
        <div className="grid gap-6 md:grid-cols-3">

          <div className="rounded-3xl bg-slate-900/70 border border-purple-500/30 shadow-[0_0_35px_rgba(168,85,247,0.35)] p-6">
            <p className="text-sm text-slate-400">Total Challenges</p>
            <p className="mt-4 text-3xl font-semibold">0</p>
          </div>

          <div className="rounded-3xl bg-slate-900/70 border border-purple-500/30 shadow-[0_0_35px_rgba(168,85,247,0.35)] p-6">
            <p className="text-sm text-slate-400">Wins</p>
            <p className="mt-4 text-3xl font-semibold">0</p>
          </div>

          <div className="rounded-3xl bg-slate-900/70 border border-purple-500/30 shadow-[0_0_35px_rgba(168,85,247,0.35)] p-6">
            <p className="text-sm text-slate-400">Total Earned</p>
            <p className="mt-4 text-3xl font-semibold">0 SOL</p>
          </div>

        </div>

        {/* ---------- WALLET OVERVIEW ---------- */}
        <div className="rounded-3xl bg-slate-900/70 border border-purple-500/30 shadow-[0_0_35px_rgba(168,85,247,0.35)] p-6 space-y-4">
          <h2 className="text-xl font-semibold">Wallet Overview</h2>

          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-400">Connected Wallet</dt>
              <dd className="font-mono bg-slate-800/80 px-3 py-1 rounded-full text-xs">
                {shortAddress}
              </dd>
            </div>

            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-400">Auto-sync</dt>
              <dd className="text-emerald-400 font-medium">Enabled</dd>
            </div>
          </dl>
        </div>

        {/* ---------- YOUR CHALLENGES ---------- */}
        <div className="rounded-3xl bg-slate-900/70 border border-purple-500/30 shadow-[0_0_35px_rgba(168,85,247,0.35)] p-8 text-center space-y-4">
          <h2 className="text-xl font-semibold">Your Challenges</h2>

          <p className="text-slate-400">You haven&apos;t joined any challenges yet.</p>

          <Link
            href="/challenges/create"
            className="inline-flex items-center justify-center rounded-full border border-purple-400/70 px-5 py-2 text-sm font-medium text-purple-200 hover:bg-purple-500/20 transition"
          >
            + Create Challenge
          </Link>
        </div>

      </section>
    </main>
  );
}

