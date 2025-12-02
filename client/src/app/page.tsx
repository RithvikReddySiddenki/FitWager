import ConnectWalletButton from "@/components/ConnectWalletButton";
export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <ConnectWalletButton />

      <h1 className="text-4xl font-bold mt-10">
        Welcome to FitWager
      </h1>

      <p className="mt-3 text-lg opacity-80">
        Compete. Train. Win. All on Solana.
      </p>
    </main>
  );
}