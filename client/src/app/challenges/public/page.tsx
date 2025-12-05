"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useFitWagerStore, Challenge } from "@/utils/store";
import { shortenPublicKey } from "@/utils/pda";
import { formatTimeRemaining, getTimeRemaining } from "@/utils/solana";
import { TransactionModal } from "@/components/TransactionModal";

const REFRESH_INTERVAL = 15000;

export default function PublicChallengesPage() {
  const { publicKey, connected } = useWallet();
  const wallet = useWallet();
  
  const {
    challenges,
    fetchChallenges,
    txInProgress,
    txModal,
    closeTxModal,
    joinChallenge,
    addToast,
    fetchUserChallengeStatus,
  } = useFitWagerStore();

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [joinedChallenges, setJoinedChallenges] = useState<Set<string>>(new Set());
  const isMounted = useRef(true);

  useEffect(() => {
    setMounted(true);
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const loadChallenges = useCallback(async () => {
    setLoading(true);
    try {
      await fetchChallenges({ filter: "active", isPublic: true });
    } catch (error) {
      console.error("Error fetching challenges:", error);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [fetchChallenges]);

  useEffect(() => {
    loadChallenges();
  }, [loadChallenges]);

  // Auto-refresh
  useEffect(() => {
    if (loading) return;
    const interval = setInterval(() => {
      if (isMounted.current && !txInProgress) {
        fetchChallenges({ filter: "active", isPublic: true });
      }
    }, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [loading, txInProgress, fetchChallenges]);

  // Check joined status
  useEffect(() => {
    async function checkJoinedStatus() {
      if (!connected || !publicKey || challenges.length === 0) {
        setJoinedChallenges(new Set());
        return;
      }
      const walletAddress = publicKey.toBase58();
      const joined = new Set<string>();
      
      await Promise.all(
        challenges.map(async (challenge) => {
          try {
            const status = await fetchUserChallengeStatus(challenge.id, walletAddress);
            if (status?.hasJoined) joined.add(challenge.id);
          } catch {}
        })
      );
      
      if (isMounted.current) setJoinedChallenges(joined);
    }
    checkJoinedStatus();
  }, [connected, publicKey, challenges, fetchUserChallengeStatus]);

  const handleJoin = useCallback(async (challengeId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!connected) {
      addToast("Please connect your wallet", "warning");
      return;
    }

    if (joinedChallenges.has(challengeId)) {
      addToast("Already joined", "info");
      return;
    }

    setJoiningId(challengeId);
    const result = await joinChallenge(wallet, challengeId);
    
    if (result.success) {
      setJoinedChallenges(prev => new Set([...prev, challengeId]));
      loadChallenges();
    }
    
    setJoiningId(null);
  }, [connected, wallet, joinChallenge, addToast, joinedChallenges, loadChallenges]);

  // Filter challenges
  const filteredChallenges = challenges.filter((c) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return c.title.toLowerCase().includes(query) || c.creator.toLowerCase().includes(query);
  });

  if (!mounted) return null;

  return (
    <main className="page-container bg-[#0f0f13]">
      <div className="px-4 max-w-2xl mx-auto">
        {/* Header */}
        <div className="pt-2 pb-4">
          <h1 className="text-2xl font-bold text-white mb-1">Explore</h1>
          <p className="text-gray-400 text-sm">Join fitness challenges and compete</p>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search challenges..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            {loading ? "Loading..." : `${filteredChallenges.length} challenges`}
          </p>
        </div>

        {/* Challenges List */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="mobile-card">
                <div className="flex items-start gap-3">
                  <div className="skeleton w-12 h-12 rounded-xl" />
                  <div className="flex-1">
                    <div className="skeleton h-5 w-32 mb-2" />
                    <div className="skeleton h-4 w-24" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="skeleton h-12 rounded-lg" />
                  <div className="skeleton h-12 rounded-lg" />
                  <div className="skeleton h-12 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredChallenges.length === 0 ? (
          <div className="mobile-card text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🏋️</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No Challenges</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery ? "Try a different search" : "Be the first to create one!"}
            </p>
            <Link href="/challenges/create" className="btn btn-primary">
              Create Challenge
            </Link>
          </div>
        ) : (
          <div className="space-y-3 pb-4">
            {filteredChallenges.map((challenge) => {
              const timeLeft = getTimeRemaining(challenge.endTime);
              const isCreator = publicKey && challenge.creator === publicKey.toBase58();
              const hasJoined = joinedChallenges.has(challenge.id);
              
              return (
                <Link
                  key={challenge.id}
                  href={`/challenges/${challenge.id}`}
                  className="mobile-card block"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                        <span className="text-xl">
                          {challenge.type === "steps" ? "👟" : 
                           challenge.type === "distance" ? "🏃" : 
                           challenge.type === "time" ? "⏱️" : "🏆"}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-white line-clamp-1">{challenge.title}</h3>
                        <p className="text-xs text-gray-500">
                          by {shortenPublicKey(challenge.creator)}
                          {isCreator && <span className="text-violet-400 ml-1">(You)</span>}
                        </p>
                      </div>
                    </div>
                    {hasJoined && (
                      <span className="badge badge-success">Joined</span>
                    )}
                  </div>

                  {/* Description */}
                  {challenge.description && (
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">{challenge.description}</p>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-white/5 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-500">Entry</p>
                      <p className="font-semibold text-violet-400">◎{challenge.entryFee}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-500">Pool</p>
                      <p className="font-semibold text-emerald-400">◎{challenge.totalPool.toFixed(1)}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-500">Time</p>
                      <p className={`font-semibold ${timeLeft.isExpired ? "text-red-400" : "text-amber-400"}`}>
                        {timeLeft.isExpired ? "Ended" : `${timeLeft.days}d ${timeLeft.hours}h`}
                      </p>
                    </div>
                  </div>

                  {/* Join Button */}
                  {!hasJoined && !isCreator && challenge.status === "active" && (
                    <button
                      onClick={(e) => handleJoin(challenge.id, e)}
                      disabled={txInProgress || joiningId === challenge.id}
                      className="btn btn-primary btn-block"
                    >
                      {joiningId === challenge.id ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Joining...
                        </span>
                      ) : (
                        `Join for ◎${challenge.entryFee}`
                      )}
                    </button>
                  )}

                  {hasJoined && (
                    <div className="text-center text-sm text-gray-400 py-2">
                      Tap to view your progress →
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}

        <TransactionModal
          isOpen={txModal.isOpen}
          type={txModal.type}
          title={txModal.title}
          message={txModal.message}
          txSignature={txModal.txSignature}
          onClose={closeTxModal}
        />
      </div>
    </main>
  );
}
