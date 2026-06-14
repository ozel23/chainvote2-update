const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SecureVoting", function () {
    let voting;
    let admin, voter1, voter2, voter3, nonAdmin;

    beforeEach(async function () {
        [admin, voter1, voter2, voter3, nonAdmin] = await ethers.getSigners();
        const SecureVoting = await ethers.getContractFactory("SecureVoting");
        voting = await SecureVoting.connect(admin).deploy();
        await voting.waitForDeployment();
    });

    // ─── Deployment ────────────────────────────────────────────────
    describe("Deployment", function () {
        it("sets the deployer as admin", async function () {
            expect(await voting.admin()).to.equal(admin.address);
        });

        it("starts with voting closed", async function () {
            expect(await voting.votingOpen()).to.equal(false);
        });

        it("starts with zero candidates", async function () {
            expect(await voting.candidateCount()).to.equal(0);
        });
    });

    // ─── Admin: Add Candidate ──────────────────────────────────────
    describe("addCandidate", function () {
        it("allows admin to add a candidate", async function () {
            await expect(
                voting.addCandidate("Alice", "Description", "https://img.url")
            )
                .to.emit(voting, "CandidateAdded")
                .withArgs(1, "Alice");

            const c = await voting.getCandidate(1);
            expect(c.name).to.equal("Alice");
            expect(c.voteCount).to.equal(0);
        });

        it("rejects non-admin adding a candidate", async function () {
            await expect(
                voting
                    .connect(nonAdmin)
                    .addCandidate("Alice", "Desc", "https://img.url")
            ).to.be.revertedWithCustomError(voting, "NotAdmin");
        });

        it("rejects empty name", async function () {
            await expect(
                voting.addCandidate("", "Description", "https://img.url")
            ).to.be.revertedWithCustomError(voting, "EmptyName");
        });

        it("rejects empty description", async function () {
            await expect(
                voting.addCandidate("Alice", "", "https://img.url")
            ).to.be.revertedWithCustomError(voting, "EmptyDescription");
        });

        it("increments candidateCount correctly", async function () {
            await voting.addCandidate("A", "D1", "u1");
            await voting.addCandidate("B", "D2", "u2");
            expect(await voting.candidateCount()).to.equal(2);
        });
    });

    // ─── Admin: Open / Close Voting ────────────────────────────────
    describe("openVoting / closeVoting", function () {
        it("admin can open voting", async function () {
            await expect(voting.openVoting())
                .to.emit(voting, "VotingStatusChanged")
                .withArgs(true);
            expect(await voting.votingOpen()).to.equal(true);
        });

        it("admin can close voting", async function () {
            await voting.openVoting();
            await expect(voting.closeVoting())
                .to.emit(voting, "VotingStatusChanged")
                .withArgs(false);
            expect(await voting.votingOpen()).to.equal(false);
        });

        it("reverts opening an already-open vote", async function () {
            await voting.openVoting();
            await expect(voting.openVoting()).to.be.revertedWithCustomError(
                voting,
                "VotingAlreadyOpen"
            );
        });

        it("reverts closing an already-closed vote", async function () {
            await expect(voting.closeVoting()).to.be.revertedWithCustomError(
                voting,
                "VotingAlreadyClosed"
            );
        });

        it("non-admin cannot open voting", async function () {
            await expect(
                voting.connect(nonAdmin).openVoting()
            ).to.be.revertedWithCustomError(voting, "NotAdmin");
        });
    });

    // ─── Voting ────────────────────────────────────────────────────
    describe("vote", function () {
        beforeEach(async function () {
            await voting.addCandidate("Alice", "Desc", "https://img.url");
            await voting.addCandidate("Bob", "Desc", "https://img.url");
            await voting.openVoting();
        });

        it("allows a voter to cast a valid vote", async function () {
            await expect(voting.connect(voter1).vote(1))
                .to.emit(voting, "VoteCast")
                .withArgs(voter1.address, 1);

            const c = await voting.getCandidate(1);
            expect(c.voteCount).to.equal(1);
            expect(await voting.hasVoted(voter1.address)).to.equal(true);
        });

        it("prevents double voting", async function () {
            await voting.connect(voter1).vote(1);
            await expect(
                voting.connect(voter1).vote(1)
            ).to.be.revertedWithCustomError(voting, "AlreadyVoted");
        });

        it("rejects vote for invalid candidate ID 0", async function () {
            await expect(
                voting.connect(voter1).vote(0)
            ).to.be.revertedWithCustomError(voting, "InvalidCandidate");
        });

        it("rejects vote for out-of-range candidate ID", async function () {
            await expect(
                voting.connect(voter1).vote(99)
            ).to.be.revertedWithCustomError(voting, "InvalidCandidate");
        });

        it("rejects vote when voting is closed", async function () {
            await voting.closeVoting();
            await expect(
                voting.connect(voter1).vote(1)
            ).to.be.revertedWithCustomError(voting, "VotingNotOpen");
        });

        it("records multiple votes correctly", async function () {
            await voting.connect(voter1).vote(1);
            await voting.connect(voter2).vote(1);
            await voting.connect(voter3).vote(2);

            const c1 = await voting.getCandidate(1);
            const c2 = await voting.getCandidate(2);
            expect(c1.voteCount).to.equal(2);
            expect(c2.voteCount).to.equal(1);
        });
    });

    // ─── View Functions ────────────────────────────────────────────
    describe("view functions", function () {
        beforeEach(async function () {
            await voting.addCandidate("Alice", "D1", "u1");
            await voting.addCandidate("Bob", "D2", "u2");
            await voting.openVoting();
            await voting.connect(voter1).vote(1);
        });

        it("getAllCandidates returns all candidates", async function () {
            const all = await voting.getAllCandidates();
            expect(all.length).to.equal(2);
            expect(all[0].name).to.equal("Alice");
            expect(all[1].name).to.equal("Bob");
        });

        it("getVoterInfo returns correct status", async function () {
            const [voted, choice] = await voting.getVoterInfo(voter1.address);
            expect(voted).to.equal(true);
            expect(choice).to.equal(1);
        });

        it("getVoterInfo returns false for non-voter", async function () {
            const [voted, choice] = await voting.getVoterInfo(voter2.address);
            expect(voted).to.equal(false);
            expect(choice).to.equal(0);
        });

        it("getTotalVotes returns aggregate vote count", async function () {
            await voting.connect(voter2).vote(2);
            expect(await voting.getTotalVotes()).to.equal(2);
        });
    });
});
