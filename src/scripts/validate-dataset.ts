import 'dotenv/config';
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from "fs";
import { resolve, dirname, relative } from "path";
import { fileURLToPath } from "url";
import { findLeafModules } from "../lib/module-resolver.ts";
import {
    buildVqaValidationContext,
    computeImageSha256,
    pruneObsoleteVqaCacheFiles,
    VqaCacheManager
} from "../lib/vqa-cache.ts";
import { getCliOption } from "../lib/cli.ts";
import { isUnionSpec, resolveDatasetDir } from "../lib/dataset-paths.ts";
import { evaluateSampleVqa, getChecklistPaths } from "../lib/vqa-evaluator.ts";
import {
    loadGeneratorCatalog,
    loadViewCatalog,
    parseSampleKey,
    SampleSplit,
    SPLIT_DIRS
} from "../lib/generation.ts";
import { validationFailed, validationReportPath } from '../lib/validation-report.ts';
import {
    buildDatasetManifestEntries,
    datasetRendererIssues,
    datasetFreshnessIssues,
    readDatasetManifest
} from '../lib/dataset-manifest.ts';
import { normalizeAndValidateSpec } from '../lib/spec-validator.ts';
import { auditVqaCache, type ExpectedVqaCacheRecord } from '../lib/vqa-cache-audit.ts';
import { CANONICAL_RENDERER_ID } from '../lib/render-environment.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, "..", "..");
const GENERATORS_ROOT = resolve(PROJECT_ROOT, "src", "generators");
const CACHE_DIR = resolve(PROJECT_ROOT, "cache", "vqa-validation");

/** The dataset's root — every split folder hangs off it. */
let DATASET_DIR = resolve(PROJECT_ROOT, "out", "dataset");

/**
 * Both splits are validated. The split is not in the filename, so an image is
 * located by reading it back out of the sample key, which is the authoritative
 * record of a sample's identity.
 */
function splitDirOf(entry: any): string {
    return SPLIT_DIRS[parseSampleKey(entry.sample_key).split];
}

function imagePathFor(entry: any): string {
    return resolve(DATASET_DIR, splitDirOf(entry), entry.file_name);
}

/**
 * Display path. `file_name` is relative to its split root and does not encode
 * the split, so the same tuple's train and validation images share it — always
 * qualify it before showing it to a human.
 */
function displayPathOf(entry: any): string {
    return `${splitDirOf(entry)}/${entry.file_name}`;
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

    for (const split of Object.keys(SPLIT_DIRS) as SampleSplit[]) {
        const splitRoot = resolve(DATASET_DIR, SPLIT_DIRS[split]);
        for (const imagePath of pngFilesBelow(splitRoot)) {
            if (!imagePaths.has(imagePath)) {
                issues.push(`Image is not referenced by metadata: ${relative(DATASET_DIR, imagePath).replace(/\\/g, '/')}.`);
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

async function evaluateSingleSample(entry: any, _datasetFolderName: string, logPrompt: boolean): Promise<any> {
    const imagePath = imagePathFor(entry);
    const result = await evaluateSampleVqa({
        imagePath,
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
        logPrompt
    });

    if (!result) return null;
    return { ...result.entry, moduleName: entry.generator };
}

async function main() {
    const args = process.argv.slice(2);

    let targetGenerator: string | undefined = process.env.npm_config_generator;
    let targetView: string | undefined = process.env.npm_config_view;
    let force = process.env.npm_config_force === 'true' || process.env.npm_config_force === '';
    let auditMode = process.env.npm_config_audit === 'true' || process.env.npm_config_audit === '';
    let reportOnly = process.env.npm_config_report_only === 'true' || process.env.npm_config_report_only === '';
    let logPrompts = process.env.npm_config_log_prompts === 'true' || process.env.npm_config_log_prompts === '';
    
    const specName = getCliOption(args, 'spec');
    if (!specName) {
        console.error('❌ Error: The --spec parameter is required.');
        console.error('Usage: npm run validate:dataset -- --spec=<spec_module> [--generator=X] [--view=Y] [--force] [--log-prompts] [--report-only] [--report=<path>]');
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
        } else if (arg === '--force' || arg === '--no-cache') {
            force = true;
        } else if (arg === '--audit' || arg === '--ci') {
            auditMode = true;
        } else if (arg === '--report-only') {
            reportOnly = true;
        } else if (arg === '--log-prompts') {
            logPrompts = true;
        }
    }
    if (auditMode && (targetGenerator || targetView)) {
        throw new Error('Strict --audit requires the complete dataset; remove --generator and --view filters.');
    }

    DATASET_DIR = resolve(PROJECT_ROOT, 'out', datasetFolderName);

    console.log(`--- Starting Automated Modular VQA ${auditMode ? '(AUDIT MODE)' : ''} [Dataset: ${datasetFolderName}] ---`);

    // Both splits are validated: validation images ship in the released dataset
    // and are subject to the same checklists as train images.
    const entries: any[] = [];
    const presentSplits: SampleSplit[] = [];
    for (const split of Object.keys(SPLIT_DIRS) as SampleSplit[]) {
        const metaPath = resolve(DATASET_DIR, SPLIT_DIRS[split], 'metadata.jsonl');
        if (!existsSync(metaPath)) continue;
        const lines = readFileSync(metaPath, 'utf-8').split('\n').filter(l => l.trim() !== '');
        entries.push(...lines.map(l => JSON.parse(l)));
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

    const [specValidation, generatorCatalog, viewCatalog] = await Promise.all([
        normalizeAndValidateSpec(specName),
        loadGeneratorCatalog(),
        loadViewCatalog()
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
    const currentManifestEntries = buildDatasetManifestEntries({
        projectRoot: PROJECT_ROOT,
        datasetDir: DATASET_DIR,
        targets: specValidation.targets,
        generators: scopedGenerators,
        views: scopedViews,
        generatedSplits: presentSplits
    });
    const generatorIds = new Set(scopedGenerators.map(entry => entry.generatorId));
    const viewIds = new Set(scopedViews.map(entry => entry.viewId));
    const existingManifest = readDatasetManifest(DATASET_DIR);
    const scopedManifest = existingManifest ? {
        ...existingManifest,
        entries: Object.fromEntries(Object.entries(existingManifest.entries)
            .filter(([, entry]) => generatorIds.has(entry.generator) && viewIds.has(entry.view)))
    } : null;
    const freshnessIssues = datasetFreshnessIssues(scopedManifest, specName, currentManifestEntries);
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

    // Collect active cache keys per module for auto-pruning
    const activeKeysPerModule = new Map<string, Set<string>>();
    const expectedCacheRecords: ExpectedVqaCacheRecord[] = [];

    for (const entry of filtered) {
        const moduleName = entry.generator;
        const imagePath = imagePathFor(entry);
        if (!existsSync(imagePath)) continue;

        const imageBuffer = readFileSync(imagePath);
        const imageSha256 = computeImageSha256(imageBuffer);

        const checklistPaths = getChecklistPaths(entry.view);
        const valCacheKey = buildVqaValidationContext(imageSha256, checklistPaths, entry.tags).validationCacheKey;

        if (!activeKeysPerModule.has(moduleName)) {
            activeKeysPerModule.set(moduleName, new Set());
        }
        activeKeysPerModule.get(moduleName)!.add(valCacheKey);
        expectedCacheRecords.push({
            moduleName,
            validationCacheKey: valCacheKey,
            sampleKey: entry.sample_key
        });
    }

    if (auditMode) {
        const structureIssues = datasetStructureIssues(filtered, missingSplits);
        const cacheAudit = auditVqaCache(
            resolve(CACHE_DIR, datasetFolderName),
            expectedCacheRecords
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
        return;
    }

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
            const mgr = new VqaCacheManager(CACHE_DIR, datasetFolderName, modName);
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

    const toEvaluate: any[] = [];
        let cachedCount = 0;
        let cachedPassed = 0;
        let cachedFailed = 0;

        for (const entry of filtered) {
            const moduleName = entry.generator;
            const viewId = entry.view;
            const imagePath = imagePathFor(entry);

            if (!existsSync(imagePath)) continue;

            const imageBuffer = readFileSync(imagePath);
            const imageSha256 = computeImageSha256(imageBuffer);
            const checklistPaths = getChecklistPaths(viewId);
            const valCacheKey = buildVqaValidationContext(imageSha256, checklistPaths, entry.tags).validationCacheKey;

            const cacheManager = new VqaCacheManager(CACHE_DIR, datasetFolderName, moduleName);
            const existingCache = cacheManager.get(valCacheKey);

            if (existingCache && !force) {
                cachedCount++;
                if (existingCache.evaluation.pass) cachedPassed++;
                else cachedFailed++;
            } else {
                toEvaluate.push(entry);
            }
        }

        if (cachedCount > 0) {
            console.log(`ℹ️ Reused ${cachedCount} cached evaluation records (${cachedPassed} passed, ${cachedFailed} failed).`);
        }

        if (toEvaluate.length > 0) {
            if (!apiKey) {
                console.log(`⚠️ LLM QA skipped: GEMINI_API_KEY or model not loaded.`);
            } else {
                const evaluationConcurrency = logPrompts ? 1 : 10;
                console.log(`Evaluating ${toEvaluate.length} samples concurrently (up to ${evaluationConcurrency} parallel request${evaluationConcurrency === 1 ? '' : 's'})...`);
                let processed = 0;
                let evalPassed = cachedPassed;
                let evalFailed = cachedFailed;

                renderProgressBar(0, toEvaluate.length, evalPassed, evalFailed);

                const cacheManagers = new Map<string, VqaCacheManager>();
                const getMgr = (mod: string) => {
                    if (!cacheManagers.has(mod)) {
                        cacheManagers.set(mod, new VqaCacheManager(CACHE_DIR, datasetFolderName, mod));
                    }
                    return cacheManagers.get(mod)!;
                };

                await runPool(toEvaluate, evaluationConcurrency, async (entry) => {
                    const record = await evaluateSingleSample(entry, datasetFolderName, logPrompts);
                    processed++;
                    if (record) {
                        const mgr = getMgr(record.moduleName);
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
                            validated_at: record.validated_at,
                            evaluation: record.evaluation
                        });
                        if (record.evaluation.pass) evalPassed++;
                        else evalFailed++;
                    }
                    renderProgressBar(processed, toEvaluate.length, evalPassed, evalFailed);
                });

                // Save all updated cache files
                for (const mgr of cacheManagers.values()) {
                    mgr.save();
                }
                console.log('\n');
            }
    }

    // Save and sort clean JSONL cache files for all active modules
    for (const modName of activeKeysPerModule.keys()) {
        const mgr = new VqaCacheManager(CACHE_DIR, datasetFolderName, modName);
        mgr.save();
    }

    // Generate Markdown report and failure TODO list
    const resolvedReportPath = validationReportPath(PROJECT_ROOT, datasetFolderName, {
        generator: targetGenerator,
        view: targetView,
        reportPath: reportOverride
    });
    const report = generateValidationReport(datasetFolderName, filtered, resolvedReportPath);
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
}

function generateValidationReport(
    datasetFolderName: string,
    filteredEntries: any[],
    reportPath: string
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

    for (const entry of filteredEntries) {
        const moduleName = entry.generator;
        const viewId = entry.view;
        const imagePath = imagePathFor(entry);
        const tally = tallyFor(entry);
        tally.total++;

        if (!existsSync(imagePath)) {
            uncachedCount++;
            tally.uncached++;
            continue;
        }

        const imageBuffer = readFileSync(imagePath);
        const imageSha256 = computeImageSha256(imageBuffer);
        const checklistPaths = getChecklistPaths(viewId);
        const valCacheKey = buildVqaValidationContext(imageSha256, checklistPaths, entry.tags).validationCacheKey;

        const cacheManager = new VqaCacheManager(CACHE_DIR, datasetFolderName, moduleName);
        const cache = cacheManager.get(valCacheKey);

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

    const total = filteredEntries.length;
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
