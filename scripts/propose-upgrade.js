const { defender } = require('hardhat');

const address = process.env.ADDRESS;
const owner = process.env.OWNER;
const url = process.env.WORKFLOW_URL;
const commit = require('child_process').execSync(`/usr/bin/git log -1 --format='%H'`).toString().trim();

async function main() {
  console.log(`Preparing new implementation for contract at ${address} from commit ${commit}`);
  const proposal = await defender.proposeUpgrade(address, 'Box',{ 
    bytecodeVerificationReferenceUrl: url,
    kind: 'uups',
    description: `Upgrading box contract to new version deployed at ${url}`,
    multisig: owner,
    multisigType: 'EOA',
  });
  const verification = proposal.verificationResponse;
  console.log(`Created new upgrade proposal for contract at ${address} to implementation at ${proposal.metadata.newImplementationAddress} deployed from artifact with digest ${verification?.providedSha256 ?? 'unknown'}: ${proposal.url}`);
}

main().catch(console.error);