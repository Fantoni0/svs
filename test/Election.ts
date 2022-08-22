import { expect } from "chai";
import { ethers } from "hardhat";
import { ContractTransaction } from "ethers";
import { Election, ElectionFactory } from "../typechain";
import { generateRandomBallot, signBallot } from "../scripts/tavs";
import { parseEvent, packAsNbytes, mostFrequent } from "../scripts/utils";

const name = "Who is the greatest Duck?";
const publicKey = packAsNbytes("0x010001");
const modulo =
  "0xcc20bbe7f3af9c71b5d3bc23203bdb074e849639c74cfd69770153b820d360f82b1577f44a8450118e8d26b552b0c885bf15a15a8f08f6a5cef4eb03fa8acd5cef9e0d2c9ed00f9c9a3278e0f5bddfa0660f7f98e3c35188a22e74feb8af3f649cb4a50e0c4e5cf507582c02c2dee49d289519375f7e2b98c2f3237efbf5c7d6873dd07994416bc310d77aaa036c4932b98355996a0d53f07a84dd1a28e979a3137fd471741447890917b932f744e140a5530c1e74ff0f653cc98868915616d4c12d86ebf59ee77519dd47291512c6ca1bd1b647f6ade2c6b026704bebfa69192bb62806fa7fa4462ef62e39d58dd8aa0122da84644a283c62df748f7b9ffc37";
const startTime = Math.floor(new Date().getTime() / 1000); // now
const candidates = ["Donald Duck", "Scrooge McDuck", "Daffy Duck", "Psyduck"];
const duration = 60 * 60; // 1 hour = 60 min = 3600 Seconds

let electionFactoryContract: ElectionFactory;
let owner: { address: any };
let election: ContractTransaction;
let electionContract: Election;

describe("Election Contract", async function () {
  it("Should send a valid vote", async function () {
    [owner] = await ethers.getSigners(); // Get keys
    const electionFactoryFactory = await ethers.getContractFactory(
      "ElectionFactory"
    );
    electionFactoryContract = await electionFactoryFactory.deploy(); // Get contract instance
    election = await electionFactoryContract.createElection(
      name,
      publicKey,
      modulo,
      startTime,
      duration,
      candidates
    );
    const txReceipt = await election.wait();
    const newElectionEvent = parseEvent(
      txReceipt,
      electionFactoryContract,
      "NewElection"
    );
    const deployedAddressEV = newElectionEvent.args[0];

    // @ts-ignore
    electionContract = await ethers.getContractAt(
      "Election",
      deployedAddressEV
    );
    const [ballot, mask, inv_mask, hash, vote] = await generateRandomBallot(
      candidates
    );
    // @ts-ignore
    const signedBallot = await signBallot(ballot);
    let signedBallotBytes = signedBallot.toString(16);
    if (signedBallotBytes.length % 2 != 0)
      signedBallotBytes = "0" + signedBallotBytes;

    signedBallotBytes = packAsNbytes(signedBallotBytes);
    const maskHex = packAsNbytes(mask.toString(16));
    const invHex = packAsNbytes(inv_mask.toString(16));
    const result = await electionContract.sendVote(
      signedBallotBytes,
      maskHex,
      invHex
    );
    // Check Created event
    const txReceipt2 = await result.wait();
    // @ts-ignore
    const newVoteEvent = parseEvent(txReceipt2, electionContract, "NewVote");
    expect(newVoteEvent).not.be.undefined;
    expect(newVoteEvent.args[0]).to.be.equal(
      owner.address,
      "Invalid voter address"
    );
    expect(newVoteEvent.args[1]).to.be.equal(hash, "Invalid vote hash");
    expect(newVoteEvent.args[2]).to.be.equal(vote, "Invalid candidate");
  });

  it("Should send an invalid vote with wrong hash", async function () {
    [owner] = await ethers.getSigners(); // Get keys
    const electionFactoryFactory = await ethers.getContractFactory(
      "ElectionFactory"
    );
    electionFactoryContract = await electionFactoryFactory.deploy(); // Get contract instance
    election = await electionFactoryContract.createElection(
      name,
      publicKey,
      modulo,
      startTime,
      duration,
      candidates
    );
    const txReceipt = await election.wait();
    const newElectionEvent = parseEvent(
      txReceipt,
      electionFactoryContract,
      "NewElection"
    );
    const deployedAddressEV = newElectionEvent.args[0];

    // @ts-ignore
    electionContract = await ethers.getContractAt(
      "Election",
      deployedAddressEV
    );
    const [ballot, mask, inv_mask, hash, vote] = await generateRandomBallot(
      candidates
    );
    // @ts-ignore
    const signedBallot = await signBallot(ballot);
    let signedBallotBytes = signedBallot.toString(16);
    if (signedBallotBytes.length % 2 !== 0)
      signedBallotBytes = "0" + signedBallotBytes;

    signedBallotBytes = packAsNbytes(signedBallotBytes);
    const maskHex = packAsNbytes(mask.toString(16));
    const invHex = packAsNbytes(inv_mask.toString(16));
    await expect(
      electionContract.sendVote(signedBallotBytes, maskHex, maskHex)
    ).to.be.revertedWith("Invalid hash");
  });

  it("Should fail by sending a valid vote after election is finished", async function () {
    [owner] = await ethers.getSigners(); // Get keys
    const electionFactoryFactory = await ethers.getContractFactory(
      "ElectionFactory"
    );
    electionFactoryContract = await electionFactoryFactory.deploy(); // Get contract instance
    election = await electionFactoryContract.createElection(
      name,
      publicKey,
      modulo,
      startTime,
      duration,
      candidates
    );
    const txReceipt = await election.wait();
    const newElectionEvent = parseEvent(
      txReceipt,
      electionFactoryContract,
      "NewElection"
    );
    const deployedAddressEV = newElectionEvent.args[0];

    // @ts-ignore
    electionContract = await ethers.getContractAt(
      "Election",
      deployedAddressEV
    );
    const [ballot, mask, inv_mask, hash, vote] = await generateRandomBallot(
      candidates
    );
    // @ts-ignore
    const signedBallot = await signBallot(ballot);
    let signedBallotBytes = signedBallot.toString(16);
    if (signedBallotBytes.length % 2 !== 0)
      signedBallotBytes = "0" + signedBallotBytes;

    // Advance Time to be able to finish election time
    ethers.provider.send("evm_increaseTime", [60 * 60]);
    await ethers.provider.send("evm_mine", []); // force mine the next block

    signedBallotBytes = packAsNbytes(signedBallotBytes);
    const maskHex = packAsNbytes(mask.toString(16));
    const invHex = packAsNbytes(inv_mask.toString(16));

    await expect(
      electionContract.sendVote(signedBallotBytes, maskHex, invHex)
    ).to.be.revertedWith(
      "Election has already finished. No more votes accepted."
    );
  });

  it("Should compute the winner of an election", async function () {
    [owner] = await ethers.getSigners(); // Get keys
    const electionFactoryFactory = await ethers.getContractFactory(
      "ElectionFactory"
    );
    electionFactoryContract = await electionFactoryFactory.deploy(); // Get contract instance
    election = await electionFactoryContract.createElection(
      name,
      publicKey,
      modulo,
      startTime,
      duration,
      candidates
    );
    const txReceipt = await election.wait();
    const newElectionEvent = parseEvent(
      txReceipt,
      electionFactoryContract,
      "NewElection"
    );
    const deployedAddressEV = newElectionEvent.args[0];

    // @ts-ignore
    electionContract = await ethers.getContractAt(
      "Election",
      deployedAddressEV
    );
    const [ballot, mask, inv_mask, hash, vote] = await generateRandomBallot(
      candidates
    );
    // @ts-ignore
    const signedBallot = await signBallot(ballot);
    let signedBallotBytes = signedBallot.toString(16);
    if (signedBallotBytes.length % 2 != 0)
      signedBallotBytes = "0" + signedBallotBytes;

    signedBallotBytes = packAsNbytes(signedBallotBytes);
    const maskHex = packAsNbytes(mask.toString(16));
    const invHex = packAsNbytes(inv_mask.toString(16));
    await electionContract.sendVote(signedBallotBytes, maskHex, invHex);

    // Advance Time to be able to compute winner
    ethers.provider.send("evm_increaseTime", [60 * 60]);
    await ethers.provider.send("evm_mine", []); // force mine the next block
    // Call method to compute winner
    await electionContract.computeWinner();
    const winner = await electionContract.winner();
    expect(winner.name).to.be.equal(vote);
  });

  it("Should fail computing the winner of an election", async function () {
    [owner] = await ethers.getSigners(); // Get keys
    const electionFactoryFactory = await ethers.getContractFactory(
      "ElectionFactory"
    );
    electionFactoryContract = await electionFactoryFactory.deploy(); // Get contract instance
    election = await electionFactoryContract.createElection(
      name,
      publicKey,
      modulo,
      startTime,
      duration,
      candidates
    );
    const txReceipt = await election.wait();
    const newElectionEvent = parseEvent(
      txReceipt,
      electionFactoryContract,
      "NewElection"
    );
    const deployedAddressEV = newElectionEvent.args[0];

    // @ts-ignore
    electionContract = await ethers.getContractAt(
      "Election",
      deployedAddressEV
    );
    const [ballot, mask, inv_mask, hash, vote] = await generateRandomBallot(
      candidates
    );
    // @ts-ignore
    const signedBallot = await signBallot(ballot);
    let signedBallotBytes = signedBallot.toString(16);
    if (signedBallotBytes.length % 2 !== 0)
      signedBallotBytes = "0" + signedBallotBytes;

    signedBallotBytes = packAsNbytes(signedBallotBytes);
    const maskHex = packAsNbytes(mask.toString(16));
    const invHex = packAsNbytes(inv_mask.toString(16));
    await electionContract.sendVote(signedBallotBytes, maskHex, invHex);

    // Call method to compute winner
    await expect(electionContract.computeWinner()).to.be.revertedWith(
      "Election must be finished to compute tally."
    );
  });

  it("Should send multiple valid votes and compute the final tally", async function () {
    // [owner] = await ethers.getSigners(); // Get keys
    const electionFactoryFactory = await ethers.getContractFactory(
      "ElectionFactory"
    );
    electionFactoryContract = await electionFactoryFactory.deploy(); // Get contract instance
    election = await electionFactoryContract.createElection(
      name,
      publicKey,
      modulo,
      startTime,
      duration,
      candidates
    );
    const txReceipt = await election.wait();
    const newElectionEvent = parseEvent(
      txReceipt,
      electionFactoryContract,
      "NewElection"
    );
    const deployedAddressEV = newElectionEvent.args[0];

    // @ts-ignore
    electionContract = await ethers.getContractAt(
      "Election",
      deployedAddressEV
    );

    // Simulate 8 votes
    let votes: string[];
    votes = [];
    let i: number;
    for (i = 0; i < 8; i++) {
      const [ballot, mask, inv_mask, hash, vote] = await generateRandomBallot(
        candidates
      );
      votes.push(String(vote));
      // @ts-ignore
      const signedBallot = await signBallot(ballot);
      let signedBallotBytes = signedBallot.toString(16);
      if (signedBallotBytes.length % 2 !== 0)
        signedBallotBytes = "0" + signedBallotBytes;
      signedBallotBytes = packAsNbytes(signedBallotBytes);
      const maskHex = packAsNbytes(mask.toString(16));
      const invHex = packAsNbytes(inv_mask.toString(16));
      const result = await electionContract.sendVote(
        signedBallotBytes,
        maskHex,
        invHex
      );
    }
    // Get most voted candidate
    const mostVoted = mostFrequent(votes);
    // Advance Time to be able to compute winner
    ethers.provider.send("evm_increaseTime", [60 * 60]);
    await ethers.provider.send("evm_mine", []); // force mine the next block
    // Call method to compute winner
    await electionContract.computeWinner();
    const winner = await electionContract.winner();
    expect(winner.name).to.be.equal(mostVoted);
  });
});
