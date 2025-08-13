"use client";

import { useEffect, useState } from "react";
import {
  useEvents,
  type ContractEvent,
  formatEventData,
} from "@/hooks/use-events";
import styles from "./event-feed.module.css";

interface EventFeedProps {
  nftId?: string;
  marketplaceId?: string;
  userAddress?: string;
  eventTypes?: string[];
  limit?: number;
  showIcons?: boolean;
}

export default function EventFeed({
  nftId,
  marketplaceId,
  userAddress,
  eventTypes,
  limit = 10,
  showIcons = true,
}: EventFeedProps) {
  const {
    events,
    isLoading,
    error,
    getEvents,
    getEventsForNft,
    getEventsForMarketplace,
    getUserActivity,
    getRecentActivity,
  } = useEvents();

  const [displayEvents, setDisplayEvents] = useState<ContractEvent[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEvents = async () => {
    try {
      let fetchedEvents: ContractEvent[];

      if (nftId) {
        fetchedEvents = await getEventsForNft(nftId);
      } else if (marketplaceId) {
        fetchedEvents = await getEventsForMarketplace(marketplaceId);
      } else if (userAddress) {
        fetchedEvents = await getUserActivity(userAddress);
      } else {
        fetchedEvents = await getRecentActivity(limit);
      }

      // Filter by event types if specified
      if (eventTypes && eventTypes.length > 0) {
        fetchedEvents = fetchedEvents.filter((event) =>
          eventTypes.includes(event.type)
        );
      }

      setDisplayEvents(fetchedEvents.slice(0, limit));
    } catch (err) {
      console.error("Failed to fetch events:", err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [nftId, marketplaceId, userAddress, limit, eventTypes]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <div className={styles.eventFeed}>
        <div className={styles.loading}>Loading events...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.eventFeed}>
        <div className={styles.error}>Error: {error}</div>
      </div>
    );
  }

  return (
    <div className={styles.eventFeed}>
      <div className={styles.header}>
        <h3>
          {nftId
            ? "NFT Activity"
            : marketplaceId
            ? "Marketplace Activity"
            : userAddress
            ? "User Activity"
            : "Recent Activity"}
        </h3>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className={styles.refreshButton}
        >
          {refreshing ? "🔄" : "↻"} Refresh
        </button>
      </div>

      {displayEvents.length === 0 ? (
        <p className={styles.noEvents}>No events found</p>
      ) : (
        <ul className={styles.eventList}>
          {displayEvents.map((event, index) => (
            <li
              key={index}
              className={`${styles.eventItem} ${
                styles[event.type.toLowerCase()]
              }`}
            >
              <div className={styles.eventHeader}>
                {showIcons && (
                  <span className={styles.eventIcon}>
                    {formatEventData.getEventIcon(event.type)}
                  </span>
                )}
                <span className={styles.eventType}>
                  {event.type.replace(/_/g, " ")}
                </span>
                <span className={styles.eventTime}>
                  {"timestamp" in event.data && event.data.timestamp
                    ? formatEventData.formatTimestamp(event.data.timestamp)
                    : "Unknown time"}
                </span>
              </div>

              <div className={styles.eventDescription}>
                {formatEventData.getEventDescription(event)}
              </div>

              <div className={styles.eventDetails}>
                {event.type === "MINT" && (
                  <div className={styles.mintDetails}>
                    <span>NFT: {event.data.nft_id}</span>
                    <span>Name: {event.data.name}</span>
                  </div>
                )}

                {(event.type === "NFT_LISTED" || event.type === "NFT_SOLD") && (
                  <div className={styles.priceDetails}>
                    <span className={styles.price}>
                      {formatEventData.formatPrice(event.data.price)}
                    </span>
                  </div>
                )}

                {event.type === "NFT_SOLD" && (
                  <div className={styles.saleDetails}>
                    <span>
                      Seller: {formatEventData.formatAddress(event.data.seller)}
                    </span>
                    <span>
                      Buyer: {formatEventData.formatAddress(event.data.buyer)}
                    </span>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Event statistics component
export function EventStats() {
  const { getSalesStats, isLoading, error } = useEvents();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    getSalesStats().then(setStats);
  }, [getSalesStats]);

  if (isLoading) return <div>Loading stats...</div>;
  if (error) return <div>Error loading stats: {error}</div>;
  if (!stats) return <div>No stats available</div>;

  return (
    <div className={styles.eventStats}>
      <h3>Marketplace Statistics</h3>
      <div className={styles.statsGrid}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Total Sales</span>
          <span className={styles.statValue}>{stats.totalSales}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Total Volume</span>
          <span className={styles.statValue}>
            {formatEventData.formatPrice(stats.totalVolume)}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Average Price</span>
          <span className={styles.statValue}>
            {formatEventData.formatPrice(stats.averagePrice)}
          </span>
        </div>
      </div>
    </div>
  );
}
