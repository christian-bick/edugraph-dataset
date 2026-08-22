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
import {projectCoverageData, resolveCoverageCore} from '../lib/coverage-core.ts';
import {readCanonicalStandardsTree} from '../lib/standards-source.ts';
import {
    buildOntologySemanticSnapshot,
    diffOntologySemantics,
    ontologySemanticUsageHash,
    readOntologySemanticSnapshot
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

if (channel !== 'latest' && channel !== 'preview') {
    throw new Error(`Invalid --channel=${channel}. Expected "latest" or "preview".`);
}

async function main() {
    console.log('--- Initiating CCSS Ontology Mapping Pipeline ---');
    const counters = createWorkCounters();
    const sourceTree = parseStandardsTree(readCanonicalStandardsTree(projectRoot));
    const ontology = resolveOntologyProvenance(projectRoot);
    const recordedOntologySemantics = readOntologySemanticSnapshot(projectRoot);
    const currentOntologySemantics = buildOntologySemanticSnapshot({provenance: ontology});
    const ontologyDelta = recordedOntologySemantics
        ? diffOntologySemantics(recordedOntologySemantics, currentOntologySemantics)
        : null;
    if (!recordedOntologySemantics
        || !recordedOntologySemantics.usages?.ccss
        || ontologyDelta!.entities.added.length > 0
        || ontologyDelta!.entities.changed.length > 0
        || ontologyDelta!.entities.removed.length > 0
        || ontologyDelta!.relations.added.length > 0
        || ontologyDelta!.relations.changed.length > 0
        || ontologyDelta!.relations.removed.length > 0) {
        throw new Error(
            'Pinned ontology package does not match the committed semantic snapshot. '
            + 'Run update:ontology-source explicitly before coverage generation.'
        );
    }
    const ontologyVersion = ontology.version;
    const generatedAt = new Date().toISOString();
    const grade = readOption('grade');
    const excludeHighSchool = args.includes('--k8') || args.includes('--exclude-hs');
    const inputs = buildCoverageInputIdentity({
        projectRoot,
        sourceRef,
        sourceSha,
        ontology,
        ontologyUsageSha256: ontologySemanticUsageHash(projectRoot, 'ccss'),
        grade,
        excludeHighSchool
    });
    const core = await resolveCoverageCore({
        root: coreCacheDir,
        inputs,
        counters,
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
    const tree = parseStandardsTree(core.artifact.tree);
    const coverage = projectCoverageData(core.artifact.coverage, generatedAt, ontologyVersion);
    console.log(
        `[Coverage core] ${core.reused ? 'HIT' : 'MISS'} ${core.artifact.core_input_key} at ${core.directory}`
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
