"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./nft-card.module.css";

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

interface NFTCardProps {
  nft: NFT;
  onNFTClick: (nft: NFT) => void;
  onPlaceInMarketplace: (nft: NFT) => void;
  onListNFT: (nft: NFT, price: string) => void;
  onPlaceAndList: (nft: NFT, price: string) => void;
  onWithdrawFromMarketplace?: (nft: NFT) => void;
  isLoading: boolean;
}

export default function NFTCard({
  nft,
  onNFTClick,
  onPlaceInMarketplace,
  onListNFT,
  onPlaceAndList,
  onWithdrawFromMarketplace,
  isLoading,
}: NFTCardProps) {
  const [showActions, setShowActions] = useState(false);
  const [listPrice, setListPrice] = useState("");
  const [showPriceInput, setShowPriceInput] = useState<string | null>(null);

  const handleImageClick = () => {
    onNFTClick(nft);
  };

  const handleMouseEnter = () => {
    setShowActions(true);
  };

  const handleMouseLeave = () => {
    setShowActions(false);
    setShowPriceInput(null);
    setListPrice("");
  };

  const handlePlaceClick = () => {
    onPlaceInMarketplace(nft);
  };

  const handleListClick = () => {
    setShowPriceInput("list");
  };

  const handlePlaceAndListClick = () => {
    setShowPriceInput("placeAndList");
  };

  const handlePriceSubmit = (action: string) => {
    if (!listPrice || parseFloat(listPrice) <= 0) {
      alert("Please enter a valid price");
      return;
    }

    if (action === "list") {
      onListNFT(nft, listPrice);
    } else if (action === "placeAndList") {
      onPlaceAndList(nft, listPrice);
    }

    setShowPriceInput(null);
    setListPrice("");
    setShowActions(false);
  };

  const handleCancelPrice = () => {
    setShowPriceInput(null);
    setListPrice("");
  };

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
        {nft.isInMarketplace && (
          <div className={styles.marketplaceBadge}>In Marketplace</div>
        )}
        {nft.listingPrice && (
          <div className={styles.priceBadge}>{nft.listingPrice} SUI</div>
        )}
      </div>

      <div className={styles.nftInfo}>
        <h3 className={styles.nftName}>{nft.name}</h3>
        {/* Attributes removed for cleaner look in my-nft page */}
      </div>

      {/* Action Panel */}
      <div
        className={`${styles.actionPanel} ${showActions ? styles.show : ""}`}
      >
        {showPriceInput ? (
          <div className={styles.priceInput}>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Price in SUI"
              value={listPrice}
              onChange={(e) => setListPrice(e.target.value)}
              className={styles.priceField}
              autoFocus
            />
            <div className={styles.priceActions}>
              <button
                onClick={() => handlePriceSubmit(showPriceInput)}
                className={styles.confirmBtn}
                disabled={isLoading}
              >
                ✓
              </button>
              <button
                onClick={handleCancelPrice}
                className={styles.cancelBtn}
                disabled={isLoading}
              >
                ✕
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.actionButtons}>
            {!nft.isInMarketplace && (
              <>
                <button
                  onClick={handlePlaceClick}
                  className={styles.actionBtn}
                  disabled={isLoading}
                  title="Place in Marketplace"
                >
                  📥 Place
                </button>
                <button
                  onClick={handleListClick}
                  className={styles.actionBtn}
                  disabled={isLoading}
                  title="List for Sale"
                >
                  🏷️ List
                </button>
                <button
                  onClick={handlePlaceAndListClick}
                  className={styles.actionBtn}
                  disabled={isLoading}
                  title="Place & List for Sale"
                >
                  🚀 Place & List
                </button>
              </>
            )}
            {nft.isInMarketplace && !nft.listingPrice && (
              <>
                <button
                  onClick={handleListClick}
                  className={styles.actionBtn}
                  disabled={isLoading}
                  title="List for Sale"
                >
                  🏷️ List for Sale
                </button>
                {onWithdrawFromMarketplace && (
                  <button
                    onClick={() => onWithdrawFromMarketplace(nft)}
                    className={styles.actionBtn}
                    disabled={isLoading}
                    title="Withdraw from Marketplace"
                  >
                    📤 Withdraw
                  </button>
                )}
              </>
            )}
            {nft.isInMarketplace && nft.listingPrice && (
              <div className={styles.listedInfo}>
                <span>Listed for {nft.listingPrice} SUI</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
