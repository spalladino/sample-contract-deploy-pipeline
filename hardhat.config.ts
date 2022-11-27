require('dotenv').config();

import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-etherscan';
import '@openzeppelin/hardhat-upgrades';
import '@openzeppelin/hardhat-defender';

import './tasks/prepare-upgrade';
import './tasks/verify-deployed';
import './tasks/propose-upgrade';
import './tasks/deploy-proxy';
import './tasks/noop';

import { HardhatUserConfig } from "hardhat/config";

console.log(process.env.ETHERSCAN_API_KEY);

const config: HardhatUserConfig = {
  solidity: "0.8.9",
  defender: {
    apiKey: process.env.DEFENDER_API_KEY!,
    apiSecret: process.env.DEFENDER_API_SECRET!,
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  networks: {
    goerli: {
      url: `https://goerli.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  }
} as HardhatUserConfig;

export default config;