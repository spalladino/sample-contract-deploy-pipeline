import { AdminClient } from 'defender-admin-client';
import { fromChainId } from 'defender-base-client';
import { writeFileSync } from 'fs';
import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment as HRE } from 'hardhat/types';
import { pickBy } from 'lodash';
import { getAddressBookEntry, getReleaseDeploys, getReleaseInfo, toEIP3770 } from './utils';

const proxyAbi = [{"inputs":[{"internalType":"address","name":"newImplementation","type":"address"}],"name":"upgradeTo","outputs":[],"stateMutability":"nonpayable","type":"function"}];
const summaryPath = process.env.GITHUB_STEP_SUMMARY;

async function main(args: { multisig?: string }, hre: HRE) {
  const { ethers, config } = hre;
  const multisig = args.multisig || process.env.MULTISIG_ADDRESS!;
  const chainId = await ethers.provider.getNetwork().then(n => n.chainId);
  const network = fromChainId(chainId)!;
  const deployed = pickBy(getReleaseDeploys(), c => !!c.implementation);

  console.error(`Creating proposal for upgrade in Defender for contracts ${Object.keys(deployed).join(', ')}`);
  const defenderAdmin = new AdminClient(config.defender!);

  const contracts = await Promise.all(Object.entries(deployed).map(async ([name, { implementation }]) => ({
    name, 
    network,
    address: getAddressBookEntry(chainId, name).address,
    abi: JSON.stringify([...await hre.artifacts.readArtifact(name).then(a => a.abi), ...proxyAbi]),
    newImplementation: implementation!,
  })));

  console.error(`Contracts:\n${contracts.map(c => `- ${c.name} at ${c.address} to ${c.newImplementation}`).join('\n')}`);
  
  const steps = contracts.map(({ address, network, newImplementation }) => ({
    contractId: `${network}-${address}`,
    targetFunction: proxyAbi[0],
    functionInputs: [newImplementation],
    type: 'custom' as const,
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
    const multisigLink = `https://app.safe.global/${toEIP3770(chainId, multisig)}/home`;
    writeFileSync(summaryPath, `## Approval\n\n[Approval required](${proposal.url}) by multisig [\`${multisig}\`](${multisigLink}) signers.`);
  }
}

task('propose-upgrade')
  .addOptionalParam('multisig', 'Address of the multisig that needs to approve the upgrade (defaults to $MULTISIG_ADDRESS if env var is set)')
  .setDescription('Proposes a system upgrade as a batch in Defender Admin')
  .setAction(main);