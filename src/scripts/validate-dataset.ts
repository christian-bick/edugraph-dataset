import 'dotenv/config';
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from "fs";
import { resolve, dirname, relative } from "path";
import { fileURLToPath } from "url";
import { findLeafModules } from "../lib/module-resolver.ts";
import {
    computeImageSha256,
    createVqaValidationContextResolver,
    pruneObsoleteVqaCacheFiles,
    type VqaValidationContext,
    VqaCacheManager
} from "../lib/vqa-cache.ts";
import { getCliOption } from "../lib/cli.ts";
import { isUnionSpec, resolveDatasetDir } from "../lib/dataset-paths.ts";
import { evaluateSampleVqa, getChecklistPaths } from "../lib/vqa-evaluator.ts";
import {
    parseSampleKey,
    SampleSplit,
    SPLIT_DIRS
} from "../lib/generation.ts";
import {loadGeneratorModelCatalog, loadViewModelCatalog} from '../lib/model-catalog.ts';
import { validationFailed, validationReportPath } from '../lib/validation-report.ts';
import {
    buildDatasetManifest,
    DATASET_MANIFEST_SCHEMA_VERSION,
    dependencyGraphVqaCacheKey,
    datasetOntologyProvenanceHash,
    datasetRendererIssues,
    datasetFreshnessIssues,
    readDatasetManifest,
    type DatasetManifestBuild
} from '../lib/dataset-manifest.ts';
import { normalizeAndValidateSpec } from '../lib/spec-validator.ts';
import { auditVqaCache, type ExpectedVqaCacheRecord } from '../lib/vqa-cache-audit.ts';
import { CANONICAL_RENDERER_ID } from '../lib/render-environment.ts';
import {createWorkCounters} from '../lib/work-counters.ts';
import {SourceContentIndex} from '../lib/content-identity.ts';
import {
    buildCompatibleModulePairIndex,
    matchingPolicyInputHash,
    matchTargetsDelta
} from '../lib/matching.ts';
import {
    readDatasetSnapshot,
    verifyDatasetSnapshotIntegrity,
    type DatasetSnapshot
} from '../lib/dataset-store.ts';
import {inspectDevelopmentInputObservation} from '../lib/development-observation.ts';
import {resolveGraphExecutionMode} from '../lib/graph-execution-mode.ts';
import {DEPENDENCY_PLANNER_EPOCH} from '../lib/dependency-planner.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, "..", "..");
const GENERATORS_ROOT = resolve(PROJECT_ROOT, "src", "generators");
const CACHE_DIR = resolve(PROJECT_ROOT, "cache", "vqa-validation");

/** The dataset's root — every split folder hangs off it. */
let DATASET_DIR = resolve(PROJECT_ROOT, "out", "dataset");
let DATASET_SNAPSHOT: DatasetSnapshot;

/**
 * Both splits are validated. The split is not in the filename, so an image is
 * located by reading it back out of the sample key, which is the authoritative
 * record of a sample's identity.
 */
function splitDirOf(entry: any): string {
    return SPLIT_DIRS[parseSampleKey(entry.sample_key).split];
}

function imagePathFor(entry: any): string {
    const split = parseSampleKey(entry.sample_key).split;
    return DATASET_SNAPSHOT.imagePath(split, entry.sample_key);
}

/**
 * Display path. `file_name` is relative to its split root and does not encode
 * the split, so the same tuple's train and validation images share it — always
 * qualify it before showing it to a human.
 */
function displayPathOf(entry: any): string {
    return `${splitDirOf(entry)}/${entry.file_name}`;
}

interface PreparedVqaSample {
    entry: any;
    imagePath: string;
    imageBuffer?: Buffer;
    imageSha256?: string;
    validationCacheKey?: string;
    checklistPaths?: string[];
    checklistContents?: {global: string; view: string};
    validationContext?: VqaValidationContext;
}

function pngFilesBelow(path: string): string[] {
    if (!existsSync(path)) return [];
    return readdirSync(path, { withFileTypes: true }).flatMap(entry => {
        const child = resolve(path, entry.name);
        if (entry.isDirectory()) return pngFilesBelow(child);
        return entry.isFile() && entry.name.toLowerCase().endsWith('.png') ? [child] : [];
    });
}

function datasetStructureIssues(entries: any[], missingSplits: SampleSplit[]): string[] {
    const issues = missingSplits.map(split => `Dataset split "${SPLIT_DIRS[split]}" is missing.`);
    const sampleKeys = new Set<string>();
    const imagePaths = new Set<string>();

    for (const entry of entries) {
        if (sampleKeys.has(entry.sample_key)) issues.push(`Duplicate metadata sample key: ${entry.sample_key}.`);
        sampleKeys.add(entry.sample_key);
        const imagePath = imagePathFor(entry);
        if (imagePaths.has(imagePath)) issues.push(`Duplicate metadata image path: ${displayPathOf(entry)}.`);
        imagePaths.add(imagePath);
        if (!existsSync(imagePath)) issues.push(`Metadata image is missing: ${displayPathOf(entry)}.`);
    }

    if (DATASET_SNAPSHOT.generationId === null) {
        for (const split of Object.keys(SPLIT_DIRS) as SampleSplit[]) {
            const splitRoot = resolve(DATASET_DIR, SPLIT_DIRS[split]);
            for (const imagePath of pngFilesBelow(splitRoot)) {
                if (!imagePaths.has(imagePath)) {
                    issues.push(`Image is not referenced by metadata: ${relative(DATASET_DIR, imagePath).replace(/\\/g, '/')}.`);
                }
            }
        }
    }
    return issues;
}

const apiKey = process.env.GEMINI_API_KEY;

function renderProgressBar(current: number, total: number, passed: number, failed: number) {
    const width = 30;
    const ratio = total > 0 ? current / total : 1;
    const filled = Math.round(ratio * width);
    const empty = width - filled;
    const bar = '='.repeat(filled) + '-'.repeat(empty);
    const pct = (ratio * 100).toFixed(1);
    process.stdout.write(`\rProgress: [${bar}] ${current}/${total} (${pct}%) | ✅ Passed: ${passed} | ❌ Failed: ${failed}`);
}

async function runPool<T>(items: T[], limit: number, fn: (item: T) => Promise<void>) {
    let index = 0;
    const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (index < items.length) {
            const currentIndex = index++;
            await fn(items[currentIndex]);
        }
    });
    await Promise.all(workers);
}

async function evaluateSingleSample(
    sample: PreparedVqaSample,
    logPrompt: boolean,
    counters: ReturnType<typeof createWorkCounters>
): Promise<any> {
    const {entry} = sample;
    if (!sample.imageBuffer) {
        sample.imageBuffer = readFileSync(sample.imagePath);
        counters.add('vqa.image_file_reads');
        counters.add('vqa.image_bytes_read', sample.imageBuffer.byteLength);
        const actualSha256 = computeImageSha256(sample.imageBuffer);
        if (sample.imageSha256 && sample.imageSha256 !== actualSha256) {
            throw new Error(`Dataset image changed after manifest resolution: ${displayPathOf(entry)}.`);
        }
        sample.imageSha256 = actualSha256;
    }
    const result = await evaluateSampleVqa({
        imagePath: sample.imagePath,
        sampleKey: entry.sample_key,
        targetId: entry.target_id,
        generatorId: entry.generator,
        viewId: entry.view,
        modeName: entry.mode,
        instanceIdx: entry.instance,
        attempt: entry.attempt,
        seed: entry.seed,
        fileName: entry.file_name,
        labels: entry.tags,
        apiKey,
        logPrompt,
        imageBuffer: sample.imageBuffer,
        imageSha256: sample.imageSha256,
        checklistPaths: sample.checklistPaths,
        checklistContents: sample.checklistContents,
        validationContext: sample.validationContext
    });

    if (!result) return null;
    return { ...result.entry, moduleName: entry.generator };
}

async function main() {
    const args = process.argv.slice(2);
    const counters = createWorkCounters();

    let targetGenerator: string | undefined = process.env.npm_config_generator;
    let targetView: string | undefined = process.env.npm_config_view;
    let force = process.env.npm_config_force === 'true' || process.env.npm_config_force === '';
    let rebuildGraph = process.env.npm_config_rebuild_graph === 'true'
        || process.env.npm_config_rebuild_graph === '';
    let auditMode = process.env.npm_config_audit === 'true' || process.env.npm_config_audit === '';
    let reportOnly = process.env.npm_config_report_only === 'true' || process.env.npm_config_report_only === '';
    let logPrompts = process.env.npm_config_log_prompts === 'true' || process.env.npm_config_log_prompts === '';
    let evaluationConcurrency = 10;
    
    const specName = getCliOption(args, 'spec');
    if (!specName) {
        console.error('❌ Error: The --spec parameter is required.');
        console.error('Usage: npm run validate:dataset -- --spec=<spec_module> [--generator=X] [--view=Y] [--rebuild-graph] [--force] [--concurrency=N] [--log-prompts] [--report-only] [--report=<path>]');
        process.exit(1);
    }
    if (isUnionSpec(specName)) {
        console.error(`❌ Error: the union dataset is not validated directly.`);
        console.error('Every sample in it was already validated in its own standard — validate those instead,');
        console.error('e.g. npm run validate:dataset -- --spec=ccss');
        process.exit(1);
    }
    const datasetFolderName = resolveDatasetDir(specName);
    const reportOverride = getCliOption(args, 'report');

    for (const arg of args) {
        if (arg.includes('generator=')) {
            targetGenerator = arg.split('generator=')[1];
        } else if (arg.includes('view=')) {
            targetView = arg.split('view=')[1];
        } else if (arg === '--force') {
            force = true;
        } else if (arg === '--rebuild-graph') {
            rebuildGraph = true;
        } else if (arg === '--audit' || arg === '--ci') {
            auditMode = true;
        } else if (arg === '--report-only') {
            reportOnly = true;
        } else if (arg === '--log-prompts') {
            logPrompts = true;
        } else if (arg.startsWith('--concurrency=')) {
            const value = Number.parseInt(arg.slice('--concurrency='.length), 10);
            if (!Number.isInteger(value) || value < 1) {
                throw new Error(`Invalid --concurrency value "${arg.slice('--concurrency='.length)}"; expected a positive integer.`);
            }
            evaluationConcurrency = value;
        }
    }
    if (auditMode && (targetGenerator || targetView)) {
        throw new Error('Strict --audit requires the complete dataset; remove --generator and --view filters.');
    }
    if (auditMode) rebuildGraph = true;

    DATASET_DIR = resolve(PROJECT_ROOT, 'out', datasetFolderName);
    DATASET_SNAPSHOT = readDatasetSnapshot(DATASET_DIR);

    console.log(`--- Starting Automated Modular VQA ${auditMode ? '(AUDIT MODE)' : ''} [Dataset: ${datasetFolderName}] ---`);

    // Both splits are validated: validation images ship in the released dataset
    // and are subject to the same checklists as train images.
    const entries: any[] = [];
    const presentSplits: SampleSplit[] = [];
    for (const split of Object.keys(SPLIT_DIRS) as SampleSplit[]) {
        const rows = DATASET_SNAPSHOT.rows(split);
        if (rows.length === 0) continue;
        entries.push(...rows);
        presentSplits.push(split);
    }

    if (presentSplits.length === 0) {
        console.error(`Error: No split metadata found under ${DATASET_DIR}. Please generate the dataset first.`);
        process.exit(1);
    }
    const missingSplits = (Object.keys(SPLIT_DIRS) as SampleSplit[]).filter(s => !presentSplits.includes(s));
    console.log(`Validating split(s): [${presentSplits.map(s => SPLIT_DIRS[s]).join(', ')}] — ${entries.length} samples.`);

    let filtered = [...entries];
    if (targetGenerator) {
        const genLeafIds = new Set(
            findLeafModules(GENERATORS_ROOT)
                .filter(m => m.id === targetGenerator || m.relativePath === targetGenerator || m.category === targetGenerator)
                .map(m => m.id)
        );
        filtered = filtered.filter((e: any) => genLeafIds.has(e.generator));
    }
    if (targetView) {
        const viewsDir = resolve(PROJECT_ROOT, 'src', 'visuals', 'views');
        const viewLeafIds = new Set(
            findLeafModules(viewsDir)
                .filter(m => m.id === targetView || m.relativePath === targetView || m.category === targetView)
                .map(m => m.id)
        );
        filtered = filtered.filter((e: any) => viewLeafIds.has(e.view));
    }

    if (filtered.length === 0) {
        throw new Error('No matching dataset images found to validate.');
    }

    const existingManifest = readDatasetManifest(DATASET_DIR);
    const graphMode = resolveGraphExecutionMode({
        previous: existingManifest,
        previousSupported: !existingManifest
            || (existingManifest.schema_version === DATASET_MANIFEST_SCHEMA_VERSION
                && existingManifest.planner_epoch === DEPENDENCY_PLANNER_EPOCH
                && existingManifest.complete === true
                && existingManifest.spec === specName),
        previousExternalIdentity: existingManifest?.ontology_provenance_hash,
        rebuild: rebuildGraph,
        currentExternalIdentity: datasetOntologyProvenanceHash(PROJECT_ROOT)
    });
    const authoritativeRebuild = graphMode.reconstruct;
    let currentManifestBuild: DatasetManifestBuild;
    let generatorIds: Set<string>;
    let viewIds: Set<string>;
    const canObserveCleanDevelopment = !auditMode
        && !authoritativeRebuild
        && !targetGenerator
        && !targetView
        && existingManifest?.schema_version === DATASET_MANIFEST_SCHEMA_VERSION
        && existingManifest.planner_epoch === DEPENDENCY_PLANNER_EPOCH
        && existingManifest.complete === true
        && existingManifest.spec === specName;
    const observation = canObserveCleanDevelopment
        ? inspectDevelopmentInputObservation({
            projectRoot: PROJECT_ROOT,
            specName,
            previous: existingManifest.development_observation,
            rendererEnvironment: CANONICAL_RENDERER_ID
        })
        : null;

    if (observation?.clean && existingManifest) {
        counters.add('dataset.development_candidate_files', observation.candidate_files);
        counters.add('dataset.development_relevant_files_checked', observation.relevant_files_checked);
        console.log(`Development delta: clean (${observation.reason}); reusing the persisted graph for VQA planning.`);
        currentManifestBuild = {
            entries: existingManifest.entries,
            dependency_graph: existingManifest.dependency_graph,
            development_observation: existingManifest.development_observation,
            source_stats: {directories_read: 0, files_read: 0, bytes_read: 0},
            ontology_semantics: {
                ontology_entities: 0,
                ontology_relations: 0,
                dependency: existingManifest.ontology_dependency,
                provenance_hash: existingManifest.ontology_provenance_hash
            }
        };
        generatorIds = new Set(Object.values(existingManifest.entries).map(entry => entry.generator));
        viewIds = new Set(Object.values(existingManifest.entries).map(entry => entry.view));
    } else {
        if (observation) {
            counters.add('dataset.development_candidate_files', observation.candidate_files);
            counters.add('dataset.development_relevant_files_checked', observation.relevant_files_checked);
            console.log(`Development delta requires graph planning: ${observation.reason}.`);
        }
        const [specValidation, generatorCatalog, viewCatalog] = await Promise.all([
            normalizeAndValidateSpec(specName),
            loadGeneratorModelCatalog(undefined, counters),
            loadViewModelCatalog(undefined, counters)
        ]);
        if (specValidation.errors.length > 0) {
            throw new Error(`Cannot validate dataset freshness because spec "${specName}" is invalid.`);
        }
        const scopedGenerators = targetGenerator
            ? generatorCatalog.filter(entry =>
                entry.generatorId === targetGenerator
                || entry.module.relativePath === targetGenerator
                || entry.module.category === targetGenerator)
            : generatorCatalog;
        const scopedViews = targetView
            ? viewCatalog.filter(entry =>
                entry.viewId === targetView
                || entry.module.relativePath === targetView
                || entry.module.category === targetView)
            : viewCatalog;
        const sourceIndex = new SourceContentIndex(PROJECT_ROOT);
        const pairIndex = buildCompatibleModulePairIndex(generatorCatalog, viewCatalog, counters);
        const matchDelta = matchTargetsDelta({
            targets: specValidation.targets,
            generatorCatalog,
            viewCatalog,
            specName,
            policyHash: matchingPolicyInputHash(),
            previousGraph: authoritativeRebuild ? null : existingManifest?.dependency_graph ?? null,
            pairIndex,
            counters
        });
        currentManifestBuild = buildDatasetManifest({
            projectRoot: PROJECT_ROOT,
            datasetDir: DATASET_DIR,
            specName,
            targets: specValidation.targets,
            generators: generatorCatalog,
            views: viewCatalog,
            tuples: matchDelta.tuples,
            pairIndex,
            sourceIndex,
            counters,
            generatedSplits: presentSplits,
            rendererEnvironment: CANONICAL_RENDERER_ID
        });
        counters.add('dataset.source_directories_read', currentManifestBuild.source_stats.directories_read);
        counters.add('dataset.source_files_read', currentManifestBuild.source_stats.files_read);
        counters.add('dataset.source_bytes_read', currentManifestBuild.source_stats.bytes_read);
        generatorIds = new Set(scopedGenerators.map(entry => entry.generatorId));
        viewIds = new Set(scopedViews.map(entry => entry.viewId));
    }
    const scopedEntries = Object.fromEntries(Object.entries(currentManifestBuild.entries)
        .filter(([, entry]) => generatorIds.has(entry.generator) && viewIds.has(entry.view)));
    const scopedBuild = {...currentManifestBuild, entries: scopedEntries};
    const scopedManifest = existingManifest ? {
        ...existingManifest,
        entries: Object.fromEntries(Object.entries(existingManifest.entries)
            .filter(([, entry]) => generatorIds.has(entry.generator) && viewIds.has(entry.view)))
    } : null;
    const freshnessIssues = datasetFreshnessIssues(scopedManifest, specName, scopedBuild);
    if (freshnessIssues.length > 0) {
        throw new Error(
            `Dataset freshness check failed:\n${freshnessIssues.map(issue => `- ${issue}`).join('\n')}\n` +
            'Regenerate the affected scope before running VQA.'
        );
    }
    console.log('Dataset freshness manifest matches the selected scope.');
    const rendererIssues = datasetRendererIssues(scopedManifest, CANONICAL_RENDERER_ID);
    if (!auditMode && rendererIssues.length > 0) {
        throw new Error(
            `Live VQA requires canonical container renders:\n${rendererIssues.map(issue => `- ${issue}`).join('\n')}\n` +
            'Regenerate the selected scope with npm run generate:dataset before validation.'
        );
    }

    const validationContextResolver = createVqaValidationContextResolver(counters);
    const checklistByView = new Map<string, {
        paths: string[];
        contents: {global: string; view: string};
    }>();
    const checklistTextByPath = new Map<string, string>();
    const checklistFor = (viewId: string) => {
        const cached = checklistByView.get(viewId);
        if (cached) return cached;

        counters.add('vqa.checklist_path_resolutions');
        const paths = getChecklistPaths(viewId);
        const readChecklist = (path: string) => {
            const existing = checklistTextByPath.get(path);
            if (existing !== undefined) return existing;
            const content = readFileSync(path, 'utf-8');
            checklistTextByPath.set(path, content);
            counters.add('vqa.checklist_file_reads');
            counters.add('vqa.checklist_bytes_read', Buffer.byteLength(content));
            return content;
        };
        const checklist = {
            paths,
            contents: {
                global: readChecklist(paths[0]),
                view: readChecklist(paths[1])
            }
        };
        checklistByView.set(viewId, checklist);
        return checklist;
    };

    const preparedSamples: PreparedVqaSample[] = filtered.map(entry => {
        const imagePath = imagePathFor(entry);
        if (!existsSync(imagePath)) return {entry, imagePath};

        const imageNode = currentManifestBuild.dependency_graph.nodes[`image:${entry.sample_key}`];
        const validationCacheKey = dependencyGraphVqaCacheKey(
            currentManifestBuild.dependency_graph,
            entry.sample_key
        );
        if (!imageNode?.output?.content_hash || !validationCacheKey) {
            throw new Error(`Dependency graph is missing VQA identity for ${entry.sample_key}.`);
        }
        return {
            entry,
            imagePath,
            imageSha256: imageNode.output.content_hash,
            validationCacheKey
        };
    });

    const prepareValidationContext = (sample: PreparedVqaSample): void => {
        if (sample.validationContext || !sample.imageSha256) return;
        const checklist = checklistFor(sample.entry.view);
        const validationContext = validationContextResolver.resolve(
            sample.imageSha256,
            checklist.paths,
            sample.entry.tags,
            [checklist.contents.global, checklist.contents.view]
        );
        if (validationContext.validationCacheKey !== sample.validationCacheKey) {
            throw new Error(
                `VQA dependency graph key does not match the resolved prompt context for ${sample.entry.sample_key}.`
            );
        }
        sample.checklistPaths = checklist.paths;
        sample.checklistContents = checklist.contents;
        sample.validationContext = validationContext;
    };

    // Collect active cache keys per module for auto-pruning.
    const activeKeysPerModule = new Map<string, Set<string>>();
    const expectedCacheRecords: ExpectedVqaCacheRecord[] = [];

    for (const sample of preparedSamples) {
        const {entry, validationCacheKey} = sample;
        const moduleName = entry.generator;
        if (!validationCacheKey) continue;

        if (!activeKeysPerModule.has(moduleName)) {
            activeKeysPerModule.set(moduleName, new Set());
        }
        activeKeysPerModule.get(moduleName)!.add(validationCacheKey);
        expectedCacheRecords.push({
            moduleName,
            validationCacheKey,
            sampleKey: entry.sample_key
        });
    }

    if (auditMode) {
        const integrity = verifyDatasetSnapshotIntegrity(DATASET_SNAPSHOT);
        counters.add('dataset.integrity_files_read', integrity.files_verified);
        counters.add('dataset.integrity_bytes_read', integrity.bytes_read);
        const structureIssues = [
            ...datasetStructureIssues(filtered, missingSplits),
            ...integrity.issues
        ];
        const cacheAudit = auditVqaCache(
            resolve(CACHE_DIR, datasetFolderName),
            expectedCacheRecords,
            counters
        );

        console.log(`\n--- Strict VQA Cache Audit Summary [${datasetFolderName}] ---`);
        console.log(`Passing coverage: ${cacheAudit.passed}/${cacheAudit.expected}`);
        console.log(`Uncovered images: ${cacheAudit.expected - cacheAudit.passed}`);
        console.log(`Dataset structure issues: ${structureIssues.length}`);
        console.log(`Renderer identity issues: ${rendererIssues.length}`);
        for (const [kind, count] of Object.entries(cacheAudit.counts)) {
            console.log(`Cache ${kind}${kind === 'missing' ? ' keys' : ''}: ${count}`);
        }
        for (const issue of structureIssues) console.error(`❌ DATASET: ${issue}`);
        for (const issue of rendererIssues) console.error(`❌ RENDERER: ${issue}`);
        for (const issue of cacheAudit.issues) console.error(`❌ CACHE ${issue.kind.toUpperCase()}: ${issue.message}`);

        const failureCount = structureIssues.length + rendererIssues.length + cacheAudit.issues.length;
        if (failureCount > 0 && !reportOnly) {
            throw new Error(
                `Strict VQA cache audit failed with ${failureCount} issue(s). ` +
                `Run canonical generation and local live validation before release.`
            );
        }
        if (failureCount > 0) {
            console.log('--report-only requested; audit findings do not affect the exit code.');
        } else {
            console.log(`✅ AUDIT PASSED: all ${cacheAudit.expected} generated samples have exact passing cache coverage.`);
        }
        console.log('\nValidation Complete.');
        console.log(`[Work counters] ${JSON.stringify(counters.snapshot())}`);
        return;
    }

    const cacheManagers = new Map<string, VqaCacheManager>();
    const cacheManagerFor = (moduleName: string) => {
        let manager = cacheManagers.get(moduleName);
        if (!manager) {
            manager = new VqaCacheManager(
                CACHE_DIR,
                datasetFolderName,
                moduleName,
                counters
            );
            cacheManagers.set(moduleName, manager);
        }
        return manager;
    };

    // Perform automatic safe pruning of stale cache entries for this dataset
    // folder. Pruning is only safe when every split is on disk: a dataset built
    // with --training-only has no validation images, and pruning against it
    // would discard paid-for validation records that are not actually stale.
    // The same reasoning applies to --generator/--view filters.
    const isFullDataset = missingSplits.length === 0 && !targetGenerator && !targetView;
    if (!isFullDataset) {
        const reasons = [
            ...missingSplits.map(s => `split "${SPLIT_DIRS[s]}" not generated`),
            ...(targetGenerator ? [`--generator=${targetGenerator}`] : []),
            ...(targetView ? [`--view=${targetView}`] : [])
        ];
        console.log(`ℹ️ Skipping cache pruning (${reasons.join(', ')}) — entries outside this run cannot be confirmed stale.`);
    } else {
        for (const [modName, activeKeys] of activeKeysPerModule.entries()) {
            const mgr = cacheManagerFor(modName);
            const pruned = mgr.prune(activeKeys);
            if (pruned > 0) {
                console.log(`🧹 Auto-pruned ${pruned} stale cache entries for [${modName}] in cache/vqa-validation/${datasetFolderName}/`);
            }
        }
        const obsoleteModules = pruneObsoleteVqaCacheFiles(
            resolve(CACHE_DIR, datasetFolderName),
            new Set(activeKeysPerModule.keys())
        );
        for (const moduleName of obsoleteModules) {
            console.log(`🧹 Removed obsolete VQA cache file for [${moduleName}] in cache/vqa-validation/${datasetFolderName}/`);
        }
    }

    const toEvaluate: PreparedVqaSample[] = [];
    let cachedCount = 0;
    let cachedPassed = 0;
    let cachedFailed = 0;

    for (const sample of preparedSamples) {
        const {entry, validationCacheKey} = sample;
        if (!validationCacheKey) continue;

        const existingCache = cacheManagerFor(entry.generator)
            .get(validationCacheKey);

        if (existingCache && !force) {
            cachedCount++;
            if (existingCache.evaluation.pass) cachedPassed++;
            else cachedFailed++;
        } else {
            toEvaluate.push(sample);
        }
    }

    if (cachedCount > 0) {
        console.log(`ℹ️ Reused ${cachedCount} cached evaluation records (${cachedPassed} passed, ${cachedFailed} failed).`);
    }

    if (toEvaluate.length > 0) {
        if (!apiKey) {
            console.log(`⚠️ LLM QA skipped: GEMINI_API_KEY or model not loaded.`);
        } else {
            for (const sample of toEvaluate) prepareValidationContext(sample);
            evaluationConcurrency = logPrompts ? 1 : evaluationConcurrency;
            console.log(`Evaluating ${toEvaluate.length} samples concurrently (up to ${evaluationConcurrency} parallel request${evaluationConcurrency === 1 ? '' : 's'})...`);
            let processed = 0;
            let evalPassed = cachedPassed;
            let evalFailed = cachedFailed;

            renderProgressBar(0, toEvaluate.length, evalPassed, evalFailed);

            await runPool(toEvaluate, evaluationConcurrency, async (sample) => {
                const record = await evaluateSingleSample(sample, logPrompts, counters);
                processed++;
                if (record) {
                    const mgr = cacheManagerFor(record.moduleName);
                    mgr.set({
                        validation_cache_key: record.validation_cache_key,
                        sample_key: record.sample_key,
                        target_id: record.target_id,
                        generator: record.generator,
                        view: record.view,
                        mode: record.mode,
                        instance: record.instance,
                        attempt: record.attempt,
                        seed: record.seed,
                        file_name: record.file_name,
                        image_sha256: record.image_sha256,
                        checklist_hash: record.checklist_hash,
                        label_context_hash: record.label_context_hash,
                        validation_context_hash: record.validation_context_hash,
                        validation_policy_hash: record.validation_policy_hash,
                        validated_at: record.validated_at,
                        evaluation: record.evaluation
                    });
                    if (record.evaluation.pass) evalPassed++;
                    else evalFailed++;
                }
                renderProgressBar(processed, toEvaluate.length, evalPassed, evalFailed);
            });
            console.log('\n');
        }
    }

    // Save and sort clean JSONL cache files for all active modules
    for (const modName of activeKeysPerModule.keys()) {
        cacheManagerFor(modName).save();
    }

    // Generate Markdown report and failure TODO list
    const resolvedReportPath = validationReportPath(PROJECT_ROOT, datasetFolderName, {
        generator: targetGenerator,
        view: targetView,
        reportPath: reportOverride
    });
    const report = generateValidationReport(
        datasetFolderName,
        preparedSamples,
        resolvedReportPath,
        cacheManagerFor
    );
    const reportPath = report.path;
    console.log(`📄 Validation report & TODO list generated: ${reportPath}`);

    if (validationFailed(report.counts, reportOnly)) {
        throw new Error(
            `VQA validation failed: ${report.counts.failed} failing and ${report.counts.uncached} uncached sample(s). ` +
            `See ${report.path}.`
        );
    }
    if (reportOnly && (report.counts.failed > 0 || report.counts.uncached > 0)) {
        console.log('--report-only requested; validation findings do not affect the exit code.');
    }

    console.log('\nValidation Complete.');
    console.log(`[Work counters] ${JSON.stringify(counters.snapshot())}`);
}

function generateValidationReport(
    datasetFolderName: string,
    preparedSamples: readonly PreparedVqaSample[],
    reportPath: string,
    cacheManagerFor: (moduleName: string) => VqaCacheManager
): { path: string; counts: { passed: number; failed: number; uncached: number } } {
    const outDir = dirname(reportPath);
    if (!existsSync(outDir)) {
        mkdirSync(outDir, { recursive: true });
    }

    let passedCount = 0;
    let failedCount = 0;
    let uncachedCount = 0;
    const failedItems: Array<{
        entry: any;
        evaluation: any;
    }> = [];
    type SplitTally = { total: number; passed: number; failed: number; uncached: number };
    const perSplit = new Map<string, SplitTally>();
    const tallyFor = (entry: any): SplitTally => {
        const splitDir = SPLIT_DIRS[parseSampleKey(entry.sample_key).split];
        if (!perSplit.has(splitDir)) perSplit.set(splitDir, { total: 0, passed: 0, failed: 0, uncached: 0 });
        return perSplit.get(splitDir)!;
    };

    for (const sample of preparedSamples) {
        const {entry, validationCacheKey} = sample;
        const moduleName = entry.generator;
        const tally = tallyFor(entry);
        tally.total++;

        if (!validationCacheKey) {
            uncachedCount++;
            tally.uncached++;
            continue;
        }

        const cache = cacheManagerFor(moduleName).get(validationCacheKey);

        if (!cache) {
            uncachedCount++;
            tally.uncached++;
        } else if (cache.evaluation.pass) {
            passedCount++;
            tally.passed++;
        } else {
            failedCount++;
            tally.failed++;
            failedItems.push({
                entry,
                evaluation: cache.evaluation
            });
        }
    }

    const total = preparedSamples.length;
    const passedPct = total > 0 ? ((passedCount / total) * 100).toFixed(1) : '0.0';
    const failedPct = total > 0 ? ((failedCount / total) * 100).toFixed(1) : '0.0';
    const uncachedPct = total > 0 ? ((uncachedCount / total) * 100).toFixed(1) : '0.0';

    let md = `# VQA Dataset Validation Report - \`${datasetFolderName}\`

**Generated At:** \`${new Date().toISOString()}\`  
**Dataset Path:** \`out/${datasetFolderName}/\`

## Overview

| Metric | Count | Percentage |
| :--- | :--- | :--- |
| **Total Evaluated Samples** | ${total} | 100% |
| **Passed** | ${passedCount} | ${passedPct}% |
| **Failed** | ${failedCount} | ${failedPct}% |
| **Uncached / Skipped** | ${uncachedCount} | ${uncachedPct}% |

## By Split

| Split | Total | Passed | Failed | Uncached |
| :--- | :--- | :--- | :--- | :--- |
${[...perSplit.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([split, t]) => `| \`${split}\` | ${t.total} | ${t.passed} | ${t.failed} | ${t.uncached} |`)
        .join('\n')}

---

## Failure TODO List

`;

    if (failedItems.length === 0) {
        md += `🎉 **No failures detected! All evaluated samples passed Visual QA.**\n`;
    } else {
        md += `Below is the list of failed exercise samples requiring visual or logical fixes:\n\n`;
        for (const item of failedItems) {
            const entry = item.entry;
            const evalObj = item.evaluation;
            const modeStr = entry.mode;
            
            const checks: string[] = [];
            if (evalObj.general_checks) {
                checks.push(`Overlaps: ${evalObj.general_checks.no_overlaps ? 'Pass' : 'FAIL'}`);
                checks.push(`Placeholders: ${evalObj.general_checks.no_placeholders ? 'Pass' : 'FAIL'}`);
                checks.push(`Padding: ${evalObj.general_checks.sane_padding ? 'Pass' : 'FAIL'}`);
                checks.push(`Task identifiable: ${evalObj.general_checks.task_identifiable ? 'Pass' : 'FAIL'}`);
                checks.push(`Mode validity: ${evalObj.general_checks.mode_valid ? 'Pass' : 'FAIL'}`);
                checks.push(`Minimal text: ${evalObj.general_checks.text_minimal ? 'Pass' : 'FAIL'}`);
                checks.push(`Mathematical coherence: ${evalObj.general_checks.math_coherent ? 'Pass' : 'FAIL'}`);
            }
            for (const labelCheck of evalObj.label_checks || []) {
                if (labelCheck.verdict === 'not_defendable') {
                    checks.push(`Label ${labelCheck.label}: NOT DEFENDABLE — ${labelCheck.evidence}`);
                }
            }

            md += `- [ ] **\`${displayPathOf(entry)}\`**\n`;
            md += `  - **Module / View:** \`${entry.generator}\` : \`${entry.view}\` (${modeStr} mode)\n`;
            md += `  - **Reason:** ${evalObj.reasoning}\n`;
            if (checks.length > 0) {
                md += `  - **Checks:** ${checks.join(' | ')}\n`;
            }
            md += `  - **Sample:** \`${entry.sample_key}\` (target \`${entry.target_id}\`, attempt ${entry.attempt}, seed ${entry.seed})\n`;
            md += `  - **Retest:** \`npm run test:sample -- --sample="${entry.sample_key}" --spec=${entry.spec}\`\n`;
            md += `\n`;
        }
    }

    writeFileSync(reportPath, md, 'utf-8');
    return {
        path: reportPath,
        counts: { passed: passedCount, failed: failedCount, uncached: uncachedCount }
    };
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
