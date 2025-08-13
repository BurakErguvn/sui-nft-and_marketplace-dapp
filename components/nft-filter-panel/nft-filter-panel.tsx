"use client";

import { useState, useEffect } from "react";
import styles from "./nft-filter-panel.module.css";

interface FilterOptions {
  attributeFilters: { [key: string]: string[] };
  priceRange: { min: number; max: number };
  sortBy: "name" | "price" | "newest" | "oldest";
  sortOrder: "asc" | "desc";
}

interface NFTFilterPanelProps {
  availableAttributes: { [key: string]: string[] };
  currentFilters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  totalNfts: number;
  filteredNfts: number;
}

export default function NFTFilterPanel({
  availableAttributes,
  currentFilters,
  onFilterChange,
  totalNfts,
  filteredNfts,
}: NFTFilterPanelProps) {
  const [localFilters, setLocalFilters] =
    useState<FilterOptions>(currentFilters);
  const [priceInputs, setPriceInputs] = useState({
    min: currentFilters.priceRange.min.toString(),
    max: currentFilters.priceRange.max.toString(),
  });

  useEffect(() => {
    setLocalFilters(currentFilters);
    setPriceInputs({
      min: currentFilters.priceRange.min.toString(),
      max: currentFilters.priceRange.max.toString(),
    });
  }, [currentFilters]);

  const handleAttributeFilterChange = (
    attributeKey: string,
    value: string,
    checked: boolean
  ) => {
    const newFilters = { ...localFilters };

    if (!newFilters.attributeFilters[attributeKey]) {
      newFilters.attributeFilters[attributeKey] = [];
    }

    if (checked) {
      newFilters.attributeFilters[attributeKey] = [
        ...newFilters.attributeFilters[attributeKey],
        value,
      ];
    } else {
      newFilters.attributeFilters[attributeKey] = newFilters.attributeFilters[
        attributeKey
      ].filter((v) => v !== value);
    }

    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handlePriceRangeChange = () => {
    const min = parseFloat(priceInputs.min) || 0;
    const max = parseFloat(priceInputs.max) || 0;

    const newFilters = {
      ...localFilters,
      priceRange: { min, max },
    };

    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSortChange = (
    sortBy: FilterOptions["sortBy"],
    sortOrder: FilterOptions["sortOrder"]
  ) => {
    const newFilters = {
      ...localFilters,
      sortBy,
      sortOrder,
    };

    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    const clearedFilters: FilterOptions = {
      attributeFilters: {},
      priceRange: { min: 0, max: 0 },
      sortBy: "newest",
      sortOrder: "desc",
    };

    setLocalFilters(clearedFilters);
    setPriceInputs({ min: "0", max: "0" });
    onFilterChange(clearedFilters);
  };

  const isAttributeSelected = (attributeKey: string, value: string) => {
    return (
      localFilters.attributeFilters[attributeKey]?.includes(value) || false
    );
  };

  return (
    <div className={styles.filterPanel}>
      <div className={styles.filterHeader}>
        <h3 className={styles.filterTitle}>Filters</h3>
        <div className={styles.filterStats}>
          <span className={styles.filteredCount}>{filteredNfts}</span>
          <span className={styles.totalCount}>/ {totalNfts}</span>
        </div>
      </div>

      {Object.keys(localFilters.attributeFilters).length > 0 && (
        <button onClick={clearAllFilters} className={styles.clearButton}>
          Clear All Filters
        </button>
      )}

      {/* Sort Options */}
      <div className={styles.filterSection}>
        <h4 className={styles.sectionTitle}>Sort By</h4>
        <div className={styles.sortOptions}>
          <select
            value={`${localFilters.sortBy}-${localFilters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split("-") as [
                FilterOptions["sortBy"],
                FilterOptions["sortOrder"]
              ];
              handleSortChange(sortBy, sortOrder);
            }}
            className={styles.sortSelect}
          >
            <option value="newest-desc">Newest First</option>
            <option value="oldest-asc">Oldest First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name-asc">Name: A to Z</option>
            <option value="name-desc">Name: Z to A</option>
          </select>
        </div>
      </div>

      {/* Price Range Filter */}
      <div className={styles.filterSection}>
        <h4 className={styles.sectionTitle}>Price Range (SUI)</h4>
        <div className={styles.priceRange}>
          <div className={styles.priceInputGroup}>
            <label className={styles.priceLabel}>Min:</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={priceInputs.min}
              onChange={(e) =>
                setPriceInputs((prev) => ({ ...prev, min: e.target.value }))
              }
              onBlur={handlePriceRangeChange}
              className={styles.priceInput}
              placeholder="0"
            />
          </div>
          <div className={styles.priceInputGroup}>
            <label className={styles.priceLabel}>Max:</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={priceInputs.max}
              onChange={(e) =>
                setPriceInputs((prev) => ({ ...prev, max: e.target.value }))
              }
              onBlur={handlePriceRangeChange}
              className={styles.priceInput}
              placeholder="No limit"
            />
          </div>
        </div>
      </div>

      {/* Attribute Filters */}
      {Object.entries(availableAttributes).map(([attributeKey, values]) => (
        <div key={attributeKey} className={styles.filterSection}>
          <h4 className={styles.sectionTitle}>{attributeKey}</h4>
          <div className={styles.attributeOptions}>
            {values.map((value) => (
              <label key={value} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={isAttributeSelected(attributeKey, value)}
                  onChange={(e) =>
                    handleAttributeFilterChange(
                      attributeKey,
                      value,
                      e.target.checked
                    )
                  }
                  className={styles.checkbox}
                />
                <span className={styles.checkboxText}>{value}</span>
              </label>
            ))}
          </div>
        </div>
      ))}

      {Object.keys(availableAttributes).length === 0 && (
        <div className={styles.noAttributes}>
          <p>No attributes available for filtering</p>
        </div>
      )}
    </div>
  );
}
