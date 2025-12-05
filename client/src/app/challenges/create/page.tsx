"use client";

import { FormEvent, useState, useEffect } from "react";
import { MIN_STAKE_SOL } from "@/utils/constants";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useFitWagerStore } from "@/utils/store";
import { TransactionModal } from "@/components/TransactionModal";
import ConnectWalletButton from "@/components/ConnectWalletButton";

const CHALLENGE_TYPES = [
  { value: "steps", label: "Steps", icon: "👟" },
  { value: "distance", label: "Distance", icon: "🏃" },
  { value: "time", label: "Time", icon: "⏱️" },
  { value: "calories", label: "Calories", icon: "🔥" },
];

const DURATIONS = [
  { value: 7, label: "1 Week" },
  { value: 14, label: "2 Weeks" },
  { value: 30, label: "1 Month" },
];

const STAKES = [
  { value: 0.02, label: "◎0.02" },
  { value: 0.1, label: "◎0.1" },
  { value: 0.25, label: "◎0.25" },
  { value: 0.5, label: "◎0.5" },
  { value: 1, label: "◎1" },
];

export default function CreateChallengePage() {
  const { connected } = useWallet();
  const wallet = useWallet();
  const router = useRouter();
  
  const { createChallenge, txInProgress, txModal, closeTxModal, addToast } = useFitWagerStore();

  const [mounted, setMounted] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("steps");
  const [goal, setGoal] = useState("");
  const [stake, setStake] = useState(0.25);
  const [duration, setDuration] = useState(7);
  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => { setMounted(true); }, []);

  const getGoalUnit = () => {
    switch (type) {
      case "steps": return "steps/day";
      case "distance": return "miles";
      case "time": return "min/day";
      case "calories": return "cal/day";
      default: return "";
    }
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!connected) {
      addToast("Connect wallet first", "warning");
      return;
    }

    if (!title.trim() || !goal || parseInt(goal) <= 0) {
      addToast("Fill in all fields", "warning");
      return;
    }

    // Validate minimum stake
    if (stake < MIN_STAKE_SOL) {
      addToast(`Entry fee must be at least ◎${MIN_STAKE_SOL} SOL`, "warning");
      return;
    }

    const result = await createChallenge(wallet, {
      title: title.trim(),
      type,
      goal: Number(goal),
      stake,
      duration,
      isPublic,
    });

    if (result.success && result.challengeId) {
      // Redirect immediately to the new challenge page
      router.push(`/challenges/${result.challengeId}`);
    }
  }

  if (!mounted) return null;

  if (!connected) {
    return (
      <main className="page-container bg-[#0f0f13]">
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-violet-500/20 flex items-center justify-center mb-6">
            <span className="text-4xl">🏆</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Create Challenge</h1>
          <p className="text-gray-400 mb-8 max-w-sm">
            Connect your wallet to create a fitness challenge.
          </p>
          <ConnectWalletButton />
        </div>
      </main>
    );
  }

  return (
    <main className="page-container bg-[#0f0f13]">
      <div className="px-4 max-w-lg mx-auto">
        {/* Header */}
        <div className="pt-2 pb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Create Challenge</h1>
          <p className="text-gray-400 text-sm">Set your goals and stake SOL</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Challenge Name
            </label>
            <input
              type="text"
              placeholder="e.g., 10K Steps Daily"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={50}
              className="input"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Type
            </label>
            <div className="grid grid-cols-4 gap-2">
              {CHALLENGE_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`p-3 rounded-xl text-center transition ${
                    type === t.value
                      ? "bg-violet-500/20 border-2 border-violet-500"
                      : "bg-white/5 border-2 border-transparent"
                  }`}
                >
                  <span className="text-2xl block mb-1">{t.icon}</span>
                  <span className="text-xs text-gray-400">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Goal */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Daily Goal
            </label>
            <div className="relative">
              <input
                type="number"
                placeholder="Enter amount"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                min={1}
                className="input pr-20"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                {getGoalUnit()}
              </span>
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Duration
            </label>
            <div className="grid grid-cols-3 gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDuration(d.value)}
                  className={`p-3 rounded-xl text-center transition ${
                    duration === d.value
                      ? "bg-cyan-500/20 border-2 border-cyan-500"
                      : "bg-white/5 border-2 border-transparent"
                  }`}
                >
                  <span className="font-semibold text-white">{d.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Stake */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Entry Fee (SOL)
              <div className="text-xs text-gray-500 mt-1">Minimum: ◎{MIN_STAKE_SOL} SOL</div>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {STAKES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStake(s.value)}
                  className={`p-3 rounded-xl text-center transition ${
                    stake === s.value
                      ? "bg-emerald-500/20 border-2 border-emerald-500"
                      : "bg-white/5 border-2 border-transparent"
                  }`}
                >
                  <span className="font-semibold text-emerald-400">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Public Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
            <div>
              <p className="font-medium text-white">Public Challenge</p>
              <p className="text-xs text-gray-500">Anyone can join</p>
            </div>
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                isPublic ? "bg-violet-500" : "bg-gray-700"
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
                  isPublic ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Summary */}
          <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/30">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">You will stake</span>
              <span className="text-xl font-bold text-emerald-400">◎{stake} SOL</span>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!title || !goal || txInProgress}
            className="btn btn-primary btn-block text-base"
          >
            {txInProgress ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating...
              </span>
            ) : (
              "Create Challenge"
            )}
          </button>

          <Link
            href="/dashboard"
            className="block text-center text-sm text-gray-500 hover:text-gray-300"
          >
            Cancel
          </Link>
        </form>

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
