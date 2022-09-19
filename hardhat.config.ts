import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "hardhat-deploy";
import path from "path";

dotenv.config({ path: path.join(__dirname, "/env/.env") });

// Get variables from env files.
const MUMBAI_PRIVATE_KEY = process.env.MUMBAI_PRIVATE_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more
const config: HardhatUserConfig = {
  solidity: "0.8.10",
  networks: {
    hardhat: {},
    /* mumbai: { // Remove comment and add key in env/.env file to deploy contracts in Mumbai.
      url: "https://rpc-mumbai.maticvigil.com",
      // @ts-ignore
      accounts: [
        MUMBAI_PRIVATE_KEY,
      ],
    }, */
  },
  /* etherscan: {  // Remove comment and add key in env/.env file to verify contracts.
    apiKey: ETHERSCAN_API_KEY,
  }, */
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
