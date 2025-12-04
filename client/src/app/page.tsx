"use client";

import ConnectWalletButton from "@/components/ConnectWalletButton";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16 text-center bg-gradient-to-b from-black via-slate-950 to-black">

      <ConnectWalletButton />

      <h1 className="text-4xl sm:text-5xl font-extrabold mt-10 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
        Welcome to FitWager
      </h1>

      <p className="mt-3 text-lg text-slate-400 max-w-xl mx-auto">
        Compete. Train. Win. Earn rewards for your fitness — all powered by Solana.
      </p>

      <div className="mt-10">
        <Link
          href="/dashboard"
          className="px-6 py-3 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-medium shadow-[0_0_20px_rgba(168,85,247,0.4)] transition"
        >
          Go to Dashboard
        </Link>
      </div>

      <section className="mt-14 w-full max-w-3xl space-y-8">

        <div className="rounded-2xl bg-slate-900/60 border border-purple-400/20 p-6">
          <h2 className="text-xl font-semibold mb-2">🏋️ Create Challenges</h2>
          <p className="text-slate-400">
            Set fitness goals, invite friends, and stake SOL in competitive challenges.
          </p>
        </div>

        <div className="rounded-2xl bg-slate-900/60 border border-purple-400/20 p-6">
          <h2 className="text-xl font-semibold mb-2">📊 Real-Time Tracking</h2>
          <p className="text-slate-400">
            Sync your fitness app and let our smart contract validate your activity.
          </p>
        </div>

        <div className="rounded-2xl bg-slate-900/60 border border-purple-400/20 p-6">
          <h2 className="text-xl font-semibold mb-2">💰 Automated Payouts</h2>
          <p className="text-slate-400">
            Winners get rewards instantly via Solana — no delays, no disputes.
          </p>
        </div>

      </section>

    </main>
  );
}
