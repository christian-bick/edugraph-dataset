import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
    loadTargets,
    loadGeneratorCatalog,
    loadViewCatalog,
    matchTargets,
    generateTargetSamples,
    buildProblem,
    buildRenderPayload,
    sanitizeFilePart
} from '../lib/generation.ts';
import { shortenLabel } from '../lib/utils.ts';
import { renderTasks, RenderTask } from '../lib/render.ts';
import { VqaCacheManager } from '../lib/vqa-cache.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..', '..');
const CACHE_DIR = resolve(PROJECT_ROOT, 'cache', 'vqa-validation');

function getArg(args: string[], name: string): string | undefined {
    return process.env[`npm_config_${name.replace(/-/g, '_')}`]
        || args.find(a => a.includes(`${name}=`))?.split(`${name}=`)[1];
}

/**
 * Inspects one competency target end to end: which (generator, view) tuples
 * it matches (with reasons for near-misses), the exact samples the pipeline
 * would produce for it (keys, seeds, attempts, fingerprints), how they relate
 * to the committed VQA cache, and — with --render — the actual images.
 * Use it to debug new targets, matching behavior and cache issues.
 */
async function main() {
    const args = process.argv.slice(2);
    const targetId = getArg(args, 'target');
    const specName = getArg(args, 'spec');
    const shouldRender = args.includes('--render') || process.env.npm_config_render !== undefined;

    if (!targetId || !specName) {
        console.error('Usage: npm run test:target -- --target=<target.id> --spec=<spec_module> [--render]');
        console.error('Example: npm run test:target -- --target=test-writing-0 --spec=test');
        process.exit(1);
    }

    const [targets, generatorCatalog, viewCatalog] = await Promise.all([
        loadTargets(specName),
        loadGeneratorCatalog(),
        loadViewCatalog()
    ]);

    const target = targets.find(t => t.id === targetId);
    if (!target) {
        console.error(`Target "${targetId}" not found in spec module "${specName}".`);
        const candidates = targets.filter(t => t.id.includes(targetId)).slice(0, 10);
        if (candidates.length > 0) {
            console.error(`Did you mean: ${candidates.map(t => t.id).join(', ')}`);
        }
        process.exit(1);
    }

    console.log(`--- Target ${target.id} [spec: ${specName}] ---`);
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

    const datasetFolderName = specName === 'test' ? 'dataset-test' : 'dataset';
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
        console.log(`    summary:     ${sample.stub.id}`);
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
        for (const sample of samples) {
            if (!sample.stub) continue;
            const generatorType = generatorCatalog.find(g => g.generatorId === sample.identity.generatorId)!.generator.type;
            const problem = buildProblem({
                stub: sample.stub,
                sampleKey: sample.sampleKey,
                type: generatorType,
                labels: [...target.labels]
            });
            tasks.push({
                fileName: sample.fileName,
                viewId: sample.identity.viewId,
                payload: buildRenderPayload({
                    problem,
                    viewId: sample.identity.viewId,
                    labels: problem.tags || [],
                    mode: sample.identity.mode,
                    seed: sample.seed
                })
            });
        }
        const outDir = resolve(PROJECT_ROOT, 'out', 'target-test', sanitizeFilePart(target.id));
        const written = await renderTasks(tasks, outDir, viewPathMap);
        console.log(`\n🖼️ Rendered ${written.length} images to ${outDir}`);
    } else {
        console.log(`\nTip: add --render (with the vite dev server running) to render these samples to out/target-test/.`);
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
