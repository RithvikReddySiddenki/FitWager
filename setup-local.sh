#!/bin/bash

# FitWager Local Development Server Setup
# This script sets up everything you need to run FitWager locally on devnet

echo "🚀 FitWager Local Development Setup"
echo "===================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✓ Node.js version: $(node --version)"
echo ""

# Navigate to client directory
cd "$(dirname "$0")/client" || exit 1

echo "📦 Installing dependencies..."
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo ""
echo "1. Make sure you have .env.local configured:"
echo "   - NEXT_PUBLIC_SOLANA_CLUSTER=devnet"
echo "   - NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com"
echo "   - NEXT_PUBLIC_PROGRAM_ID=Fg6PaFpoGXkYsidMpWxqSW1JmAxo9ZPVknpYAH97PvX1"
echo ""
echo "2. Start the development server:"
echo "   npm run dev"
echo ""
echo "3. The app will be available at:"
echo "   http://localhost:3000"
echo ""
echo "4. To test with multiple users:"
echo "   - Open http://localhost:3000 in multiple browser windows"
echo "   - Use incognito windows for separate wallets"
echo "   - Or use different browser profiles"
echo ""
echo "📝 For detailed testing guide, see TESTING_GUIDE.md"
