import { useState, useEffect, useCallback } from "react";
import { useWeb3 } from "../context/Web3Context";

/**
 * Custom hook to fetch and manage all voting-related blockchain data.
 * Provides real-time refresh via polling every 15 seconds.
 */
export function useVoting() {
    const { contract, account } = useWeb3();
    const [candidates, setCandidates] = useState([]);
    const [votingOpen, setVotingOpen] = useState(false);
    const [hasVoted, setHasVoted] = useState(false);
    const [userChoice, setUserChoice] = useState(0);
    const [totalVotes, setTotalVotes] = useState(0n);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        if (!contract) {
            setLoading(false);
            return;
        }
        try {
            setError(null);
            const [rawCandidates, isOpen, totalV] = await Promise.all([
                contract.getAllCandidates(),
                contract.votingOpen(),
                contract.getTotalVotes(),
            ]);

            // Normalize BigInt fields to regular objects for React state
            const normalized = rawCandidates.map((c) => ({
                id: Number(c.id),
                name: c.name,
                description: c.description,
                imageUrl: c.imageUrl,
                voteCount: Number(c.voteCount),
            }));

            setCandidates(normalized);
            setVotingOpen(isOpen);
            setTotalVotes(Number(totalV));

            if (account) {
                const [voted, choice] = await contract.getVoterInfo(account);
                setHasVoted(voted);
                setUserChoice(Number(choice));
            }
        } catch (err) {
            console.error("useVoting fetchData error:", err);
            setError("Failed to load voting data. Check your network connection.");
        } finally {
            setLoading(false);
        }
    }, [contract, account]);

    // Initial fetch + polling every 15s
    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 15_000);
        return () => clearInterval(interval);
    }, [fetchData]);

    // Listen for real-time contract events to refresh instantly
    useEffect(() => {
        if (!contract) return;

        const onVoteCast = () => fetchData();
        const onCandidateAdded = () => fetchData();
        const onVotingStatusChanged = () => fetchData();

        contract.on("VoteCast", onVoteCast);
        contract.on("CandidateAdded", onCandidateAdded);
        contract.on("VotingStatusChanged", onVotingStatusChanged);

        return () => {
            contract.off("VoteCast", onVoteCast);
            contract.off("CandidateAdded", onCandidateAdded);
            contract.off("VotingStatusChanged", onVotingStatusChanged);
        };
    }, [contract, fetchData]);

    return {
        candidates,
        votingOpen,
        hasVoted,
        userChoice,
        totalVotes,
        loading,
        error,
        refetch: fetchData,
    };
}
