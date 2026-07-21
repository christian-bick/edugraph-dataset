import 'dotenv/config';
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { findLeafModules } from '../lib/module-resolver.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..', '..');
let DATASET_ROOT = resolve(PROJECT_ROOT, 'out', 'dataset', 'train');
const GENERATORS_ROOT = resolve(PROJECT_ROOT, 'src', 'generators');
const CACHE_PATH = resolve(PROJECT_ROOT, 'temp', 'validation-cache.json');

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

// 2. Load Caching
let cache: Record<string, any> = {};
if (existsSync(CACHE_PATH)) {
    try {
        cache = JSON.parse(readFileSync(CACHE_PATH, 'utf-8'));
    } catch (e) {
        console.warn('Failed to load validation cache, starting fresh.');
    }
}

function saveCache() {
    const cacheDir = dirname(CACHE_PATH);
    if (!existsSync(cacheDir)) {
        mkdirSync(cacheDir, { recursive: true });
    }
    writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), 'utf-8');
}

function computeCacheHash(qBuffer: Buffer, aBuffer: Buffer, checklist: string, prompt: string): string {
    const hash = createHash('sha256');
    hash.update(qBuffer);
    hash.update(aBuffer);
    hash.update(checklist);
    hash.update(prompt);
    return hash.digest('hex');
}

function printValidationResult(parsed: any, isCached: boolean) {
    const status = parsed.pass ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}${isCached ? ' (cached)' : ''}`);
    console.log(`- Overlaps: ${parsed.general_checks.no_overlaps ? 'None' : 'DETECTED'}`);
    console.log(`- Placeholders: ${parsed.general_checks.no_placeholders ? 'None' : 'DETECTED'}`);
    console.log(`- Padding: ${parsed.general_checks.sane_padding ? 'Good' : 'BAD'}`);
    console.log(`- Coloring: ${parsed.coloring_pass ? 'Correct' : 'INCORRECT'}`);
    console.log(`- Layout: ${parsed.layout_pass ? 'Correct' : 'INCORRECT'}`);
    console.log(`Reasoning: ${parsed.reasoning}`);
}

async function validateSample(entry: any, force: boolean) {
    const moduleName = entry.generator;
    const viewId = entry.view;
    console.log(`\nEvaluating [${moduleName} : ${viewId}] sample: ${entry.file_name}...`);

    const qPath = resolve(DATASET_ROOT, entry.file_name);
    const aPath = qPath.replace('_mode-Q.png', '_mode-S.png');

    // 1. Programmatic layout check verification
    if (entry.layout_checks && entry.layout_checks.pass === false) {
        console.log(`❌ FAIL (Programmatic Overlaps Detected)`);
        if (entry.layout_checks.errors) {
            entry.layout_checks.errors.forEach((err: string) => console.log(`  - ${err}`));
        }
        return;
    }

    // 2. Load checklists hierarchically (Global -> Parent Category -> Leaf Module)
    const globalChecklistPath = resolve(GENERATORS_ROOT, 'global-checklist.md');
    let checklist = '';

    if (existsSync(globalChecklistPath)) {
        checklist += readFileSync(globalChecklistPath, 'utf-8') + '\n\n';
    }

    const leafModules = findLeafModules(GENERATORS_ROOT);
    const leafMod = leafModules.find(m => m.id === moduleName);

    if (leafMod && leafMod.category) {
        const categoryChecklistPath = resolve(GENERATORS_ROOT, leafMod.category, 'checklist.md');
        if (existsSync(categoryChecklistPath)) {
            checklist += readFileSync(categoryChecklistPath, 'utf-8') + '\n\n';
        }
    }

    const leafChecklistPath = leafMod 
        ? resolve(leafMod.absolutePath, 'checklist.md')
        : resolve(GENERATORS_ROOT, moduleName, 'checklist.md');
        
    if (existsSync(leafChecklistPath)) {
        checklist += readFileSync(leafChecklistPath, 'utf-8');
    }

    // 3. Check image file existence
    if (!existsSync(qPath) || !existsSync(aPath)) {
        console.error(`🚨 Image file(s) not found for ${entry.file_name}`);
        return;
    }

    const qImageBuffer = readFileSync(qPath);
    const aImageBuffer = readFileSync(aPath);
    const prompt = `
You are a senior Visual QA Engineer. Evaluate these two math exercise images:
Image 1: Question Mode (_mode-Q)
Image 2: Solution Mode (_mode-S)
Module: "${moduleName}"
View ID: "${viewId}"

STRICT CHECKLIST:
${checklist}

Respond only in the provided JSON schema.
`;

    const cacheKey = computeCacheHash(qImageBuffer, aImageBuffer, checklist, prompt);

    if (cache[cacheKey] && !force) {
        const parsed = cache[cacheKey];
        printValidationResult(parsed, true);
        return;
    }

    if (!model) {
        console.log(`⚠️  LLM QA skipped: GEMINI_API_KEY or model not loaded.`);
        return;
    }

    // 4. LLM QA call
    try {
        const qImagePart = { inlineData: { data: qImageBuffer.toString("base64"), mimeType: "image/png" } };
        const aImagePart = { inlineData: { data: aImageBuffer.toString("base64"), mimeType: "image/png" } };

        const result = await model.generateContent([prompt, qImagePart, aImagePart]);
        const responseText = result.response.text();
        const parsed = JSON.parse(responseText);

        printValidationResult(parsed, false);

        cache[cacheKey] = parsed;
        saveCache();
    } catch (error) {
        console.error(`🚨 Error validating ${entry.file_name}:`, error);
    }
}

async function main() {
    const args = process.argv.slice(2);

    // Check positional args
    const positionalArgs = args.filter(a => !a.startsWith('--'));
    if (positionalArgs.length > 0) {
        console.error('Error: Positional arguments are not allowed.');
        console.error('Usage: npx vite-node src/scripts/validate-dataset.ts --generator=X --view=Y [--spec=Z] [--force]');
        process.exit(1);
    }

    let targetGenerator: string | undefined = undefined;
    let targetView: string | undefined = undefined;
    let force = false;
    let specName = 'ccss';

    for (const arg of args) {
        if (arg.startsWith('--generator=')) {
            targetGenerator = arg.split('=')[1];
        } else if (arg.startsWith('--view=')) {
            targetView = arg.split('=')[1];
        } else if (arg.startsWith('--spec=')) {
            specName = arg.split('=')[1];
        } else if (arg === '--force' || arg === '--no-cache') {
            force = true;
        }
    }

    if (specName === 'test') {
        DATASET_ROOT = resolve(PROJECT_ROOT, 'out', 'dataset-test', 'train');
    }

    console.log('--- Starting Automated Modular VQA ---');

    const rootMetaPath = resolve(DATASET_ROOT, 'metadata.jsonl');
    if (!existsSync(rootMetaPath)) {
        console.error(`Error: Root metadata file not found at ${rootMetaPath}. Please generate the dataset first.`);
        process.exit(1);
    }

    // Read metadata entries
    const metadataLines = readFileSync(rootMetaPath, 'utf-8').split('\n').filter(l => l.trim() !== '');
    const entries = metadataLines.map(l => JSON.parse(l));

    // Filter to Question mode entries matching target generator/view
    let filtered = entries.filter((e: any) => !e.solution_visible);
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

    // Group entries by (generator, view) combination
    const groups: Record<string, any[]> = {};
    for (const entry of filtered) {
        const key = `${entry.generator}:${entry.view}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(entry);
    }

    // Deterministically pick the first alphabetical image in each group and validate it
    for (const key of Object.keys(groups)) {
        const groupEntries = groups[key];
        groupEntries.sort((a, b) => a.file_name.localeCompare(b.file_name));
        const deterministicSample = groupEntries[0];
        await validateSample(deterministicSample, force);
    }

    console.log('\nValidation Complete.');
}

main().catch(console.error);
