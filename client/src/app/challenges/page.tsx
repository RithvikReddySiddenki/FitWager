// client/src/app/page.tsx

import Link from "next/link";
import ConnectWalletButton from "@/components/ConnectWalletButton";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-black text-slate-100">
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-16">
        {/* Wallet pill at the top */}
        <div className="flex justify-center">
          <ConnectWalletButton />
        </div>

        {/* Hero */}
        <section className="text-center space-y-6">
          <p className="text-xs font-medium tracking-[0.35em] text-purple-300/80 uppercase">
            On-chain fitness competitions
          </p>

          {/* STATIC h1 — no template string, no curly braces */}
          <h1 className="text-5xl sm:text-6xl font-extrabold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Compete. Train. Win.
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300">
            Earn rewards for your fitness — all powered by Solana. Create
            challenges, stake SOL, and let verified workout data decide the
            winner.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-full bg-purple-500/90 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_0_25px_rgba(168,85,247,0.7)] hover:bg-purple-400 transition"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/challenges/create"
              className="inline-flex items-center justify-center rounded-full border border-purple-400/80 px-6 py-2.5 text-sm font-medium text-purple-200 hover:bg-purple-500/15 transition"
            >
              Create a Challenge
            </Link>
          </div>

          <p className="text-sm text-slate-400 pt-2">
            Compete. Train. Win. Earn rewards for your fitness — all powered by
            Solana.
          </p>
        </section>

        {/* Feature cards */}
        <section className="space-y-6">
          <div className="grid gap-6">
            {/* Create Challenges */}
            <div className="rounded-3xl bg-slate-900/70 border border-purple-500/30 shadow-[0_0_35px_rgba(168,85,247,0.35)] p-6 sm:p-8 flex flex-col gap-2 text-left">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <span role="img" aria-label="trophy">
                  🏆
                </span>
                <span>Create Challenges</span>
              </h2>
              <p className="text-slate-300 text-sm sm:text-base">
                Set fitness goals, invite friends, and stake SOL in competitive
                challenges.
              </p>
            </div>

            {/* Real-Time Tracking */}
            <div className="rounded-3xl bg-slate-900/70 border border-purple-500/30 shadow-[0_0_35px_rgba(168,85,247,0.35)] p-6 sm:p-8 flex flex-col gap-2 text-left">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <span role="img" aria-label="chart">
                  📊
                </span>
                <span>Real-Time Tracking</span>
              </h2>
              <p className="text-slate-300 text-sm sm:text-base">
                Sync your fitness app and let our smart contract validate your
                activity.
              </p>
            </div>

            {/* Automated Payouts */}
            <div className="rounded-3xl bg-slate-900/70 border border-purple-500/30 shadow-[0_0_35px_rgba(168,85,247,0.35)] p-6 sm:p-8 flex flex-col gap-2 text-left">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <span role="img" aria-label="money">
                  💰
                </span>
                <span>Automated Payouts</span>
              </h2>
              <p className="text-slate-300 text-sm sm:text-base">
                Winners get rewards instantly via Solana — no delays, no
                disputes.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

