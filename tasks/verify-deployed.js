const { execSync } = require('child_process');
const { readFileSync, existsSync } = require('fs');

async function main(args, hre) {
  const releasePath = process.env.RELEASE_PATH;
  const workflowUrl = args.referenceUrl || process.env.ARTIFACT_REFERENCE_URL || execSync(`git config --get remote.origin.url`).toString().trim();
  const input = args.output || (releasePath ? `${releasePath}/deployed.json` : null);
  const deployed = input && existsSync(input) ? JSON.parse(readFileSync(input)) : {};
  
  const { defender } = hre;

  for (const [name, address] of Object.entries(deployed)) {
    console.error(`\nVerifying source for ${name} at ${address} on Etherscan`);
    try {
      await hre.run("verify:verify", { address, noCompile: true });
    } catch(err) {
      if (err.message === 'Contract source code already verified') {
        console.error(`Source code already verified`);
      } else {
        throw err;
      }
    }
  }

  for (const [name, address] of Object.entries(deployed)) {
    console.error(`\nVerifying artifact for ${name} at ${address} on Defender`);
    const response = await defender.verifyDeployment(address, name, workflowUrl);
    console.error(`Bytecode match for ${name} is ${response.matchType}`);
  }
}

task('verify-deployed')
  .addOptionalParam('input', 'JSON file where to load the addresses of the implementations to verify (defaults to $RELEASE_PATH/deployed.json if env var is set)')
  .addOptionalParam('reference-url', 'URL to link to for artifact verification (defaults to $ARTIFACT_REFERENCE_URL the remote.origin.url of the repository)')
  .setDescription('Verifies deployed implementations in Etherscan and Defender')
  .setAction(main);