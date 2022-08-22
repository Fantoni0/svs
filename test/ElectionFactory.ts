import { expect } from "chai";
import { ethers } from "hardhat";
import { ElectionFactory } from "../typechain";
import { utils } from "ethers";
import { TextEncoder } from "util";
import { parseEvent } from "../scripts/utils";

const name = "Who is the greatest Duck?";
const publicKey = "0x010001";
const modulo =
  "0x00dccd194abf18d46efcdc95d65f613d0e99ce171d7a9b7a3abee73473173548686b8fcbb60a59b63e6b5a9ab6cd7c50f7f55781e628c2f0026d8f20fe536564b3754c923533ac428868c12590fe6315e87bff28ab177c1b152f6cfa6309de2420f9b884dab69ac38866edea4c09cababb91ca41b920978ad0f772817664a60a9bc09d0dec4b51356de56a2383503cf4ea3c23884116fdf403392537e69d2c7bc7c2f991a4d7092096000a9cfcc1f1b260fcef920756f0c0723f7bad0b1235aa2fac40df3771fca2de052911c2105e232f09c20a481f1b9b9e652d32b5a9ba4f6857ac4eb76c7fda8f4880170aa6cc456b750d5758d3ddef75b170ea97a06be8e9";
const startTime = Math.floor(new Date().getTime() / 1000); // now
const candidates = ["Donald Duck", "Scrooge McDuck", "Daffy Duck", "Psyduck"];
let duration = 60 * 60; // 1 hour = 60 min = 3600 Seconds

let electionFactoryContract: ElectionFactory;
let owner: { address: any };

describe("Election Factory Contract", async function () {
  beforeEach(async function () {
    [owner] = await ethers.getSigners(); // Get keys
    // Instantiate contract factory
    const electionFactoryFactory = await ethers.getContractFactory(
      "ElectionFactory"
    );
    electionFactoryContract = await electionFactoryFactory.deploy(); // Get contract instance
  });
  it("Should create a valid election", async function () {
    const election = await electionFactoryContract.createElection(
      name,
      publicKey,
      modulo,
      startTime,
      duration,
      candidates
    );
    const txReceipt = await election.wait();
    // @ts-ignore

    const newElectionEvent = parseEvent(
      txReceipt,
      electionFactoryContract,
      "NewElection"
    );
    expect(newElectionEvent).not.be.undefined;
    // @ts-ignore
    expect(newElectionEvent.args[1]).to.equal(
      owner.address,
      "Invalid election creator."
    );
    // @ts-ignore
    expect(newElectionEvent.args[2]).to.equal(0, "Invalid election id.");
    // @ts-ignore
    expect(newElectionEvent.args[3].hash).to.equal(
      utils.keccak256(new TextEncoder().encode(name)),
      "Invalid election name."
    );
  });

  it("Should create an invalid election", async function () {
    duration = 60 * 50; // 50 min = 3000 Seconds
    await expect(
      electionFactoryContract.createElection(
        name,
        publicKey,
        modulo,
        startTime,
        duration,
        candidates
      )
    ).to.be.revertedWith("No elections shorter than 1 hour allowed");
  });

  it("Should create an invalid election", async function () {
    duration = 60 * 5761; // 4 days and 1 minute
    await expect(
      electionFactoryContract.createElection(
        name,
        publicKey,
        modulo,
        startTime,
        duration,
        candidates
      )
    ).to.be.revertedWith("No elections longer than 4 days allowed");
  });
});
