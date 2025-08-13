"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useContract } from "@/hooks/use-contract";
import {
  ThemeProvider,
  useTheme,
} from "@/components/theme-provider/theme-provider";
import NFTCard from "@/components/nft-card/nft-card";
import styles from "./my-nft.module.css";

interface NFT {
  id: string;
  name: string;
  description: string;
  image_url: string;
  attributes: { [key: string]: string };
  creator: string;
  isInMarketplace?: boolean;
  listingPrice?: string;
}

function MyNFTContent() {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);

  const account = useCurrentAccount();
  const router = useRouter();
  const { currentTheme } = useTheme();
  const {
    getAllUserNfts,
    placeNft,
    listNft,
    placeAndListNft,
    withdrawNft,
    isLoading: contractLoading,
    error,
  } = useContract();

  useEffect(() => {
    if (account?.address) {
      loadUserNfts();
    } else {
      setNfts([]);
      setLoading(false);
    }
  }, [account?.address]);

  const loadUserNfts = async () => {
    if (!account?.address) return;

    setLoading(true);
    try {
      console.log("=== MY-NFT LOADING DEBUG ===");
      console.log("Loading NFTs for user:", account.address);

      const userNfts = await getAllUserNfts(account.address);

      console.log("=== MY-NFT DEBUG ===");
      console.log("User NFTs data:", userNfts);
      console.log("Wallet NFTs count:", userNfts.walletNfts?.length || 0);
      console.log("Wallet NFTs:", userNfts.walletNfts);
      console.log(
        "Marketplace NFTs count:",
        userNfts.marketplaceNfts?.length || 0
      );
      console.log("Marketplace NFTs:", userNfts.marketplaceNfts);

      // Her bir marketplace NFT'yi detaylı logla
      if (userNfts.marketplaceNfts && userNfts.marketplaceNfts.length > 0) {
        userNfts.marketplaceNfts.forEach((nft, index) => {
          console.log(`Marketplace NFT ${index}:`, {
            id: nft.id,
            name: nft.name,
            image_url: nft.image_url,
            hasData: !!nft,
          });
        });
      }
      console.log("===================");

      // Wallet ve marketplace NFT'lerini birleştir
      const allNfts: NFT[] = [
        ...userNfts.walletNfts.map((nft) => ({
          ...nft,
          description: nft.description || "",
          isInMarketplace: false,
        })),
        ...userNfts.marketplaceNfts.map((nft) => ({
          ...nft,
          description: nft.description || "",
          isInMarketplace: true,
        })),
      ];

      console.log("Total combined NFTs:", allNfts.length);
      console.log("Combined NFTs:", allNfts);
      setNfts(allNfts);
    } catch (err) {
      console.error("Failed to load NFTs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNFTClick = (nft: NFT) => {
    // Navigate to NFT detail page with slug
    const nftSlug = nft.id.split("::").pop() || nft.id;
    router.push(`/my-nft/${nftSlug}`);
  };

  const handleCloseModal = () => {
    // Not needed anymore since we use routing
  };

  const handlePlaceInMarketplace = async (nft: NFT) => {
    try {
      await placeNft(nft);
      await loadUserNfts(); // Refresh the list
    } catch (err) {
      console.error("Failed to place NFT:", err);
    }
  };

  const handleListNFT = async (nft: NFT, price: string) => {
    try {
      await listNft(nft.id, price);
      await loadUserNfts(); // Refresh the list
    } catch (err) {
      console.error("Failed to list NFT:", err);
    }
  };

  const handlePlaceAndList = async (nft: NFT, price: string) => {
    try {
      await placeAndListNft(nft, price);
      await loadUserNfts(); // Refresh the list
    } catch (err) {
      console.error("Failed to place and list NFT:", err);
    }
  };

  const handleWithdrawFromMarketplace = async (nft: NFT) => {
    try {
      console.log("Withdrawing NFT from marketplace:", nft.id);
      await withdrawNft(nft.id);
      await loadUserNfts(); // Refresh the list
      alert(`Successfully withdrew ${nft.name} from marketplace!`);
    } catch (err) {
      console.error("Failed to withdraw NFT:", err);
      alert("Failed to withdraw NFT from marketplace. Please try again.");
    }
  };

  if (!account) {
    return (
      <main className={styles.myNftPage}>
        <div className={styles.content}>
          <h1 className={`${styles.title} ${styles[currentTheme]}`}>
            My Savage Pet NFTs
          </h1>
          <div className={styles.connectWallet}>
            <p>Please connect your wallet to view your NFTs</p>
          </div>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className={styles.myNftPage}>
        <div className={styles.content}>
          <h1 className={`${styles.title} ${styles[currentTheme]}`}>
            My Savage Pet NFTs
          </h1>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading your NFTs...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.myNftPage}>
      <div className={styles.content}>
        <h1 className={`${styles.title} ${styles[currentTheme]}`}>
          My Savage Pet NFTs
        </h1>

        <div className={styles.statsContainer}>
          <div className={styles.stat}>
            <span className={styles.statNumber}>
              {nfts.filter((n) => !n.isInMarketplace).length}
            </span>
            <span className={styles.statLabel}>In Wallet</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNumber}>
              {nfts.filter((n) => n.isInMarketplace).length}
            </span>
            <span className={styles.statLabel}>In Marketplace</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNumber}>{nfts.length}</span>
            <span className={styles.statLabel}>Total NFTs</span>
          </div>
          <button
            onClick={loadUserNfts}
            className={styles.refreshButton}
            disabled={loading}
          >
            🔄 Refresh
          </button>
        </div>

        {nfts.length === 0 ? (
          <div className={styles.emptyState}>
            <p>You don't have any Savage Pet NFTs yet.</p>
            <p>Visit the mint page to create your first NFT!</p>
          </div>
        ) : (
          <div className={styles.nftGrid}>
            {nfts.map((nft) => (
              <NFTCard
                key={nft.id}
                nft={nft}
                onNFTClick={handleNFTClick}
                onPlaceInMarketplace={handlePlaceInMarketplace}
                onListNFT={handleListNFT}
                onPlaceAndList={handlePlaceAndList}
                onWithdrawFromMarketplace={handleWithdrawFromMarketplace}
                isLoading={contractLoading}
              />
            ))}
          </div>
        )}

        {error && <div className={styles.error}>Error: {error}</div>}
      </div>
    </main>
  );
}

export default function MyNFTPage() {
  return (
    <ThemeProvider>
      <MyNFTContent />
    </ThemeProvider>
  );
}
