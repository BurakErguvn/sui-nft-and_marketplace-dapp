// Smart Contract Configuration
// Bu dosya akıllı kontrat objelerinin ve paket ID'lerinin merkezi yönetimi için kullanılır

export interface ContractConfig {
  packageId: string;
  objects: {
    [key: string]: string;
  };
  functions: {
    [key: string]: string;
  };
  rpcUrl?: string;
}

export interface NetworkConfig {
  testnet: ContractConfig;
}

// Environment variables'dan değerleri al - Hardcoded fallback for Next.js environment bug
const getEnvValue = (key: string, fallback: string = "0x0"): string => {
  // Temporary hardcoded values due to Next.js 15.4.4 environment variable issue
  const configValues: { [key: string]: string } = {
    NEXT_PUBLIC_NETWORK: "testnet",
    NEXT_PUBLIC_PACKAGE_ID:
      "0xef57b34913323ef974640f13c596a35df83a448483b46e96763a1b7b5633c02c",
    NEXT_PUBLIC_THE_SAVAGE_PET_REGISTRY_ID:
      "0x859fd000347c52dc01cb21f5ddd86cd65ea81ec27820def53fca03c7412c0c1c",
    NEXT_PUBLIC_MARKETPLACE_OBJECT_ID:
      "0x239422d6dcac4817a8bb6c09fb118675c9af028e42401579ef62718f047d0744",
    NEXT_PUBLIC_TESTNET_RPC: "https://fullnode.testnet.sui.io:443",
  };

  // Use hardcoded values for now
  const value = configValues[key] || fallback;

  return value;
};

// Testnet Configuration - Lazy initialization
const getTestnetConfig = (): ContractConfig => {
  return {
    packageId: getEnvValue("NEXT_PUBLIC_PACKAGE_ID"),
    objects: {
      the_savage_pet_registry: getEnvValue(
        "NEXT_PUBLIC_THE_SAVAGE_PET_REGISTRY_ID"
      ),
      marketplace_object: getEnvValue("NEXT_PUBLIC_MARKETPLACE_OBJECT_ID"),
    },
    functions: {
      mintNft: "mint",
      placeNft: "place_nft",
      listNft: "list_nft",
      placeAndListNft: "place_and_list_nft",
      delistNft: "delist_nft",
      purchaseNft: "purchase_nft",
      withdrawNft: "withdraw_nft",
      updateListingPrice: "update_listing_price",
    },
    rpcUrl: getEnvValue(
      "NEXT_PUBLIC_TESTNET_RPC",
      "https://fullnode.testnet.sui.io:443"
    ),
  };
};

// Network configurations - Lazy initialization
const getNetworkConfig = (): NetworkConfig => {
  return {
    testnet: getTestnetConfig(),
  };
};

// Current network (environment değişkeninden alınabilir)
const getCurrentNetwork = (): keyof NetworkConfig => {
  return getEnvValue("NEXT_PUBLIC_NETWORK", "testnet") as keyof NetworkConfig;
};

// Active configuration - Lazy getter
const getContractConfig = (): ContractConfig => {
  const network = getCurrentNetwork();
  const networkConfig = getNetworkConfig();
  return networkConfig[network];
};

// Helper functions
export const getPackageId = (): string => {
  const config = getContractConfig();
  const packageId = config.packageId;
  return packageId;
};

export const getObjectId = (objectName: string): string => {
  const config = getContractConfig();
  const objectId = config.objects[objectName];
  if (!objectId || objectId === "0x0") {
    console.warn(`Object ID for ${objectName} not found or not configured`);
  }
  return objectId || "0x0";
};

export const getFunctionName = (functionKey: string): string => {
  const config = getContractConfig();
  return config.functions[functionKey] || functionKey;
};

export const getRpcUrl = (): string => {
  const config = getContractConfig();
  return config.rpcUrl || "https://fullnode.testnet.sui.io:443";
};

// Validation helper
export const validateConfig = (): boolean => {
  const config = getContractConfig();

  if (!config.packageId || config.packageId === "0x0") {
    console.warn("Package ID not configured");
    return false;
  }

  const requiredObjects = ["the_savage_pet_registry", "marketplace_object"];
  for (const obj of requiredObjects) {
    if (!config.objects[obj] || config.objects[obj] === "0x0") {
      console.warn(`Required object ${obj} not configured`);
      return false;
    }
  }

  return true;
};

// Environment checker
export const getNetworkInfo = () => {
  const config = getContractConfig();
  return {
    current: getCurrentNetwork(),
    packageId: getPackageId(),
    rpcUrl: getRpcUrl(),
    isValid: validateConfig(),
    objects: config.objects,
    functions: config.functions,
  };
};

// Contract call helper types
export interface ContractCallParams {
  functionName: string;
  typeArguments?: string[];
  arguments?: any[];
}

// NFT Types - TheSavagePet struct'ına göre
export interface TheSavagePetNFT {
  id: string;
  name: string;
  description: string;
  image_url: string;
  attributes: { [key: string]: string }; // VecMap<String, String>
  creator: string;
}

// Marketplace Types - Gerçek contract struct'ına göre
export interface ListingInfo {
  id: string;
  nft_id: string;
  seller: string;
  price: string;
  listed_at?: number;
}

export interface MarketplaceData {
  id: string;
  items: { [nftId: string]: string }; // Table<ID, address> - NFT ID -> Owner address
  listings: { [nftId: string]: ListingInfo }; // Table<ID, ListingInfo>
  nfts: { [nftId: string]: TheSavagePetNFT }; // Table<ID, TheSavagePet>
  profits: string; // Coin<SUI> balance as string
  total_items: number;
  total_sales: number;
  total_volume: string; // SUI amount as string
}

// Types are already exported as interfaces above

// Event Types - Gerçek contract event struct'larına göre
export interface TheSavagePetMintEvent {
  nft_id: string;
  name: string;
  owner: string;
  timestamp?: number;
}

export interface MarketplaceCreatedEvent {
  marketplace_id: string;
  creator: string;
  timestamp?: number;
}

export interface NFTPlacedEvent {
  marketplace_id: string;
  nft_id: string;
  owner: string;
  timestamp?: number;
}

export interface NFTListedEvent {
  marketplace_id: string;
  nft_id: string;
  price: string;
  seller: string;
  timestamp?: number;
}

export interface NFTDelistedEvent {
  marketplace_id: string;
  nft_id: string;
  seller: string;
  timestamp?: number;
}

export interface NFTSoldEvent {
  marketplace_id: string;
  nft_id: string;
  price: string;
  seller: string;
  buyer: string;
  timestamp?: number;
}

export interface NFTWithdrawnEvent {
  marketplace_id: string;
  nft_id: string;
  owner: string;
  timestamp?: number;
}

// Event name mapping - Contract module'lerine göre (Lazy initialization)
export const getEventTypes = () => {
  const packageId = getPackageId();
  return {
    MINT: `${packageId}::sui_nft::TheSavagePetMintEvent`,
    MARKETPLACE_CREATED: `${packageId}::marketplace::MarketplaceCreated`,
    NFT_PLACED: `${packageId}::marketplace::NFTPlaced`,
    NFT_LISTED: `${packageId}::marketplace::NFTListed`,
    NFT_DELISTED: `${packageId}::marketplace::NFTDelisted`,
    NFT_SOLD: `${packageId}::marketplace::NFTSold`,
    NFT_WITHDRAWN: `${packageId}::marketplace::NFTWithdrawn`,
  } as const;
};
