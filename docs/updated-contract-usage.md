# Updated Contract Usage Examples

Bu dokümantasyon güncellenmiş smart contract yapısına göre hook'ların nasıl kullanılacağını gösterir.

## Smart Contract Structure

### TheSavagePet NFT

```move
public struct TheSavagePet has key, store {
    id: UID,
    name: String,
    description: String,
    image_url: Url,
    attributes: VecMap<String, String>,
    creator: address,
}
```

### Marketplace

```move
public struct Marketplace has key, store {
    id: UID,
    items: Table<ID, address>, // NFT ID -> Owner address
    listings: Table<ID, ListingInfo>, // NFT ID -> Listing Info
    nfts: Table<ID, TheSavagePet>, // NFT ID -> NFT Object
    profits: Coin<SUI>, // Marketplace accumulated profits
    total_items: u64, // Total items in marketplace
    total_sales: u64, // Total completed sales
    total_volume: u64, // Total trading volume in SUI
}
```

## Environment Setup

`.env.local` dosyanızda:

```env
PACKAGE_ID=0x...
THE_SAVAGE_PET_REGISTRY_ID=0x...
MARKETPLACE_OBJECT_ID=0x...
NEXT_PUBLIC_TESTNET_RPC=https://fullnode.testnet.sui.io:443
NEXT_PUBLIC_NETWORK=testnet
```

## Usage Examples

### 1. Mint NFT

```tsx
import { useContract } from "@/hooks/use-contract";
import { useCurrentAccount } from "@mysten/dapp-kit";

function MintPage() {
  const account = useCurrentAccount();
  const { mintNft, isLoading, error } = useContract();

  const handleMint = async () => {
    try {
      await mintNft(
        "Savage Cat #1", // name
        "A fierce cat from the savage world", // description
        "https://example.com/cat.png", // image_url
        {
          // attributes
          Type: "Cat",
          Rarity: "Rare",
          Power: "85",
          Element: "Fire",
        }
      );
      alert("NFT successfully minted!");
    } catch (err) {
      console.error("Mint failed:", err);
    }
  };

  return (
    <div>
      <h1>Mint Your Pet NFT</h1>
      <button onClick={handleMint} disabled={isLoading || !account}>
        {isLoading ? "Minting..." : "Mint Pet NFT"}
      </button>
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
    </div>
  );
}
```

### 2. Get User NFTs

```tsx
import { useContract } from "@/hooks/use-contract";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useState, useEffect } from "react";

function MyNFTs() {
  const account = useCurrentAccount();
  const { getNftsByOwner } = useContract();
  const [nfts, setNfts] = useState([]);

  useEffect(() => {
    if (account?.address) {
      getNftsByOwner(account.address).then(setNfts);
    }
  }, [account, getNftsByOwner]);

  return (
    <div>
      <h2>My NFTs</h2>
      {nfts.map((nft) => (
        <div
          key={nft.id}
          style={{ border: "1px solid #ccc", padding: "10px", margin: "10px" }}
        >
          <h3>{nft.name}</h3>
          <img src={nft.image_url} alt={nft.name} style={{ width: "200px" }} />
          <p>{nft.description}</p>
          <div>
            <h4>Attributes:</h4>
            {Object.entries(nft.attributes).map(([key, value]) => (
              <p key={key}>
                <strong>{key}:</strong> {value}
              </p>
            ))}
          </div>
          <p>
            <small>Creator: {nft.creator}</small>
          </p>
        </div>
      ))}
    </div>
  );
}
```

### 3. Place and List NFT

```tsx
function SellNFT({ nftId }: { nftId: string }) {
  const { placeAndListNft, isLoading } = useContract();
  const [price, setPrice] = useState("");

  const handleSell = async () => {
    try {
      // Price in MIST (1 SUI = 10^9 MIST)
      const priceInMist = (parseFloat(price) * 1_000_000_000).toString();
      await placeAndListNft(nftId, priceInMist);
      alert("NFT listed for sale!");
    } catch (err) {
      console.error("Listing failed:", err);
    }
  };

  return (
    <div>
      <h3>Sell Your NFT</h3>
      <input
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="Price in SUI"
        step="0.1"
      />
      <button onClick={handleSell} disabled={isLoading || !price}>
        {isLoading ? "Listing..." : "List for Sale"}
      </button>
    </div>
  );
}
```

### 4. Marketplace Browser

```tsx
function Marketplace() {
  const { getMarketplaceListings, getMarketplaceData, purchaseNft, isLoading } =
    useContract();
  const [listings, setListings] = useState([]);
  const [marketplaceStats, setMarketplaceStats] = useState(null);

  useEffect(() => {
    const loadMarketplace = async () => {
      const [listingsData, statsData] = await Promise.all([
        getMarketplaceListings(),
        getMarketplaceData(),
      ]);
      setListings(listingsData);
      setMarketplaceStats(statsData);
    };

    loadMarketplace();
  }, [getMarketplaceListings, getMarketplaceData]);

  const handlePurchase = async (nftId: string, price: string) => {
    try {
      // Bu kısımda Coin<SUI> object'i oluşturmanız gerekecek
      // Gerçek implementasyonda coin selection/split logic eklenmelidir
      await purchaseNft(nftId, price);
      alert("Purchase successful!");
    } catch (err) {
      console.error("Purchase failed:", err);
    }
  };

  return (
    <div>
      <h2>Marketplace</h2>

      {marketplaceStats && (
        <div
          style={{
            backgroundColor: "#f5f5f5",
            padding: "15px",
            marginBottom: "20px",
          }}
        >
          <h3>Marketplace Stats</h3>
          <p>Total Items: {marketplaceStats.total_items}</p>
          <p>Total Sales: {marketplaceStats.total_sales}</p>
          <p>
            Total Volume:{" "}
            {(parseInt(marketplaceStats.total_volume) / 1_000_000_000).toFixed(
              2
            )}{" "}
            SUI
          </p>
          <p>
            Marketplace Profits:{" "}
            {(parseInt(marketplaceStats.profits) / 1_000_000_000).toFixed(2)}{" "}
            SUI
          </p>
        </div>
      )}

      <div>
        <h3>Available NFTs</h3>
        {listings.map((listing) => (
          <div
            key={listing.id}
            style={{
              border: "1px solid #ddd",
              padding: "15px",
              margin: "10px",
            }}
          >
            <p>
              <strong>NFT ID:</strong> {listing.nft_id}
            </p>
            <p>
              <strong>Seller:</strong> {listing.seller}
            </p>
            <p>
              <strong>Price:</strong>{" "}
              {(parseInt(listing.price) / 1_000_000_000).toFixed(2)} SUI
            </p>
            <button
              onClick={() => handlePurchase(listing.nft_id, listing.price)}
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : "Buy Now"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 5. NFT Management

```tsx
function NFTManagement({ nftId }: { nftId: string }) {
  const { delistNft, withdrawNft, updateListingPrice, isLoading } =
    useContract();
  const [newPrice, setNewPrice] = useState("");

  const handleDelist = async () => {
    try {
      await delistNft(nftId);
      alert("NFT delisted!");
    } catch (err) {
      console.error("Delist failed:", err);
    }
  };

  const handleWithdraw = async () => {
    try {
      await withdrawNft(nftId);
      alert("NFT withdrawn from marketplace!");
    } catch (err) {
      console.error("Withdraw failed:", err);
    }
  };

  const handleUpdatePrice = async () => {
    try {
      const priceInMist = (parseFloat(newPrice) * 1_000_000_000).toString();
      await updateListingPrice(nftId, priceInMist);
      alert("Price updated!");
    } catch (err) {
      console.error("Price update failed:", err);
    }
  };

  return (
    <div>
      <h3>Manage Your NFT</h3>

      <button onClick={handleDelist} disabled={isLoading}>
        {isLoading ? "Processing..." : "Delist NFT"}
      </button>

      <button onClick={handleWithdraw} disabled={isLoading}>
        {isLoading ? "Processing..." : "Withdraw NFT"}
      </button>

      <div style={{ marginTop: "10px" }}>
        <input
          type="number"
          value={newPrice}
          onChange={(e) => setNewPrice(e.target.value)}
          placeholder="New price in SUI"
          step="0.1"
        />
        <button onClick={handleUpdatePrice} disabled={isLoading || !newPrice}>
          {isLoading ? "Updating..." : "Update Price"}
        </button>
      </div>
    </div>
  );
}
```

## Available Functions

### NFT Functions

- `mintNft(name, description, image_url, attributes)` - Mint new NFT
- `getNftsByOwner(address)` - Get all NFTs owned by address

### Marketplace Functions

- `placeNft(nftId)` - Place NFT in marketplace (without listing)
- `listNft(nftId, price)` - List NFT for sale (must be placed first)
- `placeAndListNft(nftId, price)` - Place and list in one transaction
- `delistNft(nftId)` - Remove NFT from listings
- `purchaseNft(nftId, payment)` - Buy an NFT
- `withdrawNft(nftId)` - Remove NFT from marketplace
- `updateListingPrice(nftId, newPrice)` - Update listing price
- `getMarketplaceData()` - Get marketplace statistics
- `getMarketplaceListings()` - Get all active listings

## Price Handling

Sui blockchain uses MIST as the smallest unit (1 SUI = 10^9 MIST). Always convert prices:

```tsx
// Convert SUI to MIST for contract calls
const priceInMist = (priceInSui * 1_000_000_000).toString();

// Convert MIST to SUI for display
const priceInSui = parseInt(priceInMist) / 1_000_000_000;
```

## Error Handling

```tsx
const { error, isLoading, validateConfig } = useContract();

// Check configuration before operations
if (!validateConfig()) {
  console.error("Contract not properly configured!");
  return;
}

// Handle errors
if (error) {
  console.error("Contract error:", error);
}
```
