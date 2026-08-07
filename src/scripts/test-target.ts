import 'dotenv/config';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
    loadGeneratorCatalog,
    loadViewCatalog,
    matchTargets,
    generateTargetSamples,
    buildProblem,
    buildRenderPayload,
    sanitizeFilePart
} from '../lib/generation.ts';
import { loadMatchingTargets } from '../lib/spec-validator.ts';
import { shortenLabel } from '../lib/utils.ts';
import { renderTasks, RenderTask } from '../lib/render.ts';
import { VqaCacheManager } from '../lib/vqa-cache.ts';
import { getCliOption } from '../lib/cli.ts';
import { evaluateSampleVqa } from '../lib/vqa-evaluator.ts';
import { datasetDirForSpec } from '../lib/dataset-paths.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..', '..');
const CACHE_DIR = resolve(PROJECT_ROOT, 'cache', 'vqa-validation');

/**
 * Inspects one competency target end to end: which (generator, view) tuples
 * it matches (with reasons for near-misses), the exact samples the pipeline
 * would produce for it (keys, seeds, attempts, fingerprints), how they relate
 * to the committed VQA cache, and — with --render — the actual images.
 * Use it to debug new targets, matching behavior and cache issues.
 */
async function main() {
    const args = process.argv.slice(2);
    const targetId = getCliOption(args, 'target');
    const specName = getCliOption(args, 'spec');
    const shouldRender = args.includes('--render') || process.env.npm_config_render !== undefined;
    const shouldValidate = args.includes('--validate') || process.env.npm_config_validate !== undefined;
    const raw = args.includes('--raw');

    if (!targetId || !specName) {
        console.error('Usage: npm run test:target -- --target=<target.id> --spec=<spec_module> [--raw] [--render] [--validate]');
        console.error('Example: npm run test:target -- --target=test-writing~fe4336da --spec=test');
        process.exit(1);
    }

    const [targets, generatorCatalog, viewCatalog] = await Promise.all([
        loadMatchingTargets(specName, { raw }),
        loadGeneratorCatalog(),
        loadViewCatalog()
    ]);

    let target = targets.find(t => t.id === targetId);
    if (!target) {
        const prefixMatches = targets.filter(t => t.id.startsWith(`${targetId}~`) || t.id.startsWith(targetId));
        if (prefixMatches.length === 1) {
            target = prefixMatches[0];
            console.log(`ℹ️ Resolved target prefix "${targetId}" to "${target.id}"`);
        } else if (prefixMatches.length > 1) {
            console.error(`Target "${targetId}" is ambiguous. Matching targets:`);
            for (const candidate of prefixMatches.slice(0, 10)) {
                console.error(`  - ${candidate.id}`);
            }
            process.exit(1);
        } else {
            console.error(`Target "${targetId}" not found in spec module "${specName}".`);
            const candidates = targets.filter(t => t.id.includes(targetId)).slice(0, 10);
            if (candidates.length > 0) {
                console.error(`Did you mean: ${candidates.map(t => t.id).join(', ')}`);
            }
            process.exit(1);
        }
    }

    const targetMode = raw ? 'raw source definitions' : 'production-normalized';
    console.log(`--- Target ${target.id} [spec: ${specName}; ${targetMode}] ---`);
    console.log(`Labels: ${target.labels.map(shortenLabel).join(', ')}\n`);

    // 1. Matching
    const { tuples, rejections } = matchTargets([target], generatorCatalog, viewCatalog);
    if (tuples.length === 0) {
        console.log(`❌ No (generator, view) tuple matches this target.`);
    } else {
        console.log(`Matched tuples (${tuples.length}):`);
        for (const tuple of tuples) {
            console.log(`  ✅ ${tuple.generatorId} × ${tuple.viewId}`);
        }
    }
    if (rejections.length > 0) {
        console.log(`\nRejected type-compatible pairs (${rejections.length}):`);
        for (const rejection of rejections) {
            const label = rejection.verdict.label ? shortenLabel(rejection.verdict.label) : '';
            console.log(`  ❌ ${rejection.generatorId} × ${rejection.viewId}: ${rejection.verdict.reason}${label ? ` (${label})` : ''}`);
        }
    }

    // 2. Samples the pipeline would produce (no cross-target dedup, see note below)
    const samples = generateTargetSamples(target, generatorCatalog, viewCatalog);
    if (samples.length === 0) {
        console.log('\nNo samples to generate.');
        return;
    }

    const datasetFolderName = datasetDirForSpec(specName);
    const cacheManagers = new Map<string, VqaCacheManager>();
    const getCache = (generatorId: string) => {
        if (!cacheManagers.has(generatorId)) {
            cacheManagers.set(generatorId, new VqaCacheManager(CACHE_DIR, datasetFolderName, generatorId));
        }
        return cacheManagers.get(generatorId)!;
    };

    console.log(`\nSamples (${samples.length}):`);
    for (const sample of samples) {
        console.log(`\n  ${sample.sampleKey}`);
        console.log(`    file:        ${sample.fileName}`);
        console.log(`    seed:        ${sample.seed} (attempt ${sample.attempt})`);
        if (sample.error) {
            console.log(`    ⚠️ generator error: ${sample.error}`);
            continue;
        }
        if (!sample.stub) {
            console.log(`    ⚠️ no stub after retries`);
            continue;
        }
        console.log(`    fingerprint: ${sample.fingerprint}`);
        console.log(`    data:        ${JSON.stringify(sample.stub.data)}`);

        const cached = getCache(sample.identity.generatorId).entries().find(e => e.sample_key === sample.sampleKey);
        if (!cached) {
            console.log(`    cache:       (no entry)`);
        } else {
            const attemptNote = cached.attempt !== sample.attempt
                ? ` — pipeline used attempt ${cached.attempt} (cross-target collision), replay locally with --attempt=${cached.attempt}`
                : '';
            console.log(`    cache:       pass=${cached.evaluation.pass}, image ${cached.image_sha256.slice(0, 12)}…${attemptNote}`);
        }
    }
    console.log(`\nNote: attempts shown here ignore cross-target dedup; when the pipeline hit a content collision with another target, its recorded attempt (metadata/cache) is higher.`);

    // 3. Optional rendering
    if (shouldRender) {
        const viewPathMap: Record<string, string> = {};
        for (const view of viewCatalog) {
            viewPathMap[view.viewId] = view.module.relativePath;
        }
        const tasks: RenderTask[] = [];
        const validableSamples: Array<{
            sample: typeof samples[number];
            renderFileName: string;
        }> = [];
        for (const sample of samples) {
            if (!sample.stub) continue;
            const generatorType = generatorCatalog.find(g => g.generatorId === sample.identity.generatorId)!.generator.type;
            const problem = buildProblem({
                stub: sample.stub,
                type: generatorType,
                labels: [...target.labels]
            });
            // Train and validation samples intentionally share their canonical
            // dataset filename. Qualify debug renders by split so they cannot
            // overwrite each other in this single target-test directory.
            const renderFileName = `${sample.identity.split}-${sample.fileName}`;
            tasks.push({
                fileName: renderFileName,
                viewId: sample.identity.viewId,
                payload: buildRenderPayload({
                    problem,
                    viewId: sample.identity.viewId,
                    labels: problem.tags || [],
                    mode: sample.identity.mode,
                    seed: sample.seed
                })
            });
            validableSamples.push({sample, renderFileName});
        }
        const outDir = resolve(PROJECT_ROOT, 'out', 'target-test', sanitizeFilePart(target.id));
        const written = await renderTasks(tasks, outDir, viewPathMap);
        console.log(`\n🖼️ Rendered ${written.length} images to ${outDir}`);

        if (shouldValidate) {
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) {
                console.log(`\nℹ️ GEMINI_API_KEY not set — skipping live VQA validation.`);
            } else {
                console.log(`\n🤖 Running live VQA validation for rendered target samples...`);
                for (const {sample, renderFileName} of validableSamples) {
                    const imagePath = resolve(outDir, renderFileName);
                    const cacheMgr = getCache(sample.identity.generatorId);
                    const vqaResult = await evaluateSampleVqa({
                        imagePath,
                        sampleKey: sample.sampleKey,
                        targetId: target.id,
                        generatorId: sample.identity.generatorId,
                        viewId: sample.identity.viewId,
                        modeName: sample.identity.mode,
                        instanceIdx: sample.identity.instanceIdx,
                        attempt: sample.attempt,
                        seed: sample.seed,
                        fileName: sample.fileName,
                        labels: Array.from(new Set([
                            ...target.labels,
                            ...(sample.stub?.tags || [])
                        ])),
                        apiKey,
                        cacheManager: cacheMgr
                    });
                    if (vqaResult && vqaResult.isLiveEvaluated) {
                        const status = vqaResult.entry.evaluation.pass ? '✅ PASS' : `❌ FAIL: ${vqaResult.entry.evaluation.reasoning}`;
                        console.log(`  - ${sample.sampleKey}: ${status}`);
                    }
                }
            }
        }
    } else {
        console.log(`\nTip: add --render (with the vite dev server running) to render these samples to out/target-test/.`);
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
