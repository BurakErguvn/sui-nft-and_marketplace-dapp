"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useContract } from "@/hooks/use-contract";
import {
  ThemeProvider,
  useTheme,
} from "@/components/theme-provider/theme-provider";
import NFTModal from "@/components/nft-modal/nft-modal";
import styles from "../my-nft.module.css";

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

function NFTDetailsContent() {
  const [nft, setNft] = useState<NFT | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const params = useParams();
  const router = useRouter();
  const account = useCurrentAccount();
  const { currentTheme } = useTheme();
  const { getAllUserNfts } = useContract();

  const nftSlug = params["nft-slug"] as string;

  useEffect(() => {
    if (account?.address && nftSlug) {
      loadNFT();
    } else if (!account) {
      setLoading(false);
    }
  }, [account?.address, nftSlug]);

  const loadNFT = async () => {
    if (!account?.address) return;

    setLoading(true);
    try {
      const userNfts = await getAllUserNfts(account.address);

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

      const foundNft = allNfts.find((nft) => nft.id === nftSlug);

      if (foundNft) {
        setNft(foundNft);
      } else {
        setNotFound(true);
      }
    } catch (err) {
      console.error("Failed to load NFT:", err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    router.push("/my-nft");
  };

  if (!account) {
    return (
      <main className={styles.myNftPage}>
        <div className={styles.content}>
          <h1 className={`${styles.title} ${styles[currentTheme]}`}>
            NFT Details
          </h1>
          <div className={styles.connectWallet}>
            <p>Please connect your wallet to view NFT details</p>
            <button
              onClick={() => router.push("/my-nft")}
              className={styles.backBtn}
            >
              ← Back to My NFTs
            </button>
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
            Loading NFT...
          </h1>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading NFT details...</p>
          </div>
        </div>
      </main>
    );
  }

  if (notFound || !nft) {
    return (
      <main className={styles.myNftPage}>
        <div className={styles.content}>
          <h1 className={`${styles.title} ${styles[currentTheme]}`}>
            NFT Not Found
          </h1>
          <div className={styles.emptyState}>
            <p>The requested NFT was not found in your collection.</p>
            <button
              onClick={() => router.push("/my-nft")}
              className={styles.backBtn}
            >
              ← Back to My NFTs
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.myNftPage}>
      <NFTModal nft={nft} isOpen={true} onClose={handleCloseModal} />
    </main>
  );
}

export default function NFTDetailsPage() {
  return (
    <ThemeProvider>
      <NFTDetailsContent />
    </ThemeProvider>
  );
}
