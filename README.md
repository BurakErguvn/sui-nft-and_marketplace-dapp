## DeFi Mint DApp

Full-stack NFT minting and marketplace frontend for a Sui Move smart contract collection ("TheSavagePet"). Provides minting, user NFT management, marketplace listing, purchasing, delisting, price updates, and real‑time / historical event tracking.

### On-Chain Smart Contract Repository

The Move smart contracts powering this dApp live here:

https://github.com/BurakErguvn/sui-nft-and-marketplace

Clone / inspect that repository for the on-chain modules, event structs, and deployment instructions. This frontend consumes those published package IDs via environment variables.

### Key Features

- Wallet connection & network aware config (devnet / testnet / mainnet)
- Mint TheSavagePet NFTs with metadata & attributes
- View user-owned NFTs
- Marketplace: list, update price, purchase, delist, withdraw
- Aggregated marketplace statistics (items, sales, volume, profits)
- Event system: mint, listed, sold, delisted + history & live feed
- Reusable hooks: `useContract`, `useEvents`, `useContractInfo`

### Tech Stack

- Next.js App Router + TypeScript
- @mysten/dapp-kit (Sui wallet & RPC)
- React hooks for contract + event abstraction

### Directory Layout (trimmed)

```
app/                 # Pages (mint, marketplace, my-nft, dynamic nft detail)
components/          # UI + feature components (cards, modals, event feed)
hooks/               # Contract & events hooks
config/contract.ts   # Network + contract configuration logic
docs/                # Extended usage & examples
assets/ & public/    # Static images & metadata
```

### Environment Variables

Create `.env.local` (see examples in `docs/contract-config-usage.md`). Typical keys:

```
NEXT_PUBLIC_NETWORK=testnet
NEXT_PUBLIC_TESTNET_PACKAGE_ID=0x...
NEXT_PUBLIC_TESTNET_COLLECTION=0x...
NEXT_PUBLIC_TESTNET_MINT_CAP=0x...
PACKAGE_ID=0x...
THE_SAVAGE_PET_REGISTRY_ID=0x...
MARKETPLACE_OBJECT_ID=0x...
NEXT_PUBLIC_TESTNET_RPC=https://fullnode.testnet.sui.io:443
```

Rules:

1. Public runtime vars use `NEXT_PUBLIC_` prefix.
2. All IDs are 0x-prefixed 64-char hex.
3. Allowed networks: `devnet`, `testnet`, `mainnet`.

### Install & Run

```
npm install
npm run dev
# open http://localhost:3000
```

### Core Hooks

`useContract()` exposes NFT + marketplace functions:

- `mintNft(name, description, image_url, attributes)`
- `getNftsByOwner(address)`
- `placeNft`, `listNft`, `placeAndListNft`
- `delistNft`, `withdrawNft`, `updateListingPrice`
- `purchaseNft`
- `getMarketplaceData`, `getMarketplaceListings`
  Includes: `isLoading`, `error`, `validateConfig`, `contractInfo`.

`useEvents()` provides:

- Fetch all / filtered events
- Per-NFT and per-user histories
- Sales stats helpers
  Formatting helpers: `formatEventData.*`

`useEventSubscription()` enables real-time subscription (listed, sold, etc.).

### Typical Workflows

Mint:

```tsx
const { mintNft } = useContract();
await mintNft("Savage Cat #1", "Fierce cat", "https://.../cat.png", {
  Type: "Cat",
  Rarity: "Rare",
});
```

List for sale (SUI → MIST conversion 1 SUI = 1e9 MIST):

```tsx
const priceInMist = (parseFloat(priceInSui) * 1_000_000_000).toString();
await placeAndListNft(nftId, priceInMist);
```

Purchase:

```tsx
await purchaseNft(nftId, priceMistString);
```

Update price:

```tsx
await updateListingPrice(nftId, newPriceMist);
```

### Event Handling

Historical:

```tsx
const { getEventsForNft } = useEvents();
const events = await getEventsForNft(nftId);
```

Live feed:

```tsx
const { subscribeToEvents, newEvents } = useEventSubscription();
useEffect(() => subscribeToEvents(["NFT_LISTED", "NFT_SOLD"]), []);
```

Formatting:

```tsx
formatEventData.formatPrice(mistString); // => "1.0000 SUI"
```

### Validation & Debug

```tsx
const { validateConfig, contractInfo } = useContract();
if (!validateConfig()) throw new Error("Config invalid");
```

Low-level:

```tsx
import { getNetworkInfo } from "@/config/contract";
console.log(getNetworkInfo());
```

### Deployment

1. Ensure production `.env` has mainnet IDs.
2. `npm run build`
3. Deploy (Vercel or container) ensuring env vars are set.

### Documentation

- Contract config: `docs/contract-config-usage.md`
- Event handling: `docs/event-handling-examples.md`
- Updated usage: `docs/updated-contract-usage.md`

### Contributing

1. Fork / branch
2. Add tests or usage examples if adding features
3. Keep README files in sync (EN/TR)

### License

Licensed under the MIT License - see the `LICENSE` file for details.
