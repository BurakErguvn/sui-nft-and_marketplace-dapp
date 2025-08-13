"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useEvents } from "@/hooks/use-events";
import styles from "./nft-modal.module.css";

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

interface NFTModalProps {
  nft: NFT;
  isOpen: boolean;
  onClose: () => void;
}

export default function NFTModal({ nft, isOpen, onClose }: NFTModalProps) {
  const [nftHistory, setNftHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { getEventsForNft } = useEvents();

  useEffect(() => {
    if (isOpen && nft.id) {
      loadNftHistory();
    }
  }, [isOpen, nft.id]);

  const loadNftHistory = async () => {
    setLoading(true);
    try {
      const events = await getEventsForNft(nft.id);
      setNftHistory(events);
    } catch (err) {
      console.error("Failed to load NFT history:", err);
      setNftHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const formatEventType = (eventType: string) => {
    switch (eventType) {
      case "TheSavagePetMintEvent":
        return "Minted";
      case "NFTPlaced":
        return "Placed in Marketplace";
      case "NFTListed":
        return "Listed for Sale";
      case "NFTSold":
        return "Sold";
      case "NFTDelisted":
        return "Delisted";
      case "NFTWithdrawn":
        return "Withdrawn";
      default:
        return eventType;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  };

  const generateNftUrl = () => {
    return `${window.location.origin}/my-nft/${nft.id}`;
  };

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modalContent}>
        <button className={styles.closeButton} onClick={onClose}>
          ✕
        </button>

        <div className={styles.modalBody}>
          <div className={styles.imageSection}>
            <div className={styles.imageContainer}>
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
            </div>

            <div className={styles.shareSection}>
              <button
                onClick={() => copyToClipboard(generateNftUrl())}
                className={styles.shareBtn}
                title="Copy NFT Link"
              >
                🔗 Copy Link
              </button>
              <button
                onClick={() => copyToClipboard(nft.id)}
                className={styles.shareBtn}
                title="Copy NFT ID"
              >
                📋 Copy ID
              </button>
            </div>
          </div>

          <div className={styles.infoSection}>
            <div className={styles.nftHeader}>
              <h2 className={styles.nftTitle}>{nft.name}</h2>
              {nft.isInMarketplace && (
                <div className={styles.statusBadge}>
                  {nft.listingPrice
                    ? `Listed for ${nft.listingPrice} SUI`
                    : "In Marketplace"}
                </div>
              )}
            </div>

            {nft.description && nft.description.trim() && (
              <p className={styles.nftDescription}>{nft.description}</p>
            )}

            <div className={styles.attributesSection}>
              <h3 className={styles.sectionTitle}>Attributes</h3>
              <div className={styles.attributesGrid}>
                {Object.entries(nft.attributes).map(([key, value]) => {
                  // Ensure value is a string, not an object
                  const displayValue =
                    typeof value === "string"
                      ? value
                      : typeof value === "object"
                      ? JSON.stringify(value)
                      : String(value);

                  return (
                    <div key={key} className={styles.attributeItem}>
                      <span className={styles.attributeKey}>{key}</span>
                      <span className={styles.attributeValue}>
                        {displayValue}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={styles.detailsSection}>
              <h3 className={styles.sectionTitle}>Details</h3>
              <div className={styles.detailItem}>
                <span className={styles.detailKey}>NFT ID:</span>
                <span className={styles.detailValue} title={nft.id}>
                  {nft.id.slice(0, 8)}...{nft.id.slice(-8)}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailKey}>Creator:</span>
                <span className={styles.detailValue} title={nft.creator}>
                  {nft.creator.slice(0, 8)}...{nft.creator.slice(-8)}
                </span>
              </div>
            </div>

            <div className={styles.historySection}>
              <h3 className={styles.sectionTitle}>Transaction History</h3>
              {loading ? (
                <div className={styles.historyLoading}>
                  <div className={styles.spinner}></div>
                  <span>Loading history...</span>
                </div>
              ) : nftHistory.length > 0 ? (
                <div className={styles.historyList}>
                  {nftHistory.map((event, index) => (
                    <div key={index} className={styles.historyItem}>
                      <div className={styles.historyHeader}>
                        <span className={styles.eventType}>
                          {formatEventType(event.type)}
                        </span>
                        <span className={styles.eventDate}>
                          {formatDate(event.timestampMs)}
                        </span>
                      </div>
                      {event.price && (
                        <div className={styles.eventPrice}>
                          Price: {event.price} SUI
                        </div>
                      )}
                      {event.buyer && (
                        <div className={styles.eventDetail}>
                          Buyer: {event.buyer.slice(0, 8)}...
                          {event.buyer.slice(-8)}
                        </div>
                      )}
                      {event.seller && (
                        <div className={styles.eventDetail}>
                          Seller: {event.seller.slice(0, 8)}...
                          {event.seller.slice(-8)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.noHistory}>
                  No transaction history available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
