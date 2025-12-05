"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { MIN_STAKE_SOL } from "@/utils/constants";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useFitWagerStore, Participant } from "@/utils/store";
import { shortenPublicKey } from "@/utils/pda";
import { getTimeRemaining } from "@/utils/solana";
import { TransactionModal } from "@/components/TransactionModal";
import ConnectWalletButton from "@/components/ConnectWalletButton";

const REFRESH_INTERVAL = 10000;

export default function ChallengeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const challengeId = params.id as string;

  const { publicKey, connected } = useWallet();
  const wallet = useWallet();
  
  const {
    currentChallenge,
    currentParticipants,
    userChallengeStatus,
    txInProgress,
    txModal,
    closeTxModal,
    fetchChallengeDetails,
    fetchParticipants,
    fetchUserChallengeStatus,
    joinChallenge,
    submitScore,
    endChallenge,
    addToast,
    setCurrentChallenge,
    setUserChallengeStatus,
  } = useFitWagerStore();

  const [loading, setLoading] = useState(true);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [scoreInput, setScoreInput] = useState("");
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false, total: 0 });
  const [mounted, setMounted] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    setMounted(true);
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const loadChallengeData = useCallback(async () => {
    if (!challengeId) return;
    setLoading(true);
    try {
      const walletAddress = publicKey?.toBase58();
      const challenge = await fetchChallengeDetails(challengeId, walletAddress);
      
      if (!challenge && isMounted.current) {
        addToast("Challenge not found", "error");
        router.push("/challenges/public");
        return;
      }
      
      await fetchParticipants(challengeId);
      if (walletAddress) await fetchUserChallengeStatus(challengeId, walletAddress);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [challengeId, publicKey, fetchChallengeDetails, fetchParticipants, fetchUserChallengeStatus, addToast, router]);

  useEffect(() => { loadChallengeData(); }, [loadChallengeData]);

  // Auto-refresh
  useEffect(() => {
    if (!challengeId || loading) return;
    const interval = setInterval(async () => {
      if (!isMounted.current || txInProgress) return;
      const walletAddress = publicKey?.toBase58();
      try {
        await fetchChallengeDetails(challengeId, walletAddress);
        await fetchParticipants(challengeId);
        if (walletAddress) await fetchUserChallengeStatus(challengeId, walletAddress);
      } catch {}
    }, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [challengeId, loading, publicKey, txInProgress, fetchChallengeDetails, fetchParticipants, fetchUserChallengeStatus]);

  useEffect(() => {
    if (!connected) setUserChallengeStatus(null);
  }, [connected, setUserChallengeStatus]);

  useEffect(() => {
    return () => {
      setCurrentChallenge(null);
      setUserChallengeStatus(null);
    };
  }, [setCurrentChallenge, setUserChallengeStatus]);

  useEffect(() => {
    if (!currentChallenge?.endTime) return;
    const updateTimer = () => setTimeLeft(getTimeRemaining(currentChallenge.endTime));
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [currentChallenge?.endTime]);

  const isCreator = publicKey && currentChallenge?.creator === publicKey.toBase58();
  const hasJoined = userChallengeStatus?.hasJoined ?? false;
  const userScore = userChallengeStatus?.score ?? 0;

  const handleJoin = useCallback(async () => {
    if (!connected || !currentChallenge) {
      addToast("Connect wallet first", "warning");
      return;
    }
    // Enforce minimum entry fee
    if ((currentChallenge.entryFee ?? 0) < MIN_STAKE_SOL) {
      addToast(`Entry fee must be at least ◎${MIN_STAKE_SOL} SOL to join`, "warning");
      return;
    }
    await joinChallenge(wallet, currentChallenge.id);
  }, [connected, currentChallenge, wallet, joinChallenge, addToast]);

  const handleSubmitScore = useCallback(async () => {
    if (!connected || !currentChallenge || !scoreInput) return;
    const score = parseInt(scoreInput);
    if (isNaN(score) || score < 0) {
      addToast("Invalid score", "error");
      return;
    }
    const result = await submitScore(wallet, currentChallenge.id, score);
    if (result.success) {
      setShowScoreModal(false);
      setScoreInput("");
    }
  }, [connected, currentChallenge, scoreInput, wallet, submitScore, addToast]);

  const handleEndChallenge = useCallback(async () => {
    if (!connected || !currentChallenge || !isCreator || currentParticipants.length === 0) return;
    const winner = currentParticipants.reduce((prev, curr) => prev.score > curr.score ? prev : curr);
    await endChallenge(wallet, currentChallenge.id, winner.wallet);
  }, [connected, currentChallenge, isCreator, currentParticipants, wallet, endChallenge]);

  if (!mounted) return null;

  if (loading) {
    return (
      <main className="page-container bg-[#0f0f13]">
        <div className="px-4 max-w-2xl mx-auto">
          <div className="skeleton h-8 w-48 mb-4" />
          <div className="skeleton h-4 w-32 mb-6" />
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[1,2,3,4].map(i => <div key={i} className="stat-card"><div className="skeleton h-16" /></div>)}
          </div>
        </div>
      </main>
    );
  }

  if (!currentChallenge) {
    return (
      <main className="page-container bg-[#0f0f13]">
        <div className="px-4 max-w-2xl mx-auto text-center py-20">
          <h1 className="text-xl font-bold text-white mb-4">Not Found</h1>
          <Link href="/challenges/public" className="text-violet-400">Browse challenges</Link>
        </div>
      </main>
    );
  }

  const isActive = currentChallenge.status === "active";
  const canJoin = isActive && !hasJoined && !isCreator && connected;
  const canSubmit = isActive && (hasJoined || isCreator) && connected && !timeLeft.isExpired;
  const canEnd = isActive && isCreator && timeLeft.isExpired && connected;

  return (
    <main className="page-container bg-[#0f0f13]">
      <div className="px-4 max-w-2xl mx-auto">
        {/* Back button */}
        <Link href="/challenges/public" className="inline-flex items-center gap-2 text-gray-400 text-sm mb-4">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-2">
            <h1 className="text-2xl font-bold text-white">{currentChallenge.title}</h1>
            <span className={`badge ${isActive ? "badge-success" : "badge-purple"}`}>
              {isActive ? "Active" : "Ended"}
            </span>
          </div>
          <p className="text-sm text-gray-400">
            by {shortenPublicKey(currentChallenge.creator)}
            {isCreator && <span className="text-violet-400 ml-1">(You)</span>}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="stat-card">
            <span className="stat-card-label">Entry Fee</span>
            <span className="stat-card-value purple">◎{currentChallenge.entryFee}</span>
          </div>
          <div className="stat-card">
            <span className="stat-card-label">Prize Pool</span>
            <span className="stat-card-value green">◎{currentChallenge.totalPool.toFixed(2)}</span>
          </div>
          <div className="stat-card">
            <span className="stat-card-label">Players</span>
            <span className="stat-card-value cyan">{currentParticipants.length}</span>
          </div>
          <div className="stat-card">
            <span className="stat-card-label">{timeLeft.isExpired ? "Status" : "Time Left"}</span>
            <span className={`stat-card-value ${timeLeft.isExpired ? "text-red-400" : "yellow"}`}>
              {timeLeft.isExpired ? "Ended" : `${timeLeft.days}d ${timeLeft.hours}h`}
            </span>
          </div>
        </div>

        {/* Your Status */}
        {connected && hasJoined && (
          <div className="mobile-card mb-6 border-violet-500/30">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold text-white">Your Status</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <p className="font-semibold text-emerald-400">Joined ✓</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Your Score</p>
                <p className="font-semibold text-cyan-400">{userScore.toLocaleString()} pts</p>
              </div>
            </div>
          </div>
        )}

        {/* Participants */}
        <div className="mobile-card mb-6">
          <h2 className="font-semibold text-white mb-4">
            Leaderboard ({currentParticipants.length})
          </h2>
          
          {currentParticipants.length > 0 ? (
            <div className="space-y-2">
              {currentParticipants.map((p, idx) => {
                const isCurrentUser = publicKey && p.wallet === publicKey.toBase58();
                return (
                  <div
                    key={p.wallet}
                    className={`flex items-center justify-between p-3 rounded-xl ${
                      isCurrentUser ? "bg-violet-500/10 border border-violet-500/30" : "bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0 ? "bg-amber-500 text-black" : 
                        idx === 1 ? "bg-gray-400 text-black" : 
                        idx === 2 ? "bg-orange-600 text-white" : "bg-gray-700 text-gray-300"
                      }`}>
                        {idx + 1}
                      </span>
                      <div>
                        <span className="text-sm text-white font-mono">
                          {shortenPublicKey(p.wallet)}
                        </span>
                        {isCurrentUser && (
                          <span className="text-xs text-emerald-400 ml-2">(You)</span>
                        )}
                      </div>
                    </div>
                    <span className="font-semibold text-cyan-400">
                      {p.score.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-6">No participants yet</p>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3 pb-6">
          {!connected ? (
            <div className="text-center">
              <p className="text-gray-400 mb-4">Connect wallet to participate</p>
              <ConnectWalletButton />
            </div>
          ) : (
            <>
              {canJoin && (
                <button
                  onClick={handleJoin}
                  disabled={txInProgress}
                  className="btn btn-primary btn-block"
                >
                  {txInProgress ? "Processing..." : `Join for ◎${currentChallenge.entryFee}`}
                </button>
              )}

              {canSubmit && (
                <button
                  onClick={() => setShowScoreModal(true)}
                  disabled={txInProgress}
                  className="btn btn-secondary btn-block"
                >
                  Submit Score
                </button>
              )}

              {canEnd && (
                <button
                  onClick={handleEndChallenge}
                  disabled={txInProgress || currentParticipants.length === 0}
                  className="btn btn-success btn-block"
                >
                  End Challenge & Payout
                </button>
              )}
            </>
          )}
        </div>

        {/* Score Modal */}
        {showScoreModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a24] border border-white/10 rounded-2xl p-6 w-full max-w-md animate-fade-in">
              <h3 className="text-xl font-bold text-white mb-4">Submit Score</h3>
              
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">
                  Enter your workout score
                </label>
                <input
                  type="number"
                  value={scoreInput}
                  onChange={(e) => setScoreInput(e.target.value)}
                  placeholder="e.g., 10000"
                  min="0"
                  className="input"
                />
                {userScore > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Current score: {userScore.toLocaleString()}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowScoreModal(false)}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitScore}
                  disabled={txInProgress || !scoreInput}
                  className="btn btn-primary flex-1"
                >
                  {txInProgress ? "Submitting..." : "Submit"}
                </button>
              </div>
            </div>
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
