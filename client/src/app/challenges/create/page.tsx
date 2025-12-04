"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

const CHALLENGE_TYPES = [
  { value: "steps", label: "Steps" },
  { value: "distance", label: "Distance" },
  { value: "time", label: "Workout Time" },
];

const DURATIONS = [
  { value: 7, label: "7 Days" },
  { value: 14, label: "14 Days" },
  { value: 30, label: "30 Days" },
];

export default function CreateChallengePage() {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("steps");
  const [goal, setGoal] = useState("");
  const [stake, setStake] = useState("");
  const [duration, setDuration] = useState(7);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    // TODO: plug in your Anchor / API call here
    console.log("Create challenge", { title, type, goal, stake, duration });
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-black text-slate-100">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <header className="text-center space-y-3 mb-8">
          <p className="text-xs font-medium tracking-[0.35em] text-purple-300/80 uppercase">
            New challenge
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold">
            Set goals, stake SOL, and compete with friends.
          </h1>
          <p className="text-sm text-slate-400">
            Define your challenge parameters below. You can invite friends after
            you create it.
          </p>
        </header>

        {/* Card */}
        <div className="rounded-3xl bg-slate-900/70 border border-purple-500/30 shadow-[0_0_35px_rgba(168,85,247,0.35)] p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-1.5">
              <label
                htmlFor="title"
                className="block text-sm font-medium text-slate-200"
              >
                Challenge Title
              </label>
              <input
                id="title"
                type="text"
                placeholder="Example: 10k Steps a Day"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-2xl bg-slate-950/70 border border-slate-700/70 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 placeholder:text-slate-500"
              />
            </div>

            {/* Type & Duration row */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Type */}
              <div className="space-y-1.5">
                <label
                  htmlFor="type"
                  className="block text-sm font-medium text-slate-200"
                >
                  Challenge Type
                </label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full rounded-2xl bg-slate-950/70 border border-slate-700/70 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  {CHALLENGE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Duration */}
              <div className="space-y-1.5">
                <label
                  htmlFor="duration"
                  className="block text-sm font-medium text-slate-200"
                >
                  Duration (days)
                </label>
                <select
                  id="duration"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full rounded-2xl bg-slate-950/70 border border-slate-700/70 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  {DURATIONS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Goal & Stake row */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Goal */}
              <div className="space-y-1.5">
                <label
                  htmlFor="goal"
                  className="block text-sm font-medium text-slate-200"
                >
                  Goal
                </label>
                <input
                  id="goal"
                  type="number"
                  min={0}
                  placeholder="Ex: 10000"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full rounded-2xl bg-slate-950/70 border border-slate-700/70 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 placeholder:text-slate-500"
                />
                <p className="text-xs text-slate-500">
                  For steps, this is the number of steps per day, etc.
                </p>
              </div>

              {/* Stake */}
              <div className="space-y-1.5">
                <label
                  htmlFor="stake"
                  className="block text-sm font-medium text-slate-200"
                >
                  Stake (SOL)
                </label>
                <input
                  id="stake"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="Ex: 0.25"
                  value={stake}
                  onChange={(e) => setStake(e.target.value)}
                  className="w-full rounded-2xl bg-slate-950/70 border border-slate-700/70 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 placeholder:text-slate-500"
                />
                <p className="text-xs text-slate-500">
                  This amount will be locked in escrow for the duration of the
                  challenge.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
              <Link
                href="/dashboard"
                className="text-xs text-slate-400 hover:text-slate-200 underline underline-offset-4"
              >
                ← Back to dashboard
              </Link>

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-purple-500/90 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_0_25px_rgba(168,85,247,0.7)] hover:bg-purple-400 transition disabled:opacity-60"
                disabled={!title || !goal || !stake}
              >
                Create Challenge
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
