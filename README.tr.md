## DeFi Mint DApp

Sui Move akıllı sözleşmesiyle çalışan TheSavagePet NFT koleksiyonu için mint ve marketplace arayüzü. Mint, kullanıcı NFT yönetimi, listeleme, satın alma, delist, fiyat güncelleme ile gerçek zamanlı ve geçmiş event takibi sağlar.

### On-Chain Akıllı Sözleşme Deposu

Bu dApp'in kullandığı Move akıllı sözleşmeleri burada:

https://github.com/BurakErguvn/sui-nft-and-marketplace

Zincir üzerindeki modüller, event struct'ları ve deploy talimatları için bu depoyu inceleyin. Bu arayüz ilgili package ID'leri ortam değişkenleri üzerinden kullanır.

### Öne Çıkanlar

- Cüzdan bağlantısı & ağ farkındalığı (devnet / testnet / mainnet)
- TheSavagePet NFT mint (isim, açıklama, görsel, attributeler)
- Kullanıcıya ait NFT'leri listeleme
- Marketplace: listele, fiyat güncelle, satın al, delist, çek
- Marketplace istatistikleri (ürün, satış, hacim, kâr)
- Event sistemi: mint, listed, sold, delisted (geçmiş + real-time)
- Yeniden kullanılabilir hook'lar: `useContract`, `useEvents`, `useContractInfo`

### Teknoloji

- Next.js (App Router) + TypeScript
- @mysten/dapp-kit (Sui wallet & RPC)
- React hook mimarisi

### Dizin Yapısı (kırpılmış)

```
app/              # Sayfalar (mint, marketplace, my-nft, dinamik nft detay)
components/       # UI + özellik bileşenleri
hooks/            # Contract & event hook'ları
config/contract.ts# Ağ + contract konfigürasyonu
docs/             # Detaylı dokümantasyon
assets/, public/  # Statik görseller & metadata
```

### Ortam Değişkenleri

`.env.local` oluşturun (örnekler için `docs/contract-config-usage.md`). Tipik anahtarlar:

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

Kurallar:

1. Public runtime değişkenleri `NEXT_PUBLIC_` ile başlar.
2. Tüm ID'ler 0x ile başlayan 64 haneli hex.
3. Ağ isimleri: `devnet`, `testnet`, `mainnet`.

### Kurulum & Çalıştırma

```
npm install
npm run dev
# http://localhost:3000
```

### Ana Hook'lar

`useContract()` NFT + marketplace fonksiyonları:

- `mintNft(name, description, image_url, attributes)`
- `getNftsByOwner(address)`
- `placeNft`, `listNft`, `placeAndListNft`
- `delistNft`, `withdrawNft`, `updateListingPrice`
- `purchaseNft`
- `getMarketplaceData`, `getMarketplaceListings`
  Ek: `isLoading`, `error`, `validateConfig`, `contractInfo`.

`useEvents()`:

- Event listesi & filtreleme
- NFT / kullanıcı geçmişi
- Satış istatistikleri
  Formatlama yardımcıları: `formatEventData.*`

`useEventSubscription()` gerçek zamanlı abonelik sağlar.

### Tipik Akışlar

Mint:

```tsx
const { mintNft } = useContract();
await mintNft("Savage Cat #1", "Vahşi kedi", "https://.../cat.png", {
  Type: "Cat",
  Rarity: "Rare",
});
```

Listeleme (SUI → MIST 1 SUI = 1e9 MIST):

```tsx
const mist = (parseFloat(fiyatSui) * 1_000_000_000).toString();
await placeAndListNft(nftId, mist);
```

Satın alma:

```tsx
await purchaseNft(nftId, fiyatMist);
```

Fiyat güncelle:

```tsx
await updateListingPrice(nftId, yeniFiyatMist);
```

### Event İşleme

Geçmiş:

```tsx
const { getEventsForNft } = useEvents();
const events = await getEventsForNft(nftId);
```

Canlı:

```tsx
const { subscribeToEvents, newEvents } = useEventSubscription();
useEffect(() => subscribeToEvents(["NFT_LISTED", "NFT_SOLD"]), []);
```

Formatlama:

```tsx
formatEventData.formatPrice(mistStr); // "1.0000 SUI"
```

### Doğrulama & Debug

```tsx
const { validateConfig, contractInfo } = useContract();
if (!validateConfig()) throw new Error("Config geçersiz");
```

Alt seviye:

```tsx
import { getNetworkInfo } from "@/config/contract";
console.log(getNetworkInfo());
```

### Deploy

1. Production `.env` mainnet ID'leri içeriyor.
2. `npm run build`
3. Vercel veya container ile deploy (env değişkenleri ayarlı).

### Dokümantasyon

- Contract config: `docs/contract-config-usage.md`
- Event handling: `docs/event-handling-examples.md`
- Güncellenmiş kullanım: `docs/updated-contract-usage.md`

### Katkı

1. Branch aç
2. Özellik eklerken test / örnek ekle
3. EN & TR README senkron tut

### Lisans

MIT Lisansı ile lisanslanmıştır - ayrıntılar için `LICENSE` dosyasına bakın.
