// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { generateRandomBallot, signBallot } from "../scripts/tavs";
import { packAsNbytes } from "../scripts/utils";
import { parseEvent } from "../scripts/utils";

const electionFactoryAddress = "YOUR DEPLOYED ELECTION FACTORY GOES HERE";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const eFactoryInstance = await ethers.getContractAt(
        "ElectionFactory",
        electionFactoryAddress
    );

    const name = "Who is the greatest Duck?";
    const publicKey = packAsNbytes("0x010001");
    const modulo =
        "0xcc20bbe7f3af9c71b5d3bc23203bdb074e849639c74cfd69770153b820d360f82b1577f44a8450118e8d26b552b0c885bf15a15a8f08f6a5cef4eb03fa8acd5cef9e0d2c9ed00f9c9a3278e0f5bddfa0660f7f98e3c35188a22e74feb8af3f649cb4a50e0c4e5cf507582c02c2dee49d289519375f7e2b98c2f3237efbf5c7d6873dd07994416bc310d77aaa036c4932b98355996a0d53f07a84dd1a28e979a3137fd471741447890917b932f744e140a5530c1e74ff0f653cc98868915616d4c12d86ebf59ee77519dd47291512c6ca1bd1b647f6ade2c6b026704bebfa69192bb62806fa7fa4462ef62e39d58dd8aa0122da84644a283c62df748f7b9ffc37";
    const startTime = Math.floor(new Date().getTime() / 1000); // now
    const candidates = ["Donald Duck", "Scrooge McDuck", "Daffy Duck", "Psyduck"];
    const duration = 60 * 60; // 1 hour = 60 min = 3600 Seconds

    const election = await eFactoryInstance.createElection(
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
        eFactoryInstance,
        "NewElection"
    );
    const deployedAddressEV = newElectionEvent.args[0];

    // @ts-ignore
    const electionContract = await ethers.getContractAt(
        "Election",
        deployedAddressEV
    );
    console.log("Election contract deployed to: ", deployedAddressEV);
};
export default func;
