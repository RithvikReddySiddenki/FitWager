"use client";

import { useState } from "react";

export default function CreateChallengePage() {
  const [title, setTitle] = useState("");
  const [entryFee, setEntryFee] = useState("");
  const [challengeType, setChallengeType] = useState("steps");
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Create a Challenge</h1>

      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="block mb-1 font-medium">Challenge Title</label>
          <input
            className="w-full border rounded p-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Example: 'Most Steps Today'"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block mb-1 font-medium">Description</label>
          <textarea
            className="w-full border rounded p-2"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your challenge..."
          />
        </div>

        {/* Entry Fee */}
        <div>
          <label className="block mb-1 font-medium">Entry Fee (SOL)</label>
          <input
            className="w-full border rounded p-2"
            type="number"
            value={entryFee}
            onChange={(e) => setEntryFee(e.target.value)}
            placeholder="0.05"
          />
        </div>

        {/* Type */}
        <div>
          <label className="block mb-1 font-medium">Challenge Type</label>
          <select
            className="w-full border rounded p-2"
            value={challengeType}
            onChange={(e) => setChallengeType(e.target.value)}
          >
            <option value="steps">Total Steps</option>
            <option value="run">Fastest 5K</option>
            <option value="training_load">Training Load</option>
          </select>
        </div>

        {/* Duration */}
        <div>
          <label className="block mb-1 font-medium">Duration (Hours)</label>
          <input
            className="w-full border rounded p-2"
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="24"
          />
        </div>

        {/* Submit */}
        <button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold p-3 rounded"
          onClick={() => alert("Feature coming soon!")}
        >
          Create Challenge
        </button>
      </div>
    </div>
  );
}
