import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
    generateSampleByKey,
    loadViewCatalog,
    loadGeneratorCatalog,
    computeSampleFilename,
    computeContentFingerprint,
    buildProblem,
    buildRenderPayload
} from '../lib/generation.ts';
import { renderTasks } from '../lib/render.ts';
import { computeImageSha256, VqaCacheManager } from '../lib/vqa-cache.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..', '..');
const CACHE_DIR = resolve(PROJECT_ROOT, 'cache', 'vqa-validation');

function getArg(args: string[], name: string): string | undefined {
    return process.env[`npm_config_${name.replace(/-/g, '_')}`]
        || args.find(a => a.includes(`${name}=`))?.split(`${name}=`)[1];
}

/**
 * Replays one exact sample draw from its sample key, renders it to
 * out/retest/ and compares the result against the committed VQA cache.
 * This is the fix-verification loop for failed validations: after changing a
 * generator or view, rerun the failing sample alone instead of regenerating
 * the whole dataset.
 */
async function main() {
    const args = process.argv.slice(2);
    const sampleKey = getArg(args, 'key');
    const attempt = parseInt(getArg(args, 'attempt') || '1', 10);
    const specName = getArg(args, 'spec');
    const skipRender = args.includes('--no-render') || process.env.npm_config_no_render !== undefined;

    if (!sampleKey || !specName) {
        console.error('Usage: npm run retest:sample -- --key="<sample_key>" --attempt=<n> --spec=<spec_module> [--no-render]');
        console.error('Example: npm run retest:sample -- --key="test-writing-0#writing#numbers-write-standard#train#question#inst:0" --attempt=1 --spec=test');
        process.exit(1);
    }

    console.log(`--- Retesting sample ---`);
    console.log(`Sample key: ${sampleKey}`);
    console.log(`Attempt:    ${attempt}`);

    const { identity, target, labels, seed, stub } = await generateSampleByKey({ sampleKey, attempt, specName });

    console.log(`Seed:       ${seed}`);
    console.log(`Target:     ${target.id}`);
    console.log(`Labels:     ${labels.map(l => l.split('/').pop()).join(', ')}`);

    if (!stub) {
        console.log(`\n⚠️ Generator returned null for this seed — with this attempt the pipeline would have retried.`);
        return;
    }

    console.log(`\nGenerated stub:`);
    console.log(JSON.stringify({ id: stub.id, data: stub.data, tags: stub.tags }, null, 2));
    console.log(`Content fingerprint: ${computeContentFingerprint(stub.data)}`);

    if (skipRender) return;

    const problem = buildProblem({
        stub,
        sampleKey,
        type: (await loadGeneratorCatalog()).find(g => g.generatorId === identity.generatorId)!.generator.type,
        labels
    });
    const viewCatalog = await loadViewCatalog();
    const viewPathMap: Record<string, string> = {};
    for (const view of viewCatalog) {
        viewPathMap[view.viewId] = view.module.relativePath;
    }

    const fileName = computeSampleFilename(identity);
    const outDir = resolve(PROJECT_ROOT, 'out', 'retest');
    const [imagePath] = await renderTasks([
        {
            fileName,
            viewId: identity.viewId,
            payload: buildRenderPayload({
                problem,
                viewId: identity.viewId,
                labels: problem.tags || [],
                mode: identity.mode,
                seed
            })
        }
    ], outDir, viewPathMap);

    console.log(`\n🖼️ Rendered: ${imagePath}`);

    // Compare against the committed VQA cache
    const datasetFolderName = specName === 'test' ? 'dataset-test' : 'dataset';
    const imageSha256 = computeImageSha256(imagePath);
    console.log(`Image sha256: ${imageSha256}`);

    const cacheManager = new VqaCacheManager(CACHE_DIR, datasetFolderName, identity.generatorId);
    const cachedByIdentity = cacheManager.entries().find(e => e.sample_key === sampleKey);

    if (!cachedByIdentity) {
        console.log(`\nℹ️ No cache entry with this sample key in cache/vqa-validation/${datasetFolderName}/${identity.generatorId}.jsonl`);
        return;
    }

    console.log(`\nCached entry: image ${cachedByIdentity.image_sha256.slice(0, 12)}…, attempt ${cachedByIdentity.attempt}, pass=${cachedByIdentity.evaluation.pass}`);
    if (cachedByIdentity.evaluation.reasoning) {
        console.log(`Cached reasoning: ${cachedByIdentity.evaluation.reasoning}`);
    }

    if (cachedByIdentity.attempt !== attempt) {
        console.log(`\n🔀 Note: the pipeline recorded attempt ${cachedByIdentity.attempt} for this sample (you replayed attempt ${attempt}).`);
    }

    if (cachedByIdentity.image_sha256 === imageSha256) {
        console.log(`\n✅ Image is byte-identical to the cached render — the validation cache entry still applies.`);
    } else {
        console.log(`\n🆕 Image differs from the cached render — your change affected this sample.`);
        console.log(`Run validation to refresh the cache: npm run validate:dataset -- --generator=${identity.generatorId}${specName === 'test' ? ' --dataset=test' : ''}`);
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
