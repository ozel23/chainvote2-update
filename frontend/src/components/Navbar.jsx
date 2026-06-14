import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useWeb3 } from "../context/Web3Context";
import { Vote, ShieldCheck, LogOut, ChevronDown, Copy, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";

export default function Navbar() {
    const { account, isAdmin, disconnectWallet, chainId, CONTRACT_ADDRESS } = useWeb3();
    const location = useLocation();
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const shortAddr = account
        ? `${account.slice(0, 6)}...${account.slice(-4)}`
        : "";

    const copyAddress = async () => {
        await navigator.clipboard.writeText(account);
        toast.success("Address copied!");
    };

    const networkName = {
        1: "Ethereum Mainnet",
        5: "Goerli Testnet",
        11155111: "Sepolia Testnet",
        31337: "Hardhat Local",
    }[chainId] ?? `Chain #${chainId}`;

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                {/* Brand */}
                <Link to="/vote" className="navbar-brand">
                    <div className="navbar-logo">
                        <svg width="22" height="22" viewBox="0 0 44 44" fill="none">
                            <polygon points="22,4 40,14 40,30 22,40 4,30 4,14"
                                fill="none" stroke="#cc0000" strokeWidth="2.5" />
                            <circle cx="22" cy="22" r="5" fill="#cc0000" />
                        </svg>
                    </div>
                    <span>ChainVote</span>
                </Link>

                {/* Nav links */}
                <div className="navbar-links">
                    <NavLink to="/vote" active={location.pathname === "/vote"} icon={<Vote size={16} />}>
                        Vote
                    </NavLink>
                    {isAdmin && (
                        <NavLink to="/admin" active={location.pathname === "/admin"} icon={<ShieldCheck size={16} />}>
                            Admin
                        </NavLink>
                    )}
                </div>

                {/* Wallet dropdown */}
                <div className="relative">
                    <button
                        id="wallet-dropdown-btn"
                        className="wallet-btn"
                        onClick={() => setDropdownOpen((v) => !v)}
                    >
                        <div className="wallet-avatar" />
                        <span className="wallet-addr">{shortAddr}</span>
                        <ChevronDown size={14} className={`transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                    </button>

                    {dropdownOpen && (
                        <div className="dropdown">
                            <div className="dropdown-header">
                                <p className="text-xs text-muted">Connected as</p>
                                <p className="font-mono text-sm">{shortAddr}</p>
                                {isAdmin && <span className="admin-badge mt-1">Admin</span>}
                            </div>
                            <div className="dropdown-section">
                                <p className="text-xs text-muted mb-1">Network</p>
                                <p className="text-sm font-semibold">{networkName}</p>
                            </div>
                            <div className="dropdown-section">
                                <p className="text-xs text-muted mb-1">Contract</p>
                                <div className="flex-center gap-1">
                                    <p className="text-xs font-mono">{CONTRACT_ADDRESS.slice(0, 10)}…</p>
                                    <a
                                        href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="icon-btn"
                                    >
                                        <ExternalLink size={12} />
                                    </a>
                                </div>
                            </div>
                            <div className="dropdown-divider" />
                            <button className="dropdown-item" onClick={copyAddress}>
                                <Copy size={14} /> Copy full address
                            </button>
                            <button
                                id="disconnect-btn"
                                className="dropdown-item dropdown-item-danger"
                                onClick={() => { disconnectWallet(); setDropdownOpen(false); }}
                            >
                                <LogOut size={14} /> Disconnect
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}

function NavLink({ to, active, icon, children }) {
    return (
        <Link to={to} className={`nav-link ${active ? "nav-link-active" : ""}`}>
            {icon}
            {children}
        </Link>
    );
}
