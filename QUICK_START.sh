#!/bin/bash

# FitWager Quick Start - Copy & Paste Commands

echo "🎯 FitWager Quick Start Guide"
echo "=============================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Start the development server${NC}"
echo "cd /home/danielg/FitWager/FitWager/FitWager/client && npm run dev"
echo ""

echo -e "${BLUE}Step 2: Get Test SOL (choose one)${NC}"
echo ""
echo "Option A - Using Solana CLI:"
echo "  solana airdrop 2 <YOUR_WALLET_ADDRESS> --url https://api.devnet.solana.com"
echo ""
echo "Option B - Using Faucet:"
echo "  1. Visit: https://faucet.solana.com/"
echo "  2. Paste your wallet address from the app"
echo "  3. Request 2 SOL"
echo ""

echo -e "${BLUE}Step 3: Access the app${NC}"
echo "http://localhost:3000"
echo ""

echo -e "${BLUE}Step 4: Testing with multiple users${NC}"
echo ""
echo "Browser 1 (User 1):"
echo "  - Chrome: http://localhost:3000"
echo "  - Connect Phantom wallet"
echo ""
echo "Browser 2 (User 2):"
echo "  - Firefox Incognito: http://localhost:3000"
echo "  - Connect Solflare wallet"
echo ""
echo "Browser 3 (User 3):"
echo "  - Safari: http://localhost:3000"
echo "  - Connect Backpack wallet"
echo ""

echo -e "${BLUE}Step 5: Create a challenge (User 1)${NC}"
echo "1. Click 'Create Challenge'"
echo "2. Fill in:"
echo "   - Name: My Test Challenge"
echo "   - Type: Steps"
echo "   - Goal: 5000"
echo "   - Stake: 0.1 SOL"
echo "   - Duration: 1 Week"
echo "3. Click 'Create'"
echo "4. Approve in wallet"
echo ""

echo -e "${BLUE}Step 6: Join challenge (User 2)${NC}"
echo "1. Visit /challenges/public"
echo "2. Find 'My Test Challenge'"
echo "3. Click 'Join for ◎0.1'"
echo "4. Approve in wallet"
echo ""

echo -e "${BLUE}Step 7: View on Solana Explorer${NC}"
echo "1. Copy transaction signature from toast notification"
echo "2. Visit: https://explorer.solana.com/?cluster=devnet"
echo "3. Paste signature in search"
echo "4. See all transaction details"
echo ""

echo -e "${BLUE}Useful URLs:${NC}"
echo "  App: http://localhost:3000"
echo "  Explore: http://localhost:3000/challenges/public"
echo "  Create: http://localhost:3000/challenges/create"
echo "  Explorer: https://explorer.solana.com/?cluster=devnet"
echo "  Faucet: https://faucet.solana.com/"
echo ""

echo -e "${GREEN}✅ Ready to start testing!${NC}"
