const { defender } = require('hardhat');

const address = process.env.ADDRESS;
const owner = process.env.OWNER;
const url = process.env.WORKFLOW_URL;

async function main() {
  console.log(`Upgrading box contract at ${address}`);
  const proposal = await defender.proposeUpgrade(address, 'Box',{ 
    bytecodeVerificationReferenceUrl: url,
    kind: 'uups',
    description: `Upgrading box contract to new version deployed at ${url}`,
    multisig: owner,
    multisigType: 'EOA',
  });
  const verification = proposal.verificationResponse;
  console.log(`Created new upgrade proposal at ${proposal.url} for artifact with digest ${verification?.providedSha256 ?? 'unknown'} (match ${verification.matchType})`);
}

main().catch(console.error);