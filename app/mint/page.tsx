"use client";

import { useCurrentAccount } from "@mysten/dapp-kit";
import { useContract } from "@/hooks/use-contract";
import {
  ThemeProvider,
  useTheme,
} from "@/components/theme-provider/theme-provider";
import { getPackageId, getNetworkInfo } from "@/config/contract";
import styles from "./mint.module.css";
import nftMetadata from "@/assets/nft_metadata.json";

function MintContent() {
  const account = useCurrentAccount();
  const { mintNft, isLoading, error } = useContract();
  const { currentTheme } = useTheme();

  // Debug: Environment variable test
  console.log("🔍 Client-side package ID test:", getPackageId());
  console.log("🔍 Network info:", getNetworkInfo());

  const getRandomNftMetadata = () => {
    const randomIndex = Math.floor(Math.random() * nftMetadata.length);
    return nftMetadata[randomIndex];
  };

  const handleMint = async () => {
    if (!account) {
      alert("Please connect your wallet first!");
      return;
    }

    try {
      // Get random NFT metadata from JSON file
      const selectedNft = getRandomNftMetadata();

      const result = await mintNft(
        selectedNft.name,
        selectedNft.image_url,
        selectedNft.attributes as Array<{ key: string; value: string }>
      );

      // Check for mint event
      if ((result as any).mintEventData) {
        const eventData = (result as any).mintEventData;
        alert(
          `🎉 ${selectedNft.name} minted successfully!\nNFT ID: ${eventData.nft_id}`
        );
      } else {
        alert("NFT minted successfully!");
      }
    } catch (err) {
      console.error("Mint failed:", err);
      alert("Mint failed. Please try again.");
    }
  };

  return (
    <main className={styles.mintPage}>
      <div className={styles.content}>
        <h1 className={`${styles.title} ${styles[currentTheme]}`}>
          Mint Your Savage Pet
        </h1>

        <p className={styles.description}>
          Connect your wallet to mint a new Savage Pet NFT
        </p>

        <button
          className={`${styles.mintButton} ${styles[currentTheme]}`}
          onClick={handleMint}
          disabled={isLoading || !account}
        >
          {isLoading ? (
            <>
              <span className={styles.spinner}></span>
              Minting...
            </>
          ) : !account ? (
            "Connect Wallet to Mint"
          ) : (
            "Mint Random Savage Pet NFT"
          )}
        </button>

        {error && <div className={styles.error}>Error: {error}</div>}

        {account && (
          <div className={styles.walletInfo}>
            <p>
              Connected: {account.address.slice(0, 6)}...
              {account.address.slice(-4)}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function MintPage() {
  return (
    <ThemeProvider>
      <MintContent />
    </ThemeProvider>
  );
}
