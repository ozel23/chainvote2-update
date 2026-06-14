import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import toast from "react-hot-toast";
import VotingABI from "../utils/VotingABI.json";
import { CONTRACT_ADDRESS, ADMIN_ADDRESS, NETWORK_CHAIN_ID } from "../utils/contractConfig";

const Web3Context = createContext(null);

export function Web3Provider({ children }) {
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [contract, setContract] = useState(null);
    const [account, setAccount] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [chainId, setChainId] = useState(null);
    const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

    // ─── Check if MetaMask is available ─────────────────────────────
    const hasMetaMask = () => typeof window.ethereum !== "undefined";

    // ─── Wait for MetaMask to inject window.ethereum (fixes timing issue) ───
    const waitForEthereum = () => {
        return new Promise((resolve) => {
            if (typeof window.ethereum !== "undefined") {
                resolve(window.ethereum);
                return;
            }
            // Listen for MetaMask's injection event
            const onInit = () => resolve(window.ethereum);
            window.addEventListener("ethereum#initialized", onInit, { once: true });
            // Also poll every 100ms up to 3 seconds as fallback
            let elapsed = 0;
            const timer = setInterval(() => {
                elapsed += 100;
                if (typeof window.ethereum !== "undefined") {
                    clearInterval(timer);
                    window.removeEventListener("ethereum#initialized", onInit);
                    resolve(window.ethereum);
                } else if (elapsed >= 3000) {
                    clearInterval(timer);
                    window.removeEventListener("ethereum#initialized", onInit);
                    resolve(null);
                }
            }, 100);
        });
    };

    // ─── Build contract instance ─────────────────────────────────────
    const buildContract = useCallback((signerOrProvider) => {
        return new ethers.Contract(CONTRACT_ADDRESS, VotingABI.abi, signerOrProvider);
    }, []);

    // ─── Connect wallet ──────────────────────────────────────────────
    const connectWallet = useCallback(async () => {
        const eth = await waitForEthereum();
        if (!eth) {
            toast.error("MetaMask is not installed! Please install it first.", { duration: 8000 });
            window.open("https://metamask.io/download/", "_blank");
            return;
        }

        try {
            setIsLoading(true);
            const web3Provider = new ethers.BrowserProvider(window.ethereum);
            const accounts = await web3Provider.send("eth_requestAccounts", []);

            if (accounts.length === 0) {
                toast.error("No accounts found. Please unlock MetaMask.");
                return;
            }

            const web3Signer = await web3Provider.getSigner();
            const network = await web3Provider.getNetwork();
            const userAddress = await web3Signer.getAddress();

            setProvider(web3Provider);
            setSigner(web3Signer);
            setAccount(userAddress);
            setChainId(Number(network.chainId));
            setIsCorrectNetwork(Number(network.chainId) === NETWORK_CHAIN_ID);
            setIsAdmin(userAddress.toLowerCase() === ADMIN_ADDRESS.toLowerCase());
            setContract(buildContract(web3Signer));

            // Clear the disconnected flag since user manually connected
            localStorage.removeItem("userDisconnected");

            toast.success(`Connected: ${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`);
        } catch (err) {
            if (err.code === 4001) {
                toast.error("Wallet connection rejected by user.");
            } else {
                toast.error("Failed to connect wallet: " + (err.message || "Unknown error"));
            }
            console.error("connectWallet error:", err);
        } finally {
            setIsLoading(false);
        }
    }, [buildContract]);

    // ─── Disconnect wallet ───────────────────────────────────────────
    const disconnectWallet = useCallback(async () => {
        setProvider(null);
        setSigner(null);
        setContract(null);
        setAccount(null);
        setIsAdmin(false);
        setChainId(null);
        
        // Set flag to prevent auto-reconnect on reload
        localStorage.setItem("userDisconnected", "true");

        // Attempt to revoke MetaMask permissions so the connection is truly severed
        if (typeof window.ethereum !== "undefined") {
            try {
                await window.ethereum.request({
                    method: "wallet_revokePermissions",
                    params: [{ eth_accounts: {} }]
                });
            } catch (err) {
                console.warn("Could not revoke MetaMask permissions:", err);
            }
        }

        toast("Wallet disconnected.", { icon: "👋" });
    }, []);

    // ─── Switch network ──────────────────────────────────────────────
    const switchNetwork = useCallback(async () => {
        if (!hasMetaMask()) return;
        const chainHex = "0x" + NETWORK_CHAIN_ID.toString(16);
        try {
            await window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: chainHex }],
            });
        } catch (err) {
            // 4902: chain not added, try adding
            if (err.code === 4902 && NETWORK_CHAIN_ID === 31337) {
                try {
                    await window.ethereum.request({
                        method: "wallet_addEthereumChain",
                        params: [{
                            chainId: chainHex,
                            chainName: "Hardhat Local",
                            nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
                            rpcUrls: ["http://127.0.0.1:8545"],
                        }],
                    });
                } catch (addErr) {
                    toast.error("Failed to add network: " + addErr.message);
                }
            } else {
                toast.error("Failed to switch network: " + err.message);
            }
        }
    }, []);

    // ─── Auto-reconnect on page load ────────────────────────────────
    useEffect(() => {
        const autoConnect = async () => {
            if (!hasMetaMask()) { setIsLoading(false); return; }
            
            // Skip auto-connect if user manually signed out
            if (localStorage.getItem("userDisconnected") === "true") {
                setIsLoading(false);
                return;
            }

            try {
                const web3Provider = new ethers.BrowserProvider(window.ethereum);
                const accounts = await web3Provider.send("eth_accounts", []);
                if (accounts.length > 0) {
                    const web3Signer = await web3Provider.getSigner();
                    const network = await web3Provider.getNetwork();
                    const userAddress = await web3Signer.getAddress();
                    setProvider(web3Provider);
                    setSigner(web3Signer);
                    setAccount(userAddress);
                    setChainId(Number(network.chainId));
                    setIsCorrectNetwork(Number(network.chainId) === NETWORK_CHAIN_ID);
                    setIsAdmin(userAddress.toLowerCase() === ADMIN_ADDRESS.toLowerCase());
                    setContract(buildContract(web3Signer));
                }
            } catch (err) {
                console.warn("Auto-connect failed:", err);
            } finally {
                setIsLoading(false);
            }
        };
        autoConnect();
    }, [buildContract]);

    // ─── Listen for account/chain changes ───────────────────────────
    useEffect(() => {
        if (!hasMetaMask()) return;

        const handleAccountsChanged = (accounts) => {
            if (accounts.length === 0) {
                disconnectWallet();
            } else if (accounts[0] !== account) {
                toast("Account changed — reconnecting...", { icon: "🔄" });
                connectWallet();
            }
        };

        const handleChainChanged = () => {
            toast("Network changed — reloading...", { icon: "🔗" });
            window.location.reload();
        };

        window.ethereum.on("accountsChanged", handleAccountsChanged);
        window.ethereum.on("chainChanged", handleChainChanged);

        return () => {
            window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
            window.ethereum.removeListener("chainChanged", handleChainChanged);
        };
    }, [account, connectWallet, disconnectWallet]);

    return (
        <Web3Context.Provider
            value={{
                provider,
                signer,
                contract,
                account,
                isAdmin,
                isLoading,
                chainId,
                isCorrectNetwork,
                connectWallet,
                disconnectWallet,
                switchNetwork,
                CONTRACT_ADDRESS,
                NETWORK_CHAIN_ID,
            }}
        >
            {children}
        </Web3Context.Provider>
    );
}

export function useWeb3() {
    const ctx = useContext(Web3Context);
    if (!ctx) throw new Error("useWeb3 must be used within a Web3Provider");
    return ctx;
}
