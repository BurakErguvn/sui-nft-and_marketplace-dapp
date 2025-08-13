"use client";

import { useSuiClient } from "@mysten/dapp-kit";
import { useEffect, useState, useCallback } from "react";
import {
  getEventTypes,
  type TheSavagePetMintEvent,
  type MarketplaceCreatedEvent,
  type NFTPlacedEvent,
  type NFTListedEvent,
  type NFTDelistedEvent,
  type NFTSoldEvent,
  type NFTWithdrawnEvent,
  getPackageId,
} from "@/config/contract";

export type ContractEvent =
  | { type: "MINT"; data: TheSavagePetMintEvent }
  | { type: "MARKETPLACE_CREATED"; data: MarketplaceCreatedEvent }
  | { type: "NFT_PLACED"; data: NFTPlacedEvent }
  | { type: "NFT_LISTED"; data: NFTListedEvent }
  | { type: "NFT_DELISTED"; data: NFTDelistedEvent }
  | { type: "NFT_SOLD"; data: NFTSoldEvent }
  | { type: "NFT_WITHDRAWN"; data: NFTWithdrawnEvent };

export const useEvents = () => {
  const suiClient = useSuiClient();
  const [events, setEvents] = useState<ContractEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get historical events
  const getEvents = useCallback(
    async (
      eventType?: keyof ReturnType<typeof getEventTypes>,
      limit: number = 50,
      descending: boolean = true
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const EVENT_TYPES = getEventTypes();
        const query = eventType
          ? { MoveEventType: EVENT_TYPES[eventType] }
          : { MoveModule: { package: getPackageId(), module: "sui_nft" } };

        const result = await suiClient.queryEvents({
          query,
          limit,
          order: descending ? "descending" : "ascending",
        });

        const parsedEvents: ContractEvent[] = result.data.map((event) => {
          const eventData = event.parsedJson as any;
          const eventType = event.type.split("::").pop();

          switch (eventType) {
            case "TheSavagePetMintEvent":
              return {
                type: "MINT" as const,
                data: {
                  nft_id: eventData.nft_id,
                  name: eventData.name,
                  owner: eventData.owner,
                  timestamp: Number(event.timestampMs),
                } as TheSavagePetMintEvent,
              };
            case "MarketplaceCreated":
              return {
                type: "MARKETPLACE_CREATED" as const,
                data: {
                  marketplace_id: eventData.marketplace_id,
                  creator: eventData.creator,
                  timestamp: Number(event.timestampMs),
                } as MarketplaceCreatedEvent,
              };
            case "NFTPlaced":
              return {
                type: "NFT_PLACED" as const,
                data: {
                  marketplace_id: eventData.marketplace_id,
                  nft_id: eventData.nft_id,
                  owner: eventData.owner,
                  timestamp: Number(event.timestampMs),
                } as NFTPlacedEvent,
              };
            case "NFTListed":
              return {
                type: "NFT_LISTED" as const,
                data: {
                  marketplace_id: eventData.marketplace_id,
                  nft_id: eventData.nft_id,
                  price: eventData.price.toString(),
                  seller: eventData.seller,
                  timestamp: Number(event.timestampMs),
                } as NFTListedEvent,
              };
            case "NFTDelisted":
              return {
                type: "NFT_DELISTED" as const,
                data: {
                  marketplace_id: eventData.marketplace_id,
                  nft_id: eventData.nft_id,
                  seller: eventData.seller,
                  timestamp: Number(event.timestampMs),
                } as NFTDelistedEvent,
              };
            case "NFTSold":
              return {
                type: "NFT_SOLD" as const,
                data: {
                  marketplace_id: eventData.marketplace_id,
                  nft_id: eventData.nft_id,
                  price: eventData.price.toString(),
                  seller: eventData.seller,
                  buyer: eventData.buyer,
                  timestamp: Number(event.timestampMs),
                } as NFTSoldEvent,
              };
            case "NFTWithdrawn":
              return {
                type: "NFT_WITHDRAWN" as const,
                data: {
                  marketplace_id: eventData.marketplace_id,
                  nft_id: eventData.nft_id,
                  owner: eventData.owner,
                  timestamp: Number(event.timestampMs),
                } as NFTWithdrawnEvent,
              };
            default:
              throw new Error(`Unknown event type: ${eventType}`);
          }
        });

        setEvents(parsedEvents);
        return parsedEvents;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch events";
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [suiClient]
  );

  // Get specific event types
  const getMintEvents = useCallback(() => getEvents("MINT"), [getEvents]);

  const getMarketplaceEvents = useCallback(() => {
    // Get all marketplace events
    return getEvents().then((events) =>
      events.filter((event) =>
        [
          "NFT_PLACED",
          "NFT_LISTED",
          "NFT_DELISTED",
          "NFT_SOLD",
          "NFT_WITHDRAWN",
        ].includes(event.type)
      )
    );
  }, [getEvents]);

  // Get events for specific NFT
  const getEventsForNft = useCallback(
    async (nftId: string) => {
      const allEvents = await getEvents();
      return allEvents.filter((event) => {
        switch (event.type) {
          case "MINT":
            return event.data.nft_id === nftId;
          case "NFT_PLACED":
          case "NFT_LISTED":
          case "NFT_DELISTED":
          case "NFT_SOLD":
          case "NFT_WITHDRAWN":
            return event.data.nft_id === nftId;
          default:
            return false;
        }
      });
    },
    [getEvents]
  );

  // Get events for specific marketplace
  const getEventsForMarketplace = useCallback(
    async (marketplaceId: string) => {
      const allEvents = await getEvents();
      return allEvents.filter((event) => {
        switch (event.type) {
          case "MARKETPLACE_CREATED":
            return event.data.marketplace_id === marketplaceId;
          case "NFT_PLACED":
          case "NFT_LISTED":
          case "NFT_DELISTED":
          case "NFT_SOLD":
          case "NFT_WITHDRAWN":
            return event.data.marketplace_id === marketplaceId;
          default:
            return false;
        }
      });
    },
    [getEvents]
  );

  // Get recent marketplace activity
  const getRecentActivity = useCallback(
    async (limit: number = 10) => {
      return getMarketplaceEvents().then((events) => events.slice(0, limit));
    },
    [getMarketplaceEvents]
  );

  // Get user activity (as buyer, seller, or owner)
  const getUserActivity = useCallback(
    async (userAddress: string) => {
      const allEvents = await getEvents();
      return allEvents.filter((event) => {
        switch (event.type) {
          case "MINT":
            return event.data.owner === userAddress;
          case "MARKETPLACE_CREATED":
            return event.data.creator === userAddress;
          case "NFT_PLACED":
          case "NFT_WITHDRAWN":
            return event.data.owner === userAddress;
          case "NFT_LISTED":
          case "NFT_DELISTED":
            return event.data.seller === userAddress;
          case "NFT_SOLD":
            return (
              event.data.seller === userAddress ||
              event.data.buyer === userAddress
            );
          default:
            return false;
        }
      });
    },
    [getEvents]
  );

  // Get sales statistics
  const getSalesStats = useCallback(async () => {
    const soldEvents = await getEvents().then(
      (events) =>
        events.filter((event) => event.type === "NFT_SOLD") as Array<{
          type: "NFT_SOLD";
          data: NFTSoldEvent;
        }>
    );

    const totalSales = soldEvents.length;
    const totalVolume = soldEvents.reduce(
      (sum, event) => sum + Number(event.data.price),
      0
    );
    const averagePrice = totalSales > 0 ? totalVolume / totalSales : 0;

    return {
      totalSales,
      totalVolume: totalVolume.toString(),
      averagePrice: averagePrice.toString(),
      recentSales: soldEvents.slice(0, 10),
    };
  }, [getEvents]);

  return {
    events,
    isLoading,
    error,

    // Event fetchers
    getEvents,
    getMintEvents,
    getMarketplaceEvents,
    getEventsForNft,
    getEventsForMarketplace,
    getRecentActivity,
    getUserActivity,
    getSalesStats,

    // Utilities
    refreshEvents: () => getEvents(),
  };
};

// Real-time event subscription hook
export const useEventSubscription = () => {
  const [newEvents, setNewEvents] = useState<ContractEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to real-time events
  const subscribeToEvents = useCallback(
    (eventTypes?: (keyof ReturnType<typeof getEventTypes>)[]) => {
      // Bu kısım WebSocket connection gerektirir
      // Sui network'ünde real-time event subscription için
      // suiClient.subscribeEvent() kullanılabilir

      console.log("Event subscription would be implemented here");
      console.log("Event types to subscribe:", eventTypes);

      // Placeholder implementation
      setIsConnected(true);

      // Cleanup function
      return () => {
        setIsConnected(false);
        setNewEvents([]);
      };
    },
    []
  );

  return {
    newEvents,
    isConnected,
    error,
    subscribeToEvents,
  };
};

// Event formatting utilities
export const formatEventData = {
  formatPrice: (price: string) => {
    // Convert MIST to SUI (1 SUI = 10^9 MIST)
    const sui = Number(price) / 1e9;
    return `${sui.toFixed(4)} SUI`;
  },

  formatTimestamp: (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  },

  formatAddress: (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  },

  getEventDescription: (event: ContractEvent) => {
    switch (event.type) {
      case "MINT":
        return `NFT "${
          event.data.name
        }" minted by ${formatEventData.formatAddress(event.data.owner)}`;
      case "MARKETPLACE_CREATED":
        return `Marketplace created by ${formatEventData.formatAddress(
          event.data.creator
        )}`;
      case "NFT_PLACED":
        return `NFT placed in marketplace by ${formatEventData.formatAddress(
          event.data.owner
        )}`;
      case "NFT_LISTED":
        return `NFT listed for ${formatEventData.formatPrice(
          event.data.price
        )} by ${formatEventData.formatAddress(event.data.seller)}`;
      case "NFT_DELISTED":
        return `NFT delisted by ${formatEventData.formatAddress(
          event.data.seller
        )}`;
      case "NFT_SOLD":
        return `NFT sold for ${formatEventData.formatPrice(
          event.data.price
        )} to ${formatEventData.formatAddress(event.data.buyer)}`;
      case "NFT_WITHDRAWN":
        return `NFT withdrawn by ${formatEventData.formatAddress(
          event.data.owner
        )}`;
      default:
        return "Unknown event";
    }
  },

  getEventIcon: (eventType: ContractEvent["type"]) => {
    switch (eventType) {
      case "MINT":
        return "🎨";
      case "MARKETPLACE_CREATED":
        return "🏪";
      case "NFT_PLACED":
        return "📤";
      case "NFT_LISTED":
        return "🏷️";
      case "NFT_DELISTED":
        return "❌";
      case "NFT_SOLD":
        return "💰";
      case "NFT_WITHDRAWN":
        return "📥";
      default:
        return "❓";
    }
  },
};
