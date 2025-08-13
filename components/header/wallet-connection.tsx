import { ConnectButton, useAutoConnectWallet } from "@mysten/dapp-kit";
import "@mysten/dapp-kit/dist/index.css";

export default function WalletConnector() {
  const autoConnect = useAutoConnectWallet();
  return <ConnectButton />;
}
