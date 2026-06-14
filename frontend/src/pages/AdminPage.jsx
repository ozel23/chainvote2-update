import { useState } from "react";
import { useWeb3 } from "../context/Web3Context";
import { useVoting } from "../hooks/useVoting";
import NetworkWarning from "../components/NetworkWarning";
import toast from "react-hot-toast";
import {
    ShieldCheck, UserPlus, PlayCircle, StopCircle,
    BarChart3, Trophy, Loader, AlertTriangle
} from "lucide-react";

export default function AdminPage() {
    const { contract, isAdmin, account, isCorrectNetwork } = useWeb3();
    const { candidates, votingOpen, totalVotes, loading, refetch } = useVoting();

    const [form, setForm] = useState({ name: "", description: "", imageUrl: "" });
    const [formLoading, setFormLoading] = useState(false);
    const [statusLoading, setStatusLoading] = useState(false);

    if (!isCorrectNetwork) return <NetworkWarning />;

    if (!isAdmin) {
        return (
            <div className="page-center">
                <div className="access-denied">
                    <AlertTriangle size={56} style={{ color: "#cc0000" }} />
                    <h2 className="mt-4">Access Denied</h2>
                    <p className="text-muted mt-2">
                        Only the contract admin can access this page.
                    </p>
                    <p className="address-pill mt-4">
                        Your address: <code>{account}</code>
                    </p>
                </div>
            </div>
        );
    }

    /* ── Add candidate ── */
    const handleAddCandidate = async (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.description.trim()) {
            toast.error("Name and description are required.");
            return;
        }
        setFormLoading(true);
        const t = toast.loading("Adding candidate to the blockchain…");
        try {
            const tx = await contract.addCandidate(
                form.name.trim(), form.description.trim(), form.imageUrl.trim()
            );
            await tx.wait();
            toast.success(`✅ "${form.name}" added successfully!`, { id: t });
            setForm({ name: "", description: "", imageUrl: "" });
            await refetch();
        } catch (err) {
            const msg = err.reason || err.message || "Transaction failed.";
            toast.error(`❌ ${msg}`, { id: t });
        } finally {
            setFormLoading(false);
        }
    };

    /* ── Open / Close voting ── */
    const handleVotingToggle = async () => {
        setStatusLoading(true);
        const action = votingOpen ? "Closing" : "Opening";
        const t = toast.loading(`${action} voting period…`);
        try {
            const tx = votingOpen ? await contract.closeVoting() : await contract.openVoting();
            await tx.wait();
            toast.success(`✅ Voting ${votingOpen ? "closed" : "opened"} successfully!`, { id: t });
            await refetch();
        } catch (err) {
            const msg = err.reason || err.message || "Transaction failed.";
            toast.error(`❌ ${msg}`, { id: t });
        } finally {
            setStatusLoading(false);
        }
    };

    const leader = candidates.reduce(
        (max, c) => (c.voteCount > max.voteCount ? c : max),
        candidates[0] || { voteCount: 0, name: "—" }
    );

    return (
        <div className="page-root">
            {/* Header */}
            <div className="page-header-banner">
                <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                    <h1 className="page-title flex-center gap-3" style={{ color: "white" }}>
                        <ShieldCheck size={28} />
                        Admin Panel
                    </h1>
                    <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, marginTop: 4 }}>
                        Manage candidates and control the voting period
                    </p>
                </div>
            </div>

            <div className="admin-grid">
                {/* ── Left ── */}
                <div className="admin-left">
                    {/* Voting control */}
                    <div className="card">
                        <div className="card-header">
                            <h2 className="card-title">Voting Control</h2>
                        </div>
                        <div className="card-body">
                            <div className={`voting-status-display ${votingOpen ? "status-open-card" : "status-closed-card"}`}>
                                <div className="status-dot-lg"
                                    style={{ background: votingOpen ? "#22c55e" : "#cc0000" }} />
                                <div>
                                    <p className="font-semibold">
                                        Voting is {votingOpen ? "OPEN" : "CLOSED"}
                                    </p>
                                    <p className="text-sm text-muted mt-1">
                                        {votingOpen
                                            ? "Registered voters can submit their votes now."
                                            : "No votes can be submitted at this time."}
                                    </p>
                                </div>
                            </div>
                            <button
                                id="toggle-voting-btn"
                                className={`btn-lg w-full mt-4 ${votingOpen ? "btn-danger" : "btn-success"}`}
                                onClick={handleVotingToggle}
                                disabled={statusLoading || loading}
                            >
                                {statusLoading ? (
                                    <span className="flex-center gap-2"><Loader size={18} className="spin" /> Processing…</span>
                                ) : votingOpen ? (
                                    <span className="flex-center gap-2"><StopCircle size={18} /> Close Voting Period</span>
                                ) : (
                                    <span className="flex-center gap-2"><PlayCircle size={18} /> Open Voting Period</span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Add candidate form */}
                    <div className="card">
                        <div className="card-header">
                            <h2 className="card-title flex-center gap-2">
                                <UserPlus size={18} /> Add Candidate
                            </h2>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleAddCandidate} className="form-stack">
                                <div className="form-group">
                                    <label className="form-label" htmlFor="cand-name">Full Name *</label>
                                    <input id="cand-name" type="text" className="form-input"
                                        placeholder="e.g. John Smith"
                                        value={form.name}
                                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                        maxLength={100} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="cand-desc">Description / Vision *</label>
                                    <textarea id="cand-desc" className="form-input" rows={3}
                                        placeholder="Enter the candidate's vision, mission, or short biography…"
                                        value={form.description}
                                        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                                        maxLength={500} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="cand-img">Photo URL (optional)</label>
                                    <input id="cand-img" type="url" className="form-input"
                                        placeholder="https://example.com/photo.jpg"
                                        value={form.imageUrl}
                                        onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))} />
                                </div>
                                {form.imageUrl && (
                                    <div className="img-preview-wrap">
                                        <img src={form.imageUrl} alt="Preview" className="img-preview"
                                            onError={(e) => { e.target.style.display = "none"; }} />
                                    </div>
                                )}
                                <button id="add-candidate-btn" type="submit"
                                    className="btn-primary btn-lg w-full" disabled={formLoading}>
                                    {formLoading ? (
                                        <span className="flex-center gap-2"><Loader size={18} className="spin" /> Adding…</span>
                                    ) : (
                                        <span className="flex-center gap-2"><UserPlus size={18} /> Add Candidate</span>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* ── Right: Results ── */}
                <div className="admin-right">
                    <div className="card full-height">
                        <div className="card-header flex-between">
                            <h2 className="card-title flex-center gap-2">
                                <BarChart3 size={18} /> Live Results
                            </h2>
                            <span className="tag">
                                {totalVotes} votes cast
                            </span>
                        </div>
                        <div className="card-body">
                            {loading ? (
                                <div className="flex-center" style={{ justifyContent: "center", padding: "40px 0" }}>
                                    <Loader size={28} className="spin text-muted" />
                                </div>
                            ) : candidates.length === 0 ? (
                                <div className="empty-state-sm">
                                    <BarChart3 size={36} className="text-muted" />
                                    <p className="text-muted mt-3">No candidates yet.</p>
                                </div>
                            ) : (
                                <>
                                    {totalVotes > 0 && (
                                        <div className="leader-banner">
                                            <Trophy size={18} style={{ color: "#b45309" }} />
                                            <span>
                                                Currently leading: <strong>{leader.name}</strong> with{" "}
                                                {leader.voteCount} vote{leader.voteCount !== 1 ? "s" : ""}
                                            </span>
                                        </div>
                                    )}
                                    <div className="results-list">
                                        {[...candidates]
                                            .sort((a, b) => b.voteCount - a.voteCount)
                                            .map((c, i) => {
                                                const pct = totalVotes > 0 ? (c.voteCount / totalVotes) * 100 : 0;
                                                const isWinner = i === 0 && totalVotes > 0;
                                                return (
                                                    <div key={c.id} className={`result-item ${isWinner ? "result-item-winner" : ""}`}>
                                                        <div className="result-rank">#{i + 1}</div>
                                                        <div className="result-info">
                                                            <div className="flex-between mb-1">
                                                                <span className="result-name">{c.name}</span>
                                                                <span className="result-count">
                                                                    {c.voteCount} vote{c.voteCount !== 1 ? "s" : " "}{" "}
                                                                    <span className="text-muted">({pct.toFixed(1)}%)</span>
                                                                </span>
                                                            </div>
                                                            <div className="progress-bar">
                                                                <div
                                                                    className={`progress-fill ${isWinner ? "progress-winner" : ""}`}
                                                                    style={{ width: `${pct}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
