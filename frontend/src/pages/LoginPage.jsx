import { useWeb3 } from "../context/Web3Context";
import { Shield, Zap, Lock, Eye } from "lucide-react";

export default function LoginPage() {
    const { connectWallet, isLoading } = useWeb3();

    return (
        <div className="login-root">

            <div className="login-container">
                {/* Main split card */}
                <div className="login-main">

                    {/* ── Left Panel: Pemilu Image ── */}
                    <div className="login-image-panel">
                        <img
                            src="/pemilu.jpg"
                            alt="Indonesian General Election"
                            className="login-panel-bg-img"
                        />
                        <div className="login-image-content">
                            {/* Logo */}
                            <div className="login-image-logo">
                                <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                                    <polygon points="22,4 40,14 40,30 22,40 4,30 4,14"
                                        fill="none" stroke="#cc0000" strokeWidth="2.5" />
                                    <circle cx="22" cy="22" r="5" fill="#cc0000" />
                                </svg>
                            </div>

                            <h1 className="login-image-title">ChainVote</h1>
                            <p className="login-image-subtitle">
                                Decentralized e-voting platform built on Ethereum Smart Contracts
                            </p>

                            {/* Pemilu illustration */}
                            <img
                                src="/pemilu.jpg"
                                alt="Ballot Box"
                                className="login-image-pemilu"
                            />
                        </div>
                    </div>

                    {/* ── Right Panel: Auth ── */}
                    <div className="login-auth-panel">
                        <div className="login-auth-header">
                            <div className="login-auth-tag">
                                🔗 Web3 Authentication
                            </div>
                            <h2 className="login-auth-title">
                                Sign in to the<br />
                                <span className="gradient-text">Voting System</span>
                            </h2>
                            <p className="login-auth-desc">
                                Use your MetaMask wallet to sign in securely. No password, no personal data stored.
                            </p>
                        </div>

                        {/* Steps */}
                        <div className="login-step-list">
                            {[
                                "Make sure MetaMask is installed in your browser",
                                "Click the button below to connect your wallet",
                                "Select the MetaMask account you want to use",
                                "Grant connection permission — you're ready to vote!",
                            ].map((step, i) => (
                                <div key={i} className="login-step">
                                    <div className="login-step-num">{i + 1}</div>
                                    <p className="login-step-text">{step}</p>
                                </div>
                            ))}
                        </div>

                        {/* Connect button */}
                        <button
                            id="connect-wallet-btn"
                            className="btn-primary btn-lg connect-btn"
                            onClick={connectWallet}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className="flex-center gap-2">
                                    <span className="spinner-sm" />
                                    Connecting…
                                </span>
                            ) : (
                                <span className="flex-center gap-2">
                                    <MetaMaskIcon />
                                    Connect with MetaMask
                                </span>
                            )}
                        </button>

                        <p className="login-hint">
                            Don't have MetaMask?{" "}
                            <a href="https://metamask.io/download/" target="_blank" rel="noreferrer" className="link">
                                Install it here →
                            </a>
                        </p>

                        <div className="login-security-note">
                            🔒 Your wallet will never expose your private key. The connection is 100% secure via MetaMask.
                        </div>
                    </div>
                </div>
            </div>

            <div className="login-footer">
                <p>© 2024 ChainVote — Blockchain-Based Electronic Voting System on Ethereum</p>
            </div>
        </div>
    );
}

function MetaMaskIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 1.44L13.5 8.28l1.65-3.9L22.56 1.44z" fill="#E17726" />
            <path d="M1.44 1.44l9.06 6.84L8.85 4.38 1.44 1.44z" fill="#E27625" />
            <path d="M19.44 16.56l-2.43 3.72 5.19 1.44.75-5.04-3.51-.12z" fill="#E27625" />
            <path d="M1.05 16.68l.72 5.04 5.19-1.44-2.43-3.72-3.48.12z" fill="#E27625" />
            <path d="M6.69 10.56L5.01 13.2l5.13.24-.18-5.52-3.27 2.64z" fill="#E27625" />
            <path d="M17.31 10.56l-3.3-2.7-.18 5.58 5.13-.24-1.65-2.64z" fill="#E27625" />
            <path d="M6.96 20.28l3.06-1.5-2.64-2.04-.42 3.54z" fill="#E27625" />
            <path d="M14.01 18.78l3.03 1.5-.39-3.54-2.64 2.04z" fill="#E27625" />
        </svg>
    );
}
