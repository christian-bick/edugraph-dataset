import 'dotenv/config';
import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { findLeafModules } from '../lib/module-resolver.ts';
import {
    computeChecklistHash,
    computeImageSha256,
    computeVqaCacheKey,
    VqaCacheManager
} from '../lib/vqa-cache.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..', '..');
let DATASET_ROOT = resolve(PROJECT_ROOT, 'out', 'dataset', 'train');
const GENERATORS_ROOT = resolve(PROJECT_ROOT, 'src', 'generators');
const VIEWS_ROOT = resolve(PROJECT_ROOT, 'src', 'visuals', 'views');
const CACHE_DIR = resolve(PROJECT_ROOT, 'cache', 'vqa-validation');

// 1. Setup Gemini API
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
const responseSchema = {
    type: SchemaType.OBJECT,
    properties: {
        pass: { type: SchemaType.BOOLEAN },
        general_checks: {
            type: SchemaType.OBJECT,
            properties: {
                no_overlaps: { type: SchemaType.BOOLEAN },
                no_placeholders: { type: SchemaType.BOOLEAN },
                sane_padding: { type: SchemaType.BOOLEAN },
            },
            required: ["no_overlaps", "no_placeholders", "sane_padding"]
        },
        coloring_pass: { type: SchemaType.BOOLEAN },
        layout_pass: { type: SchemaType.BOOLEAN },
        reasoning: { type: SchemaType.STRING },
    },
    required: ["pass", "general_checks", "coloring_pass", "layout_pass", "reasoning"]
};

const model = genAI ? genAI.getGenerativeModel({ 
    model: "gemini-3.5-flash",
    generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema as any,
    }
}) : null;

function printValidationResult(evaluation: any, isCached: boolean) {
    const status = evaluation.pass ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}${isCached ? ' (cached)' : ''}`);
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

async function validateSample(entry: any, force: boolean) {
    const moduleName = entry.generator;
    const viewId = entry.view;
    const modeName = entry.mode || (entry.solution_visible ? 'solution' : 'question');
    const isSolution = entry.solution_visible || modeName === 'solution';

    console.log(`\nEvaluating [${moduleName} : ${viewId} (${modeName})] sample: ${entry.file_name}...`);

    const imagePath = resolve(DATASET_ROOT, entry.file_name);

    // 1. Check image file existence
    if (!existsSync(imagePath)) {
        console.error(`🚨 Image file not found for ${entry.file_name}`);
        return;
    }

    const imageBuffer = readFileSync(imagePath);
    const imageSha256 = computeImageSha256(imageBuffer);

    // 2. Load checklists hierarchically (Global -> Parent Category -> Leaf Module -> View)
    const checklistPaths: string[] = [];
    const globalChecklistPath = resolve(GENERATORS_ROOT, 'global-checklist.md');
    if (existsSync(globalChecklistPath)) checklistPaths.push(globalChecklistPath);

    const leafModules = findLeafModules(GENERATORS_ROOT);
    const leafMod = leafModules.find(m => m.id === moduleName);

    if (leafMod && leafMod.category) {
        const categoryChecklistPath = resolve(GENERATORS_ROOT, leafMod.category, 'checklist.md');
        if (existsSync(categoryChecklistPath)) checklistPaths.push(categoryChecklistPath);
    }

    const leafChecklistPath = leafMod 
        ? resolve(leafMod.absolutePath, 'checklist.md')
        : resolve(GENERATORS_ROOT, moduleName, 'checklist.md');
    if (existsSync(leafChecklistPath)) checklistPaths.push(leafChecklistPath);

    const viewModules = findLeafModules(VIEWS_ROOT);
    const viewMod = viewModules.find(v => v.id === viewId);
    if (viewMod) {
        const viewChecklistPath = resolve(viewMod.absolutePath, 'checklist.md');
        if (existsSync(viewChecklistPath)) checklistPaths.push(viewChecklistPath);
    }

    let checklistText = '';
    for (const p of checklistPaths) {
        checklistText += readFileSync(p, 'utf-8') + '\n\n';
    }

    const checklistHash = computeChecklistHash(checklistPaths);
    const targetKeyHash = entry.target_key_hash || entry.problem_id || '';
    const cacheKey = computeVqaCacheKey(targetKeyHash, imageSha256, checklistHash);

    const cacheManager = new VqaCacheManager(CACHE_DIR, moduleName);

    // 3. Programmatic layout check verification short-circuit
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
            cache_key: cacheKey,
            file_name: entry.file_name,
            target_key_hash: targetKeyHash,
            image_sha256: imageSha256,
            checklist_hash: checklistHash,
            validated_at: new Date().toISOString(),
            evaluation: failEval
        });
        cacheManager.save();
        return;
    }

    // 4. Check cache hit
    const existingCache = cacheManager.get(cacheKey);
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

STRICT CHECKLIST:
${checklistText}

EVALUATION GUIDELINES:
1. Question Mode (_mode-Q) and Solution Mode (_mode-S) are generated independently under each competency target.
2. In Question Mode (_mode-Q): verify that the problem is presented clearly, unsolved, and has minimal text instructions where appropriate.
3. In Solution Mode (_mode-S): verify that the solution visual is clear (e.g. correct answers/coloring) and strictly NEVER contains instruction text headers.

Respond only in the provided JSON schema.
`;

    // 5. LLM QA call
    try {
        const imagePart = { inlineData: { data: imageBuffer.toString("base64"), mimeType: "image/png" } };

        const result = await model.generateContent([prompt, imagePart]);
        const responseText = result.response.text();
        const parsed = JSON.parse(responseText);

        printValidationResult(parsed, false);

        cacheManager.set({
            cache_key: cacheKey,
            file_name: entry.file_name,
            target_key_hash: targetKeyHash,
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
    let specName = process.env.npm_config_spec || 'ccss';

    for (const arg of args) {
        if (arg.includes('generator=')) {
            targetGenerator = arg.split('generator=')[1];
        } else if (arg.includes('view=')) {
            targetView = arg.split('view=')[1];
        } else if (arg.includes('spec=')) {
            specName = arg.split('spec=')[1];
        } else if (arg.includes('force') || arg.includes('no-cache')) {
            force = true;
        } else if (arg.includes('audit') || arg.includes('ci')) {
            auditMode = true;
        }
    }

    if (specName === 'test') {
        DATASET_ROOT = resolve(PROJECT_ROOT, 'out', 'dataset-test', 'train');
    }

    console.log(`--- Starting Automated Modular VQA ${auditMode ? '(AUDIT MODE)' : ''} [Spec: ${specName}] ---`);

    const rootMetaPath = resolve(DATASET_ROOT, 'metadata.jsonl');
    if (!existsSync(rootMetaPath)) {
        console.error(`Error: Root metadata file not found at ${rootMetaPath}. Please generate the dataset first.`);
        process.exit(1);
    }

    // Read metadata entries
    const metadataLines = readFileSync(rootMetaPath, 'utf-8').split('\n').filter(l => l.trim() !== '');
    const entries = metadataLines.map(l => JSON.parse(l));

    // Process both _mode-Q and _mode-S entries matching target generator/view
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

        const checklistPaths: string[] = [];
        const globalChecklistPath = resolve(GENERATORS_ROOT, 'global-checklist.md');
        if (existsSync(globalChecklistPath)) checklistPaths.push(globalChecklistPath);

        const leafModules = findLeafModules(GENERATORS_ROOT);
        const leafMod = leafModules.find(m => m.id === moduleName);
        if (leafMod && leafMod.category) {
            const categoryChecklistPath = resolve(GENERATORS_ROOT, leafMod.category, 'checklist.md');
            if (existsSync(categoryChecklistPath)) checklistPaths.push(categoryChecklistPath);
        }

        const leafChecklistPath = leafMod 
            ? resolve(leafMod.absolutePath, 'checklist.md')
            : resolve(GENERATORS_ROOT, moduleName, 'checklist.md');
        if (existsSync(leafChecklistPath)) checklistPaths.push(leafChecklistPath);

        const viewModules = findLeafModules(VIEWS_ROOT);
        const viewMod = viewModules.find(v => v.id === viewId);
        if (viewMod) {
            const viewChecklistPath = resolve(viewMod.absolutePath, 'checklist.md');
            if (existsSync(viewChecklistPath)) checklistPaths.push(viewChecklistPath);
        }

        const checklistHash = computeChecklistHash(checklistPaths);
        const targetKeyHash = entry.target_key_hash || entry.problem_id || '';
        const cacheKey = computeVqaCacheKey(targetKeyHash, imageSha256, checklistHash);

        const cacheManager = new VqaCacheManager(CACHE_DIR, moduleName);

        if (auditMode) {
            const existingCache = cacheManager.get(cacheKey);
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
            await validateSample(entry, force);
        }
    }

    if (auditMode) {
        console.log(`\n--- VQA Cache Audit Summary ---`);
        console.log(`Passed (Cached): ${auditPassedCount}`);
        console.log(`Uncached: ${uncachedCount}`);
        console.log(`Failing: ${failingCount}`);

        if (uncachedCount > 0 || failingCount > 0) {
            console.error(`\n🚨 AUDIT FAILED: ${uncachedCount} uncached samples, ${failingCount} failing samples.`);
            console.error(`Please run local validation using GEMINI_API_KEY, resolve failures, and commit updated cache files under cache/vqa-validation/.`);
            process.exit(1);
        } else {
            console.log(`\n✅ AUDIT PASSED: All ${auditPassedCount} generated samples have valid, passing cache records.`);
        }
    }

    console.log('\nValidation Complete.');
}

main().catch(console.error);
