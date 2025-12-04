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

      const result = await anchorClient.createChallenge(wallet, {
        entryFeeSol: data.stake,
        durationDays: data.duration,
      });

      setLastTxSignature(result.signature);

      set({
        txModal: {
          isOpen: true,
          type: "success",
          title: "Challenge Created!",
          message: `Your challenge "${data.title}" has been created successfully.`,
          txSignature: result.signature,
        },
      });

      addToast("Challenge created successfully!", "success", 5000, result.signature);

      // Refresh challenges list from chain
      await fetchChallenges({ filter: "all" });

      return { success: true, challengeId: result.challengePda.toBase58() };
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

      addToast(displayMsg, "error");
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

      addToast(errorMsg, "error");
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

      addToast(errorMsg, "error");
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
      }
    } catch (error) {
      console.error("Error fetching challenges:", error);
      get().addToast("Failed to load challenges", "error");
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
      }
      return null;
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
}));
