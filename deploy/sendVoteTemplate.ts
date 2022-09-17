// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import {generateBallot, generateRandomBallot, signBallot} from "../scripts/tavs";
import { packAsNbytes } from "../scripts/utils";
import { parseEvent } from "../scripts/utils";

const electionAddress = "YOUR DEPLOYED ELECTION ADDRESS GOES HERE";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const electionInstance = await ethers.getContractAt(
        "Election",
        electionAddress
    );
    const [ballot, mask, inv_mask, hash, vote] = await generateBallot(
        "I vote for Kodos"
    );
    // @ts-ignore
    const signedBallot = await signBallot(ballot);
    let signedBallotBytes = signedBallot.toString(16);
    if (signedBallotBytes.length % 2 !== 0)
        signedBallotBytes = "0" + signedBallotBytes;
    signedBallotBytes = packAsNbytes(signedBallotBytes);
    const maskHex = packAsNbytes(mask.toString(16));
    const invHex = packAsNbytes(inv_mask.toString(16));
    const result = await electionInstance.sendVote(
        signedBallotBytes,
        maskHex,
        invHex
    );
    await result.wait();
    console.log("Vote Sent")
}

export default func;