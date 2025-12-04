"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Redirect /challenges to /challenges/public
export default function ChallengesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/challenges/public");
  }, [router]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <p className="text-slate-400">Redirecting to challenges...</p>
      </div>
    </main>
  );
}
