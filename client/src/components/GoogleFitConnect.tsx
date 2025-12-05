"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useFitWagerStore } from "@/utils/store";

interface GoogleFitConnectProps {
  onConnected?: () => void;
  compact?: boolean;
}

export function GoogleFitConnect({ onConnected, compact = false }: GoogleFitConnectProps) {
  const { publicKey, connected } = useWallet();
  const { 
    googleFitStatus, 
    setGoogleFitStatus, 
    connectGoogleFit, 
    fetchFitnessData,
    fitnessData,
    addToast 
  } = useFitWagerStore();
  
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Check if Google Fit is connected on mount
  useEffect(() => {
    async function checkGoogleFitStatus() {
      if (!connected || !publicKey) {
        setGoogleFitStatus({ isConnected: false });
        setCheckingStatus(false);
        return;
      }

      try {
        // Try to fetch fitness data - if it works, Google Fit is connected
        const data = await fetchFitnessData(publicKey.toBase58());
        if (data) {
          setGoogleFitStatus({ isConnected: true, lastSync: data.lastUpdated });
          onConnected?.();
        }
      } catch (error) {
        setGoogleFitStatus({ isConnected: false });
      } finally {
        setCheckingStatus(false);
      }
    }

    checkGoogleFitStatus();
  }, [connected, publicKey, fetchFitnessData, setGoogleFitStatus, onConnected]);

  const handleConnect = async () => {
    if (!connected || !publicKey) {
      addToast("Please connect your wallet first", "warning");
      return;
    }

    setLoading(true);
    try {
      const authUrl = await connectGoogleFit(publicKey.toBase58());
      if (authUrl) {
        // Redirect to Google OAuth
        window.location.href = authUrl;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!connected || !publicKey) return;

    setLoading(true);
    try {
      const data = await fetchFitnessData(publicKey.toBase58());
      if (data) {
        setGoogleFitStatus({ 
          ...googleFitStatus, 
          isConnected: true, 
          lastSync: data.lastUpdated 
        });
        addToast("Fitness data synced!", "success");
      }
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className="flex items-center gap-2 text-gray-400">
        <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm">Checking Google Fit...</span>
      </div>
    );
  }

  if (compact) {
    return (
      <button
        onClick={googleFitStatus.isConnected ? handleSync : handleConnect}
        disabled={loading || !connected}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
          googleFitStatus.isConnected
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
            : "bg-red-500/20 text-red-400 border border-red-500/30"
        }`}
      >
        {loading ? (
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93s3.06-7.44 7-7.93v15.86zm2-15.86c1.03.13 2 .45 2.87.93H13v-.93zM13 7h5.24c.25.31.48.65.68 1H13V7zm0 3h6.74c.08.33.15.66.19 1H13v-1zm0 3h6.93c-.04.34-.11.67-.19 1H13v-1zm0 3h5.92c-.2.35-.43.69-.68 1H13v-1zm0 3h2.87c-.87.48-1.84.8-2.87.93V19z"/>
          </svg>
        )}
        {googleFitStatus.isConnected ? "Synced" : "Connect"}
      </button>
    );
  }

  return (
    <div className="mobile-card">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          googleFitStatus.isConnected ? "bg-emerald-500/20" : "bg-gray-700"
        }`}>
          <svg className={`w-6 h-6 ${googleFitStatus.isConnected ? "text-emerald-400" : "text-gray-400"}`} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93s3.06-7.44 7-7.93v15.86zm2-15.86c1.03.13 2 .45 2.87.93H13v-.93zM13 7h5.24c.25.31.48.65.68 1H13V7zm0 3h6.74c.08.33.15.66.19 1H13v-1zm0 3h6.93c-.04.34-.11.67-.19 1H13v-1zm0 3h5.92c-.2.35-.43.69-.68 1H13v-1zm0 3h2.87c-.87.48-1.84.8-2.87.93V19z"/>
          </svg>
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-white">Google Fit</h3>
          <p className="text-sm text-gray-400">
            {googleFitStatus.isConnected 
              ? `Connected • Last sync: ${new Date(googleFitStatus.lastSync || 0).toLocaleTimeString()}`
              : "Connect to track your fitness data"
            }
          </p>
        </div>

        <button
          onClick={googleFitStatus.isConnected ? handleSync : handleConnect}
          disabled={loading || !connected}
          className={`btn ${googleFitStatus.isConnected ? "btn-secondary" : "btn-primary"}`}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {googleFitStatus.isConnected ? "Syncing..." : "Connecting..."}
            </span>
          ) : (
            googleFitStatus.isConnected ? "Sync Data" : "Connect"
          )}
        </button>
      </div>

      {googleFitStatus.isConnected && fitnessData && (
        <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-white/10">
          <div className="text-center">
            <p className="text-lg font-bold text-violet-400">{(fitnessData.steps || 0).toLocaleString()}</p>
            <p className="text-xs text-gray-500">Steps</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-cyan-400">{((fitnessData.distance || 0) / 1000).toFixed(1)}km</p>
            <p className="text-xs text-gray-500">Distance</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-amber-400">{fitnessData.activeMinutes || 0}</p>
            <p className="text-xs text-gray-500">Active Min</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-red-400">{(fitnessData.calories || 0).toLocaleString()}</p>
            <p className="text-xs text-gray-500">Calories</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default GoogleFitConnect;

