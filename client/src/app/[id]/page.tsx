"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";

interface Challenge {
  id: string;
  title: string;
  type: string;
  goal: number;
  stake: number;
  duration: number;
  status: "upcoming" | "active" | "completed";
  progress: number; // mock for now
  participants: { wallet: string; progress: number }[];
}

export default function ChallengeDetails({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  const [challenge, setChallenge] = useState<Challenge | null>(null);

  // Mock backend data — replace with real API later
  useEffect(() => {
    const mockChallenges: Challenge[] = [
      {
        id: "1",
        title: "10k Steps Daily",
        type: "steps",
        goal: 10000,
        stake: 0.25,
        duration: 7,
        status: "active",
        progress: 5400,
        participants: [
          { wallet: "8reB...8NKi", progress: 5400 },
          { wallet: "3xYp...9QwL", progress: 4100 },
        ],
      },
      {
        id: "2",
        title: "5 Mile Run",
        type: "running",
        goal: 5,
        stake: 0.5,
        duration: 14,
        status: "upcoming",
        progress: 0,
        participants: [],
      },
    ];

    const found = mockChallenges.find((c) => c.id === id);
    if (!found) return notFound();

    setChallenge(found);
  }, [id]);

  if (!challenge)
    return (
      <div className="text-center text-gray-400 mt-20">Loading challenge...</div>
    );

  const progressPercent = Math.min(
    100,
    (challenge.progress / challenge.goal) * 100
  ).toFixed(1);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-3xl mx-auto">
        {/* TITLE */}
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-indigo-500 bg-clip-text text-transparent">
          {challenge.title}
        </h1>

        <p className="text-gray-400 mt-2">
          Type: <span className="text-purple-400">{challenge.type}</span>
        </p>

        {/* STATUS BADGE */}
        <div className="mt-4">
          <span
            className={`px-4 py-1 rounded-full text-sm ${
              challenge.status === "active"
                ? "bg-green-600/20 text-green-400"
                : challenge.status === "upcoming"
                ? "bg-blue-600/20 text-blue-400"
                : "bg-gray-600/20 text-gray-300"
            }`}
          >
            {challenge.status.toUpperCase()}
          </span>
        </div>

        {/* CHALLENGE INFO GRID */}
        <div className="grid grid-cols-2 gap-6 mt-8">
          <div className="p-6 rounded-2xl bg-[#0a0a0a]/60 border border-purple-500/20 shadow-lg shadow-purple-900/30">
            <p className="text-gray-400 text-sm">Stake</p>
            <p className="text-2xl font-semibold">{challenge.stake} SOL</p>
          </div>
          <div className="p-6 rounded-2xl bg-[#0a0a0a]/60 border border-purple-500/20 shadow-lg shadow-purple-900/30">
            <p className="text-gray-400 text-sm">Duration</p>
            <p className="text-2xl font-semibold">{challenge.duration} days</p>
          </div>
        </div>

        {/* PROGRESS SECTION (only visible if active) */}
        {challenge.status === "active" && (
          <div className="mt-10">
            <h2 className="text-xl font-bold">Your Progress</h2>

            <p className="text-gray-400 text-sm mt-1">
              {challenge.progress} / {challenge.goal}
            </p>

            {/* BAR */}
            <div className="w-full mt-3 h-4 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="mt-2 text-purple-300 text-sm">
              {progressPercent}% Complete
            </p>
          </div>
        )}

        {/* PARTICIPANTS */}
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-4">Participants</h2>

          <div className="space-y-3">
            {challenge.participants.map((p, index) => {
              const pPercent = Math.min(
                100,
                (p.progress / challenge.goal) * 100
              );
              return (
                <div
                  key={index}
                  className="p-4 rounded-xl bg-[#0a0a0a]/60 border border-purple-500/20 shadow-md shadow-purple-900/20"
                >
                  <p className="text-purple-400 font-mono">{p.wallet}</p>
                  <div className="w-full h-3 bg-gray-800 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-purple-600"
                      style={{ width: `${pPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* BUTTONS */}
        <div className="flex flex-col gap-4 mt-12">
          {challenge.status === "upcoming" && (
            <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:opacity-90 transition shadow-md shadow-purple-600/40">
              Join Challenge
            </button>
          )}

          {challenge.status === "active" && (
            <button className="px-6 py-3 rounded-xl bg-purple-700/40 border border-purple-500/30 hover:bg-purple-700/60 transition">
              Submit Workout
            </button>
          )}

          <button className="px-6 py-3 rounded-xl bg-red-600/20 border border-red-600/30 hover:bg-red-600/30 transition">
            Leave Challenge
          </button>
        </div>
      </div>
    </div>
  );
}
