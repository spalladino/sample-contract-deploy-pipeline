import { appendFileSync } from 'fs';
import { execSync } from 'child_process';
import { task, types } from 'hardhat/config';
import { getAddressBookEntry, writeDeploy, getReleaseDeploys } from './utils';
import { HardhatRuntimeEnvironment as HRE } from 'hardhat/types';
import { DeployImplementationResponse } from '@openzeppelin/hardhat-upgrades/src/deploy-implementation';
import { getContractAddress } from '@ethersproject/address';

const summaryPath = process.env.GITHUB_STEP_SUMMARY;

function getEtherscanDomain(hre: HRE) {
  const network = hre.network.name;
  if (network === `mainnet`) return 'etherscan.io';
  return `${network}.etherscan.io`;
}

function getNewImplementation(prepareUpgradeResult: DeployImplementationResponse): string {
  return typeof prepareUpgradeResult === 'string'
    ? prepareUpgradeResult
    : getContractAddress(prepareUpgradeResult);
}

async function prepareUpgrade(hre: HRE, chainId: number, contract: string) { 
  console.error(`Deploying new implementation for contract ${contract}`);
  const { upgrades, ethers } = hre;

  const info = getAddressBookEntry(chainId, contract);
  console.error(` Proxy for ${contract} at ${info.address}`)

  const factory = await ethers.getContractFactory(contract);
  const result = await upgrades.prepareUpgrade(info.address, factory, { kind: 'uups' });
  const implementation = getNewImplementation(result);

  console.error(` Deployed new implementation for ${contract} at ${implementation}`);
  writeDeploy(chainId, contract, { implementation });

  return implementation;
}

async function main(args: { contracts: string[] }, hre: HRE) {
  const { contracts } = args;
  const { ethers } = hre;
  if (contracts.length === 0) return;
  
  const commit = execSync(`/usr/bin/git log -1 --format='%H'`).toString().trim();
  const chainId = await ethers.provider.getNetwork().then(n => n.chainId);
  console.error(`Deploying implementation contracts ${contracts.join(', ')} from commit ${commit} on chain ${chainId}`);
  
  try {
    for (const contract of contracts) {
      await prepareUpgrade(hre, chainId, contract);
    } 
  } finally {
    const deployed = getReleaseDeploys();
    if (summaryPath && deployed && Object.entries(deployed).length > 0) {
      const list = Object.entries(deployed).map(([name, info]) => `- ${name} at [\`${info.implementation}\`](https://${getEtherscanDomain(hre)}/address/${info.implementation})`);
      appendFileSync(summaryPath, `## Implementation contracts deployed\n\n${list.join('\n')}\n`);
    }
  }
}

task('prepare-upgrade')
  .addVariadicPositionalParam('contracts', 'Names of the contracts to deploy as new implementations', [], types.string)
  .setDescription('Deploys new implementation contracts')
  .setAction(main);