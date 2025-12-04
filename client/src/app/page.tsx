"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import ConnectWalletButton from "@/components/ConnectWalletButton";

export default function Home() {
  const { connected } = useWallet();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="page-container bg-[#0f0f13]">
      <div className="px-4 max-w-lg mx-auto">
        {/* Hero */}
        <section className="pt-8 pb-12 text-center">
          <div className="w-20 h-20 rounded-2xl bg-violet-500/20 flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🏋️</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            FitWager
          </h1>
          
          <p className="text-gray-400 mb-8 max-w-sm mx-auto">
            Compete in fitness challenges, stake SOL, and win real rewards.
          </p>

          <div className="space-y-3">
            {mounted && connected ? (
              <>
                <Link href="/dashboard" className="btn btn-primary btn-block">
                  Go to Dashboard
                </Link>
                <Link href="/challenges/public" className="btn btn-outline btn-block">
                  Browse Challenges
                </Link>
              </>
            ) : (
              <>
                <div className="flex justify-center">
                  <ConnectWalletButton />
                </div>
                <Link href="/challenges/public" className="btn btn-outline btn-block">
                  Browse Challenges
                </Link>
              </>
            )}
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-3 gap-3 mb-8">
          <div className="stat-card text-center">
            <span className="stat-card-value purple text-xl">100+</span>
            <span className="stat-card-label">Challenges</span>
          </div>
          <div className="stat-card text-center">
            <span className="stat-card-value cyan text-xl">500+</span>
            <span className="stat-card-label">Users</span>
          </div>
          <div className="stat-card text-center">
            <span className="stat-card-value green text-xl">50+</span>
            <span className="stat-card-label">SOL Won</span>
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">How It Works</h2>
          
          <div className="space-y-3">
            {[
              { icon: "🔗", title: "Connect Wallet", desc: "Link your Solana wallet" },
              { icon: "🏆", title: "Join Challenge", desc: "Stake SOL to compete" },
              { icon: "📊", title: "Track Progress", desc: "Submit your workout data" },
              { icon: "💰", title: "Win Rewards", desc: "Get paid automatically" },
            ].map((item, idx) => (
              <div key={idx} className="mobile-card flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">{item.icon}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Features</h2>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="mobile-card">
              <span className="text-2xl mb-2 block">⚡</span>
              <h3 className="font-medium text-white text-sm">Instant Payouts</h3>
              <p className="text-xs text-gray-500">Winners get SOL instantly</p>
            </div>
            <div className="mobile-card">
              <span className="text-2xl mb-2 block">🔒</span>
              <h3 className="font-medium text-white text-sm">Secure Escrow</h3>
              <p className="text-xs text-gray-500">Stakes held on-chain</p>
            </div>
            <div className="mobile-card">
              <span className="text-2xl mb-2 block">👥</span>
              <h3 className="font-medium text-white text-sm">Community</h3>
              <p className="text-xs text-gray-500">Compete with anyone</p>
            </div>
            <div className="mobile-card">
              <span className="text-2xl mb-2 block">📱</span>
              <h3 className="font-medium text-white text-sm">Mobile Ready</h3>
              <p className="text-xs text-gray-500">Use anywhere, anytime</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mobile-card text-center py-8 mb-8 border-violet-500/30">
          <h2 className="text-lg font-semibold text-white mb-2">Ready to Compete?</h2>
          <p className="text-sm text-gray-400 mb-6">Start earning rewards for your workouts</p>
          
          {mounted && connected ? (
            <Link href="/challenges/create" className="btn btn-primary">
              Create Challenge
            </Link>
          ) : (
            <ConnectWalletButton />
          )}
        </section>

        {/* Footer */}
        <footer className="text-center py-6 text-gray-600 text-sm">
          <p>Built on Solana • {new Date().getFullYear()}</p>
        </footer>
      </div>
    </main>
  );
}
