# Event Handling Usage Examples

Bu dokümantasyon smart contract event'lerinin frontend'te nasıl yakalandığını ve kullanıldığını gösterir.

## Event Types

Contract'taki event struct'ları:

```move
public struct TheSavagePetMintEvent has drop,copy {
    nft_id: ID,
    name: String,
    owner: address,
}

public struct NFTPlaced has copy, drop {
    marketplace_id: ID,
    nft_id: ID,
    owner: address,
}

public struct NFTListed has copy, drop {
    marketplace_id: ID,
    nft_id: ID,
    price: u64,
    seller: address,
}

public struct NFTSold has copy, drop {
    marketplace_id: ID,
    nft_id: ID,
    price: u64,
    seller: address,
    buyer: address,
}
```

## Kullanım Örnekleri

### 1. Transaction'da Event Yakalama

```tsx
import { useContract } from "@/hooks/use-contract";

function MintComponent() {
  const { mintNft, isLoading } = useContract();

  const handleMint = async () => {
    try {
      const result = await mintNft(
        "Savage Cat #1",
        "https://example.com/cat.png",
        { Type: "Cat", Rarity: "Rare" }
      );

      // Event data'sını kontrol et
      if ((result as any).mintEventData) {
        const eventData = (result as any).mintEventData;
        console.log("Minted NFT ID:", eventData.nft_id);
        console.log("Owner:", eventData.owner);
        console.log("Name:", eventData.name);

        // UI'ı güncelle veya başka işlemler yap
        alert(`NFT ${eventData.name} successfully minted!`);
      }
    } catch (error) {
      console.error("Mint failed:", error);
    }
  };

  return (
    <button onClick={handleMint} disabled={isLoading}>
      {isLoading ? "Minting..." : "Mint NFT"}
    </button>
  );
}
```

### 2. Historical Event'leri Getirme

```tsx
import { useEvents } from "@/hooks/use-events";
import { useEffect, useState } from "react";

function NFTHistory({ nftId }: { nftId: string }) {
  const { getEventsForNft, isLoading } = useEvents();
  const [nftEvents, setNftEvents] = useState([]);

  useEffect(() => {
    if (nftId) {
      getEventsForNft(nftId).then(setNftEvents);
    }
  }, [nftId, getEventsForNft]);

  if (isLoading) return <div>Loading NFT history...</div>;

  return (
    <div>
      <h3>NFT History</h3>
      {nftEvents.map((event, index) => (
        <div key={index}>
          <strong>{event.type}</strong>:{" "}
          {formatEventData.getEventDescription(event)}
        </div>
      ))}
    </div>
  );
}
```

### 3. Event Feed Komponenti

```tsx
import EventFeed from "@/components/event-feed/event-feed";

function MarketplacePage() {
  return (
    <div>
      <h1>Marketplace</h1>

      {/* Recent marketplace activity */}
      <EventFeed
        limit={20}
        eventTypes={["NFT_LISTED", "NFT_SOLD", "NFT_DELISTED"]}
        showIcons={true}
      />
    </div>
  );
}

function UserProfilePage({ userAddress }: { userAddress: string }) {
  return (
    <div>
      <h1>User Profile</h1>

      {/* User specific activity */}
      <EventFeed userAddress={userAddress} limit={15} />
    </div>
  );
}

function NFTDetailPage({ nftId }: { nftId: string }) {
  return (
    <div>
      <h1>NFT Details</h1>

      {/* NFT specific history */}
      <EventFeed nftId={nftId} showIcons={true} />
    </div>
  );
}
```

### 4. Sales Statistics

```tsx
import { useEvents } from "@/hooks/use-events";
import { EventStats } from "@/components/event-feed/event-feed";

function StatisticsPage() {
  const { getSalesStats } = useEvents();
  const [customStats, setCustomStats] = useState(null);

  useEffect(() => {
    // Özel istatistik hesaplamaları
    getSalesStats().then((stats) => {
      setCustomStats({
        ...stats,
        // Ek hesaplamalar
        dailyVolume: calculateDailyVolume(stats.recentSales),
        topSellers: getTopSellers(stats.recentSales),
      });
    });
  }, [getSalesStats]);

  return (
    <div>
      <h1>Marketplace Statistics</h1>

      {/* Built-in stats component */}
      <EventStats />

      {/* Custom stats */}
      {customStats && (
        <div>
          <h3>Advanced Statistics</h3>
          <p>
            Daily Volume: {formatEventData.formatPrice(customStats.dailyVolume)}
          </p>
          {/* More custom stats */}
        </div>
      )}
    </div>
  );
}
```

### 5. Real-time Event Monitoring

```tsx
import { useEventSubscription } from "@/hooks/use-events";

function RealtimeMonitor() {
  const { subscribeToEvents, newEvents, isConnected } = useEventSubscription();

  useEffect(() => {
    // Subscribe to specific events
    const unsubscribe = subscribeToEvents(["NFT_SOLD", "NFT_LISTED"]);

    return unsubscribe;
  }, [subscribeToEvents]);

  useEffect(() => {
    // Handle new events
    if (newEvents.length > 0) {
      const latestEvent = newEvents[newEvents.length - 1];

      if (latestEvent.type === "NFT_SOLD") {
        // Show notification for new sale
        showNotification(
          `NFT sold for ${formatEventData.formatPrice(latestEvent.data.price)}!`
        );
      }
    }
  }, [newEvents]);

  return (
    <div>
      <div>Status: {isConnected ? "🟢 Connected" : "🔴 Disconnected"}</div>
      <div>New Events: {newEvents.length}</div>
    </div>
  );
}
```

### 6. Event Filtering ve Searching

```tsx
function EventExplorer() {
  const { getEvents } = useEvents();
  const [filters, setFilters] = useState({
    eventType: "",
    dateRange: "",
    priceRange: "",
  });
  const [filteredEvents, setFilteredEvents] = useState([]);

  const applyFilters = async () => {
    let events = await getEvents();

    // Event type filter
    if (filters.eventType) {
      events = events.filter((event) => event.type === filters.eventType);
    }

    // Price range filter (for sale events)
    if (
      filters.priceRange &&
      ["NFT_LISTED", "NFT_SOLD"].includes(filters.eventType)
    ) {
      const [min, max] = filters.priceRange.split("-").map(Number);
      events = events.filter((event) => {
        const price = Number(event.data.price) / 1e9; // Convert to SUI
        return price >= min && price <= max;
      });
    }

    // Date range filter
    if (filters.dateRange) {
      const now = Date.now();
      const range = {
        "1d": 24 * 60 * 60 * 1000,
        "7d": 7 * 24 * 60 * 60 * 1000,
        "30d": 30 * 24 * 60 * 60 * 1000,
      }[filters.dateRange];

      if (range) {
        events = events.filter(
          (event) =>
            "timestamp" in event.data && now - event.data.timestamp! < range
        );
      }
    }

    setFilteredEvents(events);
  };

  return (
    <div>
      <div>
        <select
          value={filters.eventType}
          onChange={(e) =>
            setFilters({ ...filters, eventType: e.target.value })
          }
        >
          <option value="">All Events</option>
          <option value="MINT">Mint Events</option>
          <option value="NFT_LISTED">Listed Events</option>
          <option value="NFT_SOLD">Sold Events</option>
        </select>

        <select
          value={filters.dateRange}
          onChange={(e) =>
            setFilters({ ...filters, dateRange: e.target.value })
          }
        >
          <option value="">All Time</option>
          <option value="1d">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>

        <button onClick={applyFilters}>Apply Filters</button>
      </div>

      <EventFeed events={filteredEvents} />
    </div>
  );
}
```

## Utilities

### Event Data Formatting

```tsx
import { formatEventData } from "@/hooks/use-events";

// Price formatting
const price = formatEventData.formatPrice("1000000000"); // "1.0000 SUI"

// Address formatting
const address = formatEventData.formatAddress("0x123...abc"); // "0x123...abc"

// Timestamp formatting
const time = formatEventData.formatTimestamp(1643723400000); // "Feb 1, 2022, 10:30:00 AM"

// Event description
const description = formatEventData.getEventDescription(event); // "NFT sold for 1.0000 SUI to 0x123...abc"

// Event icon
const icon = formatEventData.getEventIcon("NFT_SOLD"); // "💰"
```

## Error Handling

```tsx
function EventHandler() {
  const { getEvents, error, isLoading } = useEvents();

  const handleEventFetch = async () => {
    try {
      const events = await getEvents();
      // Process events
    } catch (err) {
      console.error("Event fetch failed:", err);
      // Handle error
    }
  };

  if (error) {
    return <div>Error loading events: {error}</div>;
  }

  if (isLoading) {
    return <div>Loading events...</div>;
  }

  return <button onClick={handleEventFetch}>Load Events</button>;
}
```

Bu event handling sistemi ile smart contract'taki tüm aktiviteleri kullanıcıya real-time olarak gösterebilir ve marketplace'in tüm geçmişini takip edebilirsiniz.
