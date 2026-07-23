import 'dotenv/config';
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { findLeafModules } from "../lib/module-resolver.ts";
import {
    computeChecklistHash,
    computeImageSha256,
    computeValidationCacheKey,
    VqaCacheManager
} from "../lib/vqa-cache.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, "..", "..");
const GENERATORS_ROOT = resolve(PROJECT_ROOT, "src", "generators");
const VIEWS_ROOT = resolve(PROJECT_ROOT, "src", "visuals", "views");
const CACHE_DIR = resolve(PROJECT_ROOT, "cache", "vqa-validation");

let DATASET_ROOT = resolve(PROJECT_ROOT, "out", "dataset", "train");

const apiKey = process.env.GEMINI_API_KEY;
let genAI: GoogleGenerativeAI | null = null;
let model: any = null;

if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({
        model: "gemini-3.5-flash",
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: SchemaType.OBJECT,
                properties: {
                    pass: { type: SchemaType.BOOLEAN },
                    general_checks: {
                        type: SchemaType.OBJECT,
                        properties: {
                            no_overlaps: { type: SchemaType.BOOLEAN },
                            no_placeholders: { type: SchemaType.BOOLEAN },
                            sane_padding: { type: SchemaType.BOOLEAN }
                        },
                        required: ["no_overlaps", "no_placeholders", "sane_padding"]
                    },
                    coloring_pass: { type: SchemaType.BOOLEAN },
                    layout_pass: { type: SchemaType.BOOLEAN },
                    reasoning: { type: SchemaType.STRING }
                },
                required: ["pass", "general_checks", "reasoning"]
            }
        }
    });
}

function resolveTreeChecklists(rootDir: string, moduleId: string): string[] {
    const paths: string[] = [];

    // 1. Root checklist.md
    const rootChecklist = resolve(rootDir, 'checklist.md');
    if (existsSync(rootChecklist)) paths.push(rootChecklist);

    // 2. Discover leaf modules
    const modules = findLeafModules(rootDir);
    const mod = modules.find(m => m.id === moduleId);

    // 3. Category checklist.md
    if (mod && mod.category) {
        const categoryChecklist = resolve(rootDir, mod.category, 'checklist.md');
        if (existsSync(categoryChecklist)) paths.push(categoryChecklist);
    }

    // 4. Leaf checklist.md
    const leafChecklist = mod
        ? resolve(mod.absolutePath, 'checklist.md')
        : resolve(rootDir, moduleId, 'checklist.md');
    if (existsSync(leafChecklist)) paths.push(leafChecklist);

    return paths;
}

function getChecklistPaths(moduleName: string, viewId: string): string[] {
    return [
        ...resolveTreeChecklists(GENERATORS_ROOT, moduleName),
        ...resolveTreeChecklists(VIEWS_ROOT, viewId)
    ];
}

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

async function evaluateSingleSample(entry: any, _datasetFolderName: string): Promise<any> {
    const moduleName = entry.generator;
    const viewId = entry.view;
    const modeName = entry.mode;
    const isSolution = modeName === 'solution';
    const imagePath = resolve(DATASET_ROOT, entry.file_name);

    if (!existsSync(imagePath)) return null;

    const imageBuffer = readFileSync(imagePath);
    const imageSha256 = computeImageSha256(imageBuffer);
    const checklistPaths = getChecklistPaths(moduleName, viewId);

    let checklistText = '';
    for (const p of checklistPaths) {
        checklistText += readFileSync(p, 'utf-8') + '\n\n';
    }

    const checklistHash = computeChecklistHash(checklistPaths);
    const valCacheKey = computeValidationCacheKey(imageSha256, checklistHash);

    const prompt = `
You are a senior Visual QA Engineer. Evaluate this math exercise image:
Mode: "${isSolution ? 'Solution Mode (_mode-S)' : 'Question Mode (_mode-Q)'}"
Module: "${moduleName}"
View ID: "${viewId}"

CHECKLIST:
${checklistText}

IMPORTANT: If pass is true and all checks pass, set "reasoning" to "" (empty string). Only provide a non-empty reasoning string if pass is false or any check fails.

Respond only in the provided JSON schema.
`;

    try {
        const imagePart = { inlineData: { data: imageBuffer.toString("base64"), mimeType: "image/png" } };
        const result = await model.generateContent([prompt, imagePart]);
        const responseText = result.response.text();
        const parsed = JSON.parse(responseText);

        if (parsed.pass && parsed.general_checks?.no_overlaps && parsed.general_checks?.no_placeholders && parsed.general_checks?.sane_padding) {
            parsed.reasoning = "";
        }

        return {
            validation_cache_key: valCacheKey,
            sample_key: entry.sample_key,
            target_id: entry.target_id,
            generator: moduleName,
            view: viewId,
            mode: modeName,
            instance: entry.instance,
            attempt: entry.attempt,
            seed: entry.seed,
            file_name: entry.file_name,
            image_sha256: imageSha256,
            checklist_hash: checklistHash,
            validated_at: new Date().toISOString(),
            evaluation: parsed,
            moduleName
        };
    } catch (error) {
        console.error(`\n🚨 Error validating ${entry.file_name}:`, error);
        return null;
    }
}

async function main() {
    const args = process.argv.slice(2);

    let targetGenerator: string | undefined = process.env.npm_config_generator;
    let targetView: string | undefined = process.env.npm_config_view;
    let force = process.env.npm_config_force === 'true' || process.env.npm_config_force === '';
    let auditMode = process.env.npm_config_audit === 'true' || process.env.npm_config_audit === '';
    
    let datasetParam = process.env.npm_config_dataset || (args.find(a => a.includes('dataset='))?.split('dataset=')[1]) || (args.find(a => a.includes('spec='))?.split('spec=')[1]);
    let datasetFolderName = 'dataset';
    if (datasetParam) {
        datasetFolderName = datasetParam.startsWith('dataset-') ? datasetParam : `dataset-${datasetParam}`;
        if (datasetParam === 'default' || datasetParam === 'dataset') {
            datasetFolderName = 'dataset';
        }
    }

    for (const arg of args) {
        if (arg.includes('generator=')) {
            targetGenerator = arg.split('generator=')[1];
        } else if (arg.includes('view=')) {
            targetView = arg.split('view=')[1];
        } else if (arg.includes('force') || arg.includes('no-cache')) {
            force = true;
        } else if (arg.includes('audit') || arg.includes('ci')) {
            auditMode = true;
        }
    }

    DATASET_ROOT = resolve(PROJECT_ROOT, 'out', datasetFolderName, 'train');

    console.log(`--- Starting Automated Modular VQA ${auditMode ? '(AUDIT MODE)' : ''} [Dataset: ${datasetFolderName}] ---`);

    const rootMetaPath = resolve(DATASET_ROOT, 'metadata.jsonl');
    if (!existsSync(rootMetaPath)) {
        console.error(`Error: Root metadata file not found at ${rootMetaPath}. Please generate the dataset first.`);
        process.exit(1);
    }

    const metadataLines = readFileSync(rootMetaPath, 'utf-8').split('\n').filter(l => l.trim() !== '');
    const entries = metadataLines.map(l => JSON.parse(l));

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
        console.log('No matching dataset images found to validate.');
        return;
    }

    // Collect active cache keys per module for auto-pruning
    const activeKeysPerModule = new Map<string, Set<string>>();

    for (const entry of filtered) {
        const moduleName = entry.generator;
        const imagePath = resolve(DATASET_ROOT, entry.file_name);
        if (!existsSync(imagePath)) continue;

        const imageBuffer = readFileSync(imagePath);
        const imageSha256 = computeImageSha256(imageBuffer);

        const checklistPaths = getChecklistPaths(moduleName, entry.view);
        const checklistHash = computeChecklistHash(checklistPaths);
        const valCacheKey = computeValidationCacheKey(imageSha256, checklistHash);

        if (!activeKeysPerModule.has(moduleName)) {
            activeKeysPerModule.set(moduleName, new Set());
        }
        activeKeysPerModule.get(moduleName)!.add(valCacheKey);
    }

    // Perform automatic safe pruning of stale cache entries for this dataset folder
    for (const [modName, activeKeys] of activeKeysPerModule.entries()) {
        const mgr = new VqaCacheManager(CACHE_DIR, datasetFolderName, modName);
        const pruned = mgr.prune(activeKeys);
        if (pruned > 0) {
            console.log(`🧹 Auto-pruned ${pruned} stale cache entries for [${modName}] in cache/vqa-validation/${datasetFolderName}/`);
        }
    }

    let uncachedCount = 0;
    let failingCount = 0;
    let auditPassedCount = 0;

    if (auditMode) {
        for (const entry of filtered) {
            const moduleName = entry.generator;
            const viewId = entry.view;
            const imagePath = resolve(DATASET_ROOT, entry.file_name);

            if (!existsSync(imagePath)) {
                console.error(`❌ AUDIT FAILURE (File missing): [${moduleName} : ${viewId}] ${entry.file_name}`);
                uncachedCount++;
                continue;
            }

            const imageBuffer = readFileSync(imagePath);
            const imageSha256 = computeImageSha256(imageBuffer);
            const checklistPaths = getChecklistPaths(moduleName, viewId);
            const checklistHash = computeChecklistHash(checklistPaths);
            const valCacheKey = computeValidationCacheKey(imageSha256, checklistHash);

            const cacheManager = new VqaCacheManager(CACHE_DIR, datasetFolderName, moduleName);
            const existingCache = cacheManager.get(valCacheKey);

            if (!existingCache) {
                console.error(`❌ AUDIT FAILURE (Uncached): [${moduleName} : ${viewId}] ${entry.file_name}`);
                uncachedCount++;
            } else if (!existingCache.evaluation.pass) {
                console.error(`❌ AUDIT FAILURE (Failing evaluation): [${moduleName} : ${viewId}] ${entry.file_name} -> ${existingCache.evaluation.reasoning}`);
                failingCount++;
            } else {
                auditPassedCount++;
            }
        }
    } else {
        const toEvaluate: any[] = [];
        let cachedCount = 0;
        let cachedPassed = 0;
        let cachedFailed = 0;

        for (const entry of filtered) {
            const moduleName = entry.generator;
            const viewId = entry.view;
            const imagePath = resolve(DATASET_ROOT, entry.file_name);

            if (!existsSync(imagePath)) continue;

            const imageBuffer = readFileSync(imagePath);
            const imageSha256 = computeImageSha256(imageBuffer);
            const checklistPaths = getChecklistPaths(moduleName, viewId);
            const checklistHash = computeChecklistHash(checklistPaths);
            const valCacheKey = computeValidationCacheKey(imageSha256, checklistHash);

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
            if (!model) {
                console.log(`⚠️ LLM QA skipped: GEMINI_API_KEY or model not loaded.`);
            } else {
                console.log(`Evaluating ${toEvaluate.length} samples concurrently (up to 10 parallel requests)...`);
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

                await runPool(toEvaluate, 10, async (entry) => {
                    const record = await evaluateSingleSample(entry, datasetFolderName);
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
    }

    // Save and sort clean JSONL cache files for all active modules
    for (const modName of activeKeysPerModule.keys()) {
        const mgr = new VqaCacheManager(CACHE_DIR, datasetFolderName, modName);
        mgr.save();
    }

    // Generate Markdown report and failure TODO list
    const reportPath = generateValidationReport(datasetFolderName, filtered);
    console.log(`📄 Validation report & TODO list generated: ${reportPath}`);

    if (auditMode) {
        const total = filtered.length;
        const passed = auditPassedCount;
        const cached = total - uncachedCount;

        console.log(`\n--- VQA Cache Audit Summary [${datasetFolderName}] ---`);
        console.log(`Passed: ${passed}/${total}`);
        console.log(`Cached: ${cached}/${total}`);

        if (uncachedCount > 0 || failingCount > 0) {
            console.error(`\n🚨 AUDIT FAILED: ${failingCount} failing samples.`);
            console.error(`Please run local validation using GEMINI_API_KEY, resolve failures, and commit updated cache files under cache/vqa-validation/${datasetFolderName}/.`);
            process.exit(1);
        } else {
            console.log(`\n✅ AUDIT PASSED: All ${passed}/${total} generated samples have valid, passing cache records.`);
        }
    }

    console.log('\nValidation Complete.');
}

function generateValidationReport(
    datasetFolderName: string,
    filteredEntries: any[]
): string {
    const reportPath = resolve(PROJECT_ROOT, 'out', datasetFolderName, 'validation-report.md');
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

    for (const entry of filteredEntries) {
        const moduleName = entry.generator;
        const viewId = entry.view;
        const imagePath = resolve(DATASET_ROOT, entry.file_name);

        if (!existsSync(imagePath)) {
            uncachedCount++;
            continue;
        }

        const imageBuffer = readFileSync(imagePath);
        const imageSha256 = computeImageSha256(imageBuffer);
        const checklistPaths = getChecklistPaths(moduleName, viewId);
        const checklistHash = computeChecklistHash(checklistPaths);
        const valCacheKey = computeValidationCacheKey(imageSha256, checklistHash);

        const cacheManager = new VqaCacheManager(CACHE_DIR, datasetFolderName, moduleName);
        const cache = cacheManager.get(valCacheKey);

        if (!cache) {
            uncachedCount++;
        } else if (cache.evaluation.pass) {
            passedCount++;
        } else {
            failedCount++;
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
            }
            if (evalObj.coloring_pass !== undefined) {
                checks.push(`Coloring: ${evalObj.coloring_pass ? 'Pass' : 'FAIL'}`);
            }
            if (evalObj.layout_pass !== undefined) {
                checks.push(`Layout: ${evalObj.layout_pass ? 'Pass' : 'FAIL'}`);
            }

            md += `- [ ] **\`${entry.file_name}\`**\n`;
            md += `  - **Module / View:** \`${entry.generator}\` : \`${entry.view}\` (${modeStr} mode)\n`;
            md += `  - **Reason:** ${evalObj.reasoning}\n`;
            if (checks.length > 0) {
                md += `  - **Checks:** ${checks.join(' | ')}\n`;
            }
            md += `  - **Sample:** \`${entry.sample_key}\` (target \`${entry.target_id}\`, attempt ${entry.attempt}, seed ${entry.seed})\n`;
            md += `  - **Retest:** \`npm run retest:sample -- --key="${entry.sample_key}" --attempt=${entry.attempt} --spec=${entry.spec}\`\n`;
            md += `\n`;
        }
    }

    writeFileSync(reportPath, md, 'utf-8');
    return reportPath;
}

main().catch(console.error);
