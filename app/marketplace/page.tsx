"use client";

import { useState, useEffect } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useContract } from "@/hooks/use-contract";
import {
  ThemeProvider,
  useTheme,
} from "@/components/theme-provider/theme-provider";
import MarketplaceNFTCard from "@/components/marketplace-nft-card/marketplace-nft-card";
import NFTModal from "@/components/nft-modal/nft-modal";
import NFTFilterPanel from "@/components/nft-filter-panel/nft-filter-panel";
import styles from "./marketplace.module.css";

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

interface FilterOptions {
  attributeFilters: { [key: string]: string[] };
  priceRange: { min: number; max: number };
  sortBy: "name" | "price" | "newest" | "oldest";
  sortOrder: "asc" | "desc";
}

function MarketplaceContent() {
  const [nfts, setNfts] = useState<MarketplaceNFT[]>([]);
  const [filteredNfts, setFilteredNfts] = useState<MarketplaceNFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNft, setSelectedNft] = useState<MarketplaceNFT | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    attributeFilters: {},
    priceRange: { min: 0, max: 0 },
    sortBy: "newest",
    sortOrder: "desc",
  });

  const account = useCurrentAccount();
  const { currentTheme } = useTheme();
  const {
    getMarketplaceData,
    purchaseNft,
    getObjectId,
    getPackageId,
    isLoading: contractLoading,
    error,
  } = useContract();

  useEffect(() => {
    testRpcStatus();
    loadMarketplaceNfts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [nfts, filters]);

  const testRpcStatus = async () => {
    console.log("=== RPC STATUS TEST ===");
    console.log("Network:", process.env.NEXT_PUBLIC_NETWORK);
    console.log("RPC URL:", process.env.NEXT_PUBLIC_TESTNET_RPC);
    console.log("Package ID:", getPackageId());
    console.log("Marketplace Object ID:", getObjectId("marketplace_object"));

    try {
      // Test marketplace data directly
      console.log("Testing marketplace data fetch...");
      const data = await getMarketplaceData();
      console.log("Marketplace data result:", data);

      if (data) {
        console.log("Items count:", Object.keys(data.items || {}).length);
        console.log("Listings count:", Object.keys(data.listings || {}).length);
        console.log("NFTs count:", Object.keys(data.nfts || {}).length);
      }
    } catch (error) {
      console.error("RPC test failed:", error);
    }
    console.log("=====================");
  };

  const checkRecentTransactions = async () => {
    if (!account?.address) {
      console.log("No account connected for transaction check");
      return;
    }

    console.log("=== CHECKING RECENT TRANSACTIONS ===");
    console.log("User address:", account.address);

    try {
      // Marketplace data'yı tekrar çek ve analiz et
      const marketplaceData = await getMarketplaceData();

      if (marketplaceData) {
        console.log("=== MARKETPLACE ANALYSIS ===");

        // User'ın sahip olduğu NFT'leri filtrele
        const userItems = Object.entries(marketplaceData.items).filter(
          ([nftId, owner]) => owner === account.address
        );

        const userListings = Object.entries(marketplaceData.listings).filter(
          ([nftId, listing]) => listing.seller === account.address
        );

        console.log(`User has ${userItems.length} placed NFTs:`, userItems);
        console.log(
          `User has ${userListings.length} listed NFTs:`,
          userListings
        );

        // Her bir NFT için detay
        userItems.forEach(([nftId, owner]) => {
          const nftData = marketplaceData.nfts[nftId];
          const isListed = marketplaceData.listings[nftId];

          console.log(`NFT ${nftId}:`, {
            owner,
            isListed: !!isListed,
            listing: isListed,
            nftData: nftData
              ? {
                  name: nftData.name,
                  image_url: nftData.image_url,
                  hasData: true,
                }
              : null,
          });
        });

        console.log("Raw marketplace data:");
        console.log("Items:", marketplaceData.items);
        console.log("Listings:", marketplaceData.listings);
        console.log("NFTs keys:", Object.keys(marketplaceData.nfts));
      }
    } catch (error) {
      console.error("Transaction check failed:", error);
    }
    console.log("====================================");
  };

  const loadMarketplaceNfts = async () => {
    setLoading(true);
    try {
      const marketplaceData = await getMarketplaceData();

      console.log("Marketplace data:", marketplaceData);

      if (!marketplaceData) {
        setNfts([]);
        return;
      }

      console.log("=== MARKETPLACE DEBUG ===");
      console.log("Marketplace data:", marketplaceData);
      console.log("Items:", marketplaceData.items);
      console.log("Listings:", marketplaceData.listings);
      console.log("NFTs:", marketplaceData.nfts);
      console.log("========================");

      // Transform marketplace data to MarketplaceNFT format
      const marketplaceNfts: MarketplaceNFT[] = [];

      // First, add NFTs that are listed for sale (in listings)
      Object.entries(marketplaceData.listings).forEach(([nftId, listing]) => {
        const nftData = marketplaceData.nfts[nftId];

        console.log(`Processing listed NFT ${nftId}:`, {
          nftData,
          listing,
          hasName: !!nftData?.name,
          hasImageUrl: !!nftData?.image_url,
          nameValue: nftData?.name,
          imageUrlValue: nftData?.image_url,
        });

        // Gevşek kontrol - sadece nftData varsa ekle
        if (nftData) {
          marketplaceNfts.push({
            id: nftId,
            name: nftData.name || "Unnamed NFT",
            description: nftData.description || "",
            image_url: nftData.image_url || "",
            attributes: nftData.attributes || {},
            creator: nftData.creator || "",
            price: listing.price || "0",
            seller: listing.seller || "",
            isListed: true,
          });
        } else {
          console.warn(`No NFT data found for listed NFT ${nftId}`);
        }
      });

      // Then, add NFTs that are placed but not listed (in items but not in listings)
      Object.entries(marketplaceData.items).forEach(([nftId, owner]) => {
        // Skip if already in listings
        if (marketplaceData.listings[nftId]) return;

        const nftData = marketplaceData.nfts[nftId];

        console.log(`Processing placed NFT ${nftId}:`, {
          nftData,
          owner,
          hasName: !!nftData?.name,
          hasImageUrl: !!nftData?.image_url,
          nameValue: nftData?.name,
          imageUrlValue: nftData?.image_url,
        });

        // Gevşek kontrol - sadece nftData varsa ekle
        if (nftData) {
          marketplaceNfts.push({
            id: nftId,
            name: nftData.name || "Unnamed NFT",
            description: nftData.description || "",
            image_url: nftData.image_url || "",
            attributes: nftData.attributes || {},
            creator: nftData.creator || "",
            price: undefined, // No price set yet
            seller: owner || "",
            isListed: false,
          });
        } else {
          console.warn(`No NFT data found for placed NFT ${nftId}`);
        }
      });

      console.log(`Total marketplace NFTs found: ${marketplaceNfts.length}`);
      console.log("All marketplace NFTs:", marketplaceNfts);

      setNfts(marketplaceNfts);

      // Set initial price range for filters
      if (marketplaceNfts.length > 0) {
        const prices = marketplaceNfts
          .filter((nft) => nft.price)
          .map((nft) => parseFloat(nft.price!));

        if (prices.length > 0) {
          setFilters((prev) => ({
            ...prev,
            priceRange: {
              min: Math.min(...prices),
              max: Math.max(...prices),
            },
          }));
        }
      }
    } catch (err) {
      console.error("Failed to load marketplace NFTs:", err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...nfts];

    // Apply attribute filters
    Object.entries(filters.attributeFilters).forEach(
      ([attributeKey, selectedValues]) => {
        if (selectedValues.length > 0) {
          filtered = filtered.filter((nft) => {
            const nftAttributes = nft.attributes || {};
            const attributeValue = nftAttributes[attributeKey];
            return attributeValue && selectedValues.includes(attributeValue);
          });
        }
      }
    );

    // Apply price range filter (only filter if user has set price filters)
    if (filters.priceRange.max > 0) {
      filtered = filtered.filter((nft) => {
        // Include NFTs without price (not listed yet) or within price range
        if (!nft.price) return true; // Show unpriced NFTs
        const price = parseFloat(nft.price);
        return (
          price >= filters.priceRange.min && price <= filters.priceRange.max
        );
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case "name":
          // Safe string comparison with fallback
          const nameA = a.name || "Unknown";
          const nameB = b.name || "Unknown";
          comparison = nameA.localeCompare(nameB);
          break;
        case "price":
          // NFTs without price go to the end
          if (!a.price && !b.price) comparison = 0;
          else if (!a.price) comparison = 1;
          else if (!b.price) comparison = -1;
          else {
            const priceA = parseFloat(a.price);
            const priceB = parseFloat(b.price);
            comparison = priceA - priceB;
          }
          break;
        case "newest":
        case "oldest":
          // For now, sort by name as fallback since we don't have timestamps
          const fallbackNameA = a.name || "Unknown";
          const fallbackNameB = b.name || "Unknown";
          comparison = fallbackNameA.localeCompare(fallbackNameB);
          break;
      }

      return filters.sortOrder === "desc" ? -comparison : comparison;
    });

    setFilteredNfts(filtered);
  };

  const handleNFTClick = (nft: MarketplaceNFT) => {
    setSelectedNft(nft);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedNft(null);
    setIsModalOpen(false);
  };

  const handlePurchaseNft = async (nft: MarketplaceNFT) => {
    if (!account) {
      alert("Please connect your wallet first!");
      return;
    }

    if (!nft.price) {
      alert("This NFT is not listed for sale!");
      return;
    }

    try {
      await purchaseNft(nft.id, nft.price);
      await loadMarketplaceNfts(); // Refresh the list
      alert(`Successfully purchased ${nft.name}!`);
    } catch (err) {
      console.error("Failed to purchase NFT:", err);
      alert("Purchase failed. Please try again.");
    }
  };

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  // Get unique attribute values for filter panel
  const getUniqueAttributes = () => {
    const attributeMap: { [key: string]: Set<string> } = {};

    nfts.forEach((nft) => {
      // Safe attributes check
      const attributes = nft.attributes || {};
      Object.entries(attributes).forEach(([key, value]) => {
        // Ensure key and value are valid strings
        if (
          key &&
          value &&
          typeof key === "string" &&
          typeof value === "string"
        ) {
          if (!attributeMap[key]) {
            attributeMap[key] = new Set();
          }
          attributeMap[key].add(value);
        }
      });
    });

    // Convert Sets to Arrays
    const result: { [key: string]: string[] } = {};
    Object.entries(attributeMap).forEach(([key, valueSet]) => {
      result[key] = Array.from(valueSet).sort();
    });

    return result;
  };

  if (loading) {
    return (
      <main className={styles.marketplacePage}>
        <div className={styles.content}>
          <h1 className={`${styles.title} ${styles[currentTheme]}`}>
            NFT Marketplace
          </h1>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading marketplace...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.marketplacePage}>
      <div className={styles.content}>
        <h1 className={`${styles.title} ${styles[currentTheme]}`}>
          NFT Marketplace
        </h1>

        <div className={styles.marketplaceContainer}>
          {/* Main NFT Grid - 80% */}
          <div className={styles.nftSection}>
            <div className={styles.sectionHeader}>
              <span className={styles.nftCount}>
                {filteredNfts.length} NFT{filteredNfts.length !== 1 ? "s" : ""}{" "}
                available
              </span>
              <div className={styles.actionButtons}>
                <button
                  onClick={loadMarketplaceNfts}
                  className={styles.refreshButton}
                  disabled={loading}
                >
                  🔄 Refresh
                </button>
                <button
                  onClick={testRpcStatus}
                  className={styles.testButton}
                  disabled={loading}
                >
                  🔍 Test RPC
                </button>
                <button
                  onClick={checkRecentTransactions}
                  className={styles.testButton}
                  disabled={loading}
                >
                  📋 Check Txs
                </button>
              </div>
            </div>

            {filteredNfts.length === 0 ? (
              <div className={styles.emptyState}>
                {nfts.length === 0 ? (
                  <p>No NFTs available in the marketplace.</p>
                ) : (
                  <p>No NFTs match your current filters.</p>
                )}
              </div>
            ) : (
              <div className={styles.nftGrid}>
                {filteredNfts.map((nft) => (
                  <MarketplaceNFTCard
                    key={nft.id}
                    nft={nft}
                    onNFTClick={handleNFTClick}
                    onPurchaseNft={handlePurchaseNft}
                    isLoading={contractLoading}
                    currentUser={account?.address}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Filter Panel - 20% */}
          <div className={styles.filterSection}>
            <NFTFilterPanel
              availableAttributes={getUniqueAttributes()}
              currentFilters={filters}
              onFilterChange={handleFilterChange}
              totalNfts={nfts.length}
              filteredNfts={filteredNfts.length}
            />
          </div>
        </div>

        {error && <div className={styles.error}>Error: {error}</div>}
      </div>

      {selectedNft && (
        <NFTModal
          nft={selectedNft}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </main>
  );
}

export default function MarketplacePage() {
  return (
    <ThemeProvider>
      <MarketplaceContent />
    </ThemeProvider>
  );
}
