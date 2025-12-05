/**
 * Circle API Client for USDC Payments
 * 
 * Handles USDC deposits and payouts through Circle's API.
 * Note: For hackathon/devnet, this uses sandbox mode.
 */

// Circle API configuration
const CIRCLE_API_KEY = process.env.CIRCLE_API_KEY;
const CIRCLE_API_URL = process.env.CIRCLE_API_URL || 'https://api-sandbox.circle.com';

// USDC token addresses
export const USDC_ADDRESSES = {
  devnet: 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr', // Devnet USDC
  mainnet: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // Mainnet USDC
};

interface CircleResponse<T> {
  data: T;
}

interface CircleWallet {
  walletId: string;
  entityId: string;
  type: string;
  description: string;
  balances: Array<{
    amount: string;
    currency: string;
  }>;
}

interface CircleTransfer {
  id: string;
  source: {
    type: string;
    id: string;
  };
  destination: {
    type: string;
    address: string;
    chain: string;
  };
  amount: {
    amount: string;
    currency: string;
  };
  status: string;
  createDate: string;
}

interface CircleDepositAddress {
  address: string;
  addressTag?: string;
  currency: string;
  chain: string;
}

/**
 * Make authenticated request to Circle API
 */
async function circleRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (!CIRCLE_API_KEY) {
    throw new Error('Circle API key not configured');
  }
  
  const response = await fetch(`${CIRCLE_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${CIRCLE_API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Circle API error: ${response.status} - ${error}`);
  }
  
  const data = await response.json();
  return data.data as T;
}

/**
 * Create a Circle wallet for a user
 */
export async function createWallet(
  description: string,
  idempotencyKey: string
): Promise<CircleWallet> {
  return circleRequest<CircleWallet>('/v1/wallets', {
    method: 'POST',
    body: JSON.stringify({
      idempotencyKey,
      description,
    }),
  });
}

/**
 * Get wallet details
 */
export async function getWallet(walletId: string): Promise<CircleWallet> {
  return circleRequest<CircleWallet>(`/v1/wallets/${walletId}`);
}

/**
 * Generate deposit address for a wallet
 */
export async function generateDepositAddress(
  walletId: string,
  idempotencyKey: string,
  chain: string = 'SOL'
): Promise<CircleDepositAddress> {
  return circleRequest<CircleDepositAddress>(
    `/v1/wallets/${walletId}/addresses`,
    {
      method: 'POST',
      body: JSON.stringify({
        idempotencyKey,
        currency: 'USD',
        chain,
      }),
    }
  );
}

/**
 * Create a transfer (payout)
 */
export async function createTransfer(
  sourceWalletId: string,
  destinationAddress: string,
  amount: string,
  idempotencyKey: string,
  chain: string = 'SOL'
): Promise<CircleTransfer> {
  return circleRequest<CircleTransfer>('/v1/transfers', {
    method: 'POST',
    body: JSON.stringify({
      idempotencyKey,
      source: {
        type: 'wallet',
        id: sourceWalletId,
      },
      destination: {
        type: 'blockchain',
        address: destinationAddress,
        chain,
      },
      amount: {
        amount,
        currency: 'USD',
      },
    }),
  });
}

/**
 * Get transfer status
 */
export async function getTransfer(transferId: string): Promise<CircleTransfer> {
  return circleRequest<CircleTransfer>(`/v1/transfers/${transferId}`);
}

/**
 * List transfers for a wallet
 */
export async function listTransfers(
  walletId?: string,
  pageSize: number = 50
): Promise<CircleTransfer[]> {
  let endpoint = `/v1/transfers?pageSize=${pageSize}`;
  if (walletId) {
    endpoint += `&walletId=${walletId}`;
  }
  return circleRequest<CircleTransfer[]>(endpoint);
}

// ============================================================
// SIMPLIFIED FUNCTIONS FOR FITWAGER
// ============================================================

/**
 * Check if Circle integration is available
 */
export function isCircleAvailable(): boolean {
  return !!CIRCLE_API_KEY;
}

/**
 * Process USDC entry fee for a challenge
 * In production, this would create a deposit flow through Circle
 */
export async function processUsdcDeposit(
  userWallet: string,
  challengeId: string,
  amount: number
): Promise<{
  success: boolean;
  depositAddress?: string;
  error?: string;
}> {
  if (!isCircleAvailable()) {
    // Fallback: Use direct SPL token transfer
    return {
      success: true,
      depositAddress: undefined, // User will transfer directly on-chain
    };
  }
  
  try {
    // For sandbox/hackathon, we can simulate the flow
    // In production, this would:
    // 1. Create a Circle wallet if needed
    // 2. Generate a deposit address
    // 3. Monitor for deposits
    // 4. Execute on-chain actions when deposit confirmed
    
    const idempotencyKey = `deposit_${challengeId}_${userWallet}_${Date.now()}`;
    
    // For MVP, return success and let frontend handle SPL transfer
    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Deposit processing failed',
    };
  }
}

/**
 * Process USDC payout for challenge winner
 */
export async function processUsdcPayout(
  winnerWallet: string,
  challengeId: string,
  amount: number
): Promise<{
  success: boolean;
  transferId?: string;
  error?: string;
}> {
  if (!isCircleAvailable()) {
    // Fallback: Payout will be handled on-chain
    return {
      success: true,
    };
  }
  
  try {
    // For sandbox, simulate successful payout
    // In production, this would execute the actual transfer
    return {
      success: true,
      transferId: `sim_${challengeId}_${Date.now()}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payout processing failed',
    };
  }
}

/**
 * Convert USDC amount to smallest unit (6 decimals)
 */
export function usdcToMicroUnits(amount: number): number {
  return Math.round(amount * 1_000_000);
}

/**
 * Convert USDC micro units to readable amount
 */
export function microUnitsToUsdc(microUnits: number): number {
  return microUnits / 1_000_000;
}

/**
 * Format USDC amount for display
 */
export function formatUsdc(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

