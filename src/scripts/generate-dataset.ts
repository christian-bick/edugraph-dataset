import { Browser, chromium } from 'playwright';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { AbstractProblem, ProblemStub } from '../types/ml-engine.ts';
import { shortenLabel } from '../lib/utils.ts';
import {
    loadTargets,
    loadGeneratorCatalog,
    loadViewCatalog,
    matchTargets,
    computeSampleKey,
    computeSampleFilename,
    computeSampleSeed,
    computeContentFingerprint,
    generateSampleWithRetry,
    isValTarget,
    buildProblem,
    buildRenderPayload,
    GeneratorCatalogEntry,
    ViewCatalogEntry,
    SampleIdentity,
    SampleMode,
    SampleSplit
} from '../lib/generation.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..', '..');
let OUT_DIR = resolve(PROJECT_ROOT, 'out', 'dataset');
let SPEC_NAME = '';
const BASE_URL = 'http://localhost:5173';
const DEFAULT_CONCURRENCY = 8;
const MAX_ATTEMPTS = 50;
const VAL_RATIO = 0.25;

const SPLIT_DIRS: Record<SampleSplit, string> = { train: 'train', val: 'validation' };

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
    problemSummary: string;
    problem: AbstractProblem;
}

/**
 * Merges hidden .metadata.jsonl files from module subdirectories into a single root metadata.jsonl
 */
function finalizeMetadata(splitDirName: string) {
    const splitDir = resolve(OUT_DIR, splitDirName);
    if (!existsSync(splitDir)) return;

    const rootMetaPath = resolve(splitDir, 'metadata.jsonl');

    // We start fresh for the root metadata.jsonl
    writeFileSync(rootMetaPath, '');

    const modules = readdirSync(splitDir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name)
        .sort();

    for (const moduleName of modules) {
        const moduleMetaPath = resolve(splitDir, moduleName, '.metadata.jsonl');
        if (existsSync(moduleMetaPath)) {
            const content = readFileSync(moduleMetaPath, 'utf-8');
            const lines = content.split('\n').filter(l => l.trim() !== '');

            const adjustedLines = lines.map(line => {
                const entry = JSON.parse(line);
                // Adjust file_name to be relative to the split root
                entry.file_name = `${moduleName}/${entry.file_name}`;
                return JSON.stringify(entry);
            });

            if (adjustedLines.length > 0) {
                appendFileSync(rootMetaPath, adjustedLines.join('\n') + '\n');
            }
        }
    }

    console.log(`[${splitDirName}] Finalized root metadata.jsonl`);
}

/**
 * Generates all samples of one module (generator) for one split. Dedup is
 * scoped per (split, view) via content fingerprints; the val split also
 * rejects content already present in the train split.
 */
function generateModuleSamples(
    genEntry: GeneratorCatalogEntry,
    viewCatalog: ViewCatalogEntry[],
    targets: any[],
    split: SampleSplit,
    fingerprintsByView: Map<string, Set<string>>,
    trainFingerprintsByView?: Map<string, Set<string>>
): RenderSample[] {
    const moduleName = genEntry.generatorId;
    const { tuples } = matchTargets(targets, [genEntry], viewCatalog);
    const samples: RenderSample[] = [];

    for (const tuple of tuples) {
        const target = tuple.target;
        if (split === 'val' && !isValTarget(target.id, VAL_RATIO)) continue;

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

        if (!fingerprintsByView.has(tuple.viewId)) {
            fingerprintsByView.set(tuple.viewId, new Set());
        }
        const seenFingerprints = fingerprintsByView.get(tuple.viewId)!;
        const trainFingerprints = trainFingerprintsByView?.get(tuple.viewId);

        const questionIdentity = makeIdentity('question');
        const questionKey = computeSampleKey(questionIdentity);

        let question: { stub: ProblemStub | null; attempt: number; seed: number };
        try {
            question = generateSampleWithRetry({
                generator: genEntry.generator,
                labels,
                sampleKey: questionKey,
                maxAttempts: MAX_ATTEMPTS,
                isDuplicate: (stub) => {
                    const fingerprint = computeContentFingerprint(stub.data);
                    return seenFingerprints.has(fingerprint) || (trainFingerprints?.has(fingerprint) ?? false);
                }
            });
        } catch (e) {
            console.warn(`[${moduleName}] Skipping ${questionKey}: generator error: ${e instanceof Error ? e.message : e}`);
            continue;
        }
        if (!question.stub) {
            console.warn(`[${moduleName}] Skipping ${questionKey}: no unique stub after ${MAX_ATTEMPTS} attempts`);
            continue;
        }
        seenFingerprints.add(computeContentFingerprint(question.stub.data));

        const solutionIdentity = makeIdentity('solution');
        const solutionKey = computeSampleKey(solutionIdentity);
        let solution: { stub: ProblemStub | null; attempt: number; seed: number };
        try {
            solution = generateSampleWithRetry({
                generator: genEntry.generator,
                labels,
                sampleKey: solutionKey,
                maxAttempts: MAX_ATTEMPTS
            });
        } catch (e) {
            solution = { stub: null, attempt: 1, seed: computeSampleSeed(solutionKey, 1) };
        }
        // Fall back to the question stub when no independent solution draw succeeded
        const solutionStub = solution.stub || question.stub;

        samples.push({
            identity: questionIdentity,
            sampleKey: questionKey,
            fileName: computeSampleFilename(questionIdentity),
            seed: question.seed,
            attempt: question.attempt,
            fingerprint: computeContentFingerprint(question.stub.data),
            problemSummary: question.stub.id,
            problem: buildProblem({ stub: question.stub, sampleKey: questionKey, type: genEntry.generator.type, labels })
        });
        samples.push({
            identity: solutionIdentity,
            sampleKey: solutionKey,
            fileName: computeSampleFilename(solutionIdentity),
            seed: solution.stub ? solution.seed : question.seed,
            attempt: solution.stub ? solution.attempt : question.attempt,
            fingerprint: computeContentFingerprint(solutionStub.data),
            problemSummary: solutionStub.id,
            problem: buildProblem({ stub: solutionStub, sampleKey: solutionKey, type: genEntry.generator.type, labels })
        });
    }

    return samples;
}

async function renderSamples(
    browser: Browser,
    split: SampleSplit,
    moduleName: string,
    samples: RenderSample[],
    concurrency: number,
    viewPathMap: Record<string, string>
): Promise<number> {
    if (samples.length === 0) return 0;

    const splitDirName = SPLIT_DIRS[split];
    console.log(`\n--- Rendering [${moduleName}] Split: ${splitDirName} (${samples.length} samples) ---`);
    const splitOutputDir = resolve(OUT_DIR, splitDirName, moduleName);
    if (!existsSync(splitOutputDir)) {
        mkdirSync(splitOutputDir, { recursive: true });
    }

    // Order by view to minimize page navigations; workers pull from a shared
    // queue, which is safe because every render is fully self-seeded.
    const taskQueue = [...samples].sort((a, b) =>
        a.identity.viewId.localeCompare(b.identity.viewId) || a.fileName.localeCompare(b.fileName)
    );
    const totalTasks = taskQueue.length;
    let completedTasks = 0;
    let totalImages = 0;
    const metadata: any[] = [];

    const processQueue = async () => {
        const context = await browser.newContext();
        const page = await context.newPage();
        let currentViewUrl = '';

        try {
            while (true) {
                const sample = taskQueue.shift();
                if (!sample) break;

                const { identity } = sample;
                const viewPath = viewPathMap[identity.viewId] || identity.viewId;
                const url = `${BASE_URL}/visuals/views/${viewPath}/view.html`;

                if (currentViewUrl !== url) {
                    await page.goto(url, { waitUntil: 'networkidle' });
                    await page.waitForFunction(() => typeof (window as any).renderView === 'function');
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

                const outPath = resolve(splitOutputDir, sample.fileName);
                await page.locator('#view').screenshot({ path: outPath, omitBackground: true });
                totalImages++;

                metadata.push({
                    file_name: sample.fileName,
                    sample_key: sample.sampleKey,
                    spec: SPEC_NAME,
                    target_id: identity.targetId,
                    generator: identity.generatorId,
                    view: identity.viewId,
                    mode: identity.mode,
                    instance: identity.instanceIdx,
                    attempt: sample.attempt,
                    seed: sample.seed,
                    content_fingerprint: sample.fingerprint,
                    problem_summary: sample.problemSummary,
                    type: sample.problem.type,
                    solution_visible: identity.mode === 'solution',
                    tags: (sample.problem.tags || []).map(shortenLabel).sort(),
                    parameters: sample.problem.data
                });

                completedTasks++;
                if (completedTasks % Math.max(1, Math.floor(totalTasks / 10)) === 0) {
                    console.log(`[${moduleName}:${splitDirName}] Progress: ${Math.floor((completedTasks / totalTasks) * 100)}%`);
                }
            }
        } catch (err) {
            console.error('Worker error:', err);
        } finally {
            await context.close();
        }
    };

    const workers = [];
    for (let i = 0; i < Math.min(concurrency, taskQueue.length); i++) {
        workers.push(processQueue());
    }
    await Promise.allSettled(workers);

    metadata.sort((a, b) => a.file_name.localeCompare(b.file_name));
    const metaPath = resolve(splitOutputDir, '.metadata.jsonl');
    const jsonlContent = metadata.map(entry => JSON.stringify(entry)).join('\n') + '\n';
    writeFileSync(metaPath, jsonlContent);
    console.log(`[${moduleName}:${splitDirName}] Wrote modular metadata to .metadata.jsonl`);

    return totalImages;
}

async function runModulePipeline(
    browser: Browser,
    genEntry: GeneratorCatalogEntry,
    viewCatalog: ViewCatalogEntry[],
    allTargets: any[],
    trainingOnly: boolean
): Promise<number> {
    const moduleName = genEntry.generatorId;
    console.log(`\n--- Starting Pipeline for Module: ${moduleName} (${genEntry.module.relativePath}) ---`);

    const viewPathMap: Record<string, string> = {};
    for (const view of viewCatalog) {
        viewPathMap[view.viewId] = view.module.relativePath;
    }

    const trainFingerprints = new Map<string, Set<string>>();
    const trainSamples = generateModuleSamples(genEntry, viewCatalog, allTargets, 'train', trainFingerprints);

    let valSamples: RenderSample[] = [];
    if (!trainingOnly) {
        const valFingerprints = new Map<string, Set<string>>();
        valSamples = generateModuleSamples(genEntry, viewCatalog, allTargets, 'val', valFingerprints, trainFingerprints);
    }

    console.log(`[${moduleName}] Generated samples. Train (${trainSamples.length}), Validation (${valSamples.length})`);

    let moduleImages = 0;
    moduleImages += await renderSamples(browser, 'train', moduleName, trainSamples, DEFAULT_CONCURRENCY, viewPathMap);
    if (valSamples.length > 0) {
        moduleImages += await renderSamples(browser, 'val', moduleName, valSamples, DEFAULT_CONCURRENCY, viewPathMap);
    }
    return moduleImages;
}

async function main() {
    const args = process.argv.slice(2);

    const specName = process.env.npm_config_spec || (args.find(a => a.includes('spec='))?.split('spec=')[1]);
    if (!specName) {
        console.error('Error: The --spec parameter is required.');
        console.error('Usage: npm run generate:dataset -- --spec=<spec_module> [--generator=<generator_name>] [--view=<view_id>] [--training-only]');
        console.error('Example: npm run generate:dataset -- --spec=test');
        console.error('Example: npm run generate:dataset -- --spec=ccss');
        process.exit(1);
    }

    if (specName === 'test') {
        OUT_DIR = resolve(PROJECT_ROOT, 'out', 'dataset-test');
    }
    SPEC_NAME = specName;

    const allTargets = await loadTargets(specName);

    const targetModule = process.env.npm_config_generator || (args.find(a => a.includes('generator='))?.split('generator=')[1]);
    const targetView = process.env.npm_config_view || (args.find(a => a.includes('view='))?.split('view=')[1]);
    const trainingOnly = process.env.npm_config_training_only === 'true' || process.env.npm_config_training_only === '' || args.some(a => a.includes('training-only'));

    if (!targetModule) {
        if (existsSync(OUT_DIR)) {
            console.log('Cleaning whole dataset output directory...');
            rmSync(OUT_DIR, { recursive: true, force: true });
        }
        mkdirSync(OUT_DIR, { recursive: true });
    } else {
        // Clear specific module in both splits
        Object.values(SPLIT_DIRS).forEach(splitDirName => {
            const moduleDir = resolve(OUT_DIR, splitDirName, targetModule!);
            if (existsSync(moduleDir)) {
                console.log(`Cleaning target directory for module [${targetModule}] in split [${splitDirName}]...`);
                rmSync(moduleDir, { recursive: true, force: true });
            }
        });
        if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
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

    const browser = await chromium.launch({ headless: true });
    const startTime = performance.now();
    let totalImages = 0;

    for (const genEntry of modulesToRun) {
        try {
            totalImages += await runModulePipeline(browser, genEntry, viewCatalog, allTargets, trainingOnly);
        } catch (e) {
            console.error(`Failed to run pipeline for ${genEntry.generatorId}:`, e);
        }
    }

    await browser.close();

    // Finalization step: Merge metadata
    finalizeMetadata(SPLIT_DIRS.train);
    if (!trainingOnly) {
        finalizeMetadata(SPLIT_DIRS.val);
    }

    const duration = ((performance.now() - startTime) / 1000).toFixed(2);
    console.log(`\nDONE! Generated ${totalImages} images in ${duration}s.`);
}

main().catch(console.error);
