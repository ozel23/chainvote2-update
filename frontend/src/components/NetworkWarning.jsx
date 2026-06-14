import { useWeb3 } from "../context/Web3Context";
import { AlertTriangle, ArrowRight } from "lucide-react";

const NETWORK_NAMES = {
    1: "Ethereum Mainnet",
    5: "Goerli",
    11155111: "Sepolia Testnet",
    31337: "Hardhat Local",
};

export default function NetworkWarning() {
    const { chainId, NETWORK_CHAIN_ID, switchNetwork } = useWeb3();
    const currentNet = NETWORK_NAMES[chainId] ?? `Chain #${chainId}`;
    const targetNet = NETWORK_NAMES[NETWORK_CHAIN_ID] ?? `Chain #${NETWORK_CHAIN_ID}`;

    return (
        <div className="page-center">
            <div className="network-warning-card">
                <div className="warning-icon-wrap">
                    <AlertTriangle size={40} style={{ color: "#f59e0b" }} />
                </div>
                <h2 className="mt-4 font-bold text-xl">Wrong Network</h2>
                <p className="text-muted mt-2 text-center">
                    You are connected to <strong>{currentNet}</strong>, but this app requires{" "}
                    <strong>{targetNet}</strong>.
                </p>
                <button
                    id="switch-network-btn"
                    className="btn-primary btn-lg mt-6 flex-center gap-2"
                    onClick={switchNetwork}
                >
                    Switch to {targetNet}
                    <ArrowRight size={18} />
                </button>
            </div>
        </div>
    );
}
