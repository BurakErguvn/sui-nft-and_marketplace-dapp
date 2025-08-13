import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    NEXT_PUBLIC_NETWORK: process.env.NEXT_PUBLIC_NETWORK,
    NEXT_PUBLIC_PACKAGE_ID: process.env.NEXT_PUBLIC_PACKAGE_ID,
    NEXT_PUBLIC_THE_SAVAGE_PET_REGISTRY_ID:
      process.env.NEXT_PUBLIC_THE_SAVAGE_PET_REGISTRY_ID,
    NEXT_PUBLIC_MARKETPLACE_OBJECT_ID:
      process.env.NEXT_PUBLIC_MARKETPLACE_OBJECT_ID,
    NEXT_PUBLIC_TESTNET_RPC: process.env.NEXT_PUBLIC_TESTNET_RPC,
  },
  // Alternatif olarak publicRuntimeConfig kullanabiliriz
  publicRuntimeConfig: {
    NEXT_PUBLIC_NETWORK: process.env.NEXT_PUBLIC_NETWORK,
    NEXT_PUBLIC_PACKAGE_ID: process.env.NEXT_PUBLIC_PACKAGE_ID,
    NEXT_PUBLIC_THE_SAVAGE_PET_REGISTRY_ID:
      process.env.NEXT_PUBLIC_THE_SAVAGE_PET_REGISTRY_ID,
    NEXT_PUBLIC_MARKETPLACE_OBJECT_ID:
      process.env.NEXT_PUBLIC_MARKETPLACE_OBJECT_ID,
    NEXT_PUBLIC_TESTNET_RPC: process.env.NEXT_PUBLIC_TESTNET_RPC,
  },
};

export default nextConfig;
