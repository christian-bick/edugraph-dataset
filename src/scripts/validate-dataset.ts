import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { existsSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { findLeafModules } from "../lib/module-resolver.ts";
import {
    computeChecklistHash,
    computeImageSha256,
    computeValidationCacheKey,
    computeInputCacheKey,
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
        model: "gemini-1.5-flash",
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

function printValidationResult(evaluation: any, cached: boolean) {
    if (evaluation.pass) {
        console.log(`✅ PASS ${cached ? '(cached)' : ''}`);
    } else {
        console.log(`❌ FAIL ${cached ? '(cached)' : ''}`);
    }
    if (evaluation.general_checks) {
        console.log(`- Overlaps: ${evaluation.general_checks.no_overlaps ? 'None' : 'DETECTED'}`);
        console.log(`- Placeholders: ${evaluation.general_checks.no_placeholders ? 'None' : 'DETECTED'}`);
        console.log(`- Padding: ${evaluation.general_checks.sane_padding ? 'Good' : 'BAD'}`);
    }
    if (evaluation.coloring_pass !== undefined) {
        console.log(`- Coloring: ${evaluation.coloring_pass ? 'Correct' : 'INCORRECT'}`);
    }
    if (evaluation.layout_pass !== undefined) {
        console.log(`- Layout: ${evaluation.layout_pass ? 'Correct' : 'INCORRECT'}`);
    }
    console.log(`Reasoning: ${evaluation.reasoning}`);
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

async function validateSample(entry: any, force: boolean, datasetFolderName: string) {
    const moduleName = entry.generator;
    const viewId = entry.view;
    const modeName = entry.mode || (entry.solution_visible ? 'solution' : 'question');
    const isSolution = entry.solution_visible || modeName === 'solution';

    console.log(`\nEvaluating [${moduleName} : ${viewId} (${modeName})] sample: ${entry.file_name}...`);

    const imagePath = resolve(DATASET_ROOT, entry.file_name);

    if (!existsSync(imagePath)) {
        console.error(`🚨 Image file not found for ${entry.file_name}`);
        return;
    }

    const imageBuffer = readFileSync(imagePath);
    const imageSha256 = computeImageSha256(imageBuffer);

    const checklistPaths = getChecklistPaths(moduleName, viewId);

    let checklistText = '';
    for (const p of checklistPaths) {
        checklistText += readFileSync(p, 'utf-8') + '\n\n';
    }

    const checklistHash = computeChecklistHash(checklistPaths);
    const valCacheKey = computeValidationCacheKey(imageSha256, checklistHash);
    const inputCacheKey = computeInputCacheKey(
        moduleName,
        viewId,
        modeName,
        entry.tags || [],
        entry.instance !== undefined ? entry.instance : 0
    );

    const cacheManager = new VqaCacheManager(CACHE_DIR, datasetFolderName, moduleName);

    if (entry.layout_checks && entry.layout_checks.pass === false) {
        console.log(`❌ FAIL (Programmatic Overlaps Detected)`);
        const errorReason = entry.layout_checks.errors ? entry.layout_checks.errors.join('; ') : 'DOM overlaps detected';
        if (entry.layout_checks.errors) {
            entry.layout_checks.errors.forEach((err: string) => console.log(`  - ${err}`));
        }
        
        const failEval = {
            pass: false,
            general_checks: {
                no_overlaps: false,
                no_placeholders: true,
                sane_padding: true
            },
            coloring_pass: true,
            layout_pass: false,
            reasoning: `Pre-generation layout check failed: ${errorReason}`
        };

        cacheManager.set({
            validation_cache_key: valCacheKey,
            input_cache_key: inputCacheKey,
            file_name: entry.file_name,
            image_sha256: imageSha256,
            checklist_hash: checklistHash,
            validated_at: new Date().toISOString(),
            evaluation: failEval
        });
        cacheManager.save();
        return;
    }

    const existingCache = cacheManager.get(valCacheKey);
    if (existingCache && !force) {
        printValidationResult(existingCache.evaluation, true);
        return;
    }

    if (!model) {
        console.log(`⚠️  LLM QA skipped: GEMINI_API_KEY or model not loaded.`);
        return;
    }

    const prompt = `
You are a senior Visual QA Engineer. Evaluate this math exercise image:
Mode: "${isSolution ? 'Solution Mode (_mode-S)' : 'Question Mode (_mode-Q)'}"
Module: "${moduleName}"
View ID: "${viewId}"

CHECKLIST:
${checklistText}

Respond only in the provided JSON schema.
`;

    try {
        const imagePart = { inlineData: { data: imageBuffer.toString("base64"), mimeType: "image/png" } };

        const result = await model.generateContent([prompt, imagePart]);
        const responseText = result.response.text();
        const parsed = JSON.parse(responseText);

        printValidationResult(parsed, false);

        cacheManager.set({
            validation_cache_key: valCacheKey,
            input_cache_key: inputCacheKey,
            file_name: entry.file_name,
            image_sha256: imageSha256,
            checklist_hash: checklistHash,
            validated_at: new Date().toISOString(),
            evaluation: parsed
        });
        cacheManager.save();
    } catch (error) {
        console.error(`🚨 Error validating ${entry.file_name}:`, error);
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

    for (const entry of filtered) {
        const moduleName = entry.generator;
        const viewId = entry.view;
        const imagePath = resolve(DATASET_ROOT, entry.file_name);

        if (!existsSync(imagePath)) {
            console.error(`🚨 Image file not found for ${entry.file_name}`);
            uncachedCount++;
            continue;
        }

        const imageBuffer = readFileSync(imagePath);
        const imageSha256 = computeImageSha256(imageBuffer);

        const checklistPaths = getChecklistPaths(moduleName, viewId);
        const checklistHash = computeChecklistHash(checklistPaths);
        const valCacheKey = computeValidationCacheKey(imageSha256, checklistHash);

        const cacheManager = new VqaCacheManager(CACHE_DIR, datasetFolderName, moduleName);

        if (auditMode) {
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
        } else {
            await validateSample(entry, force, datasetFolderName);
        }
    }

    // Save and sort clean JSONL cache files for all active modules
    for (const modName of activeKeysPerModule.keys()) {
        const mgr = new VqaCacheManager(CACHE_DIR, datasetFolderName, modName);
        mgr.save();
    }

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

main().catch(console.error);
