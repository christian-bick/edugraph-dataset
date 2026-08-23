import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {
    buildCoverageManifest,
    buildCurrentStandardsCoverage,
    parseStandardsTree
} from '../lib/standards-coverage.ts';
import {createWorkCounters} from '../lib/work-counters.ts';
import {projectCoverageData, resolveCoverageCore} from '../lib/coverage-core.ts';
import {
    publishCoverageInputObservation,
    resolveCurrentCoverageInputs
} from '../lib/coverage-observation.ts';
import {readCanonicalStandardsTree} from '../lib/standards-source.ts';
import {
    resolveOntologySemanticUsage
} from '../lib/external-semantics.ts';
import type {DataView} from '../standards-explorer/types.ts';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const readOption = (name: string): string | undefined =>
    args.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
const outputDir = path.resolve(projectRoot, readOption('output-dir') || path.join('public', 'coverage', 'preview'));
const coreCacheDir = path.resolve(projectRoot, readOption('core-cache-dir') || path.join('temp', 'coverage-core'));
const channel = (readOption('channel') || 'preview') as DataView;
const sourceRef = readOption('source-ref') || process.env.GITHUB_REF_NAME || 'working-tree';
const sourceSha = readOption('source-sha') || process.env.GITHUB_SHA || 'working-tree';
const rebuildGraph = args.includes('--rebuild-graph');

if (channel !== 'latest' && channel !== 'preview') {
    throw new Error(`Invalid --channel=${channel}. Expected "latest" or "preview".`);
}

async function main() {
    console.log('--- Initiating CCSS Ontology Mapping Pipeline ---');
    const counters = createWorkCounters();
    const sourceTree = parseStandardsTree(readCanonicalStandardsTree(projectRoot));
    const generatedAt = new Date().toISOString();
    const grade = readOption('grade');
    const excludeHighSchool = args.includes('--k8') || args.includes('--exclude-hs');
    const resolvedInputs = await resolveCurrentCoverageInputs({
        projectRoot,
        root: coreCacheDir,
        sourceRef,
        sourceSha,
        grade,
        excludeHighSchool,
        rebuildGraph,
        counters,
        ontologyUsageSha256: async () =>
            (await resolveOntologySemanticUsage(projectRoot, 'ccss')).usage.input_sha256
    });
    const inputs = resolvedInputs.inputs;
    const ontologyVersion = inputs.ontology.version;
    console.log(
        `[Coverage observation] ${resolvedInputs.reused_observation ? 'HIT' : 'MISS'}: `
        + resolvedInputs.reason
    );
    const core = await resolveCoverageCore({
        root: coreCacheDir,
        inputs,
        counters,
        rebuildGraph,
        build: async () => ({
            tree: sourceTree,
            coverage: await buildCurrentStandardsCoverage({
                standardsMap: sourceTree.standardsMap,
                ontologyVersion,
                generatedAt,
                counters,
                grade,
                excludeHighSchool
            })
        })
    });
    publishCoverageInputObservation(coreCacheDir, resolvedInputs.observation);
    const tree = parseStandardsTree(core.artifact.tree);
    const coverage = projectCoverageData(core.artifact.coverage, generatedAt, ontologyVersion);
    console.log(
        `[Coverage core] ${core.reused ? 'HIT' : rebuildGraph ? 'REBUILT' : 'MISS'} `
        + `${core.artifact.core_input_key} at ${core.directory}`
    );
    const manifest = buildCoverageManifest({
        channel,
        inputs,
        generatedAt
    });

    fs.mkdirSync(outputDir, {recursive: true});
    fs.writeFileSync(path.join(outputDir, 'ccss-tree.json'), JSON.stringify(tree, null, 2));
    fs.writeFileSync(path.join(outputDir, 'ccss-coverage.json'), JSON.stringify(coverage, null, 2));
    fs.writeFileSync(path.join(outputDir, 'coverage-manifest.json'), JSON.stringify(manifest, null, 2));

    console.log(`Mapping pipeline complete: ${coverage.metadata.covered_count}/${coverage.metadata.total_leaves_scanned} covered.`);
    console.log(`[Work counters] ${JSON.stringify(counters.snapshot())}`);
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
