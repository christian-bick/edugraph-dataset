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
import {buildCoverageInputIdentity, resolveOntologyProvenance} from '../lib/coverage-identity.ts';
import {loadPinnedStandardsSource} from '../lib/standards-source.ts';
import type {DataView} from '../standards-explorer/types.ts';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const readOption = (name: string): string | undefined =>
    args.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
const outputDir = path.resolve(projectRoot, readOption('output-dir') || path.join('public', 'coverage', 'preview'));
const channel = (readOption('channel') || 'preview') as DataView;
const sourceRef = readOption('source-ref') || process.env.GITHUB_REF_NAME || 'working-tree';
const sourceSha = readOption('source-sha') || process.env.GITHUB_SHA || 'working-tree';

if (channel !== 'latest' && channel !== 'preview') {
    throw new Error(`Invalid --channel=${channel}. Expected "latest" or "preview".`);
}

async function main() {
    console.log('--- Initiating CCSS Ontology Mapping Pipeline ---');
    const counters = createWorkCounters();
    const pinnedStandards = await loadPinnedStandardsSource({
        projectRoot,
        report: message => console.log(`[External input] ${message}`)
    });
    const tree = parseStandardsTree(pinnedStandards.tree);
    const ontology = resolveOntologyProvenance(projectRoot);
    const ontologyVersion = ontology.version;
    const generatedAt = new Date().toISOString();
    const grade = readOption('grade');
    const excludeHighSchool = args.includes('--k8') || args.includes('--exclude-hs');
    const coverage = await buildCurrentStandardsCoverage({
        standardsMap: tree.standardsMap,
        ontologyVersion,
        generatedAt,
        counters,
        grade,
        excludeHighSchool
    });
    const inputs = buildCoverageInputIdentity({
        projectRoot,
        sourceRef,
        sourceSha,
        standards: pinnedStandards.provenance,
        ontology,
        grade,
        excludeHighSchool
    });
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
