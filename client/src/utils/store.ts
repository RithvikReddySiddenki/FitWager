import { create } from "zustand";
import { PublicKey } from "@solana/web3.js";
import { WalletContextState } from "@solana/wallet-adapter-react";
import * as anchorClient from "./anchorClient";
import { lamportsToSol } from "./solana";
import { shortenPublicKey } from "./pda";

// ============================================================
// Types
// ============================================================

export interface Challenge {
  id: string;
  publicKey: string;
  creator: string;
  title: string;
  description?: string;
  type?: string;
  goal?: number;
  entryFee: number;
  totalPool: number;
  startTime: number;
  endTime: number;
  status: "active" | "ended";
  participantCount: number;
  isPublic: boolean;
  timeRemaining?: string;
}

export interface Participant {
  wallet: string;
  participantPda: string;
  score: number;
  hasJoined: boolean;
  rank?: number;
}

export interface UserStats {
  wallet: string;
  totalChallengesCreated: number;
  totalChallengesJoined: number;
  totalWins: number;
  totalEarned: number;
  totalStaked: number;
  activeChallenges: number;
  completedChallenges: number;
  winRate: number;
  recentChallenges: Array<{
    id: string;
    title: string;
    status: "active" | "ended";
    role: "creator" | "participant";
    stake: number;
    score?: number;
  }>;
}

export interface GoogleFitStatus {
  isConnected: boolean;
  email?: string;
  lastSync?: number;
}

export interface FitnessData {
  steps: number;
  distance: number;
  calories: number;
  activeMinutes: number;
  lastUpdated: number;
}

export interface VerificationResult {
  score: number;
  meetsGoal: boolean;
  completionPercentage: number;
  verificationHash: string;
  verifiedAt: number;
}

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  duration?: number;
  txSignature?: string;
}

export interface TransactionState {
  isOpen: boolean;
  type: "success" | "error" | "pending";
  title: string;
  message: string;
  txSignature?: string;
}

export interface UserChallengeStatus {
  hasJoined: boolean;
  score: number;
  participantPda: string;
}

// ============================================================
// Store Interface
// ============================================================

interface FitWagerStore {
  // Public challenges (visible to all users)
  challenges: Challenge[];
  setChallenges: (challenges: Challenge[]) => void;
  
  // Current challenge being viewed (shared, but data is from chain)
  currentChallenge: Challenge | null;
  setCurrentChallenge: (challenge: Challenge | null) => void;
  
  // Participants for current challenge (fetched per-challenge)
  currentParticipants: Participant[];
  setCurrentParticipants: (participants: Participant[]) => void;

  // User's status in current challenge (wallet-specific)
  userChallengeStatus: UserChallengeStatus | null;
  setUserChallengeStatus: (status: UserChallengeStatus | null) => void;

  // User stats (wallet-specific, cleared on disconnect)
  userStats: UserStats | null;
  setUserStats: (stats: UserStats | null) => void;
  clearUserData: () => void;

  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  isRefreshing: boolean;
  setIsRefreshing: (refreshing: boolean) => void;

  // Toasts (UI only, not user-specific data)
  toasts: Toast[];
  addToast: (
    message: string,
    type: "success" | "error" | "info" | "warning",
    duration?: number,
    txSignature?: string
  ) => string;
  removeToast: (id: string) => void;

  // Transaction modal state
  txModal: TransactionState;
  openTxModal: (state: Omit<TransactionState, "isOpen">) => void;
  closeTxModal: () => void;

  // Transaction state
  txInProgress: boolean;
  setTxInProgress: (inProgress: boolean) => void;
  lastTxSignature: string | null;
  setLastTxSignature: (signature: string | null) => void;

  // ============================================================
  // Actions (all fetch fresh data from chain/API)
  // ============================================================

  createChallenge: (
    wallet: WalletContextState,
    data: {
      title: string;
      type: string;
      goal: number;
      stake: number;
      duration: number;
      isPublic: boolean;
    }
  ) => Promise<{ success: boolean; challengeId?: string; error?: string }>;

  joinChallenge: (
    wallet: WalletContextState,
    challengePda: string
  ) => Promise<{ success: boolean; error?: string }>;

  submitScore: (
    wallet: WalletContextState,
    challengePda: string,
    score: number
  ) => Promise<{ success: boolean; error?: string }>;

  endChallenge: (
    wallet: WalletContextState,
    challengePda: string,
    winnerPubkey: string
  ) => Promise<{ success: boolean; error?: string }>;

  // Fetch functions - always get fresh data
  fetchChallenges: (options?: {
    filter?: "active" | "ended" | "all";
    isPublic?: boolean;
    creator?: string;
    participant?: string;
  }) => Promise<void>;
  
  fetchChallengeDetails: (challengeId: string, wallet?: string) => Promise<Challenge | null>;
  
  fetchParticipants: (challengeId: string) => Promise<Participant[]>;
  
  fetchUserChallengeStatus: (challengeId: string, wallet: string) => Promise<UserChallengeStatus | null>;
  
  fetchUserStats: (wallet: string) => Promise<void>;

  // Refresh current data
  refreshCurrentChallenge: (wallet?: string) => Promise<void>;

  // Google Fit integration
  googleFitStatus: GoogleFitStatus;
  setGoogleFitStatus: (status: GoogleFitStatus) => void;
  fitnessData: FitnessData | null;
  setFitnessData: (data: FitnessData | null) => void;
  verificationResult: VerificationResult | null;
  setVerificationResult: (result: VerificationResult | null) => void;

  // Google Fit actions
  connectGoogleFit: (wallet: string) => Promise<string | null>;
  fetchFitnessData: (wallet: string, startTime?: number, endTime?: number) => Promise<FitnessData | null>;
  verifyChallenge: (wallet: string, challengeId: string) => Promise<VerificationResult | null>;
  submitVerifiedScore: (
    wallet: WalletContextState,
    challengeId: string,
    verificationResult: VerificationResult
  ) => Promise<{ success: boolean; error?: string }>;
}

// ============================================================
// Store Implementation
// ============================================================

export const useFitWagerStore = create<FitWagerStore>((set, get) => ({
  // Public challenges
  challenges: [],
  setChallenges: (challenges) => set({ challenges }),

  // Current challenge
  currentChallenge: null,
  setCurrentChallenge: (challenge) => set({ currentChallenge: challenge }),

  // Participants
  currentParticipants: [],
  setCurrentParticipants: (participants) => set({ currentParticipants: participants }),

  // User challenge status
  userChallengeStatus: null,
  setUserChallengeStatus: (status) => set({ userChallengeStatus: status }),

  // User stats
  userStats: null,
  setUserStats: (stats) => set({ userStats: stats }),
  
  // Clear user-specific data (call on wallet disconnect)
  clearUserData: () => set({
    userStats: null,
    userChallengeStatus: null,
  }),

  // Loading
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  isRefreshing: false,
  setIsRefreshing: (refreshing) => set({ isRefreshing: refreshing }),

  // Toasts
  toasts: [],
  addToast: (message, type, duration = 5000, txSignature) => {
    const id = Math.random().toString(36).substr(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, duration, txSignature }],
    }));

    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }

    return id;
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  // Transaction modal
  txModal: {
    isOpen: false,
    type: "pending",
    title: "",
    message: "",
  },
  openTxModal: (state) => set({ txModal: { ...state, isOpen: true } }),
  closeTxModal: () =>
    set((state) => ({ txModal: { ...state.txModal, isOpen: false } })),

  // Transaction
  txInProgress: false,
  setTxInProgress: (inProgress) => set({ txInProgress: inProgress }),
  lastTxSignature: null,
  setLastTxSignature: (signature) => set({ lastTxSignature: signature }),

  // ============================================================
  // Actions
  // ============================================================

  createChallenge: async (wallet, data) => {
    const { addToast, openTxModal, setLastTxSignature, fetchChallenges } = get();
    set({ txInProgress: true });

    openTxModal({
      type: "pending",
      title: "Creating Challenge",
      message: "Please confirm the transaction in your wallet...",
    });

    try {
      if (!wallet.publicKey) {
        throw new Error("Wallet not connected");
      }

      // Validate wallet has signing capabilities
      if (!wallet.signTransaction || !wallet.signAllTransactions) {
        console.error("Wallet signing methods missing:", {
          hasSignTransaction: !!wallet.signTransaction,
          hasSignAllTransactions: !!wallet.signAllTransactions,
        });
        throw new Error("Wallet adapter not properly initialized - missing signing methods");
      }

      console.log("Starting challenge creation with wallet:", {
        publicKey: wallet.publicKey.toBase58(),
        connected: wallet.connected,
      });

      const result = await anchorClient.createChallenge(wallet, {
        entryFeeSol: data.stake,
        durationDays: data.duration,
        challengeType: data.type,
        goal: data.goal,
        isPublic: data.isPublic,
      });

      console.log("Challenge creation succeeded:", {
        signature: result.signature,
        challengePda: result.challengePda.toBase58(),
      });

      setLastTxSignature(result.signature);

      set({
        txModal: {
          isOpen: true,
          type: "success",
          title: "Successfully Created Challenge",
          message: `Your challenge "${data.title}" has been created successfully. You will be redirected to the challenge page.`,
          txSignature: result.signature,
        },
      });

      addToast("✓ Successfully created challenge", "success", 6000, result.signature);

      // Auto-close success modal after 3 seconds to allow redirect
      setTimeout(() => {
        set((state) => ({ txModal: { ...state.txModal, isOpen: false } }));
      }, 3000);

      // Refresh challenges list in background (don't wait for it)
      fetchChallenges({ filter: "all" }).catch(console.error);

      return { success: true, challengeId: result.challengePda.toBase58() };
    } catch (error) {
      const errorMsg = anchorClient.formatAnchorError(error);
      
      // Skip showing "not found" errors - they're expected when challenges don't exist
      if (!errorMsg.includes("not found")) {
        set({
          txModal: {
            isOpen: true,
            type: "error",
            title: "Transaction Failed",
            message: errorMsg,
          },
        });
        addToast(errorMsg, "error", 3000);
      }
      return { success: false, error: errorMsg };
    } finally {
      set({ txInProgress: false });
    }
  },

  joinChallenge: async (wallet, challengePda) => {
    const { addToast, openTxModal, setLastTxSignature, refreshCurrentChallenge, currentChallenge } = get();
    set({ txInProgress: true });

    openTxModal({
      type: "pending",
      title: "Joining Challenge",
      message: "Please confirm the transaction in your wallet...",
    });

    try {
      if (!wallet.publicKey) {
        throw new Error("Wallet not connected");
      }

      // Check if user already joined before sending transaction
      const statusCheck = await get().fetchUserChallengeStatus(challengePda, wallet.publicKey.toBase58());
      if (statusCheck?.hasJoined) {
        throw new Error("You have already joined this challenge");
      }

      const result = await anchorClient.joinChallenge(
        wallet,
        new PublicKey(challengePda)
      );

      setLastTxSignature(result.signature);

      set({
        txModal: {
          isOpen: true,
          type: "success",
          title: "Challenge Joined!",
          message: `You've successfully joined the challenge and staked ${currentChallenge?.entryFee || 0} SOL.`,
          txSignature: result.signature,
        },
      });

      addToast("Successfully joined challenge!", "success", 5000, result.signature);

      // Refresh challenge data from chain
      await refreshCurrentChallenge(wallet.publicKey.toBase58());

      return { success: true };
    } catch (error) {
      const errorMsg = anchorClient.formatAnchorError(error);
      
      // Handle specific errors
      let displayMsg = errorMsg;
      if (errorMsg.includes("already")) {
        displayMsg = "You have already joined this challenge";
      }
      
      set({
        txModal: {
          isOpen: true,
          type: "error",
          title: "Transaction Failed",
          message: displayMsg,
        },
      });

      addToast(displayMsg, "error", 8000);
      return { success: false, error: displayMsg };
    } finally {
      set({ txInProgress: false });
    }
  },

  submitScore: async (wallet, challengePda, score) => {
    const { addToast, openTxModal, setLastTxSignature, refreshCurrentChallenge, currentChallenge } = get();
    set({ txInProgress: true });

    openTxModal({
      type: "pending",
      title: "Submitting Score",
      message: "Please confirm the transaction in your wallet...",
    });

    try {
      if (!wallet.publicKey) {
        throw new Error("Wallet not connected");
      }

      // Verify challenge is still active
      if (currentChallenge?.status === "ended") {
        throw new Error("This challenge has already ended");
      }

      // Check if challenge end time has passed
      const now = Math.floor(Date.now() / 1000);
      if (currentChallenge && currentChallenge.endTime < now) {
        throw new Error("Challenge time has expired");
      }

      const result = await anchorClient.submitScore(
        wallet,
        new PublicKey(challengePda),
        score
      );

      setLastTxSignature(result.signature);

      set({
        txModal: {
          isOpen: true,
          type: "success",
          title: "Score Submitted!",
          message: `Your score of ${score.toLocaleString()} has been recorded.`,
          txSignature: result.signature,
        },
      });

      addToast("Score submitted successfully!", "success", 5000, result.signature);

      // Refresh challenge and participant data
      await refreshCurrentChallenge(wallet.publicKey.toBase58());

      return { success: true };
    } catch (error) {
      const errorMsg = anchorClient.formatAnchorError(error);
      
      set({
        txModal: {
          isOpen: true,
          type: "error",
          title: "Transaction Failed",
          message: errorMsg,
        },
      });

      addToast(errorMsg, "error", 8000);
      return { success: false, error: errorMsg };
    } finally {
      set({ txInProgress: false });
    }
  },

  endChallenge: async (wallet, challengePda, winnerPubkey) => {
    const { addToast, openTxModal, setLastTxSignature, refreshCurrentChallenge, currentChallenge } = get();
    set({ txInProgress: true });

    openTxModal({
      type: "pending",
      title: "Ending Challenge",
      message: "Please confirm the transaction in your wallet...",
    });

    try {
      if (!wallet.publicKey) {
        throw new Error("Wallet not connected");
      }

      // Verify caller is creator
      if (currentChallenge && currentChallenge.creator !== wallet.publicKey.toBase58()) {
        throw new Error("Only the creator can end the challenge");
      }

      // Verify challenge hasn't ended
      if (currentChallenge?.status === "ended") {
        throw new Error("Challenge has already ended");
      }

      const result = await anchorClient.endChallenge(
        wallet,
        new PublicKey(challengePda),
        new PublicKey(winnerPubkey)
      );

      setLastTxSignature(result.signature);

      set({
        txModal: {
          isOpen: true,
          type: "success",
          title: "Challenge Ended!",
          message: `Winner: ${shortenPublicKey(winnerPubkey)} receives ${lamportsToSol(result.payout).toFixed(4)} SOL`,
          txSignature: result.signature,
        },
      });

      addToast("Challenge ended successfully!", "success", 5000, result.signature);

      // Refresh data
      await refreshCurrentChallenge(wallet.publicKey.toBase58());

      return { success: true };
    } catch (error) {
      const errorMsg = anchorClient.formatAnchorError(error);
      
      set({
        txModal: {
          isOpen: true,
          type: "error",
          title: "Transaction Failed",
          message: errorMsg,
        },
      });

      addToast(errorMsg, "error", 8000);
      return { success: false, error: errorMsg };
    } finally {
      set({ txInProgress: false });
    }
  },

  // ============================================================
  // Fetch Functions - Always get fresh data from API/chain
  // ============================================================

  fetchChallenges: async (options = {}) => {
    set({ isLoading: true });
    try {
      const params = new URLSearchParams();
      if (options.filter) params.set("filter", options.filter);
      if (options.isPublic) params.set("public", "true");
      if (options.creator) params.set("creator", options.creator);
      if (options.participant) params.set("participant", options.participant);

      const response = await fetch(`/api/challenges/list?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        set({ challenges: data.challenges || [] });
      } else {
        console.error("Failed to fetch challenges:", response.statusText);
        set({ challenges: [] });
      }
    } catch (error) {
      console.error("Error fetching challenges:", error);
      set({ challenges: [] });
      // Only show toast if it's a critical error, not for empty lists
    } finally {
      set({ isLoading: false });
    }
  },

  fetchChallengeDetails: async (challengeId, wallet) => {
    try {
      const response = await fetch("/api/challenges/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, wallet }),
      });

      if (response.ok) {
        const data = await response.json();
        set({ currentChallenge: data.challenge });
        
        if (data.userStatus) {
          set({ userChallengeStatus: data.userStatus });
        }
        
        return data.challenge;
      } else if (response.status === 404) {
        // Challenge not found - don't show error, just return null
        return null;
      } else {
        console.error("Error fetching challenge details:", response.statusText);
        return null;
      }
    } catch (error) {
      console.error("Error fetching challenge details:", error);
      return null;
    }
  },

  fetchParticipants: async (challengeId) => {
    try {
      const response = await fetch(`/api/challenges/participants?challengeId=${challengeId}`);
      if (response.ok) {
        const data = await response.json();
        set({ currentParticipants: data.participants || [] });
        return data.participants || [];
      }
      return [];
    } catch (error) {
      console.error("Error fetching participants:", error);
      return [];
    }
  },

  fetchUserChallengeStatus: async (challengeId, wallet) => {
    try {
      const response = await fetch("/api/challenges/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, wallet }),
      });

      if (response.ok) {
        const data = await response.json();
        const status: UserChallengeStatus = {
          hasJoined: data.hasJoined,
          score: data.score,
          participantPda: data.participantPda,
        };
        set({ userChallengeStatus: status });
        return status;
      }
      return null;
    } catch (error) {
      console.error("Error fetching user challenge status:", error);
      return null;
    }
  },

  fetchUserStats: async (wallet) => {
    try {
      const response = await fetch(`/api/user/stats?wallet=${wallet}`);
      if (response.ok) {
        const data = await response.json();
        set({ userStats: data.stats });
      }
    } catch (error) {
      console.error("Error fetching user stats:", error);
    }
  },

  refreshCurrentChallenge: async (wallet) => {
    const { currentChallenge, fetchChallengeDetails, fetchParticipants, fetchUserChallengeStatus } = get();
    
    if (!currentChallenge) return;
    
    set({ isRefreshing: true });
    
    try {
      // Fetch fresh data in parallel
      await Promise.all([
        fetchChallengeDetails(currentChallenge.id, wallet),
        fetchParticipants(currentChallenge.id),
        wallet ? fetchUserChallengeStatus(currentChallenge.id, wallet) : Promise.resolve(),
      ]);
    } finally {
      set({ isRefreshing: false });
    }
  },

  // ============================================================
  // Google Fit Integration
  // ============================================================

  googleFitStatus: { isConnected: false },
  setGoogleFitStatus: (status) => set({ googleFitStatus: status }),
  
  fitnessData: null,
  setFitnessData: (data) => set({ fitnessData: data }),
  
  verificationResult: null,
  setVerificationResult: (result) => set({ verificationResult: result }),

  connectGoogleFit: async (wallet) => {
    try {
      const response = await fetch(`/api/google/auth?wallet=${wallet}`);
      if (response.ok) {
        const data = await response.json();
        return data.authUrl;
      }
      get().addToast("Failed to start Google authentication", "error");
      return null;
    } catch (error) {
      console.error("Google auth error:", error);
      get().addToast("Failed to connect to Google", "error");
      return null;
    }
  },

  fetchFitnessData: async (wallet, startTime, endTime) => {
    try {
      const params = new URLSearchParams({ wallet });
      if (startTime) params.set("startTime", startTime.toString());
      if (endTime) params.set("endTime", endTime.toString());
      
      const response = await fetch(`/api/google/fitnessData?${params.toString()}`);
      
      if (response.ok) {
        const result = await response.json();
        const fitnessData: FitnessData = {
          steps: result.data.steps || 0,
          distance: result.data.distance || 0,
          calories: result.data.calories || 0,
          activeMinutes: result.data.activeMinutes || 0,
          lastUpdated: result.lastSynced,
        };
        set({ fitnessData });
        return fitnessData;
      } else {
        const errorData = await response.json();
        if (errorData.needsAuth) {
          set({ googleFitStatus: { isConnected: false } });
          get().addToast("Please connect Google Fit to continue", "warning");
        }
        return null;
      }
    } catch (error) {
      console.error("Fitness data error:", error);
      return null;
    }
  },

  verifyChallenge: async (wallet, challengeId) => {
    const { addToast } = get();
    
    try {
      const response = await fetch("/api/google/verifyChallenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet, challengeId }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const result: VerificationResult = {
          score: data.verification.calculatedScore,
          meetsGoal: data.verification.meetsGoal,
          completionPercentage: Math.min(100, (data.verification.calculatedScore / (data.verification.goal || 1)) * 100),
          verificationHash: data.verification.verificationHash,
          verifiedAt: data.verification.verifiedAt,
        };
        set({ verificationResult: result });
        addToast("Fitness data verified successfully!", "success");
        return result;
      } else {
        const errorData = await response.json();
        addToast(errorData.error || "Verification failed", "error");
        return null;
      }
    } catch (error) {
      console.error("Verification error:", error);
      addToast("Failed to verify fitness data", "error");
      return null;
    }
  },

  submitVerifiedScore: async (wallet, challengeId, verificationResult) => {
    const { addToast, openTxModal, setLastTxSignature, refreshCurrentChallenge } = get();
    set({ txInProgress: true });

    openTxModal({
      type: "pending",
      title: "Submitting Verified Score",
      message: "Please confirm the transaction in your wallet...",
    });

    try {
      if (!wallet.publicKey) {
        throw new Error("Wallet not connected");
      }

      // Convert verification hash to bytes
      const hashBytes: number[] = [];
      for (let i = 0; i < verificationResult.verificationHash.length; i += 2) {
        hashBytes.push(parseInt(verificationResult.verificationHash.slice(i, i + 2), 16));
      }

      const result = await anchorClient.submitScore(
        wallet,
        new PublicKey(challengeId),
        verificationResult.score
      );

      setLastTxSignature(result.signature);

      set({
        txModal: {
          isOpen: true,
          type: "success",
          title: "Score Submitted!",
          message: `Your verified score of ${verificationResult.score.toLocaleString()} has been recorded on-chain.`,
          txSignature: result.signature,
        },
      });

      addToast("Verified score submitted!", "success", 5000, result.signature);
      await refreshCurrentChallenge(wallet.publicKey.toBase58());

      return { success: true };
    } catch (error) {
      const errorMsg = anchorClient.formatAnchorError(error);
      
      set({
        txModal: {
          isOpen: true,
          type: "error",
          title: "Transaction Failed",
          message: errorMsg,
        },
      });

      addToast(errorMsg, "error");
      return { success: false, error: errorMsg };
    } finally {
      set({ txInProgress: false });
    }
  },
}));
