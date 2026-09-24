import 'dotenv/config';
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
import { getCliOption } from '../lib/cli.ts';
import { evaluateSampleVqa } from '../lib/vqa-evaluator.ts';
import { datasetDirForSpec, datasetOutDir } from '../lib/dataset-paths.ts';
import { CANONICAL_RENDERER_ID, currentRendererEnvironment } from '../lib/render-environment.ts';
import {readDatasetSnapshot} from '../lib/dataset-store.ts';
import {selectSampleReplay} from '../lib/sample-replay.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..', '..');
const CACHE_DIR = resolve(PROJECT_ROOT, 'cache', 'vqa-validation');


/**
 * Replays one exact sample draw from its sample key, renders it to
 * out/retest/ and compares the result against the committed VQA cache.
 * This is the fix-verification loop for failed validations: after changing a
 * generator or view, rerun the failing sample alone instead of regenerating
 * the whole dataset.
 */
async function main() {
    const args = process.argv.slice(2);
    const sampleKey = getCliOption(args, 'sample') || getCliOption(args, 'sample-key') || getCliOption(args, 'key');
    const attemptArg = getCliOption(args, 'attempt');
    const specName = getCliOption(args, 'spec');
    const skipRender = args.includes('--no-render') || process.env.npm_config_no_render !== undefined;
    const shouldValidate = !args.includes('--no-validate') && process.env.npm_config_no_validate === undefined;

    if (!sampleKey || !specName) {
        console.error('Usage: npm run test:sample -- --sample="<sample_key>" [--attempt=<n>] --spec=<spec_module> [--no-render] [--no-validate]');
        console.error('Example: npm run test:sample -- --sample="test-writing~fe4336da#writing#numbers-write-standard#train#question#inst:0" --spec=test');
        process.exit(1);
    }

    const { parseSampleKey } = await import('../lib/generation.ts');
    const identity = parseSampleKey(sampleKey);
    const datasetFolderName = datasetDirForSpec(specName);
    const cacheManager = new VqaCacheManager(CACHE_DIR, datasetFolderName, identity.generatorId);
    const cachedByIdentity = cacheManager.entries().find(e => e.sample_key === sampleKey);

    const metadata = attemptArg === undefined
        ? readDatasetSnapshot(datasetOutDir(PROJECT_ROOT, datasetFolderName)).rows(identity.split)
            .find(row => row.sample_key === sampleKey)
        : undefined;
    const selected = selectSampleReplay({sampleKey, attempt: attemptArg === undefined ? undefined : Number(attemptArg),
        metadata, cached: cachedByIdentity});
    const {attempt} = selected;

    console.log(`--- Retesting sample ---`);
    console.log(`Sample key: ${sampleKey}`);
    console.log(`Attempt:    ${attempt} (${selected.source === 'fresh' ? 'explicit fresh draw' : `recorded ${selected.source} recipe`})`);

    const {target, targetLabels, seed, stub, plan, preparedView, replay, labels} = await generateSampleByKey({
        sampleKey, attempt, specName, recordedPlan: selected.recordedPlan, replay: selected.replay
    });
    if (replay.sampleKey !== sampleKey) console.log(`Draw origin: ${replay.sampleKey}`);

    console.log(`Seed:       ${seed}`);
    console.log(`Target:     ${target.id}`);
    console.log(`Target labels: ${targetLabels.map(l => l.split('/').pop()).join(', ')}`);

    if (!stub) {
        console.log(`\n⚠️ Generator returned null for this seed — with this attempt the pipeline would have retried.`);
        return;
    }

    console.log(`\nGenerated stub:`);
    console.log(JSON.stringify({ data: stub.data, resolved_labels: stub.labels }, null, 2));
    console.log(`Content fingerprint: ${computeContentFingerprint(stub.data)}`);

    if (skipRender) return;

    const generatorCatalog = await loadGeneratorCatalog();
    const viewCatalog = await loadViewCatalog();
    const generatorEntry = generatorCatalog.find(g => g.generatorId === identity.generatorId)!;
    const problem = buildProblem({
        stub,
        type: generatorEntry.generator.type,
        labels
    });
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
                targetLabels,
                mode: identity.mode,
                seed,
                preparedView
            })
        }
    ], outDir, viewPathMap);

    console.log(`\n🖼️ Rendered: ${imagePath}`);

    // Compare against the committed VQA cache
    const imageSha256 = computeImageSha256(imagePath);
    console.log(`Image sha256: ${imageSha256}`);

    if (cachedByIdentity) {
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
        }
    } else {
        console.log(`\nℹ️ No cache entry with this sample key in cache/vqa-validation/${datasetFolderName}/${identity.generatorId}.jsonl`);
    }

    if (shouldValidate) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.log(`\nℹ️ GEMINI_API_KEY not set — skipping live VQA validation (cache comparison only).`);
            return;
        }
        if (currentRendererEnvironment() !== CANONICAL_RENDERER_ID) {
            throw new Error(
                'Live VQA cache updates require canonical container images. ' +
                'Use this command for native cache comparison, then regenerate the relevant dataset scope with ' +
                'npm run generate:dataset and run validate:dataset.'
            );
        }

        console.log(`\n🤖 Running live VQA validation with Gemini API...`);
        const vqaResult = await evaluateSampleVqa({
            imagePath,
            sampleKey,
            targetId: identity.targetId,
            generatorId: identity.generatorId,
            viewId: identity.viewId,
            modeName: identity.mode,
            instanceIdx: identity.instanceIdx,
            attempt,
            seed,
            generationPlan: plan,
            generationReplay: replay,
            fileName,
            labels: problem.labels,
            apiKey,
            cacheManager
        });

        if (vqaResult && vqaResult.isLiveEvaluated) {
            const evalObj = vqaResult.entry.evaluation;
            if (evalObj.pass) {
                console.log(`\n✅ Live VQA PASS! Cache updated for ${identity.generatorId}.jsonl`);
            } else {
                console.log(`\n❌ Live VQA FAIL!`);
                console.log(`Reasoning: ${evalObj.reasoning}`);
            }
        }
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
