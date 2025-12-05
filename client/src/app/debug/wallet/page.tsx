"use client";

import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useState } from "react";
import { Connection, LAMPORTS_PER_SOL, Transaction, SystemProgram, PublicKey } from "@solana/web3.js";

export default function WalletDebugPage() {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [testSignStatus, setTestSignStatus] = useState<string>("");

  const handleGetBalance = async () => {
    if (!wallet.publicKey) {
      alert("Wallet not connected");
      return;
    }

    setLoadingBalance(true);
    try {
      const conn = new Connection("https://api.devnet.solana.com", "confirmed");
      const lamports = await conn.getBalance(wallet.publicKey);
      setBalance(lamports / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error("Error fetching balance:", error);
      alert("Error fetching balance: " + String(error));
    } finally {
      setLoadingBalance(false);
    }
  };

  const handleTestWalletSign = async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      alert("Wallet not properly connected");
      return;
    }

    setTestSignStatus("Testing wallet signing...");
    try {
      const conn = new Connection("https://api.devnet.solana.com", "confirmed");
      const recentBlockhash = await conn.getLatestBlockhash();
      
      // Create a simple test transaction
      const tx = new Transaction({
        recentBlockhash: recentBlockhash.blockhash,
        feePayer: wallet.publicKey,
      });

      tx.add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: wallet.publicKey, // Send to self
          lamports: 0, // Zero amount, just testing signing
        })
      );

      setTestSignStatus("Requesting wallet signature...");
      console.log("About to call wallet.signTransaction()");
      
      const signed = await wallet.signTransaction(tx);
      
      setTestSignStatus("✓ Wallet signed successfully!");
      console.log("Signature successful");
    } catch (error) {
      console.error("Wallet signing failed:", error);
      setTestSignStatus("✗ Signing failed: " + String(error));
    }
  };

  return (
    <main className="page-container bg-[#0f0f13]">
      <div className="px-4 max-w-2xl mx-auto py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Wallet Debug</h1>

        <div className="space-y-6">
          {/* Connection Info */}
          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4">Connection Info</h2>
            <div className="space-y-2 font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Connected:</span>
                <span className={wallet.connected ? "text-green-400" : "text-red-400"}>
                  {wallet.connected ? "YES" : "NO"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Public Key:</span>
                <span className="text-white truncate">
                  {wallet.publicKey?.toBase58() || "Not connected"}
                </span>
              </div>
            </div>
          </div>

          {/* Wallet Adapter Methods */}
          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4">Wallet Adapter Methods</h2>
            <div className="space-y-2 font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">signTransaction:</span>
                <span className={wallet.signTransaction ? "text-green-400" : "text-red-400"}>
                  {wallet.signTransaction ? "✓ Present" : "✗ Missing"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">signAllTransactions:</span>
                <span className={wallet.signAllTransactions ? "text-green-400" : "text-red-400"}>
                  {wallet.signAllTransactions ? "✓ Present" : "✗ Missing"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">signMessage:</span>
                <span className={wallet.signMessage ? "text-green-400" : "text-red-400"}>
                  {wallet.signMessage ? "✓ Present" : "✗ Missing"}
                </span>
              </div>
            </div>
          </div>

          {/* Balance Check */}
          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4">Balance Check</h2>
            {balance !== null && (
              <div className="mb-4 p-3 rounded-lg bg-green-500/20 border border-green-500/50">
                <p className="text-green-400">Balance: ◎{balance.toFixed(4)}</p>
              </div>
            )}
            <button
              onClick={handleGetBalance}
              disabled={loadingBalance}
              className="btn btn-primary"
            >
              {loadingBalance ? "Loading..." : "Check Balance"}
            </button>
          </div>

          {/* Test Wallet Signing */}
          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4">Test Wallet Signing</h2>
            {testSignStatus && (
              <div className={`mb-4 p-3 rounded-lg ${
                testSignStatus.includes("✓") ? "bg-green-500/20 border border-green-500/50" :
                testSignStatus.includes("✗") ? "bg-red-500/20 border border-red-500/50" :
                "bg-blue-500/20 border border-blue-500/50"
              }`}>
                <p className={
                  testSignStatus.includes("✓") ? "text-green-400" :
                  testSignStatus.includes("✗") ? "text-red-400" :
                  "text-blue-400"
                }>{testSignStatus}</p>
              </div>
            )}
            <button
              onClick={handleTestWalletSign}
              className="btn btn-primary"
            >
              Test Wallet Signing
            </button>
            <p className="text-xs text-gray-500 mt-3">
              This will prompt your wallet to sign a test transaction. Check if the popup appears.
            </p>
          </div>

          {/* Wallet Disconnect Check */}
          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4">Status</h2>
            {wallet.connected && wallet.publicKey ? (
              <div className="text-green-400">
                <p>✓ Wallet is properly connected and ready to sign</p>
                <p className="text-sm text-gray-400 mt-2">
                  You should be able to create challenges now.
                </p>
              </div>
            ) : (
              <div className="text-red-400">
                <p>✗ Wallet is not connected</p>
                <p className="text-sm text-gray-400 mt-2">
                  Please connect your wallet first.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
