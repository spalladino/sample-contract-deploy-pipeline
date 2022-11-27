const { AdminClient } = require('defender-admin-client');
const { writeFileSync, readFileSync, existsSync } = require('fs');
const { fromChainId } = require('defender-base-client');
const { getReleaseInfo, getReleaseDeploys } = require('./utils');
const { pickBy } = require('lodash');

const releasePath = process.env.RELEASE_PATH;
const proxyAbi = [{"inputs":[{"internalType":"address","name":"newImplementation","type":"address"}],"name":"upgradeTo","outputs":[],"stateMutability":"nonpayable","type":"function"}];
const summaryPath = process.env.GITHUB_STEP_SUMMARY;

async function main(args, hre) {
  const { ethers, config } = hre;
  const multisig = args.multisig || process.env.MULTISIG_ADDRESS;
  const chainId = await ethers.provider.getNetwork().then(n => n.chainId);
  const deployed = pickBy(getReleaseDeploys(), c => c.implementation);

  console.error(`Creating proposal for upgrade in Defender for contracts ${Object.keys(deployed).join(', ')}`);
  const defenderAdmin = new AdminClient(config.defender);

  const contracts = await Promise.all(Object.entries(deployed).map(async ([name, address]) => ({
    name, 
    network,
    address: addressBook[name].address,
    abi: JSON.stringify([...(await hre.artifacts.readArtifact(name)).abi, ...proxyAbi]),
    newImplementation: address,
  })));

  console.error(`Contracts:\n${contracts.map(c => `- ${c.name} at ${c.address} to ${c.newImplementation}`).join('\n')}`);
  
  const steps = contracts.map(({ name, address, network, newImplementation }) => ({
    contractId: `${network}-${address}`,
    targetFunction: proxyAbi[0],
    functionInputs: [newImplementation],
    type: 'custom',
  }));

  console.error(`Steps:\n`, JSON.stringify(steps, null, 2));

  const releaseInfo = getReleaseInfo() || {};
  const title = releaseInfo['title'] || 'Upgrade';
  const description = releaseInfo['description'] || contracts.map(c => `${c.name} at ${c.address} to ${c.newImplementation}`).join('\n');

  const proposal = await defenderAdmin.createProposal({
    contract: contracts,
    title,
    description,
    type: 'batch',
    via: multisig,
    viaType: 'Gnosis Safe',
    metadata: {},
    steps,
  })

  console.error(`Created upgrade proposal for multisig ${multisig} at ${proposal.url}`);
  if (summaryPath) {
    writeFileSync(summaryPath, `## Approval\n\nRequired approval by multisig ${multisig} signers [here](${proposal.url})`);
  }
}

task('propose-upgrade')
  .addOptionalParam('multisig', 'Address of the multisig that needs to approve the upgrade (defaults to $MULTISIG_ADDRESS if env var is set)')
  .setDescription('Proposes a system upgrade as a batch in Defender Admin')
  .setAction(main);