// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const ElectionFactory = await ethers.getContractFactory("ElectionFactory");
    const eFactoryInstance = await ElectionFactory.deploy();
    await eFactoryInstance.deployed();
    console.log("Election Factory deployed to:", eFactoryInstance.address);
};
export default func;
