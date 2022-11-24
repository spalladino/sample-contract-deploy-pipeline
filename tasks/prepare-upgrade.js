const { readFileSync, writeFileSync, existsSync } = require('fs');
const { execSync } = require('child_process');
const { task, types } = require('hardhat/config');

const addressBookPath = 'addresses.json';
const releasePath = process.env.RELEASE_PATH;

async function prepareUpgrade(hre, contract) { 
  console.error(`- Deploying new implementation for contract ${contract}`);
  const { upgrades, ethers } = hre;

  const commit = execSync(`/usr/bin/git log -1 --format='%H'`).toString().trim();
  const chainId = await ethers.provider.getNetwork().then(n => n.chainId);
  const addressBook = JSON.parse(readFileSync(addressBookPath));
  const info = (addressBook[chainId.toString()] || {})[contract];
  if (!info) throw new Error(`Could not find info for ${contract} on chain ${chainId}`);
  console.error(` Proxy contract for ${contract} at ${info.address}`)

  const factory = await ethers.getContractFactory(contract);
  const implementation = await upgrades.prepareUpgrade(info.address, factory, { kind: 'uups' });

  console.error(` Deployed new implementation for ${contract} at ${implementation}`);
  info.implementation = implementation;
  writeFileSync(addressBookPath, JSON.stringify(addressBook, null, 2));

  return implementation;
}

async function main(args, hre) {
  const { contracts } = args;
  if (contracts.length === 0) return;
  const output = args.output || (releasePath ? `${releasePath}/deployed.json` : null);
  const deployed = output && existsSync(output) ? JSON.parse(readFileSync(output)) : {};
  
  console.error(`Deploying implementation contracts ${contracts.join(', ')} from commit ${commit}`);
  
  try {
    for (const contract of contracts) {
      const implementation = await prepareUpgrade(hre, contract);
      deployed[contract] = implementation;
    } 
  } finally {
    if (output) writeFileSync(output, JSON.stringify(deployed, null, 2));
  }
}

task('prepare-upgrade')
  .addOptionalParam('output', 'JSON file where to output the addresses of the deployed implementations (defaults to $RELEASE_PATH/deployed.json if env var is set)')
  .addVariadicPositionalParam('contracts', 'Names of the contracts to deploy as new implementations', [], types.string)
  .setDescription('Deploys new implementation contracts')
  .setAction(main);