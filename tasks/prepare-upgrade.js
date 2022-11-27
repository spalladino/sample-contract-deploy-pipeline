const { appendFileSync } = require('fs');
const { execSync } = require('child_process');
const { task, types } = require('hardhat/config');
const { getContractInfo, writeDeploy } = require('./utils');

const summaryPath = process.env.GITHUB_STEP_SUMMARY;

function getEtherscanDomain(hre) {
  const network = hre.network.name;
  if (network === `mainnet`) return 'etherscan.io';
  return `${network}.etherscan.io`;
}

async function prepareUpgrade(hre, chainId, contract) { 
  console.error(`- Deploying new implementation for contract ${contract}`);
  const { upgrades, ethers } = hre;

  const info = getContractInfo(chainId, contract);
  console.error(` Proxy for ${contract} at ${info.address}`)

  const factory = await ethers.getContractFactory(contract);
  const implementation = await upgrades.prepareUpgrade(info.address, factory, { kind: 'uups' });

  console.error(` Deployed new implementation for ${contract} at ${implementation}`);
  writeDeploy(chainId, contract, { implementation });

  return implementation;
}

async function main(args, hre) {
  const { contracts } = args;
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
    if (summaryPath && Object.entries(deployed).length > 0) {
      const list = Object.entries(deployed).map(([name, info]) => `- ${name} at [${info.implementation}](https://${getEtherscanDomain(hre)}/address/${info.implementation})`);
      appendFileSync(summaryPath, `## Implementation contracts deployed\n\n${list.join('\n')}\n`);
    }
  }
}

task('prepare-upgrade')
  .addOptionalParam('output', 'JSON file where to output the addresses of the deployed implementations (defaults to $RELEASE_PATH/deployed.json if env var is set)')
  .addVariadicPositionalParam('contracts', 'Names of the contracts to deploy as new implementations', [], types.string)
  .setDescription('Deploys new implementation contracts')
  .setAction(main);