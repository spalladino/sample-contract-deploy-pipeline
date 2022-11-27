import { execSync } from 'child_process';
import { appendFileSync } from 'fs';
import { task, types } from 'hardhat/config';
import { HardhatRuntimeEnvironment as HRE } from 'hardhat/types';
import { getReleaseDeploys, writeDeploy } from './utils';

const summaryPath = process.env.GITHUB_STEP_SUMMARY;

function getEtherscanDomain(hre: HRE) {
  const network = hre.network.name;
  if (network === `mainnet`) return 'etherscan.io';
  return `${network}.etherscan.io`;
}

async function deploy(hre: HRE, chainId: number, contract: string) { 
  console.error(`- Deploying contract ${contract}`);
  const { upgrades, ethers } = hre;

  const factory = await ethers.getContractFactory(contract);
  const instance = await upgrades.deployProxy(factory, [], { kind: 'uups' }).then(d => d.deployed());
  const implementation = await upgrades.erc1967.getImplementationAddress(instance.address);

  console.error(` Deployed ${contract} at ${instance.address} with implementation ${implementation}`);
  writeDeploy(chainId, contract, { address: instance.address, implementation });

  return implementation;
}

async function main(args: { contracts: string[] }, hre: HRE) {
  const { contracts } = args;
  const { ethers } = hre;
  if (contracts.length === 0) return;
  
  const commit = execSync(`/usr/bin/git log -1 --format='%H'`).toString().trim();
  const chainId = await ethers.provider.getNetwork().then(n => n.chainId);
  console.error(`Deploying contracts ${contracts.join(', ')} from commit ${commit} on chain ${chainId}`);
  
  try {
    for (const contract of contracts) {
      await deploy(hre, chainId, contract);
    } 
  } finally {
    const deployed = getReleaseDeploys();
    if (summaryPath && deployed && Object.entries(deployed).length > 0) {
      const list = Object.entries(deployed).map(([name, info]) => `- ${name} at [\`${info.address}\`](https://${getEtherscanDomain(hre)}/address/${info.address}) with implementation at [\`${info.implementation}\`](https://${getEtherscanDomain(hre)}/address/${info.implementation})`);
      appendFileSync(summaryPath, `## Contracts deployed\n\n${list.join('\n')}\n`);
    }
  }
}

task('deploy-proxy')
  .addVariadicPositionalParam('contracts', 'Names of the contracts to deploy as upgradeable', [], types.string)
  .setDescription('Deploys new contracts as upgradeable')
  .setAction(main);