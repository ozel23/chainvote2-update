export default function LoadingScreen() {
    return (
        <div className="loading-screen">
            <div className="loading-inner">
                <div className="loading-logo">
                    <svg width="48" height="48" viewBox="0 0 44 44" fill="none">
                        <polygon points="22,4 40,14 40,30 22,40 4,30 4,14"
                            fill="none" stroke="#cc0000" strokeWidth="2.5" />
                        <circle cx="22" cy="22" r="5" fill="#cc0000" />
                    </svg>
                </div>
                <h2 className="loading-title">ChainVote</h2>
                <p className="text-muted text-sm" style={{ marginBottom: 20 }}>
                    Blockchain-Based E-Voting System
                </p>
                <div className="loading-dots">
                    <span /><span /><span />
                </div>
                <p className="text-muted text-sm mt-4">Connecting to blockchain…</p>
            </div>
        </div>
    );
}
