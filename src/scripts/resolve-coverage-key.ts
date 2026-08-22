import {appendFileSync, readFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {
    buildCoverageInputIdentity,
    coverageInputKey,
    resolveOntologyProvenance
} from '../lib/coverage-identity.ts';
import {digestIdentity} from '../lib/content-identity.ts';
import {ontologySemanticUsageHash} from '../lib/external-semantics.ts';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const readOption = (name: string): string | undefined =>
    args.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
const sourceRef = readOption('source-ref') || process.env.GITHUB_REF_NAME || 'working-tree';
const sourceSha = readOption('source-sha') || process.env.GITHUB_SHA || 'working-tree';
const knownAssetsPath = readOption('known-assets');
const knownAssetsSha256 = knownAssetsPath
    ? digestIdentity(JSON.parse(readFileSync(resolve(projectRoot, knownAssetsPath), 'utf-8')))
    : undefined;
const inputs = buildCoverageInputIdentity({
    projectRoot,
    sourceRef,
    sourceSha,
    ontology: resolveOntologyProvenance(projectRoot),
    ontologyUsageSha256: ontologySemanticUsageHash(projectRoot, 'ccss'),
    grade: readOption('grade'),
    excludeHighSchool: args.includes('--k8') || args.includes('--exclude-hs'),
    knownAssetsSha256
});
const coreInputKey = coverageInputKey(inputs);
const githubOutput = readOption('github-output');
if (githubOutput) appendFileSync(githubOutput, `core_input_key=${coreInputKey}\n`, 'utf-8');
process.stdout.write(`${JSON.stringify({core_input_key: coreInputKey, inputs})}\n`);
