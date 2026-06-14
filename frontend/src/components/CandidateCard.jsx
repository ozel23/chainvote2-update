import { CheckCircle2, Circle, User } from "lucide-react";

export default function CandidateCard({ candidate, selected, voted, totalVotes, disabled, onSelect }) {
    const pct = totalVotes > 0 ? ((candidate.voteCount / totalVotes) * 100).toFixed(1) : 0;
    const isHighlighted = selected || voted;

    return (
        <div
            id={`candidate-card-${candidate.id}`}
            className={`candidate-card ${isHighlighted ? "candidate-card-selected" : ""} ${disabled ? "candidate-card-disabled" : "candidate-card-clickable"}`}
            onClick={!disabled ? onSelect : undefined}
            role={disabled ? "article" : "button"}
            tabIndex={disabled ? -1 : 0}
            onKeyDown={(e) => { if (!disabled && (e.key === "Enter" || e.key === " ")) onSelect(); }}
            aria-pressed={selected}
            aria-label={`Kandidat: ${candidate.name}`}
        >
            {/* Check icon */}
            <div className="card-check-icon">
                {voted ? (
                    <CheckCircle2 size={24} style={{ color: "#16a34a" }} />
                ) : selected ? (
                    <CheckCircle2 size={24} style={{ color: "#cc0000" }} />
                ) : (
                    <Circle size={24} style={{ color: "#cccccc" }} />
                )}
            </div>

            {/* Voted badge */}
            {voted && (
                <div className="voted-badge">
                    <CheckCircle2 size={12} /> Your Vote
                </div>
            )}

            {/* Candidate image & info */}
            <div className="cand-card-body">
                <div className="cand-img-wrap">
                    {candidate.imageUrl ? (
                        <img
                            src={candidate.imageUrl}
                            alt={candidate.name}
                            className="cand-img"
                            onError={(e) => {
                                e.target.style.display = "none";
                                e.target.nextSibling.style.display = "flex";
                            }}
                        />
                    ) : null}
                    <div
                        className="cand-img-placeholder"
                        style={{ display: candidate.imageUrl ? "none" : "flex" }}
                    >
                        <User size={36} style={{ color: "#cc0000", opacity: 0.4 }} />
                    </div>
                </div>

                <div className="cand-info">
                    <h3 className="cand-name">{candidate.name}</h3>
                    <p className="cand-desc">{candidate.description}</p>
                </div>
            </div>

            {/* Vote count */}
            <div className="cand-stats">
                <div className="flex-between mb-1">
                    <span className="text-sm text-muted">Vote Count</span>
                    <span className="text-sm font-semibold">
                        {candidate.voteCount} <span className="text-muted">({pct}%)</span>
                    </span>
                </div>
                <div className="progress-bar">
                    <div
                        className={`progress-fill ${voted || selected ? "progress-highlight" : ""}`}
                        style={{ width: `${pct}%`, transition: "width 0.6s ease" }}
                    />
                </div>
            </div>
        </div>
    );
}
