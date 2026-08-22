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
    computeTaskFingerprint,
    resolveViewConfig,
    generateSampleWithRetry,
    isValTuple,
    DEFAULT_VAL_RATIO,
    buildProblem,
    buildRenderPayload,
    GeneratorCatalogEntry,
    MatchTuple,
    ViewCatalogEntry,
    SampleIdentity,
    SampleMode,
    SampleSplit,
    SPLIT_DIRS
} from '../lib/generation.ts';
import {createWorkCounters} from '../lib/work-counters.ts';
import { normalizeAndValidateSpec } from '../lib/spec-validator.ts';
import { getCliOption } from '../lib/cli.ts';
import { datasetDirForSpec, datasetOutDir } from '../lib/dataset-paths.ts';
import {
    DatasetRow,
    finalizeDatasetMetadata,
    mergeModuleMetadata
} from '../lib/dataset-output.ts';
import {
    assertDatasetGenerationScope,
    affectedDatasetPairKeys,
    buildDatasetManifest,
    createDatasetManifest,
    datasetExternalSemanticIssues,
    readDatasetManifest,
    type ManifestUpdateScope,
} from '../lib/dataset-manifest.ts';
import {radixSortUtf8, SourceContentIndex} from '../lib/content-identity.ts';
import {beginDatasetStoreTransaction} from '../lib/dataset-store.ts';
import { CONTAINER_GENERATION_VARIABLE, RENDER_CONTEXT_OPTIONS } from '../lib/render-environment.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..', '..');
const BASE_URL = process.env.RENDER_BASE_URL ?? 'http://localhost:5173';
const DEFAULT_CONCURRENCY = 8;
const DEFAULT_PREFLIGHT_CONCURRENCY = 4;
const MAX_ATTEMPTS = 50;

const pairKey = (generatorId: string, viewId: string): string => `${generatorId}#${viewId}`;

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
    contentFingerprint: string;
    taskFingerprint: string;
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

function claimSample(index: SampleFingerprintIndex, sample: RenderSample, fingerprint: string): void {
    const byFingerprint = index.get(sample.identity.viewId) ?? new Map<string, RenderSample[]>();
    const samples = byFingerprint.get(fingerprint) ?? [];
    samples.push(sample);
    byFingerprint.set(fingerprint, samples);
    index.set(sample.identity.viewId, byFingerprint);
}

/**
 * Generates all samples of one module (generator) for one split.
 *
 * Dedup is scoped per (module, split, view) via task fingerprints (problem
 * data plus resolved view configuration), and covers both modes. The val
 * split separately rejects mathematical content already claimed by train,
 * even when the view configuration differs.
 *
 * The module scope is deliberate — it keeps `--generator=X` reproducing exactly
 * what a full run produces for that module. It costs nothing in practice
 * because no view is rendered by more than one generator, so cross-module
 * collisions within a view cannot occur.
 */
function generateModuleSamples(
    genEntry: GeneratorCatalogEntry,
    viewsById: ReadonlyMap<string, ViewCatalogEntry>,
    tuples: readonly MatchTuple[],
    split: SampleSplit,
    taskFingerprintsByView: SampleFingerprintIndex,
    contentFingerprintsByView: SampleFingerprintIndex,
    trainTaskFingerprintsByView?: SampleFingerprintIndex,
    trainContentFingerprintsByView?: SampleFingerprintIndex
): RenderSample[] {
    const moduleName = genEntry.generatorId;
    const samples: RenderSample[] = [];

    for (const tuple of tuples) {
        const target = tuple.target;
        if (split === 'val' && !isValTuple(target.id, moduleName, tuple.viewId, DEFAULT_VAL_RATIO)) continue;

        const labels = [...target.labels];
        const instanceIdx = 0;
        const viewEntry = viewsById.get(tuple.viewId);
        if (!viewEntry) throw new Error(`View catalog entry not found: ${tuple.viewId}`);

        const makeIdentity = (mode: SampleMode): SampleIdentity => ({
            targetId: target.id,
            generatorId: moduleName,
            viewId: tuple.viewId,
            split,
            mode,
            instanceIdx
        });

        const fingerprintStub = (stub: ProblemStub, seed: number) => {
            const problem = buildProblem({ stub, type: genEntry.generator.type, labels });
            const contentFingerprint = computeContentFingerprint(problem.data);
            const viewConfig = resolveViewConfig(viewEntry.schema, problem.tags ?? [], seed);
            return {
                problem,
                contentFingerprint,
                taskFingerprint: computeTaskFingerprint(problem.data, viewConfig)
            };
        };

        // A task-identical sample may represent another target. A train sample
        // with only the same mathematical payload cannot: it merely excludes
        // that payload from validation to protect the split boundary.
        const representingSamples: RenderSample[] = [];
        const isDuplicate = (stub: ProblemStub, { seed }: { seed: number }) => {
            const { contentFingerprint, taskFingerprint } = fingerprintStub(stub, seed);
            const taskMatches = [
                ...samplesForFingerprint(taskFingerprintsByView, tuple.viewId, taskFingerprint),
                ...samplesForFingerprint(trainTaskFingerprintsByView, tuple.viewId, taskFingerprint)
            ];
            for (const sample of taskMatches) {
                if (!representingSamples.includes(sample)) representingSamples.push(sample);
            }
            const trainContentMatches = samplesForFingerprint(
                trainContentFingerprintsByView,
                tuple.viewId,
                contentFingerprint
            );
            return taskMatches.length > 0 || trainContentMatches.length > 0;
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
            const representedBy = representingSamples[0];
            if (representedBy) {
                representedBy.associatedTargetIds.add(target.id);
                console.warn(`[${moduleName}] Linked ${questionKey} to existing sample ${representedBy.sampleKey} after ${MAX_ATTEMPTS} duplicate attempts`);
                continue;
            }
            console.warn(`[${moduleName}] Skipping ${questionKey}: no unique stub after ${MAX_ATTEMPTS} attempts`);
            continue;
        }

        const questionResult = fingerprintStub(question.stub, question.seed);
        const questionSample: RenderSample = {
            identity: questionIdentity,
            sampleKey: questionKey,
            fileName: computeSampleFilename(questionIdentity),
            seed: question.seed,
            attempt: question.attempt,
            contentFingerprint: questionResult.contentFingerprint,
            taskFingerprint: questionResult.taskFingerprint,
            problem: questionResult.problem,
            associatedTargetIds: new Set()
        };
        samples.push(questionSample);
        claimSample(taskFingerprintsByView, questionSample, questionSample.taskFingerprint);
        claimSample(contentFingerprintsByView, questionSample, questionSample.contentFingerprint);

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
        const solutionSeed = solution.stub ? solution.seed : question.seed;
        const solutionResult = fingerprintStub(solutionStub, solutionSeed);
        const solutionSample: RenderSample = {
            identity: solutionIdentity,
            sampleKey: solutionKey,
            fileName: computeSampleFilename(solutionIdentity),
            seed: solutionSeed,
            attempt: solution.stub ? solution.attempt : question.attempt,
            contentFingerprint: solutionResult.contentFingerprint,
            taskFingerprint: solutionResult.taskFingerprint,
            problem: solutionResult.problem,
            associatedTargetIds: new Set()
        };
        samples.push(solutionSample);
        claimSample(taskFingerprintsByView, solutionSample, solutionSample.taskFingerprint);
        claimSample(contentFingerprintsByView, solutionSample, solutionSample.contentFingerprint);
    }

    return samples;
}

interface PageDiagnostics {
    pageErrors: string[];
    consoleErrors: string[];
    failedRequests: string[];
}

interface RenderBatchResult {
    renderedImages: number;
    failures: Error[];
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

function resetDiagnostics(diagnostics: PageDiagnostics): void {
    diagnostics.pageErrors.length = 0;
    diagnostics.consoleErrors.length = 0;
    diagnostics.failedRequests.length = 0;
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
    const viewsById = new Map(views.map(view => [view.viewId, view]));
    const queue = radixSortUtf8([...viewsById.keys()]).map(id => viewsById.get(id)!);
    let queueIndex = 0;
    const failures: Error[] = [];
    let failed = false;

    const worker = async () => {
        const context = await browser.newContext(RENDER_CONTEXT_OPTIONS);
        try {
            while (!failed) {
                const view = queue[queueIndex++];
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
): Promise<RenderBatchResult> {
    if (samples.length === 0) return { renderedImages: 0, failures: [] };

    const splitDirName = SPLIT_DIRS[split];
    console.log(`\n--- Rendering [${moduleName}] Split: ${splitDirName} (${samples.length} samples) ---`);
    const splitOutputDir = resolve(outputDir, splitDirName, moduleName);
    mkdirSync(splitOutputDir, { recursive: true });

    // Order by view to minimize page navigations; workers pull from a shared
    // queue, which is safe because every render is fully self-seeded.
    const samplesByOrder = new Map(samples.map(sample => [
        `${sample.identity.viewId}\0${sample.fileName}`,
        sample
    ]));
    const taskQueue = radixSortUtf8([...samplesByOrder.keys()]).map(key => samplesByOrder.get(key)!);
    const totalTasks = taskQueue.length;
    let taskIndex = 0;
    let attemptedTasks = 0;
    let completedTasks = 0;
    const metadata: DatasetRow[] = [];
    const failures: Error[] = [];

    const processQueue = async () => {
        const context = await browser.newContext(RENDER_CONTEXT_OPTIONS);
        let page = await context.newPage();
        let diagnostics = attachPageDiagnostics(page, baseUrl);
        let currentViewUrl = '';

        try {
            while (true) {
                const sample = taskQueue[taskIndex++];
                if (!sample) break;
                resetDiagnostics(diagnostics);

                try {
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
                    const viewErrorLocator = page.locator('[data-view-error="true"]');
                    const viewError = await viewErrorLocator.count() > 0
                        ? await viewErrorLocator.first().textContent()
                        : null;
                    if (viewError) throw new Error(viewError.trim());

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
                        content_fingerprint: sample.contentFingerprint,
                        task_fingerprint: sample.taskFingerprint,
                        tags: radixSortUtf8((sample.problem.tags || []).map(shortenLabel)),
                        target_associations: radixSortUtf8([...sample.associatedTargetIds])
                            .map(targetId => ({spec: specName, target_id: targetId}))
                    });

                    completedTasks++;
                } catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    const detail = message.startsWith('Invalid problem data:')
                        ? ''
                        : formatDiagnostics(diagnostics);
                    failures.push(new Error(
                        `Failed to render ${sample.sampleKey}: ${message}` +
                        (detail ? `; ${detail}` : '')
                    ));

                    // An ErrorBoundary remains tripped for the lifetime of its
                    // React tree. Recreate the page so one invalid sample cannot
                    // contaminate the next render assigned to this worker.
                    await page.close().catch(() => undefined);
                    page = await context.newPage();
                    diagnostics = attachPageDiagnostics(page, baseUrl);
                    currentViewUrl = '';
                } finally {
                    attemptedTasks++;
                    if (attemptedTasks % Math.max(1, Math.floor(totalTasks / 10)) === 0) {
                        console.log(`[${moduleName}:${splitDirName}] Progress: ${Math.floor((attemptedTasks / totalTasks) * 100)}%`);
                    }
                }
            }
        } catch (error) {
            const detail = formatDiagnostics(diagnostics);
            failures.push(new Error(
                `Render worker failed for ${moduleName}:${splitDirName}: ${error instanceof Error ? error.message : error}` +
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

    if (attemptedTasks !== totalTasks) {
        failures.push(new Error(`Attempted ${attemptedTasks}/${totalTasks} expected renders.`));
    }

    if (failures.length === 0) {
        mergeModuleMetadata(splitOutputDir, metadata);
        console.log(`[${moduleName}:${splitDirName}] Wrote modular metadata to .metadata.jsonl`);
    } else {
        console.error(`[${moduleName}:${splitDirName}] ${failures.length} render failure(s); successful artifacts remain staged only.`);
    }

    return { renderedImages: completedTasks, failures };
}

async function runModulePipeline(
    browser: Browser,
    outputDir: string,
    specName: string,
    baseUrl: string,
    genEntry: GeneratorCatalogEntry,
    viewCatalog: ViewCatalogEntry[],
    tuples: readonly MatchTuple[],
    trainingOnly: boolean,
    concurrency: number
): Promise<RenderBatchResult> {
    const moduleName = genEntry.generatorId;
    console.log(`\n--- Starting Pipeline for Module: ${moduleName} (${genEntry.module.relativePath}) ---`);

    const viewPathMap: Record<string, string> = {};
    const viewsById = new Map<string, ViewCatalogEntry>();
    for (const view of viewCatalog) {
        viewPathMap[view.viewId] = view.module.relativePath;
        viewsById.set(view.viewId, view);
    }

    // Train is generated first, into its own index, and val only ever *reads*
    // that index. This asymmetry is deliberate and must be preserved: train is
    // the primary artifact and may not depend on whether val was generated at
    // all, while val is derived and necessarily depends on train — disjointness
    // cannot be had otherwise. Verify with:
    //   generate --spec=test, then generate --spec=test --training-only
    //   → the train split must be byte-identical.
    const trainTaskFingerprints: SampleFingerprintIndex = new Map();
    const trainContentFingerprints: SampleFingerprintIndex = new Map();
    const trainSamples = generateModuleSamples(
        genEntry,
        viewsById,
        tuples,
        'train',
        trainTaskFingerprints,
        trainContentFingerprints
    );

    let valSamples: RenderSample[] = [];
    if (!trainingOnly) {
        const valTaskFingerprints: SampleFingerprintIndex = new Map();
        const valContentFingerprints: SampleFingerprintIndex = new Map();
        valSamples = generateModuleSamples(
            genEntry,
            viewsById,
            tuples,
            'val',
            valTaskFingerprints,
            valContentFingerprints,
            trainTaskFingerprints,
            trainContentFingerprints
        );
    }

    console.log(`[${moduleName}] Generated samples. Train (${trainSamples.length}), Validation (${valSamples.length})`);

    const trainResult = await renderSamples(
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
    let valResult: RenderBatchResult = { renderedImages: 0, failures: [] };
    if (valSamples.length > 0) {
        valResult = await renderSamples(
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
    return {
        renderedImages: trainResult.renderedImages + valResult.renderedImages,
        failures: [...trainResult.failures, ...valResult.failures]
    };
}

async function main() {
    if (process.env[CONTAINER_GENERATION_VARIABLE] !== '1') {
        throw new Error(
            'Dataset generation is container-only. Run npm run generate:dataset -- --spec=<spec_module>.'
        );
    }
    const counters = createWorkCounters();
    const args = process.argv.slice(2);

    const specName = getCliOption(args, 'spec');
    if (!specName) {
        console.error('Error: The --spec parameter is required.');
        console.error('Usage: npm run generate:dataset -- --spec=<spec_module> [--generator=<generator_name>] [--view=<view_id>] [--affected] [--training-only]');
        console.error('Example: npm run generate:dataset -- --spec=test');
        console.error('Example: npm run generate:dataset -- --spec=ccss');
        process.exit(1);
    }

    const outDir = datasetOutDir(PROJECT_ROOT, datasetDirForSpec(specName));
    const externalIssues = datasetExternalSemanticIssues(PROJECT_ROOT, specName);
    if (externalIssues.length > 0) {
        for (const issue of externalIssues) console.warn(`[External update ignored] ${issue}`);
        throw new Error(
            'Reliable external semantic delta state is unavailable. The pinned external update was not consumed; '
            + 'run the corresponding explicit update command before generation.'
        );
    }

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
    const affectedOnly = args.includes('--affected');
    const trainingOnly = process.env.npm_config_training_only === 'true' || process.env.npm_config_training_only === '' || args.includes('--training-only');
    const concurrencyOption = getCliOption(args, 'concurrency');
    const concurrency = concurrencyOption === undefined ? DEFAULT_CONCURRENCY : Number(concurrencyOption);
    if (!Number.isInteger(concurrency) || concurrency < 1) {
        throw new Error(`--concurrency must be a positive integer; received "${concurrencyOption}".`);
    }

    const generatorCatalog = await loadGeneratorCatalog(undefined, counters);
    const fullViewCatalog = await loadViewCatalog(undefined, counters);

    const requestedModules = targetModule
        ? generatorCatalog.filter(g =>
            g.generatorId === targetModule || g.module.relativePath === targetModule || g.module.category === targetModule)
        : generatorCatalog;

    const requestedViews = targetView
        ? fullViewCatalog.filter(v =>
            v.viewId === targetView || v.module.relativePath === targetView || v.module.category === targetView)
        : fullViewCatalog;

    if (requestedModules.length === 0) {
        throw new Error(`No generator modules matched --generator=${targetModule}.`);
    }
    if (requestedViews.length === 0) {
        throw new Error(`No views matched --view=${targetView}.`);
    }

    const requestedMatchedTuples = matchTargets(
        allTargets,
        requestedModules,
        requestedViews,
        {counters}
    ).tuples;
    if (requestedMatchedTuples.length === 0) {
        throw new Error('The selected generation scope contains no matched generator-view tuples.');
    }

    const requestedScope: ManifestUpdateScope = {
        fullDataset: !targetModule && !targetView,
        generatorIds: requestedModules.map(module => module.generatorId),
        viewIds: targetView ? requestedViews.map(view => view.viewId) : undefined
    };
    const allMatchedTuples = requestedScope.fullDataset
        ? requestedMatchedTuples
        : matchTargets(allTargets, generatorCatalog, fullViewCatalog, {counters}).tuples;
    const sourceIndex = new SourceContentIndex(PROJECT_ROOT);
    const previousManifest = readDatasetManifest(outDir);
    let generationScope = requestedScope;
    let matchedTuples = requestedMatchedTuples;
    if (affectedOnly || !requestedScope.fullDataset) {
        const planningBuild = buildDatasetManifest({
            projectRoot: PROJECT_ROOT,
            datasetDir: outDir,
            specName,
            targets: allTargets,
            generators: generatorCatalog,
            views: fullViewCatalog,
            tuples: allMatchedTuples,
            generatedSplits: trainingOnly ? ['train'] : ['train', 'val'],
            sourceIndex,
            reuseImageIdentityFrom: previousManifest?.dependency_graph
        });
        const plan = assertDatasetGenerationScope(previousManifest, planningBuild, requestedScope);
        console.log(
            `Dependency plan: ${plan.changed_roots.length} changed root(s), `
            + `${plan.affected_nodes.length} affected node(s), ${plan.reuse_nodes.length} reusable node(s).`
        );
        if (affectedOnly) {
            if (plan.clean) {
                if (!requestedScope.fullDataset) {
                    throw new Error(
                        'Affected-only generation has no trusted prior dependency state. '
                        + 'Run one unfiltered full generation to establish the shard baseline.'
                    );
                }
                console.log('Dependency delta unavailable; performing the required full baseline generation.');
            } else {
                const pairKeys = affectedDatasetPairKeys(plan, planningBuild, previousManifest);
                if (pairKeys.length === 0) {
                    console.log('Dependency plan is clean; no dataset pairs require rendering or publication.');
                    console.log(`[Work counters] ${JSON.stringify(counters.snapshot())}`);
                    return;
                }
                const selectedPairs = new Set(pairKeys);
                generationScope = {
                    fullDataset: false,
                    pairKeys,
                    generatorIds: radixSortUtf8([...new Set(pairKeys.map(key => key.split('#')[0]))])
                };
                matchedTuples = allMatchedTuples.filter(tuple =>
                    selectedPairs.has(pairKey(tuple.generatorId, tuple.viewId)));
                console.log(`Affected execution: ${pairKeys.length} exact generator/view pair(s).`);
            }
        }
    }

    const selectedGeneratorIds = new Set(generationScope.fullDataset
        ? requestedModules.map(module => module.generatorId)
        : generationScope.generatorIds);
    const modulesToRun = requestedModules.filter(module => selectedGeneratorIds.has(module.generatorId));
    const selectedViewIds = new Set(matchedTuples.map(tuple => tuple.viewId));
    const viewCatalog = requestedViews.filter(view => selectedViewIds.has(view.viewId));
    const viewsToPreflight = viewCatalog;
    const tuplesByGenerator = new Map<string, MatchTuple[]>();
    for (const tuple of matchedTuples) {
        const group = tuplesByGenerator.get(tuple.generatorId);
        if (group) group.push(tuple);
        else tuplesByGenerator.set(tuple.generatorId, [tuple]);
    }

    const browser = await chromium.launch({ headless: true });
    const startTime = performance.now();
    let transaction: ReturnType<typeof beginDatasetStoreTransaction> | undefined;

    try {
        await preflightViews(
            browser,
            viewsToPreflight,
            BASE_URL,
            Math.min(DEFAULT_PREFLIGHT_CONCURRENCY, concurrency)
        );

        transaction = beginDatasetStoreTransaction(outDir, generationScope);

        let totalImages = 0;
        const renderFailures: Error[] = [];
        for (const genEntry of modulesToRun) {
            const result = await runModulePipeline(
                browser,
                transaction.stagingDir,
                specName,
                BASE_URL,
                genEntry,
                viewCatalog,
                tuplesByGenerator.get(genEntry.generatorId) ?? [],
                trainingOnly,
                concurrency
            );
            totalImages += result.renderedImages;
            renderFailures.push(...result.failures);
        }

        if (renderFailures.length > 0) {
            console.error(`\nFAILED! ${renderFailures.length} render(s) failed after ${totalImages} successful image(s):`);
            for (const message of radixSortUtf8(renderFailures.map(failure => failure.message))) {
                console.error(`- ${message}`);
            }
            throw new AggregateError(renderFailures, 'Dataset rendering completed with failures.');
        }

        finalizeDatasetMetadata(transaction.stagingDir, SPLIT_DIRS.train);
        finalizeDatasetMetadata(transaction.stagingDir, SPLIT_DIRS.val);
        const candidate = transaction.prepare();
        const manifestBuild = buildDatasetManifest({
            projectRoot: PROJECT_ROOT,
            datasetDir: outDir,
            specName,
            targets: allTargets,
            generators: generatorCatalog,
            views: fullViewCatalog,
            tuples: allMatchedTuples,
            generatedSplits: trainingOnly ? ['train'] : ['train', 'val'],
            sourceIndex,
            datasetSnapshot: candidate
        });
        counters.add('dataset.source_directories_read', manifestBuild.source_stats.directories_read);
        counters.add('dataset.source_files_read', manifestBuild.source_stats.files_read);
        counters.add('dataset.source_bytes_read', manifestBuild.source_stats.bytes_read);
        const manifest = createDatasetManifest({
            projectRoot: PROJECT_ROOT,
            specName,
            build: manifestBuild,
            scope: generationScope,
            previous: previousManifest
        });
        transaction.commit(manifest);
        const storeStats = transaction.stats();
        counters.add('dataset.shards_written', storeStats.shards_written);
        counters.add('dataset.shards_reused', storeStats.shards_reused);
        counters.add('dataset.image_bytes_written', storeStats.image_bytes_written);

        const duration = ((performance.now() - startTime) / 1000).toFixed(2);
        console.log(`\nDONE! Generated ${totalImages} images in ${duration}s.`);
        console.log(`[Work counters] ${JSON.stringify(counters.snapshot())}`);
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
