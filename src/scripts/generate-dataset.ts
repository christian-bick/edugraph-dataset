import { Browser, Page, chromium } from 'playwright';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';
import { AbstractProblem, ProblemStub } from '../types/ml-engine.ts';
import { shortenLabel } from '../lib/utils.ts';
import {
    loadGeneratorCatalog,
    loadViewCatalog,
    matchTargets,
    computeSampleKey,
    computeSampleFilename,
    computeSampleSeed,
    computeContentFingerprint,
    generateSampleWithRetry,
    isValTuple,
    DEFAULT_VAL_RATIO,
    buildProblem,
    buildRenderPayload,
    GeneratorCatalogEntry,
    ViewCatalogEntry,
    SampleIdentity,
    SampleMode,
    SampleSplit,
    SPLIT_DIRS
} from '../lib/generation.ts';
import { normalizeAndValidateSpec } from '../lib/spec-validator.ts';
import { getCliOption } from '../lib/cli.ts';
import { datasetDirForSpec, datasetOutDir } from '../lib/dataset-paths.ts';
import {
    beginDatasetTransaction,
    DatasetRow,
    finalizeDatasetMetadata,
    mergeModuleMetadata
} from '../lib/dataset-output.ts';
import { buildDatasetManifestEntries, updateDatasetManifest } from '../lib/dataset-manifest.ts';
import { CONTAINER_GENERATION_VARIABLE, RENDER_CONTEXT_OPTIONS } from '../lib/render-environment.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..', '..');
const BASE_URL = process.env.RENDER_BASE_URL ?? 'http://localhost:5173';
const DEFAULT_CONCURRENCY = 8;
const DEFAULT_PREFLIGHT_CONCURRENCY = 4;
const MAX_ATTEMPTS = 50;

/**
 * One fully specified image to render: the sample identity plus everything
 * derived from it. All fields are pure functions of (identity, attempt), so
 * the same tuple always produces the same image regardless of what else is
 * in the dataset.
 */
interface RenderSample {
    identity: SampleIdentity;
    sampleKey: string;
    fileName: string;
    seed: number;
    attempt: number;
    fingerprint: string;
    problem: AbstractProblem;
    associatedTargetIds: Set<string>;
}

type SampleFingerprintIndex = Map<string, Map<string, RenderSample[]>>;

function samplesForFingerprint(
    index: SampleFingerprintIndex | undefined,
    viewId: string,
    fingerprint: string
): RenderSample[] {
    return index?.get(viewId)?.get(fingerprint) ?? [];
}

function claimSample(index: SampleFingerprintIndex, sample: RenderSample): void {
    const byFingerprint = index.get(sample.identity.viewId) ?? new Map<string, RenderSample[]>();
    const samples = byFingerprint.get(sample.fingerprint) ?? [];
    samples.push(sample);
    byFingerprint.set(sample.fingerprint, samples);
    index.set(sample.identity.viewId, byFingerprint);
}

/**
 * Generates all samples of one module (generator) for one split.
 *
 * Dedup is scoped per (module, split, view) via content fingerprints, and
 * covers both modes: every drawn content item is claimed for its view, so a
 * question never repeats a solution's content or vice versa. The val split
 * additionally rejects content already claimed by the module's train split.
 *
 * The module scope is deliberate — it keeps `--generator=X` reproducing exactly
 * what a full run produces for that module. It costs nothing in practice
 * because no view is rendered by more than one generator, so cross-module
 * collisions within a view cannot occur.
 */
function generateModuleSamples(
    genEntry: GeneratorCatalogEntry,
    viewCatalog: ViewCatalogEntry[],
    targets: any[],
    split: SampleSplit,
    fingerprintsByView: SampleFingerprintIndex,
    trainFingerprintsByView?: SampleFingerprintIndex
): RenderSample[] {
    const moduleName = genEntry.generatorId;
    const { tuples } = matchTargets(targets, [genEntry], viewCatalog);
    const samples: RenderSample[] = [];

    for (const tuple of tuples) {
        const target = tuple.target;
        if (split === 'val' && !isValTuple(target.id, moduleName, tuple.viewId, DEFAULT_VAL_RATIO)) continue;

        const labels = [...target.labels];
        const instanceIdx = 0;

        const makeIdentity = (mode: SampleMode): SampleIdentity => ({
            targetId: target.id,
            generatorId: moduleName,
            viewId: tuple.viewId,
            split,
            mode,
            instanceIdx
        });

        // Applied to both modes: content already claimed for this view — in
        // either mode, and in train when drawing val — is rejected, so no two
        // images of a view ever show the same problem across a split boundary.
        const duplicateSamples: RenderSample[] = [];
        const isDuplicate = (stub: ProblemStub) => {
            const fingerprint = computeContentFingerprint(stub.data);
            const matches = [
                ...samplesForFingerprint(fingerprintsByView, tuple.viewId, fingerprint),
                ...samplesForFingerprint(trainFingerprintsByView, tuple.viewId, fingerprint)
            ];
            for (const sample of matches) {
                if (!duplicateSamples.includes(sample)) duplicateSamples.push(sample);
            }
            return matches.length > 0;
        };

        const questionIdentity = makeIdentity('question');
        const questionKey = computeSampleKey(questionIdentity);

        let question: { stub: ProblemStub | null; attempt: number; seed: number };
        try {
            question = generateSampleWithRetry({
                generator: genEntry.generator,
                labels,
                sampleKey: questionKey,
                maxAttempts: MAX_ATTEMPTS,
                isDuplicate
            });
        } catch (e) {
            console.warn(`[${moduleName}] Skipping ${questionKey}: generator error: ${e instanceof Error ? e.message : e}`);
            continue;
        }
        if (!question.stub) {
            const representedBy = duplicateSamples[0];
            if (representedBy) {
                representedBy.associatedTargetIds.add(target.id);
                console.warn(`[${moduleName}] Linked ${questionKey} to existing sample ${representedBy.sampleKey} after ${MAX_ATTEMPTS} duplicate attempts`);
                continue;
            }
            console.warn(`[${moduleName}] Skipping ${questionKey}: no unique stub after ${MAX_ATTEMPTS} attempts`);
            continue;
        }

        const questionSample: RenderSample = {
            identity: questionIdentity,
            sampleKey: questionKey,
            fileName: computeSampleFilename(questionIdentity),
            seed: question.seed,
            attempt: question.attempt,
            fingerprint: computeContentFingerprint(question.stub.data),
            problem: buildProblem({ stub: question.stub, type: genEntry.generator.type, labels }),
            associatedTargetIds: new Set()
        };
        samples.push(questionSample);
        claimSample(fingerprintsByView, questionSample);

        const solutionIdentity = makeIdentity('solution');
        const solutionKey = computeSampleKey(solutionIdentity);
        let solution: { stub: ProblemStub | null; attempt: number; seed: number };
        try {
            solution = generateSampleWithRetry({
                generator: genEntry.generator,
                labels,
                sampleKey: solutionKey,
                maxAttempts: MAX_ATTEMPTS,
                isDuplicate
            });
        } catch (e) {
            solution = { stub: null, attempt: 1, seed: computeSampleSeed(solutionKey, 1) };
        }
        // A view whose content space is too small to offer a second distinct
        // problem falls back to showing the question's content solved. That is
        // the same exercise in the same split — never a cross-split leak.
        const solutionStub = solution.stub || question.stub;
        const solutionSample: RenderSample = {
            identity: solutionIdentity,
            sampleKey: solutionKey,
            fileName: computeSampleFilename(solutionIdentity),
            seed: solution.stub ? solution.seed : question.seed,
            attempt: solution.stub ? solution.attempt : question.attempt,
            fingerprint: computeContentFingerprint(solutionStub.data),
            problem: buildProblem({ stub: solutionStub, type: genEntry.generator.type, labels }),
            associatedTargetIds: new Set()
        };
        samples.push(solutionSample);
        claimSample(fingerprintsByView, solutionSample);
    }

    return samples;
}

interface PageDiagnostics {
    pageErrors: string[];
    consoleErrors: string[];
    failedRequests: string[];
}

function attachPageDiagnostics(page: Page, baseUrl: string): PageDiagnostics {
    const diagnostics: PageDiagnostics = { pageErrors: [], consoleErrors: [], failedRequests: [] };
    page.on('pageerror', error => diagnostics.pageErrors.push(error.message || String(error)));
    page.on('console', message => {
        if (message.type() === 'error') diagnostics.consoleErrors.push(message.text());
    });
    page.on('requestfailed', request => {
        const errorText = request.failure()?.errorText ?? 'failed';
        // Vite/Chromium can abort a superseded optimized-dependency request
        // while navigation still completes normally. Missing local resources
        // use other failure codes and remain renderer-gating diagnostics.
        if (request.url().startsWith(baseUrl) && errorText !== 'net::ERR_ABORTED') {
            diagnostics.failedRequests.push(`${request.url()} (${errorText})`);
        }
    });
    return diagnostics;
}

function formatDiagnostics(diagnostics: PageDiagnostics): string {
    return [
        ...diagnostics.pageErrors.map(error => `page error: ${error}`),
        ...diagnostics.consoleErrors.map(error => `console error: ${error}`),
        ...diagnostics.failedRequests.map(error => `request failed: ${error}`)
    ].join('; ');
}

function renderViewUrl(baseUrl: string, relativePath: string): string {
    return `${baseUrl.replace(/\/$/, '')}/visuals/views/${relativePath}/view.html`;
}

async function preflightViews(
    browser: Browser,
    views: ViewCatalogEntry[],
    baseUrl: string,
    concurrency: number
): Promise<void> {
    if (views.length === 0) return;
    console.log(`Preflighting ${views.length} renderer view(s) at ${baseUrl}...`);
    const queue = [...views].sort((a, b) => a.viewId.localeCompare(b.viewId));
    const failures: Error[] = [];
    let failed = false;

    const worker = async () => {
        const context = await browser.newContext(RENDER_CONTEXT_OPTIONS);
        try {
            while (!failed) {
                const view = queue.shift();
                if (!view) break;
                const page = await context.newPage();
                const diagnostics = attachPageDiagnostics(page, baseUrl);
                const url = renderViewUrl(baseUrl, view.module.relativePath);
                try {
                    const response = await page.goto(url, { waitUntil: 'networkidle' });
                    if (!response || !response.ok()) {
                        throw new Error(`HTTP ${response?.status() ?? 'no response'}`);
                    }
                    await page.waitForFunction(() => typeof window.renderView === 'function');
                    if (diagnostics.pageErrors.length > 0 || diagnostics.failedRequests.length > 0) {
                        throw new Error(formatDiagnostics(diagnostics));
                    }
                } catch (error) {
                    failed = true;
                    const detail = formatDiagnostics(diagnostics);
                    failures.push(new Error(
                        `Renderer preflight failed for ${view.viewId} (${url}): ${error instanceof Error ? error.message : error}` +
                        (detail ? `; ${detail}` : '')
                    ));
                } finally {
                    await page.close();
                }
            }
        } finally {
            await context.close();
        }
    };

    await Promise.all(Array.from(
        { length: Math.min(concurrency, queue.length) },
        () => worker()
    ));
    if (failures.length > 0) throw new AggregateError(failures, 'Renderer preflight failed.');
    console.log('Renderer preflight passed.');
}

async function renderSamples(
    browser: Browser,
    outputDir: string,
    specName: string,
    baseUrl: string,
    split: SampleSplit,
    moduleName: string,
    samples: RenderSample[],
    concurrency: number,
    viewPathMap: Record<string, string>
): Promise<number> {
    if (samples.length === 0) return 0;

    const splitDirName = SPLIT_DIRS[split];
    console.log(`\n--- Rendering [${moduleName}] Split: ${splitDirName} (${samples.length} samples) ---`);
    const splitOutputDir = resolve(outputDir, splitDirName, moduleName);
    mkdirSync(splitOutputDir, { recursive: true });

    // Order by view to minimize page navigations; workers pull from a shared
    // queue, which is safe because every render is fully self-seeded.
    const taskQueue = [...samples].sort((a, b) =>
        a.identity.viewId.localeCompare(b.identity.viewId) || a.fileName.localeCompare(b.fileName)
    );
    const totalTasks = taskQueue.length;
    let completedTasks = 0;
    const metadata: DatasetRow[] = [];
    const failures: Error[] = [];
    let failed = false;

    const processQueue = async () => {
        const context = await browser.newContext(RENDER_CONTEXT_OPTIONS);
        const page = await context.newPage();
        const diagnostics = attachPageDiagnostics(page, baseUrl);
        let currentViewUrl = '';
        let currentSampleKey = '';

        try {
            while (!failed) {
                const sample = taskQueue.shift();
                if (!sample) break;
                currentSampleKey = sample.sampleKey;

                const { identity } = sample;
                const viewPath = viewPathMap[identity.viewId] || identity.viewId;
                const url = renderViewUrl(baseUrl, viewPath);

                if (currentViewUrl !== url) {
                    const response = await page.goto(url, { waitUntil: 'networkidle' });
                    if (!response || !response.ok()) {
                        throw new Error(`View returned HTTP ${response?.status() ?? 'no response'}: ${url}`);
                    }
                    await page.waitForFunction(() => typeof window.renderView === 'function');
                    // CSS transitions/animations make pixels depend on screenshot
                    // timing and on the previous render of the reused page —
                    // disable them so every render settles instantly.
                    await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; animation: none !important; }' });
                    currentViewUrl = url;
                }

                const payload = buildRenderPayload({
                    problem: sample.problem,
                    viewId: identity.viewId,
                    labels: sample.problem.tags || [],
                    mode: identity.mode,
                    seed: sample.seed
                });

                await page.evaluate((p) => window.renderView!(p), payload);
                // Wait for fonts and images to be fully loaded so pixel output
                // does not depend on cache warmth of the reused page.
                await page.waitForFunction(() =>
                    document.fonts.status === 'loaded'
                    && Array.from(document.images).every(img => img.complete && img.naturalWidth > 0)
                );
                await page.waitForTimeout(60);
                if (diagnostics.pageErrors.length > 0) {
                    throw new Error(formatDiagnostics(diagnostics));
                }

                const outPath = resolve(splitOutputDir, sample.fileName);
                await page.locator('#view').screenshot({ path: outPath, omitBackground: true });

                metadata.push({
                    file_name: sample.fileName,
                    sample_key: sample.sampleKey,
                    spec: specName,
                    target_id: identity.targetId,
                    generator: identity.generatorId,
                    view: identity.viewId,
                    mode: identity.mode,
                    instance: identity.instanceIdx,
                    attempt: sample.attempt,
                    seed: sample.seed,
                    content_fingerprint: sample.fingerprint,
                    tags: (sample.problem.tags || []).map(shortenLabel).sort(),
                    target_associations: [...sample.associatedTargetIds]
                        .sort()
                        .map(targetId => ({spec: specName, target_id: targetId}))
                });

                completedTasks++;
                if (completedTasks % Math.max(1, Math.floor(totalTasks / 10)) === 0) {
                    console.log(`[${moduleName}:${splitDirName}] Progress: ${Math.floor((completedTasks / totalTasks) * 100)}%`);
                }
            }
        } catch (error) {
            failed = true;
            const detail = formatDiagnostics(diagnostics);
            failures.push(new Error(
                `Failed to render ${currentSampleKey || `${moduleName}:${splitDirName}`}: ${error instanceof Error ? error.message : error}` +
                (detail ? `; ${detail}` : '')
            ));
        } finally {
            await context.close();
        }
    };

    await Promise.all(Array.from(
        { length: Math.min(concurrency, taskQueue.length) },
        () => processQueue()
    ));

    if (failures.length > 0 || completedTasks !== totalTasks) {
        if (failures.length === 0) {
            failures.push(new Error(`Rendered ${completedTasks}/${totalTasks} expected images.`));
        }
        throw new AggregateError(failures, `Rendering failed for ${moduleName}:${splitDirName}.`);
    }

    mergeModuleMetadata(splitOutputDir, metadata);
    console.log(`[${moduleName}:${splitDirName}] Wrote modular metadata to .metadata.jsonl`);

    return completedTasks;
}

async function runModulePipeline(
    browser: Browser,
    outputDir: string,
    specName: string,
    baseUrl: string,
    genEntry: GeneratorCatalogEntry,
    viewCatalog: ViewCatalogEntry[],
    allTargets: any[],
    trainingOnly: boolean,
    concurrency: number
): Promise<number> {
    const moduleName = genEntry.generatorId;
    console.log(`\n--- Starting Pipeline for Module: ${moduleName} (${genEntry.module.relativePath}) ---`);

    const viewPathMap: Record<string, string> = {};
    for (const view of viewCatalog) {
        viewPathMap[view.viewId] = view.module.relativePath;
    }

    // Train is generated first, into its own index, and val only ever *reads*
    // that index. This asymmetry is deliberate and must be preserved: train is
    // the primary artifact and may not depend on whether val was generated at
    // all, while val is derived and necessarily depends on train — disjointness
    // cannot be had otherwise. Verify with:
    //   generate --spec=test, then generate --spec=test --training-only
    //   → the train split must be byte-identical.
    const trainFingerprints: SampleFingerprintIndex = new Map();
    const trainSamples = generateModuleSamples(genEntry, viewCatalog, allTargets, 'train', trainFingerprints);

    let valSamples: RenderSample[] = [];
    if (!trainingOnly) {
        const valFingerprints: SampleFingerprintIndex = new Map();
        valSamples = generateModuleSamples(genEntry, viewCatalog, allTargets, 'val', valFingerprints, trainFingerprints);
    }

    console.log(`[${moduleName}] Generated samples. Train (${trainSamples.length}), Validation (${valSamples.length})`);

    let moduleImages = 0;
    moduleImages += await renderSamples(
        browser,
        outputDir,
        specName,
        baseUrl,
        'train',
        moduleName,
        trainSamples,
        concurrency,
        viewPathMap
    );
    if (valSamples.length > 0) {
        moduleImages += await renderSamples(
            browser,
            outputDir,
            specName,
            baseUrl,
            'val',
            moduleName,
            valSamples,
            concurrency,
            viewPathMap
        );
    }
    return moduleImages;
}

async function main() {
    if (process.env[CONTAINER_GENERATION_VARIABLE] !== '1') {
        throw new Error(
            'Dataset generation is container-only. Run npm run generate:dataset -- --spec=<spec_module>.'
        );
    }
    const args = process.argv.slice(2);

    const specName = getCliOption(args, 'spec');
    if (!specName) {
        console.error('Error: The --spec parameter is required.');
        console.error('Usage: npm run generate:dataset -- --spec=<spec_module> [--generator=<generator_name>] [--view=<view_id>] [--training-only]');
        console.error('Example: npm run generate:dataset -- --spec=test');
        console.error('Example: npm run generate:dataset -- --spec=ccss');
        process.exit(1);
    }

    const outDir = datasetOutDir(PROJECT_ROOT, datasetDirForSpec(specName));

    const validationResult = await normalizeAndValidateSpec(specName);
    if (validationResult.errors.length > 0) {
        console.error(`❌ Spec validation failed for "${specName}" with ${validationResult.errors.length} error(s):`);
        for (const err of validationResult.errors) {
            console.error(`- ${err}`);
        }
        throw new Error(`Spec validation failed for "${specName}". Aborting dataset generation.`);
    }

    const allTargets = validationResult.targets;
    console.log(`Loaded ${allTargets.length} normalized & deduplicated targets for spec "${specName}" (${validationResult.stats.deduplicatedCount} deduplicated).`);

    const targetModule = getCliOption(args, 'generator');
    const targetView = getCliOption(args, 'view');
    const trainingOnly = process.env.npm_config_training_only === 'true' || process.env.npm_config_training_only === '' || args.includes('--training-only');
    const concurrencyOption = getCliOption(args, 'concurrency');
    const concurrency = concurrencyOption === undefined ? DEFAULT_CONCURRENCY : Number(concurrencyOption);
    if (!Number.isInteger(concurrency) || concurrency < 1) {
        throw new Error(`--concurrency must be a positive integer; received "${concurrencyOption}".`);
    }

    const generatorCatalog = await loadGeneratorCatalog();
    const fullViewCatalog = await loadViewCatalog();

    const modulesToRun = targetModule
        ? generatorCatalog.filter(g =>
            g.generatorId === targetModule || g.module.relativePath === targetModule || g.module.category === targetModule)
        : generatorCatalog;

    const viewCatalog = targetView
        ? fullViewCatalog.filter(v =>
            v.viewId === targetView || v.module.relativePath === targetView || v.module.category === targetView)
        : fullViewCatalog;

    if (modulesToRun.length === 0) {
        throw new Error(`No generator modules matched --generator=${targetModule}.`);
    }
    if (viewCatalog.length === 0) {
        throw new Error(`No views matched --view=${targetView}.`);
    }

    const matchedViewIds = new Set(
        matchTargets(allTargets, modulesToRun, viewCatalog).tuples.map(tuple => tuple.viewId)
    );
    if (matchedViewIds.size === 0) {
        throw new Error('The selected generation scope contains no matched generator-view tuples.');
    }
    const viewsToPreflight = viewCatalog.filter(view => matchedViewIds.has(view.viewId));

    const browser = await chromium.launch({ headless: true });
    const startTime = performance.now();
    let transaction: ReturnType<typeof beginDatasetTransaction> | undefined;

    try {
        await preflightViews(
            browser,
            viewsToPreflight,
            BASE_URL,
            Math.min(DEFAULT_PREFLIGHT_CONCURRENCY, concurrency)
        );

        const generationScope = {
            fullDataset: !targetModule && !targetView,
            generatorIds: modulesToRun.map(module => module.generatorId),
            viewIds: targetView ? viewCatalog.map(view => view.viewId) : undefined
        };
        transaction = beginDatasetTransaction(outDir, generationScope);

        let totalImages = 0;
        for (const genEntry of modulesToRun) {
            totalImages += await runModulePipeline(
                browser,
                transaction.stagingDir,
                specName,
                BASE_URL,
                genEntry,
                viewCatalog,
                allTargets,
                trainingOnly,
                concurrency
            );
        }

        finalizeDatasetMetadata(transaction.stagingDir, SPLIT_DIRS.train);
        finalizeDatasetMetadata(transaction.stagingDir, SPLIT_DIRS.val);
        const manifestEntries = buildDatasetManifestEntries({
            projectRoot: PROJECT_ROOT,
            datasetDir: transaction.stagingDir,
            targets: allTargets,
            generators: modulesToRun,
            views: viewCatalog,
            generatedSplits: trainingOnly ? ['train'] : ['train', 'val']
        });
        updateDatasetManifest({
            projectRoot: PROJECT_ROOT,
            datasetDir: transaction.stagingDir,
            specName,
            entries: manifestEntries,
            scope: generationScope
        });
        transaction.commit();

        const duration = ((performance.now() - startTime) / 1000).toFixed(2);
        console.log(`\nDONE! Generated ${totalImages} images in ${duration}s.`);
    } catch (error) {
        transaction?.rollback();
        throw error;
    } finally {
        await browser.close();
    }
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
