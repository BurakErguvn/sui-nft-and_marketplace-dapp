// Contract interaction hook
import { useSuiClient, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useState, useCallback } from "react";
import {
  getPackageId,
  getObjectId,
  getFunctionName,
  validateConfig,
  getNetworkInfo,
  type ContractCallParams,
  type TheSavagePetNFT,
  type ListingInfo,
  type MarketplaceData,
} from "@/config/contract";

export const useContract = () => {
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Contract bilgilerini al
  const contractInfo = getNetworkInfo();

  // Generic contract function call
  const callFunction = useCallback(
    async (params: ContractCallParams) => {
      if (!validateConfig()) {
        throw new Error("Contract configuration is not valid");
      }

      setIsLoading(true);
      setError(null);

      try {
        const tx = new Transaction();

        tx.moveCall({
          target: `${getPackageId()}::${params.functionName}`,
          typeArguments: params.typeArguments || [],
          arguments: params.arguments || [],
        });

        return new Promise((resolve, reject) => {
          signAndExecute(
            {
              transaction: tx,
            },
            {
              onSuccess: (result) => {
                setIsLoading(false);
                resolve(result);
              },
              onError: (error) => {
                setIsLoading(false);
                setError(error.message);
                reject(error);
              },
            }
          );
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        setError(errorMessage);
        setIsLoading(false);
        throw err;
      }
    },
    [signAndExecute]
  );

  // Mint NFT function - contract'taki mint fonksiyonuna göre
  const mintNft = useCallback(
    async (
      name: string,
      image_url: string,
      attributes:
        | { [key: string]: string }
        | Array<{ key: string; value: string }>
        | Array<[string, string]>
    ) => {
      setIsLoading(true);
      setError(null);

      const tx = new Transaction();

      const target = `${getPackageId()}::sui_nft::${getFunctionName(
        "mintNft"
      )}`;

      // Convert attributes to VecMap format
      let attributeVectors: string[][];

      if (Array.isArray(attributes)) {
        // Check if it's array of objects with key/value properties
        if (
          attributes.length > 0 &&
          typeof attributes[0] === "object" &&
          "key" in attributes[0]
        ) {
          // Array of { key: string, value: string } objects
          attributeVectors = (
            attributes as Array<{ key: string; value: string }>
          ).map((attr) => [attr.key, attr.value]);
        } else {
          // Array of [string, string] tuples
          attributeVectors = attributes as Array<[string, string]>;
        }
      } else {
        // Object format { key: value }
        attributeVectors = Object.entries(attributes);
      }

      // Yeni Move contract formatına göre - ayrı key/value arrays
      const attributeKeys = attributeVectors.map(([key, _]) => key);
      const attributeValues = attributeVectors.map(([_, value]) => value);

      tx.moveCall({
        target,
        arguments: [
          tx.object(getObjectId("the_savage_pet_registry")), // registry: &mut TheSavagePetRegistry
          tx.pure.string(name), // name: String
          tx.pure.string(image_url), // image_url: String
          tx.pure.vector("string", attributeKeys), // attribute_keys: vector<String>
          tx.pure.vector("string", attributeValues), // attribute_values: vector<String>
        ],
      });

      return new Promise((resolve, reject) => {
        signAndExecute(
          {
            transaction: tx,
          },
          {
            onSuccess: (result) => {
              setIsLoading(false);

              // Event'leri kontrol et ve NFT ID'sini al
              try {
                const effects = (result as any).effects;
                if (
                  effects &&
                  effects.events &&
                  Array.isArray(effects.events)
                ) {
                  const mintEvent = effects.events.find(
                    (event: any) =>
                      event.type && event.type.includes("TheSavagePetMintEvent")
                  );

                  if (mintEvent && mintEvent.parsedJson) {
                    // Return mint event data along with result
                    (result as any).mintEventData = mintEvent.parsedJson;
                  }
                }
              } catch (eventError) {
                console.warn("Event parsing failed:", eventError);
              }

              resolve(result);
            },
            onError: (error) => {
              setIsLoading(false);
              setError(error.message);
              reject(error);
            },
          }
        );
      });
    },
    [signAndExecute]
  );

  // Get NFTs by owner
  const getNftsByOwner = useCallback(
    async (ownerAddress: string): Promise<TheSavagePetNFT[]> => {
      try {
        const objects = await suiClient.getOwnedObjects({
          owner: ownerAddress,
          filter: {
            StructType: `${getPackageId()}::sui_nft::TheSavagePet`,
          },
          options: {
            showContent: true,
            showDisplay: true,
          },
        });

        return objects.data.map((obj: any) => {
          // Extract attributes from VecMap format
          const rawAttributes = obj.data?.content?.fields?.attributes;
          let attributes: { [key: string]: string } = {};

          if (
            rawAttributes &&
            rawAttributes.fields &&
            rawAttributes.fields.contents
          ) {
            // VecMap format with fields.contents array structure
            rawAttributes.fields.contents.forEach((item: any) => {
              if (item.fields && item.fields.key && item.fields.value) {
                attributes[item.fields.key] = item.fields.value;
              }
            });
          } else if (rawAttributes && rawAttributes.contents) {
            // Simpler VecMap format with contents array
            rawAttributes.contents.forEach((item: any) => {
              if (item.key && item.value) {
                attributes[item.key] = item.value;
              } else if (item.fields && item.fields.key && item.fields.value) {
                attributes[item.fields.key] = item.fields.value;
              }
            });
          } else if (rawAttributes && typeof rawAttributes === "object") {
            // Direct object format - but make sure it doesn't have contents
            if (rawAttributes.contents || rawAttributes.fields) {
              console.warn(
                "Found object with contents/fields property, skipping:",
                rawAttributes
              );
            } else {
              attributes = rawAttributes;
            }
          }

          return {
            id: obj.data?.objectId || "",
            name: obj.data?.content?.fields?.name || "Unknown Pet",
            description: obj.data?.content?.fields?.description || "",
            image_url: obj.data?.content?.fields?.image_url || "",
            attributes,
            creator: obj.data?.content?.fields?.creator || "",
          };
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch NFTs");
        return [];
      }
    },
    [suiClient]
  );

  // Place NFT in marketplace
  const placeNft = useCallback(
    async (nft: TheSavagePetNFT) => {
      setIsLoading(true);
      setError(null);

      const tx = new Transaction();

      tx.moveCall({
        target: `${getPackageId()}::marketplace::${getFunctionName(
          "placeNft"
        )}`,
        arguments: [tx.object(getObjectId("marketplace")), tx.object(nft.id)],
      });

      return new Promise((resolve, reject) => {
        signAndExecute(
          {
            transaction: tx,
          },
          {
            onSuccess: (result) => {
              setIsLoading(false);

              // NFTPlaced event'ini kontrol et
              try {
                const effects = (result as any).effects;
                if (
                  effects &&
                  effects.events &&
                  Array.isArray(effects.events)
                ) {
                  const placeEvent = effects.events.find(
                    (event: any) =>
                      event.type && event.type.includes("NFTPlaced")
                  );

                  if (placeEvent && placeEvent.parsedJson) {
                    (result as any).placeEventData = placeEvent.parsedJson;
                  }
                }
              } catch (eventError) {
                console.warn("Event parsing failed:", eventError);
              }

              resolve(result);
            },
            onError: (error) => {
              setIsLoading(false);
              setError(error.message);
              reject(error);
            },
          }
        );
      });
    },
    [signAndExecute]
  );

  // List NFT for sale
  const listNft = useCallback(
    async (nftId: string, price: string) => {
      setIsLoading(true);
      setError(null);

      const tx = new Transaction();

      tx.moveCall({
        target: `${getPackageId()}::marketplace::${getFunctionName("listNft")}`,
        arguments: [
          tx.object(getObjectId("marketplace")),
          tx.object(nftId),
          tx.pure.u64(price),
        ],
      });

      return new Promise((resolve, reject) => {
        signAndExecute(
          {
            transaction: tx,
          },
          {
            onSuccess: (result) => {
              setIsLoading(false);

              // NFTListed event'ini kontrol et
              try {
                const effects = (result as any).effects;
                if (
                  effects &&
                  effects.events &&
                  Array.isArray(effects.events)
                ) {
                  const listEvent = effects.events.find(
                    (event: any) =>
                      event.type && event.type.includes("NFTListed")
                  );

                  if (listEvent && listEvent.parsedJson) {
                    (result as any).listEventData = listEvent.parsedJson;
                  }
                }
              } catch (eventError) {
                console.warn("Event parsing failed:", eventError);
              }

              resolve(result);
            },
            onError: (error) => {
              setIsLoading(false);
              setError(error.message);
              reject(error);
            },
          }
        );
      });
    },
    [signAndExecute]
  );

  // Place and list NFT (combined operation)
  const placeAndListNft = useCallback(
    async (nft: TheSavagePetNFT, price: string) => {
      setIsLoading(true);
      setError(null);

      const tx = new Transaction();

      tx.moveCall({
        target: `${getPackageId()}::marketplace::${getFunctionName(
          "placeAndListNft"
        )}`,
        arguments: [
          tx.object(getObjectId("marketplace")),
          tx.object(nft.id),
          tx.pure.u64(price),
        ],
      });

      return new Promise((resolve, reject) => {
        signAndExecute(
          {
            transaction: tx,
          },
          {
            onSuccess: (result) => {
              setIsLoading(false);

              // Hem NFTPlaced hem NFTListed event'lerini kontrol et
              try {
                const effects = (result as any).effects;
                if (
                  effects &&
                  effects.events &&
                  Array.isArray(effects.events)
                ) {
                  const placeEvent = effects.events.find(
                    (event: any) =>
                      event.type && event.type.includes("NFTPlaced")
                  );
                  const listEvent = effects.events.find(
                    (event: any) =>
                      event.type && event.type.includes("NFTListed")
                  );

                  if (placeEvent && placeEvent.parsedJson) {
                    (result as any).placeEventData = placeEvent.parsedJson;
                  }

                  if (listEvent && listEvent.parsedJson) {
                    (result as any).listEventData = listEvent.parsedJson;
                  }
                }
              } catch (eventError) {
                console.warn("Event parsing failed:", eventError);
              }

              resolve(result);
            },
            onError: (error) => {
              setIsLoading(false);
              setError(error.message);
              reject(error);
            },
          }
        );
      });
    },
    [signAndExecute]
  );

  // Delist NFT
  const delistNft = useCallback(
    async (nftId: string) => {
      const tx = new Transaction();

      tx.moveCall({
        target: `${getPackageId()}::marketplace::${getFunctionName(
          "delistNft"
        )}`,
        arguments: [tx.object(getObjectId("marketplace")), tx.object(nftId)],
      });

      return new Promise((resolve, reject) => {
        signAndExecute(
          {
            transaction: tx,
          },
          {
            onSuccess: (result) => {
              setIsLoading(false);
              resolve(result);
            },
            onError: (error) => {
              setIsLoading(false);
              setError(error.message);
              reject(error);
            },
          }
        );
      });
    },
    [signAndExecute]
  );

  // Purchase NFT
  const purchaseNft = useCallback(
    async (nftId: string, payment: string) => {
      const tx = new Transaction();

      tx.moveCall({
        target: `${getPackageId()}::marketplace::${getFunctionName(
          "purchaseNft"
        )}`,
        arguments: [
          tx.object(getObjectId("marketplace")),
          tx.object(nftId),
          tx.object(payment), // Coin<SUI> object
        ],
      });

      return new Promise((resolve, reject) => {
        signAndExecute(
          {
            transaction: tx,
          },
          {
            onSuccess: (result) => {
              setIsLoading(false);
              resolve(result);
            },
            onError: (error) => {
              setIsLoading(false);
              setError(error.message);
              reject(error);
            },
          }
        );
      });
    },
    [signAndExecute]
  );

  // Withdraw NFT from marketplace
  const withdrawNft = useCallback(
    async (nftId: string) => {
      const tx = new Transaction();

      tx.moveCall({
        target: `${getPackageId()}::marketplace::${getFunctionName(
          "withdrawNft"
        )}`,
        arguments: [tx.object(getObjectId("marketplace")), tx.object(nftId)],
      });

      return new Promise((resolve, reject) => {
        signAndExecute(
          {
            transaction: tx,
          },
          {
            onSuccess: (result) => {
              setIsLoading(false);
              resolve(result);
            },
            onError: (error) => {
              setIsLoading(false);
              setError(error.message);
              reject(error);
            },
          }
        );
      });
    },
    [signAndExecute]
  );

  // Update listing price
  const updateListingPrice = useCallback(
    async (nftId: string, newPrice: string) => {
      const tx = new Transaction();

      tx.moveCall({
        target: `${getPackageId()}::marketplace::${getFunctionName(
          "updateListingPrice"
        )}`,
        arguments: [
          tx.object(getObjectId("marketplace")),
          tx.object(nftId),
          tx.pure.u64(newPrice),
        ],
      });

      return new Promise((resolve, reject) => {
        signAndExecute(
          {
            transaction: tx,
          },
          {
            onSuccess: (result) => {
              setIsLoading(false);
              resolve(result);
            },
            onError: (error) => {
              setIsLoading(false);
              setError(error.message);
              reject(error);
            },
          }
        );
      });
    },
    [signAndExecute]
  );

  // Get marketplace data
  const getMarketplaceData =
    useCallback(async (): Promise<MarketplaceData | null> => {
      try {
        console.log(
          "🔍 Fetching marketplace data from:",
          getObjectId("marketplace_object")
        );

        const marketplaceObject = await suiClient.getObject({
          id: getObjectId("marketplace_object"),
          options: {
            showContent: true,
            showOwner: true,
            showPreviousTransaction: true,
            showStorageRebate: true,
            showDisplay: true,
          },
        });

        console.log("🔍 Raw marketplace object:", marketplaceObject);

        if (
          !marketplaceObject.data?.content ||
          marketplaceObject.data.content.dataType !== "moveObject"
        ) {
          console.error("❌ Invalid marketplace object structure");
          return null;
        }

        const fields = (marketplaceObject.data.content as any).fields;
        console.log("🔍 Marketplace fields:", fields);

        // Items Table'ı parse et (Table<ID, address>)
        const items: { [nftId: string]: string } = {};
        if (fields.items?.fields?.contents) {
          console.log("🔍 Parsing items table:", fields.items.fields.contents);
          fields.items.fields.contents.forEach((item: any) => {
            if (item.fields?.key && item.fields?.value) {
              items[item.fields.key] = item.fields.value;
              console.log(
                `📦 Item: ${item.fields.key} -> ${item.fields.value}`
              );
            }
          });
        }

        // Listings Table'ı parse et (Table<ID, ListingInfo>)
        const listings: { [nftId: string]: ListingInfo } = {};
        if (fields.listings?.fields?.contents) {
          console.log(
            "🔍 Parsing listings table:",
            fields.listings.fields.contents
          );
          fields.listings.fields.contents.forEach((item: any) => {
            if (item.fields?.key && item.fields?.value?.fields) {
              const listing = item.fields.value.fields;
              listings[item.fields.key] = {
                id: item.fields.key,
                nft_id: item.fields.key,
                seller: listing.seller,
                price: listing.price,
                listed_at: listing.listed_at || 0,
              };
              console.log(
                `💰 Listing: ${item.fields.key} -> ${listing.price} SUI by ${listing.seller}`
              );
            }
          });
        }

        // NFTs Table'ı parse et (Table<ID, TheSavagePet>)
        const nfts: { [nftId: string]: TheSavagePetNFT } = {};
        if (fields.nfts?.fields?.contents) {
          console.log("🔍 Parsing NFTs table:", fields.nfts.fields.contents);
          fields.nfts.fields.contents.forEach((item: any) => {
            if (item.fields?.key && item.fields?.value?.fields) {
              const nftFields = item.fields.value.fields;
              console.log(`🎨 Processing NFT ${item.fields.key}:`, nftFields);

              // Attributes'ları parse et (VecMap<String, String>)
              let attributes: { [key: string]: string } = {};
              if (nftFields.attributes?.fields?.contents) {
                nftFields.attributes.fields.contents.forEach((attr: any) => {
                  if (attr.fields?.key && attr.fields?.value) {
                    attributes[attr.fields.key] = attr.fields.value;
                  }
                });
                console.log(
                  `🏷️ NFT ${item.fields.key} attributes:`,
                  attributes
                );
              }

              // Image URL'yi doğru parse et
              let imageUrl = "";
              if (nftFields.image_url) {
                if (typeof nftFields.image_url === "string") {
                  imageUrl = nftFields.image_url;
                } else if (nftFields.image_url.fields?.url) {
                  imageUrl = nftFields.image_url.fields.url;
                } else if (nftFields.image_url.url) {
                  imageUrl = nftFields.image_url.url;
                }
              }

              nfts[item.fields.key] = {
                id: item.fields.key,
                name: nftFields.name || "Unknown NFT",
                description: nftFields.description || "",
                image_url: imageUrl,
                attributes,
                creator: nftFields.creator || "",
              };

              console.log(`✅ Processed NFT:`, nfts[item.fields.key]);
            }
          });
        }

        const result = {
          id: getObjectId("marketplace_object"),
          items,
          listings,
          nfts,
          profits: fields.profits?.fields?.balance || "0",
          total_items: parseInt(fields.total_items) || 0,
          total_sales: parseInt(fields.total_sales) || 0,
          total_volume: fields.total_volume || "0",
        };

        console.log("🎯 Final marketplace data:", result);
        return result;
      } catch (err) {
        console.error("❌ Failed to fetch marketplace data:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch marketplace data"
        );
        return null;
      }
    }, [suiClient]);

  // Get marketplace listings
  const getMarketplaceListings = useCallback(async (): Promise<
    ListingInfo[]
  > => {
    try {
      const marketplaceData = await getMarketplaceData();
      if (!marketplaceData) return [];

      // Convert listings object to array
      return Object.entries(marketplaceData.listings).map(
        ([nftId, listing]) => ({
          id: nftId,
          nft_id: nftId,
          seller: listing.seller,
          price: listing.price,
          listed_at: listing.listed_at,
        })
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch marketplace listings"
      );
      return [];
    }
  }, [getMarketplaceData]);

  // Get NFTs placed by user in marketplace (sahip olduğu ama marketplace'te olan NFT'ler)
  const getUserNftsInMarketplace = useCallback(
    async (userAddress: string): Promise<TheSavagePetNFT[]> => {
      try {
        const marketplaceData = await getMarketplaceData();
        if (!marketplaceData) return [];

        // Marketplace'teki items tablosundan user'ın NFT'lerini bul
        const userNftIds = Object.entries(marketplaceData.items)
          .filter(([nftId, owner]) => owner === userAddress)
          .map(([nftId]) => nftId);

        // Bu NFT ID'lere sahip NFT objelerini marketplace'ten çek
        const userMarketplaceNfts: TheSavagePetNFT[] = [];

        for (const nftId of userNftIds) {
          if (marketplaceData.nfts[nftId]) {
            const nftData = marketplaceData.nfts[nftId];
            userMarketplaceNfts.push({
              id: nftId,
              name: nftData.name,
              description: nftData.description || "",
              image_url: nftData.image_url,
              attributes: nftData.attributes,
              creator: nftData.creator,
            });
          }
        }

        return userMarketplaceNfts;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch user marketplace NFTs"
        );
        return [];
      }
    },
    [getMarketplaceData]
  );

  // Get user's total NFTs (wallet + marketplace)
  const getAllUserNfts = useCallback(
    async (userAddress: string) => {
      const [walletNfts, marketplaceNfts] = await Promise.all([
        getNftsByOwner(userAddress), // Wallet'taki NFT'ler
        getUserNftsInMarketplace(userAddress), // Marketplace'teki NFT'ler
      ]);

      return {
        walletNfts,
        marketplaceNfts,
        totalNfts: [...walletNfts, ...marketplaceNfts],
      };
    },
    [getNftsByOwner, getUserNftsInMarketplace]
  );

  return {
    // State
    isLoading,
    error,
    contractInfo,

    // Generic function
    callFunction,

    // Specific functions
    mintNft,
    getNftsByOwner,

    // Marketplace functions
    placeNft,
    listNft,
    placeAndListNft,
    delistNft,
    purchaseNft,
    withdrawNft,
    updateListingPrice,
    getMarketplaceData,
    getMarketplaceListings,

    // User NFT functions
    getUserNftsInMarketplace,
    getAllUserNfts,

    // Utilities
    validateConfig: () => validateConfig(),
    getPackageId,
    getObjectId,
    getFunctionName,
  };
};

// Separate hook for contract info only (no wallet connection needed)
export const useContractInfo = () => {
  return {
    contractInfo: getNetworkInfo(),
    getPackageId,
    getObjectId,
    getFunctionName,
    validateConfig: () => validateConfig(),
  };
};
