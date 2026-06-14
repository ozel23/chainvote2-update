import { useState } from "react";
import { useWeb3 } from "../context/Web3Context";
import { useVoting } from "../hooks/useVoting";
import CandidateCard from "../components/CandidateCard";
import NetworkWarning from "../components/NetworkWarning";
import toast from "react-hot-toast";
import { CheckCircle, Vote, Users, BarChart3, Loader } from "lucide-react";

export default function VotingPage() {
    const { contract, account, isCorrectNetwork } = useWeb3();
    const { candidates, votingOpen, hasVoted, userChoice, totalVotes, loading, error, refetch } =
        useVoting();
    const [selected, setSelected] = useState(null);
    const [voting, setVoting] = useState(false);

    if (!isCorrectNetwork) return <NetworkWarning />;

    const handleVote = async () => {
        if (!selected) { toast.error("Please select a candidate first."); return; }
        if (hasVoted) { toast.error("You have already voted."); return; }
        if (!votingOpen) { toast.error("Voting is currently closed."); return; }

        const loadingToast = toast.loading("Submitting your vote to the blockchain…");
        setVoting(true);
        try {
            const tx = await contract.vote(selected);
            toast.loading("Transaction sent! Waiting for confirmation…", { id: loadingToast });
            const receipt = await tx.wait();
            toast.success(
                `✅ Vote confirmed! Tx: ${receipt.hash.slice(0, 10)}…`,
                { id: loadingToast, duration: 8000 }
            );
            await refetch();
            setSelected(null);
        } catch (err) {
            let msg = "Transaction failed.";
            if (err.code === 4001) msg = "Transaction rejected by user.";
            else if (err.reason) msg = err.reason;
            else if (err.message?.includes("AlreadyVoted")) msg = "You have already voted!";
            else if (err.message?.includes("VotingNotOpen")) msg = "Voting period is not open.";
            toast.error(msg, { id: loadingToast });
        } finally {
            setVoting(false);
        }
    };

    if (loading) {
        return (
            <div className="page-center">
                <div className="loader-wrap">
                    <div className="spinner-lg" />
                    <p className="text-muted mt-4">Loading candidates from the blockchain…</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-center">
                <div className="error-box">
                    <p>⚠️ {error}</p>
                    <button className="btn-primary mt-4" onClick={refetch}>Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className="page-root">
            {/* Red header banner */}
            <div className="page-header-banner">
                <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                    <h1 className="page-title" style={{ color: "white", marginBottom: 6 }}>
                        {hasVoted ? (
                            <span className="flex-center gap-3">
                                <CheckCircle size={28} />
                                Your Vote Has Been Recorded
                            </span>
                        ) : (
                            <span className="flex-center gap-3">
                                <Vote size={28} />
                                Cast Your Vote
                            </span>
                        )}
                    </h1>
                    <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 14 }}>
                        {hasVoted
                            ? "Thank you! Your vote has been permanently recorded on the blockchain."
                            : "Select one candidate and submit your vote. This action is permanent and cannot be undone."}
                    </p>

                    {/* Stats */}
                    <div className="stats-row" style={{ marginTop: 16 }}>
                        <div className="stat-badge">
                            <Users size={14} />
                            <span className="stat-value">{candidates.length}</span>
                            <span className="stat-label">Candidates</span>
                        </div>
                        <div className="stat-badge">
                            <BarChart3 size={14} />
                            <span className="stat-value">{totalVotes}</span>
                            <span className="stat-label">Total Votes</span>
                        </div>
                        <div className={`status-badge ${votingOpen ? "status-open" : "status-closed"}`}>
                            <span className={`status-dot ${votingOpen ? "dot-green" : "dot-red"}`} />
                            {votingOpen ? "Voting Open" : "Voting Closed"}
                        </div>
                    </div>
                </div>
            </div>

            {/* Already voted banner */}
            {hasVoted && (
                <div className="voted-banner">
                    <CheckCircle size={20} />
                    <div>
                        <strong>Your vote has been recorded on the blockchain!</strong>
                        <p className="text-sm mt-1">
                            You voted for:{" "}
                            <strong>{candidates.find((c) => c.id === userChoice)?.name ?? "Unknown"}</strong>
                        </p>
                    </div>
                </div>
            )}

            {/* Voting closed banner */}
            {!votingOpen && !hasVoted && (
                <div className="warning-banner">
                    <span>⏸️</span>
                    <div>
                        <strong>Voting is currently closed.</strong>
                        <p className="text-sm mt-1">The admin has not opened the voting period yet. Please check back later.</p>
                    </div>
                </div>
            )}

            {/* Candidates */}
            {candidates.length === 0 ? (
                <div className="empty-state">
                    <Vote size={48} style={{ color: "#cc0000", opacity: 0.4 }} />
                    <p className="text-muted mt-4">No candidates have been added yet.</p>
                </div>
            ) : (
                <>
                    <div className="candidates-grid">
                        {candidates.map((c) => (
                            <CandidateCard
                                key={c.id}
                                candidate={c}
                                selected={selected === c.id}
                                voted={hasVoted && userChoice === c.id}
                                totalVotes={totalVotes}
                                disabled={hasVoted || !votingOpen}
                                onSelect={() => { if (!hasVoted && votingOpen) setSelected(c.id); }}
                            />
                        ))}
                    </div>

                    {/* Vote submit bar */}
                    {!hasVoted && votingOpen && (
                        <div className="vote-action-bar">
                            <div className="vote-action-inner">
                                <p className="text-secondary">
                                    {selected
                                        ? `Selected: ${candidates.find((c) => c.id === selected)?.name}`
                                        : "Select a candidate above to activate the vote button"}
                                </p>
                                <button
                                    id="submit-vote-btn"
                                    className="btn-primary btn-lg"
                                    onClick={handleVote}
                                    disabled={!selected || voting}
                                >
                                    {voting ? (
                                        <span className="flex-center gap-2">
                                            <Loader size={18} className="spin" />
                                            Submitting…
                                        </span>
                                    ) : (
                                        <span className="flex-center gap-2">
                                            <Vote size={18} />
                                            Submit Vote
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
