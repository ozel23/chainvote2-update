// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SecureVoting
 * @author BlockchainVote System
 * @notice A secure, transparent, and tamper-proof e-voting contract
 * @dev Implements reentrancy protection, admin controls, and double-vote prevention
 */
contract SecureVoting {
    // ============================================================
    // TYPES & STATE
    // ============================================================

    struct Candidate {
        uint id;
        string name;
        string description;
        string imageUrl;
        uint voteCount;
    }

    address public immutable admin;
    bool public votingOpen;
    uint public candidateCount;

    mapping(uint => Candidate) public candidates;
    mapping(address => bool) public hasVoted;
    mapping(address => uint) public voterChoice;

    // Reentrancy guard
    uint256 private _status;
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    // ============================================================
    // EVENTS
    // ============================================================

    event VoteCast(address indexed voter, uint indexed candidateId);
    event CandidateAdded(uint indexed id, string name);
    event VotingStatusChanged(bool isOpen);

    // ============================================================
    // ERRORS (gas-efficient custom errors)
    // ============================================================

    error NotAdmin();
    error VotingNotOpen();
    error VotingAlreadyOpen();
    error VotingAlreadyClosed();
    error AlreadyVoted();
    error InvalidCandidate();
    error EmptyName();
    error EmptyDescription();
    error ReentrantCall();
    error ZeroAddress();

    // ============================================================
    // MODIFIERS
    // ============================================================

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    modifier votingIsOpen() {
        if (!votingOpen) revert VotingNotOpen();
        _;
    }

    modifier nonReentrant() {
        if (_status == _ENTERED) revert ReentrantCall();
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    // ============================================================
    // CONSTRUCTOR
    // ============================================================

    /**
     * @dev Sets the deploying address as the immutable admin.
     *      Admin cannot be changed after deployment (immutable).
     */
    constructor() {
        if (msg.sender == address(0)) revert ZeroAddress();
        admin = msg.sender;
        votingOpen = false;
        candidateCount = 0;
        _status = _NOT_ENTERED;
        emit VotingStatusChanged(false);
    }

    // ============================================================
    // ADMIN FUNCTIONS
    // ============================================================

    /**
     * @notice Add a new candidate — only callable by admin
     * @dev Validates all inputs before storing. Candidate IDs start at 1.
     * @param _name        Candidate's full name (non-empty)
     * @param _description Short description / biography
     * @param _imageUrl    URL to candidate's profile image
     */
    function addCandidate(
        string calldata _name,
        string calldata _description,
        string calldata _imageUrl
    ) external onlyAdmin {
        if (bytes(_name).length == 0) revert EmptyName();
        if (bytes(_description).length == 0) revert EmptyDescription();
        // imageUrl may be empty — frontend will show a placeholder

        candidateCount++;
        candidates[candidateCount] = Candidate({
            id: candidateCount,
            name: _name,
            description: _description,
            imageUrl: _imageUrl,
            voteCount: 0
        });

        emit CandidateAdded(candidateCount, _name);
    }

    /**
     * @notice Open the voting period — only callable by admin
     */
    function openVoting() external onlyAdmin {
        if (votingOpen) revert VotingAlreadyOpen();
        votingOpen = true;
        emit VotingStatusChanged(true);
    }

    /**
     * @notice Close the voting period — only callable by admin
     */
    function closeVoting() external onlyAdmin {
        if (!votingOpen) revert VotingAlreadyClosed();
        votingOpen = false;
        emit VotingStatusChanged(false);
    }

    // ============================================================
    // VOTER FUNCTIONS
    // ============================================================

    /**
     * @notice Cast a vote for a candidate
     * @dev Protected against reentrancy and double voting.
     *      State is updated BEFORE any potential external interactions
     *      (checks-effects-interactions pattern).
     * @param _candidateId The ID of the candidate to vote for (1-indexed)
     */
    function vote(uint _candidateId)
        external
        nonReentrant
        votingIsOpen
    {
        // Checks
        if (hasVoted[msg.sender]) revert AlreadyVoted();
        if (_candidateId == 0 || _candidateId > candidateCount) revert InvalidCandidate();

        // Effects (state changes before any interaction)
        hasVoted[msg.sender] = true;
        voterChoice[msg.sender] = _candidateId;
        candidates[_candidateId].voteCount++;

        // Interactions (no external calls here — event is safe)
        emit VoteCast(msg.sender, _candidateId);
    }

    // ============================================================
    // VIEW FUNCTIONS
    // ============================================================

    /**
     * @notice Retrieve the full data for a candidate
     * @param _id Candidate ID (1-indexed)
     */
    function getCandidate(uint _id)
        external
        view
        returns (
            uint id,
            string memory name,
            string memory description,
            string memory imageUrl,
            uint voteCount
        )
    {
        if (_id == 0 || _id > candidateCount) revert InvalidCandidate();
        Candidate storage c = candidates[_id];
        return (c.id, c.name, c.description, c.imageUrl, c.voteCount);
    }

    /**
     * @notice Retrieve all candidates in a single call
     * @return Array of all Candidate structs
     */
    function getAllCandidates() external view returns (Candidate[] memory) {
        Candidate[] memory allCandidates = new Candidate[](candidateCount);
        for (uint i = 1; i <= candidateCount; i++) {
            allCandidates[i - 1] = candidates[i];
        }
        return allCandidates;
    }

    /**
     * @notice Check voting status of an address and who they voted for
     * @param _voter Address to check
     * @return voted   Whether this address has voted
     * @return choiceId The candidate ID they voted for (0 if not voted)
     */
    function getVoterInfo(address _voter)
        external
        view
        returns (bool voted, uint choiceId)
    {
        return (hasVoted[_voter], voterChoice[_voter]);
    }

    /**
     * @notice Get total votes cast across all candidates
     */
    function getTotalVotes() external view returns (uint total) {
        for (uint i = 1; i <= candidateCount; i++) {
            total += candidates[i].voteCount;
        }
    }
}
