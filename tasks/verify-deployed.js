const { execSync } = require('child_process');
const { readFileSync, existsSync } = require('fs');

async function main(args, hre) {
  const releasePath = process.env.RELEASE_PATH;
  const workflowUrl = args.referenceUrl || process.env.ARTIFACT_REFERENCE_URL || execSync(`git config --get remote.origin.url`).toString().trim();
  const input = args.output || (releasePath ? `${releasePath}/deployed.json` : null);
  const deployed = input && existsSync(input) ? JSON.parse(readFileSync(input)) : {};
  
  const { defender } = hre;
  const errs = [];

  for (const [name, address] of Object.entries(deployed)) {
    console.error(`\nVerifying source for ${name} at ${address} on Etherscan`);
    try {
      await hre.run("verify:verify", { address, noCompile: true });
    } catch(err) {
      if (err.message === 'Contract source code already verified') {
        console.error(`Source code already verified`);
      } else {
        console.error(`Error verifying source code: ${err.message}`);
        errs.push([name, err]);
      }
    }
  }

  for (const [name, address] of Object.entries(deployed)) {
    console.error(`\nVerifying artifact for ${name} at ${address} on Defender`);
    try {
      const response = await defender.verifyDeployment(address, name, workflowUrl);
      console.error(`Bytecode match for ${name} is ${response.matchType}`);
    } catch (err) {
      console.error(`Error verifying artifact: ${err.message}`);
      errs.push([name, err]);
    }
  }

  if (errs.length > 0) {
    throw new Error(`Some verifications failed:\n${errs.map(([name, err]) => ` ${name}: ${err.message}`)}`);
  }
}

task('verify-deployed')
  .addOptionalParam('input', 'JSON file where to load the addresses of the implementations to verify (defaults to $RELEASE_PATH/deployed.json if env var is set)')
  .addOptionalParam('referenceUrl', 'URL to link to for artifact verification (defaults to $ARTIFACT_REFERENCE_URL the remote.origin.url of the repository)')
  .setDescription('Verifies deployed implementations in Etherscan and Defender')
  .setAction(main);