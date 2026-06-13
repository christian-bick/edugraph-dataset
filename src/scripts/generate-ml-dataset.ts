import { Browser, chromium } from 'playwright';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync, rmSync, writeFileSync, readdirSync } from 'fs';
import { AbstractProblem, RenderPayload, VisualBlueprint } from '../types/ml-engine.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..', '..');
const OUT_DIR = resolve(PROJECT_ROOT, 'out', 'ml-dataset');
const BASE_URL = 'http://localhost:5173';
const DEFAULT_CONCURRENCY = 8;

function createSafeFilename(problemId: string, rendererId: string, params: any, instance: number): string {
    const safeId = problemId.replace(/[^a-zA-Z0-9-]/g, '-');
    const paramStrings = Object.entries(params)
        .map(([k, v]) => `${k}-${v}`)
        .join('_')
        .replace(/[^a-zA-Z0-9-_]/g, '');
    
    const paramPart = paramStrings ? `_${paramStrings}` : '';
    return `${safeId}_${rendererId}${paramPart}_inst-${instance}`;
}

async function renderDatasetSplit(
    browser: Browser,
    splitName: string,
    moduleName: string,
    problems: AbstractProblem[],
    blueprints: VisualBlueprint[],
    concurrency: number
) {
    if (problems.length === 0) return 0;
    
    console.log(`\n--- Rendering [${moduleName}] Split: ${splitName} (${problems.length} abstract problems) ---`);
    const splitOutputDir = resolve(OUT_DIR, splitName, moduleName);
    if (!existsSync(splitOutputDir)) {
        mkdirSync(splitOutputDir, { recursive: true });
    }

    let totalImages = 0;
    const metadata: any[] = [];
    
    const taskQueue: { problem: AbstractProblem, blueprint: VisualBlueprint, instance: number }[] = [];
    for (const blueprint of blueprints) {
        for (const problem of problems) {
            const mergedVisualParams = { 
                ...blueprint.visualParams, 
                ...(problem.data._permutationParams || {}) 
            };
            const specificBlueprint = { ...blueprint, visualParams: mergedVisualParams };
            for (let i = 0; i < blueprint.instancesPerProblem; i++) {
                taskQueue.push({ problem, blueprint: specificBlueprint, instance: i });
            }
        }
    }

    const totalTasks = taskQueue.length;
    let completedTasks = 0;

    const processQueue = async () => {
        const context = await browser.newContext();
        const page = await context.newPage();
        let currentRendererUrl = '';

        try {
            while (true) {
                const task = taskQueue.shift();
                if (!task) break;

                const { problem, blueprint, instance } = task;
                const url = `${BASE_URL}/exercises/${blueprint.rendererId}/exercise.html`;
                
                if (currentRendererUrl !== url) {
                    await page.goto(url, { waitUntil: 'networkidle' });
                    currentRendererUrl = url;
                }

                const baseFilename = createSafeFilename(problem.id, blueprint.rendererId, blueprint.visualParams, instance);

                const renderAndRecord = async (isAnswerView: boolean, modeTag: string, modeName: string) => {
                    const payload: RenderPayload = {
                        problem,
                        config: {
                            rendererId: blueprint.rendererId,
                            visualParams: blueprint.visualParams
                        },
                        isAnswerView
                    };

                    await page.evaluate((p) => window.renderExercise!(p), payload);
                    const filename = `${baseFilename}_mode-${modeTag}.png`;
                    const outPath = resolve(splitOutputDir, filename);
                    await page.locator('#exercise').screenshot({ path: outPath, omitBackground: true });
                    
                    metadata.push({
                        filename,
                        problemId: problem.id,
                        type: problem.type,
                        mode: modeName,
                        tags: problem.tags,
                        parameters: blueprint.visualParams
                    });
                    
                    totalImages++;
                };

                await renderAndRecord(false, 'Q', 'question');
                await renderAndRecord(true, 'A', 'answer');

                completedTasks++;
                if (completedTasks % Math.max(1, Math.floor(totalTasks / 10)) === 0) {
                    console.log(`[${moduleName}:${splitName}] Progress: ${Math.floor((completedTasks / totalTasks) * 100)}%`);
                }
            }
        } finally {
            await context.close();
        }
    };

    const workers = [];
    for (let i = 0; i < Math.min(concurrency, taskQueue.length); i++) {
        workers.push(processQueue());
    }

    await Promise.allSettled(workers);
    
    const metaPath = resolve(splitOutputDir, 'meta.json');
    writeFileSync(metaPath, JSON.stringify(metadata, null, 2));
    console.log(`[${moduleName}:${splitName}] Wrote metadata for ${metadata.length} items to meta.json`);
    
    return totalImages;
}

async function runModulePipeline(browser: Browser, moduleName: string) {
    console.log(`\n--- Starting Pipeline for Module: ${moduleName} ---`);
    
    const modulePath = resolve(PROJECT_ROOT, 'src', 'generators', moduleName);
    if (!existsSync(modulePath)) {
        throw new Error(`Generator folder not found: ${modulePath}`);
    }

    // Dynamic Imports from the module folder
    const { ArithmeticGenerator } = await import(`../generators/${moduleName}/generator.ts`);
    // Note: In a fully generic system, we'd export a generic class or factory.
    // For now I'll use a mapping or assume a standard export name.
    let GeneratorClass;
    if (moduleName === 'arithmetic') GeneratorClass = (await import(`../generators/${moduleName}/generator.ts`)).ArithmeticGenerator;
    else if (moduleName === 'counting') GeneratorClass = (await import(`../generators/${moduleName}/generator.ts`)).CountingGenerator;
    else if (moduleName === 'measurement') GeneratorClass = (await import(`../generators/${moduleName}/generator.ts`)).MeasurementGenerator;
    else if (moduleName === 'comparison') GeneratorClass = (await import(`../generators/${moduleName}/generator.ts`)).ComparisonGenerator;
    else if (moduleName === 'ordering') GeneratorClass = (await import(`../generators/${moduleName}/generator.ts`)).OrderingGenerator;
    else if (moduleName === 'writing') GeneratorClass = (await import(`../generators/${moduleName}/generator.ts`)).WritingGenerator;
    else if (moduleName === 'time') GeneratorClass = (await import(`../generators/${moduleName}/generator.ts`)).TimeGenerator;

    if (!GeneratorClass) throw new Error(`Could not find generator class for ${moduleName}`);

    const { config } = await import(`../generators/${moduleName}/permutations.ts`);
    
    const generator = new GeneratorClass();
    console.log(`Generating abstract problems for ${moduleName}...`);
    const dataset = generator.generateDataset(config.generationConfig);

    // Orchestrated Label Generation
    for (const problem of dataset) {
        problem.tags = generator.generateLabels(problem.data._permutationParams || {});
    }

    // Split logic
    const count = dataset.length;
    const trainC = Math.floor(count * config.splits.train);
    const trainSet = dataset.slice(0, trainC);
    const valSet = dataset.slice(trainC);

    console.log(`[${moduleName}] Generated ${count} problems. Split: Train (${trainSet.length}), Val (${valSet.length})`);

    let moduleImages = 0;
    moduleImages += await renderDatasetSplit(browser, 'train', moduleName, trainSet, config.visualDistribution, DEFAULT_CONCURRENCY);
    moduleImages += await renderDatasetSplit(browser, 'val', moduleName, valSet, config.visualDistribution, DEFAULT_CONCURRENCY);

    return moduleImages;
}

async function main() {
    const args = process.argv.slice(2);
    const targetModule = args.find(a => !a.startsWith('--'));

    if (existsSync(OUT_DIR) && !targetModule) {
        console.log('Cleaning whole dataset output directory...');
        rmSync(OUT_DIR, { recursive: true, force: true });
    }
    if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

    const browser = await chromium.launch({ headless: true });
    const startTime = performance.now();
    let totalImages = 0;

    const generatorsPath = resolve(PROJECT_ROOT, 'src', 'generators');
    const allModules = readdirSync(generatorsPath, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);

    const modulesToRun = targetModule ? [targetModule] : allModules;

    for (const moduleName of modulesToRun) {
        try {
            totalImages += await runModulePipeline(browser, moduleName);
        } catch (e) {
            console.error(`Failed to run pipeline for ${moduleName}:`, e);
        }
    }

    await browser.close();
    const duration = ((performance.now() - startTime) / 1000).toFixed(2);
    console.log(`\nDONE! Generated ${totalImages} images in ${duration}s.`);
}

main().catch(console.error);
