import 'dotenv/config';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync, rmSync, writeFileSync, readdirSync, readFileSync } from 'fs';
import { createHash } from 'crypto';
import { chromium, Browser } from 'playwright';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..', '..');
const TEMP_TEST_DIR = resolve(PROJECT_ROOT, 'temp', 'view-tests');
const CACHE_PATH = resolve(PROJECT_ROOT, 'temp', 'validation-cache.json');
const BASE_URL = 'http://localhost:5173';

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
        responseSchema: responseSchema,
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

function getProblemType(viewId: string) {
    if (viewId.startsWith('operations') || viewId.startsWith('place-value')) return 'arithmetic';
    if (viewId.startsWith('counting') || viewId.startsWith('sorting')) return 'counting';
    if (viewId.startsWith('measure')) return 'measurement';
    if (viewId.startsWith('numbers-compare')) return 'comparison';
    if (viewId.startsWith('numbers-order')) return 'ordering';
    if (viewId.startsWith('numbers-write')) return 'writing';
    if (viewId.startsWith('time')) return 'time';
    if (viewId.startsWith('geometry')) return 'geometry';
    return 'counting';
}

function cartesianProduct(obj: Record<string, any[]>): Record<string, any>[] {
    const keys = Object.keys(obj);
    if (keys.length === 0) return [{}];

    const recurse = (keyIndex: number): Record<string, any>[] => {
        if (keyIndex === keys.length) return [{}];
        const key = keys[keyIndex];
        const values = obj[key];
        const subProducts = recurse(keyIndex + 1);
        const products: Record<string, any>[] = [];
        for (const val of values) {
            for (const sub of subProducts) {
                products.push({ [key]: val, ...sub });
            }
        }
        return products;
    };

    return recurse(0);
}

async function testViewBoundaries(browser: Browser, viewId: string) {
    const specPath = resolve(PROJECT_ROOT, 'src', 'visuals', 'views', viewId, 'spec.ts');
    if (!existsSync(specPath)) {
        console.log(`Skipping view [${viewId}] (no spec.ts found).`);
        return;
    }

    console.log(`\n==================================================`);
    console.log(`Running boundary tests for view: [${viewId}]`);
    console.log(`==================================================`);

    // Clear output folder for this view
    const viewOutputDir = resolve(TEMP_TEST_DIR, viewId);
    if (existsSync(viewOutputDir)) {
        rmSync(viewOutputDir, { recursive: true, force: true });
    }
    mkdirSync(viewOutputDir, { recursive: true });

    // Import spec
    const { spec } = await import(`../visuals/views/${viewId}/spec.ts`);
    const constraints = spec.constraints || {};
    const testParams = spec.testParams || {};

    // 1. Resolve parameters into Varied arrays and Fixed values/lambdas
    const variedArrays: Record<string, any[]> = {};
    const fixedValues: Record<string, any> = {};
    const dependentFns: Record<string, (params: any) => any> = {};

    for (const [key, value] of Object.entries(testParams)) {
        if (typeof value === 'function') {
            // Check if it is a varied parameter evaluator (takes 1 arg, or does not use params object)
            // Or if it is a dependent fixed parameter resolver (takes params object)
            const constraint = constraints[key];
            if (constraint) {
                // If there's a constraint, evaluate it
                const evaluated = value(constraint);
                if (Array.isArray(evaluated)) {
                    variedArrays[key] = evaluated;
                } else {
                    fixedValues[key] = evaluated;
                }
            } else {
                // No constraint, it must be a dependent/fixed parameter resolver function
                dependentFns[key] = value as any;
            }
        } else if (Array.isArray(value)) {
            variedArrays[key] = value;
        } else {
            fixedValues[key] = value;
        }
    }

    // 2. Generate Cartesian product permutations
    const rawPermutations = cartesianProduct(variedArrays);
    const finalPermutations: Record<string, any>[] = [];

    for (const raw of rawPermutations) {
        const fullParams = { ...fixedValues, ...raw };
        // Evaluate dependent parameters
        for (const [key, fn] of Object.entries(dependentFns)) {
            fullParams[key] = fn(key, fullParams);
        }
        finalPermutations.push(fullParams);
    }

    console.log(`Generated ${finalPermutations.length} boundary test permutations.`);

    // 3. Render and test each permutation in Playwright
    const context = await browser.newContext();
    const page = await context.newPage();
    const url = `${BASE_URL}/visuals/views/${viewId}/view.html`;
    await page.goto(url, { waitUntil: 'networkidle' });

    const generatorName = getProblemType(viewId);
    const checklistPath = resolve(PROJECT_ROOT, 'src', 'generators', generatorName, 'checklist.md');
    const globalChecklistPath = resolve(PROJECT_ROOT, 'src', 'generators', 'global-checklist.md');
    
    let checklist = '';
    if (existsSync(globalChecklistPath)) checklist += readFileSync(globalChecklistPath, 'utf-8') + '\n\n';
    if (existsSync(checklistPath)) checklist += readFileSync(checklistPath, 'utf-8');

    for (let index = 0; index < finalPermutations.length; index++) {
        const params = finalPermutations[index];
        console.log(`\nPermutation #${index + 1}:`, JSON.stringify(params));

        const problem = {
            id: `test-${viewId}-${index}`,
            type: generatorName as any,
            data: params
        };

        const renderAndCheck = async (isSolutionView: boolean, modeTag: string) => {
            const payload = {
                problem,
                config: { viewId, visualParams: {} },
                isSolutionView
            };

            await page.evaluate((p) => window.renderView!(p), payload);
            await page.waitForTimeout(60);

            // Programmatic DOM overlap check
            const layoutCheck = await page.evaluate(() => {
                const viewContainer = document.getElementById('view');
                if (!viewContainer) return { pass: true, errors: ['#view container not found'] };

                const allElements = Array.from(viewContainer.querySelectorAll('*')) as HTMLElement[];
                const elementsToCheck = allElements.filter(el => {
                    const rect = el.getBoundingClientRect();
                    if (rect.width === 0 || rect.height === 0) return false;
                    
                    const style = window.getComputedStyle(el);
                    if (style.visibility === 'hidden' || style.display === 'none' || style.opacity === '0') return false;
                    
                    const isLeaf = el.children.length === 0;
                    const isRenderNode = ['IMG', 'SVG', 'INPUT', 'BUTTON', 'CANVAS'].includes(el.tagName);
                    const hasDirectText = Array.from(el.childNodes).some(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim().length > 0);
                    
                    return isLeaf || isRenderNode || hasDirectText;
                });

                const rects = elementsToCheck.map(el => ({
                    el,
                    rect: el.getBoundingClientRect()
                }));

                const errors: string[] = [];
                for (let i = 0; i < rects.length; i++) {
                    for (let j = i + 1; j < rects.length; j++) {
                        const a = rects[i];
                        const b = rects[j];
                        if (a.el.contains(b.el) || b.el.contains(a.el)) continue;

                        const r1 = a.rect;
                        const r2 = b.rect;
                        const overlaps = !(
                            r1.right <= r2.left ||
                            r1.left >= r2.right ||
                            r1.bottom <= r2.top ||
                            r1.top >= r2.bottom
                        );
                        if (overlaps) {
                            const labelA = `${a.el.tagName}${a.el.className ? '.' + Array.from(a.el.classList).join('.') : ''}`;
                            const labelB = `${b.el.tagName}${b.el.className ? '.' + Array.from(b.el.classList).join('.') : ''}`;
                            errors.push(`Overlap: ${labelA} intersects with ${labelB}`);
                        }
                    }
                }
                return { pass: errors.length === 0, errors };
            });

            const filename = `perm-${index}_mode-${modeTag}.png`;
            const outPath = resolve(viewOutputDir, filename);
            await page.locator('#view').screenshot({ path: outPath, omitBackground: true });

            return {
                path: outPath,
                layoutCheck
            };
        };

        const qResult = await renderAndCheck(false, 'Q');
        const aResult = await renderAndCheck(true, 'S');

        // Check if programmatic layout failed
        const programmaticFailed = !qResult.layoutCheck.pass || !aResult.layoutCheck.pass;
        const allErrors = [...(qResult.layoutCheck.errors || []), ...(aResult.layoutCheck.errors || [])];

        if (programmaticFailed) {
            console.log(`❌ Programmatic QA: FAILED`);
            allErrors.forEach(err => console.log(`  - ${err}`));
            continue;
        } else {
            console.log(`✅ Programmatic QA: PASS`);
        }

        // LLM QA (integrated with caching)
        if (!model) {
            console.log(`⚠️  LLM QA skipped: GEMINI_API_KEY not defined.`);
            continue;
        }

        const qImageBuffer = readFileSync(qResult.path);
        const aImageBuffer = readFileSync(aResult.path);
        const prompt = `
You are a senior Visual QA Engineer. Evaluate these two math exercise images:
Image 1: Question Mode (_mode-Q)
Image 2: Solution Mode (_mode-S)
View ID: "${viewId}"

STRICT CHECKLIST:
${checklist}

Respond only in the provided JSON schema.
`;

        const cacheKey = computeCacheHash(qImageBuffer, aImageBuffer, checklist, prompt);
        if (cache[cacheKey]) {
            const parsed = cache[cacheKey];
            const status = parsed.pass ? '✅ LLM QA: PASS (cached)' : '❌ LLM QA: FAIL (cached)';
            console.log(status);
            console.log(`  Reasoning: ${parsed.reasoning}`);
        } else {
            const qImagePart = { inlineData: { data: qImageBuffer.toString("base64"), mimeType: "image/png" } };
            const aImagePart = { inlineData: { data: aImageBuffer.toString("base64"), mimeType: "image/png" } };
            try {
                const result = await model.generateContent([prompt, qImagePart, aImagePart]);
                const parsed = JSON.parse(result.response.text());
                
                const status = parsed.pass ? '✅ LLM QA: PASS' : '❌ LLM QA: FAIL';
                console.log(status);
                console.log(`  Reasoning: ${parsed.reasoning}`);

                cache[cacheKey] = parsed;
                saveCache();
            } catch (err) {
                console.error(`🚨 Error during LLM QA:`, err);
            }
        }
    }

    await context.close();
}

function computeCacheHash(qBuffer: Buffer, aBuffer: Buffer, checklist: string, prompt: string): string {
    const hash = createHash('sha256');
    hash.update(qBuffer);
    hash.update(aBuffer);
    hash.update(checklist);
    hash.update(prompt);
    return hash.digest('hex');
}

async function main() {
    const args = process.argv.slice(2);
    let targetView: string | undefined = undefined;

    // Check positional arguments
    const positionalArgs = args.filter(a => !a.startsWith('--'));
    if (positionalArgs.length > 0) {
        console.error('Error: Positional arguments are not allowed.');
        console.error('Usage: npm run test:views -- --view=X');
        process.exit(1);
    }

    const viewArg = args.find(a => a.startsWith('--view='));
    if (viewArg) {
        targetView = viewArg.split('=')[1];
    }

    console.log('--- Starting View Boundary Testing ---');

    const browser = await chromium.launch({ headless: true });
    try {
        const viewsRoot = resolve(PROJECT_ROOT, 'src', 'visuals', 'views');
        const allViews = readdirSync(viewsRoot, { withFileTypes: true })
            .filter(d => d.isDirectory())
            .map(d => d.name);

        const viewsToTest = targetView ? [targetView] : allViews;

        for (const viewId of viewsToTest) {
            await testViewBoundaries(browser, viewId);
        }
    } finally {
        await browser.close();
    }
    console.log('\nView Boundary Testing Complete.');
}

main().catch(console.error);
