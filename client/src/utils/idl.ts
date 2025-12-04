// FitWager Program IDL
// This is the Anchor IDL generated from the Rust smart contract

// Default program ID
const PROGRAM_ID = "Fg6PaFpoGXkYsidMpWxqSW1JmAxo9ZPVknpYAH97PvX1";

// IDL Type Definition
export interface FitWager {
  version: "0.1.0";
  name: "fitwager";
  address: string;
  metadata: {
    name: string;
    version: string;
  };
  instructions: Array<{
    name: string;
    accounts: Array<{
      name: string;
      isMut: boolean;
      isSigner: boolean;
    }>;
    args: Array<{
      name: string;
      type: string;
    }>;
  }>;
  accounts: Array<{
    name: string;
    type: {
      kind: string;
      fields: Array<{
        name: string;
        type: string | { defined: string };
      }>;
    };
  }>;
  types: Array<{
    name: string;
    type: {
      kind: string;
      variants?: Array<{ name: string }>;
    };
  }>;
  errors: Array<{
    code: number;
    name: string;
    msg: string;
  }>;
}

export const IDL: FitWager = {
  version: "0.1.0",
  name: "fitwager",
  address: PROGRAM_ID,
  metadata: {
    name: "fitwager",
    version: "0.1.0",
  },
  instructions: [
    {
      name: "createChallenge",
      accounts: [
        { name: "creator", isMut: true, isSigner: true },
        { name: "challenge", isMut: true, isSigner: false },
        { name: "escrowVault", isMut: true, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
        { name: "clock", isMut: false, isSigner: false },
      ],
      args: [
        { name: "entryFee", type: "u64" },
        { name: "durationSeconds", type: "i64" },
      ],
    },
    {
      name: "joinChallenge",
      accounts: [
        { name: "player", isMut: true, isSigner: true },
        { name: "challenge", isMut: true, isSigner: false },
        { name: "participant", isMut: true, isSigner: false },
        { name: "escrowVault", isMut: true, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
    {
      name: "submitScore",
      accounts: [
        { name: "challenge", isMut: false, isSigner: false },
        { name: "participant", isMut: true, isSigner: false },
      ],
      args: [{ name: "score", type: "u64" }],
    },
    {
      name: "endChallenge",
      accounts: [
        { name: "creator", isMut: false, isSigner: true },
        { name: "challenge", isMut: true, isSigner: false },
        { name: "escrowVault", isMut: true, isSigner: false },
        { name: "winner", isMut: true, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
        { name: "clock", isMut: false, isSigner: false },
      ],
      args: [{ name: "vaultBump", type: "u8" }],
    },
  ],
  accounts: [
    {
      name: "Challenge",
      type: {
        kind: "struct",
        fields: [
          { name: "creator", type: "publicKey" },
          { name: "entryFee", type: "u64" },
          { name: "totalPool", type: "u64" },
          { name: "startTime", type: "i64" },
          { name: "endTime", type: "i64" },
          { name: "status", type: { defined: "ChallengeStatus" } },
        ],
      },
    },
    {
      name: "Participant",
      type: {
        kind: "struct",
        fields: [
          { name: "player", type: "publicKey" },
          { name: "score", type: "u64" },
          { name: "hasJoined", type: "bool" },
        ],
      },
    },
  ],
  types: [
    {
      name: "ChallengeStatus",
      type: {
        kind: "enum",
        variants: [{ name: "Active" }, { name: "Ended" }],
      },
    },
  ],
  errors: [
    { code: 6000, name: "InvalidEntryFee", msg: "Entry fee must be > 0." },
    { code: 6001, name: "InvalidDuration", msg: "Duration must be > 0." },
    { code: 6002, name: "ChallengeClosed", msg: "Challenge is already closed." },
    { code: 6003, name: "ChallengeNotOver", msg: "Challenge is not over yet." },
    { code: 6004, name: "ChallengeEnded", msg: "Challenge has ended." },
    { code: 6005, name: "NotJoined", msg: "Player has not joined this challenge." },
  ],
};
