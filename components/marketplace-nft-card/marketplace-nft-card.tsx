"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./marketplace-nft-card.module.css";

interface MarketplaceNFT {
  id: string;
  name: string;
  description: string;
  image_url: string;
  attributes: { [key: string]: string };
  creator: string;
  price?: string;
  seller: string;
  isListed: boolean;
}

interface MarketplaceNFTCardProps {
  nft: MarketplaceNFT;
  onNFTClick: (nft: MarketplaceNFT) => void;
  onPurchaseNft: (nft: MarketplaceNFT) => void;
  isLoading: boolean;
  currentUser?: string;
}

export default function MarketplaceNFTCard({
  nft,
  onNFTClick,
  onPurchaseNft,
  isLoading,
  currentUser,
}: MarketplaceNFTCardProps) {
  const [showActions, setShowActions] = useState(false);

  const handleImageClick = () => {
    onNFTClick(nft);
  };

  const handleMouseEnter = () => {
    setShowActions(true);
  };

  const handleMouseLeave = () => {
    setShowActions(false);
  };

  const handlePurchaseClick = () => {
    onPurchaseNft(nft);
  };

  const isOwnNft = currentUser && nft.seller === currentUser;

  return (
    <div
      className={styles.nftCard}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={styles.imageContainer} onClick={handleImageClick}>
        {nft.image_url ? (
          <Image
            src={nft.image_url}
            alt={nft.name}
            fill
            className={styles.nftImage}
            unoptimized
          />
        ) : (
          <div className={styles.placeholderImage}>
            <span>No Image</span>
          </div>
        )}

        {nft.price && <div className={styles.priceBadge}>{nft.price} SUI</div>}

        {isOwnNft && <div className={styles.ownBadge}>Your NFT</div>}
      </div>

      <div className={styles.nftInfo}>
        <h3 className={styles.nftName}>{nft.name}</h3>

        <div className={styles.nftDetails}>
          <div className={styles.sellerInfo}>
            <span className={styles.sellerLabel}>Seller:</span>
            <span className={styles.sellerAddress}>
              {nft.seller.slice(0, 6)}...{nft.seller.slice(-4)}
            </span>
          </div>

          <div className={styles.nftAttributes}>
            {Object.entries(nft.attributes)
              .slice(0, 2)
              .map(([key, value]) => (
                <span key={key} className={styles.attribute}>
                  {key}: {value}
                </span>
              ))}
          </div>
        </div>
      </div>

      {/* Action Panel */}
      <div
        className={`${styles.actionPanel} ${showActions ? styles.show : ""}`}
      >
        {nft.price && !isOwnNft && (
          <button
            onClick={handlePurchaseClick}
            className={styles.buyButton}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className={styles.spinner}></span>
                Buying...
              </>
            ) : (
              <>💰 Buy for {nft.price} SUI</>
            )}
          </button>
        )}

        {!nft.price && (
          <div className={styles.notListedInfo}>
            <span>Not listed for sale</span>
          </div>
        )}

        {isOwnNft && (
          <div className={styles.ownNftInfo}>
            <span>This is your NFT</span>
          </div>
        )}
      </div>
    </div>
  );
}
