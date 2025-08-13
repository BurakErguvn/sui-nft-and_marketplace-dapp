# Smart Contract Configuration Usage

Bu dokümantasyon, smart contract configuration sisteminin nasıl kullanılacağını açıklar.

## Setup

### 1. Environment Variables

`.env.example` dosyasını `.env.local` olarak kopyalayın:

```bash
cp .env.example .env.local
```

### 2. Contract Deploy Edildikten Sonra

Smart contract deploy edildikten sonra, gerçek değerleri `.env.local` dosyasına ekleyin:

```env
NEXT_PUBLIC_NETWORK=testnet
NEXT_PUBLIC_TESTNET_PACKAGE_ID=0x123abc...
NEXT_PUBLIC_TESTNET_COLLECTION=0x456def...
NEXT_PUBLIC_TESTNET_MINT_CAP=0x789ghi...
```

## Hook Kullanımı

### useContract Hook

```tsx
import { useContract } from "@/hooks/use-contract";
import { useCurrentAccount } from "@mysten/dapp-kit";

function MintPage() {
  const account = useCurrentAccount();
  const { mintNft, isLoading, error, contractInfo } = useContract();

  const handleMint = async (petType: "cat" | "dragon" | "snake") => {
    try {
      await mintNft(petType);
      alert("NFT successfully minted!");
    } catch (err) {
      console.error("Mint failed:", err);
    }
  };

  return (
    <div>
      <h1>Mint Your Pet NFT</h1>
      <p>Network: {contractInfo.current}</p>
      <p>Package ID: {contractInfo.packageId}</p>

      <button
        onClick={() => handleMint("cat")}
        disabled={isLoading || !account}
      >
        {isLoading ? "Minting..." : "Mint Cat NFT"}
      </button>

      {error && <p style={{ color: "red" }}>Error: {error}</p>}
    </div>
  );
}
```

### Get User NFTs

```tsx
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
        <div key={nft.id}>
          <h3>{nft.name}</h3>
          <img src={nft.imageUrl} alt={nft.name} />
          <p>Type: {nft.attributes.petType}</p>
          <p>Level: {nft.attributes.level}</p>
        </div>
      ))}
    </div>
  );
}
```

### Marketplace Listing

```tsx
function ListForSale({ nftId }: { nftId: string }) {
  const { listForSale, isLoading } = useContract();
  const [price, setPrice] = useState("");

  const handleList = async () => {
    try {
      await listForSale(nftId, price);
      alert("NFT listed for sale!");
    } catch (err) {
      console.error("Listing failed:", err);
    }
  };

  return (
    <div>
      <input
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="Price in SUI"
      />
      <button onClick={handleList} disabled={isLoading}>
        {isLoading ? "Listing..." : "List for Sale"}
      </button>
    </div>
  );
}
```

## Configuration-Only Hook (useContractInfo)

Wallet bağlantısı gerekmayan durumlarda:

```tsx
import { useContractInfo } from "@/hooks/use-contract";

function ContractStatus() {
  const { contractInfo, validateConfig } = useContractInfo();

  return (
    <div>
      <h3>Contract Status</h3>
      <p>Network: {contractInfo.current}</p>
      <p>Package ID: {contractInfo.packageId}</p>
      <p>Valid: {contractInfo.isValid ? "✅" : "❌"}</p>

      {!contractInfo.isValid && (
        <p style={{ color: "red" }}>Please configure environment variables!</p>
      )}
    </div>
  );
}
```

## Network Switching

Environment variable ile network değiştirebilirsiniz:

```env
# Development için
NEXT_PUBLIC_NETWORK=devnet

# Testing için
NEXT_PUBLIC_NETWORK=testnet

# Production için
NEXT_PUBLIC_NETWORK=mainnet
```

## Error Handling

```tsx
function SafeContractCall() {
  const { mintNft, error, validateConfig } = useContract();

  const handleMint = async () => {
    // Config kontrolü
    if (!validateConfig()) {
      alert("Contract not configured properly!");
      return;
    }

    try {
      await mintNft("cat");
    } catch (err) {
      console.error("Error:", err);
      // Error handling logic
    }
  };

  return (
    <div>
      <button onClick={handleMint}>Mint NFT</button>
      {error && (
        <div style={{ color: "red", marginTop: "10px" }}>Error: {error}</div>
      )}
    </div>
  );
}
```

## Important Notes

1. **Environment Variables**: Tüm environment variables `NEXT_PUBLIC_` prefix ile başlamalı
2. **Package ID Format**: `0x` ile başlayan 64 karakterlik hex string
3. **Object ID Format**: `0x` ile başlayan 64 karakterlik hex string
4. **Network Names**: Sadece 'testnet', 'mainnet', 'devnet' kullanın
5. **Validation**: Production'a geçmeden önce `validateConfig()` fonksiyonunu kontrol edin

## Debugging

Contract configuration debug için:

```tsx
import { getNetworkInfo } from "@/config/contract";

console.log("Contract Info:", getNetworkInfo());
```

Bu sistemle contract deployment ve network switching işlemleri daha kolay yönetilebilir hale gelir.
