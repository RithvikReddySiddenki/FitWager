"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useFitWagerStore } from "@/utils/store";
import ConnectWalletButton from "@/components/ConnectWalletButton";
import { GoogleFitConnect } from "@/components/GoogleFitConnect";
import { shortenPublicKey } from "@/utils/pda";

export default function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { publicKey, connected } = useWallet();
  const { 
    userStats, 
    fetchUserStats, 
    clearUserData,
    addToast,
    googleFitStatus,
    fitnessData,
    fetchFitnessData,
  } = useFitWagerStore();
  
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);
  const previousWallet = useRef<string | null>(null);

  useEffect(() => {
    setMounted(true);
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // Handle OAuth callback params
  useEffect(() => {
    if (!mounted) return;
    
    const googleConnected = searchParams.get('google_connected');
    const error = searchParams.get('error');
    
    if (googleConnected === 'true') {
      addToast("Google Fit connected successfully!", "success");
      // Clean URL
      router.replace('/dashboard', { scroll: false });
    }
    
    if (error) {
      const errorMessages: Record<string, string> = {
        google_auth_denied: "Google authentication was cancelled",
        missing_code: "Authentication failed - missing code",
        auth_expired: "Authentication session expired - please try again",
        invalid_state: "Invalid authentication state - please try again",
        google_auth_failed: "Google authentication failed - please try again",
      };
      addToast(errorMessages[error] || "Authentication error", "error");
      router.replace('/dashboard', { scroll: false });
    }
  }, [mounted, searchParams, addToast, router]);

  useEffect(() => {
    const currentWallet = publicKey?.toBase58() || null;
    
    if (previousWallet.current !== currentWallet) {
      clearUserData();
      previousWallet.current = currentWallet;
    }
    
    if (!currentWallet) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchUserStats(currentWallet),
          fetchFitnessData(currentWallet),
        ]);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        if (isMounted.current) setLoading(false);
      }
    };

    loadData();
  }, [publicKey, fetchUserStats, fetchFitnessData, clearUserData]);

  if (!mounted) return null;

  // Not connected state
  if (!connected) {
    return (
      <main className="page-container bg-[#0f0f13]">
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-violet-500/20 flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Connect Wallet</h1>
          <p className="text-gray-400 mb-8 max-w-sm">
            Connect your Solana wallet to view your fitness challenges and stats.
          </p>
          <ConnectWalletButton />
        </div>
      </main>
    );
  }

  return (
    <main className="page-container bg-[#0f0f13]">
      <div className="px-4 max-w-2xl mx-auto">
        {/* Header */}
        <div className="pt-2 pb-6">
          <p className="text-gray-400 text-sm mb-1">Welcome back</p>
          <h1 className="text-2xl font-bold text-white">
            {publicKey ? shortenPublicKey(publicKey, 6) : "Dashboard"}
          </h1>
        </div>

        {loading ? (
          <div className="space-y-4">
            {/* Skeleton loading */}
            <div className="mobile-card">
              <div className="skeleton h-16 w-full" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="stat-card">
                  <div className="skeleton h-4 w-16 mb-2" />
                  <div className="skeleton h-8 w-20" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Google Fit Connection */}
            <div className="mb-6">
              <GoogleFitConnect />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="stat-card">
                <span className="stat-card-label">Challenges</span>
                <span className="stat-card-value purple">
                  {(userStats?.totalChallengesCreated || 0) + (userStats?.totalChallengesJoined || 0)}
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-card-label">Active</span>
                <span className="stat-card-value cyan">{userStats?.activeChallenges || 0}</span>
              </div>
              <div className="stat-card">
                <span className="stat-card-label">Wins</span>
                <span className="stat-card-value green">{userStats?.totalWins || 0}</span>
              </div>
              <div className="stat-card">
                <span className="stat-card-label">Earned</span>
                <span className="stat-card-value yellow">◎{(userStats?.totalEarned || 0).toFixed(2)}</span>
              </div>
            </div>

            {/* Today's Fitness Stats */}
            {googleFitStatus.isConnected && fitnessData && (
              <div className="mobile-card mb-6">
                <h2 className="text-sm font-semibold text-gray-400 mb-4">TODAY'S PROGRESS</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">👟</span>
                      <span className="text-xs text-gray-500">Steps</span>
                    </div>
                    <p className="text-2xl font-bold text-violet-400">
                      {(fitnessData.steps || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">🏃</span>
                      <span className="text-xs text-gray-500">Distance</span>
                    </div>
                    <p className="text-2xl font-bold text-cyan-400">
                      {((fitnessData.distance || 0) / 1000).toFixed(1)} km
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">⏱️</span>
                      <span className="text-xs text-gray-500">Active</span>
                    </div>
                    <p className="text-2xl font-bold text-amber-400">
                      {fitnessData.activeMinutes || 0} min
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">🔥</span>
                      <span className="text-xs text-gray-500">Calories</span>
                    </div>
                    <p className="text-2xl font-bold text-red-400">
                      {(fitnessData.calories || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="space-y-3 mb-6">
              <Link href="/challenges/create" className="mobile-card flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white">Create Challenge</h3>
                  <p className="text-sm text-gray-400">Start a new fitness competition</p>
                </div>
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              <Link href="/challenges/public" className="mobile-card flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white">Browse Challenges</h3>
                  <p className="text-sm text-gray-400">Join public competitions</p>
                </div>
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Recent Activity */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-3">Recent Activity</h2>
              
              {userStats?.recentChallenges && userStats.recentChallenges.length > 0 ? (
                <div className="space-y-2">
                  {userStats.recentChallenges.map((challenge) => (
                    <Link
                      key={`${challenge.id}-${challenge.role}`}
                      href={`/challenges/${challenge.id}`}
                      className="mobile-card flex items-center gap-3"
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                        challenge.status === "active" 
                          ? "bg-emerald-500/20" 
                          : "bg-gray-500/20"
                      }`}>
                        {challenge.status === "active" ? "⚡" : "✓"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">{challenge.title}</p>
                        <p className="text-xs text-gray-500">
                          {challenge.role === "creator" ? "Created" : "Joined"} • ◎{challenge.stake}
                        </p>
                      </div>
                      <span className={`badge ${
                        challenge.status === "active" ? "badge-success" : "badge-purple"
                      }`}>
                        {challenge.status}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="mobile-card text-center py-8">
                  <p className="text-gray-500 mb-4">No challenges yet</p>
                  <Link href="/challenges/create" className="text-violet-400 font-medium">
                    Create your first challenge →
                  </Link>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
