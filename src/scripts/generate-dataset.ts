import { Browser, chromium } from 'playwright';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync, rmSync, writeFileSync, readdirSync, readFileSync, appendFileSync } from 'fs';
import { DatasetConfig } from '../config/dataset.config.ts';
import { AbstractProblem, VisualBlueprint } from '../types/ml-engine.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..', '..');
const OUT_DIR = resolve(PROJECT_ROOT, 'out', 'dataset');
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

/**
 * Merges hidden .metadata.jsonl files from module subdirectories into a single root metadata.jsonl
 */
function finalizeMetadata(splitName: string) {
    const splitDir = resolve(OUT_DIR, splitName);
    if (!existsSync(splitDir)) return;

    const rootMetaPath = resolve(splitDir, 'metadata.jsonl');
    
    // We start fresh for the root metadata.jsonl
    writeFileSync(rootMetaPath, '');

    const modules = readdirSync(splitDir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);

    for (const moduleName of modules) {
        const moduleMetaPath = resolve(splitDir, moduleName, '.metadata.jsonl');
        if (existsSync(moduleMetaPath)) {
            const content = readFileSync(moduleMetaPath, 'utf-8');
            const lines = content.split('\n').filter(l => l.trim() !== '');
            
            const adjustedLines = lines.map(line => {
                const entry = JSON.parse(line);
                // Adjust file_name to be relative to the split root
                entry.file_name = `${moduleName}/${entry.file_name}`;
                return JSON.stringify(entry);
            });

            if (adjustedLines.length > 0) {
                appendFileSync(rootMetaPath, adjustedLines.join('\n') + '\n');
            }
        }
    }
    
    console.log(`[${splitName}] Finalized root metadata.jsonl`);
}

async function renderDatasetSplit(
    browser: Browser,
    splitName: string,
    moduleName: string,
    problems: AbstractProblem[],
    blueprints: VisualBlueprint[],
    viewIndexOffset: number,
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
    problems.forEach((problem, index) => {
        const blueprint = blueprints[(index + viewIndexOffset) % blueprints.length];
        const mergedVisualParams = { 
            ...blueprint.visualParams, 
            ...(problem.data._permutationParams || {}) 
        };
        const specificBlueprint = { ...blueprint, visualParams: mergedVisualParams };
        for (let i = 0; i < blueprint.instancesPerProblem; i++) {
            taskQueue.push({ problem, blueprint: specificBlueprint, instance: i });
        }
    });

    const totalTasks = taskQueue.length;
    let completedTasks = 0;

    const processQueue = async () => {
        const context = await browser.newContext();
        const page = await context.newPage();
        let currentViewUrl = '';

        try {
            while (true) {
                const task = taskQueue.shift();
                if (!task) break;

                const { problem, blueprint, instance } = task;
                const url = `${BASE_URL}/visuals/views/${blueprint.viewId}/view.html`;
                
                if (currentViewUrl !== url) {
                    await page.goto(url, { waitUntil: 'networkidle' });
                    currentViewUrl = url;
                }

                const baseFilename = createSafeFilename(problem.id, blueprint.viewId, blueprint.visualParams, instance);

                const renderAndRecord = async (isSolutionView: boolean, modeTag: string, modeName: string) => {
                    const payload: any = {
                        problem,
                        config: {
                            viewId: blueprint.viewId,
                            visualParams: blueprint.visualParams
                        },
                        isSolutionView
                    };

                    await page.evaluate((p) => window.renderView!(p), payload);
                    await page.waitForTimeout(60);
                    const filename = `${baseFilename}_mode-${modeTag}.png`;
                    const outPath = resolve(splitOutputDir, filename);
                    await page.locator('#view').screenshot({ path: outPath, omitBackground: true });
                    
                    totalImages++;

                    return {
                        file_name: filename,
                        problem_id: problem.id,
                        type: problem.type,
                        solution_visible: isSolutionView,
                        mode: modeName,
                        tags: problem.tags,
                        parameters: {
                            ...(problem.data._permutationParams || {}),
                            ...blueprint.visualParams
                        }
                    };
                };

                const qMeta = await renderAndRecord(false, 'Q', 'question');
                const aMeta = await renderAndRecord(true, 'S', 'solution');
                metadata.push(qMeta, aMeta);

                completedTasks++;
                if (completedTasks % Math.max(1, Math.floor(totalTasks / 10)) === 0) {
                    console.log(`[${moduleName}:${splitName}] Progress: ${Math.floor((completedTasks / totalTasks) * 100)}%`);
                }
            }
        } catch (err) {
            console.error('Worker error:', err);
        } finally {
            await context.close();
        }
    };

    const workers = [];
    for (let i = 0; i < Math.min(concurrency, taskQueue.length); i++) {
        workers.push(processQueue());
    }

    await Promise.allSettled(workers);
    
    const metaPath = resolve(splitOutputDir, '.metadata.jsonl');
    const jsonlContent = metadata.map(entry => JSON.stringify(entry)).join('\n') + '\n';
    writeFileSync(metaPath, jsonlContent);
    console.log(`[${moduleName}:${splitName}] Wrote modular metadata to .metadata.jsonl`);
    
    return totalImages;
}

async function runModulePipeline(browser: Browser, moduleName: string, trainingOnly: boolean) {
    console.log(`\n--- Starting Pipeline for Module: ${moduleName} ---`);
    
    const modulePath = resolve(PROJECT_ROOT, 'src', 'generators', moduleName);
    if (!existsSync(modulePath)) {
        throw new Error(`Generator folder not found: ${modulePath}`);
    }

    const moduleConfig = DatasetConfig.modules[moduleName];
    if (!moduleConfig) {
        throw new Error(`Module ${moduleName} not found in DatasetConfig`);
    }

    const GeneratorClass = moduleConfig.generatorClass;

    const { generationConfig } = await import(`../generators/${moduleName}/permutations.ts`);
    const { setSeed } = await import(`../lib/random.ts`);
    
    const generator = new GeneratorClass();
    const { permutations, countPerPermutation = 1 } = generationConfig;

    // Generate datasets
    const trainDataset: AbstractProblem[] = [];
    const valDataset: AbstractProblem[] = [];
    
    const trainKeys = new Set<string>();
    const valKeys = new Set<string>();

    const valRatio = moduleConfig.splits.val / moduleConfig.splits.train;
    console.log(`Generating abstract problems for ${moduleName}...`);

    for (const params of permutations) {
        let countForThisPerm = 0;
        let attempts = 0;
        const maxAttempts = countPerPermutation * 50;

        while (countForThisPerm < countPerPermutation && attempts < maxAttempts) {
            attempts++;
            
            // Seed for training problem
            if (generationConfig.seed !== undefined) {
                setSeed(generationConfig.seed + trainDataset.length);
            }
            
            const problemStub = generator.generate(params);
            
            if (problemStub && !trainKeys.has(problemStub.id)) {
                trainKeys.add(problemStub.id);
                countForThisPerm++;
                
                const problem: AbstractProblem = {
                    ...problemStub,
                    id: `${moduleName}-train-${trainDataset.length + 1}-${problemStub.id}`,
                    type: generator.type,
                    tags: Array.from(new Set(params.labels))
                };
                
                problem.data._permutationParams = params.constraints;
                trainDataset.push(problem);

                // Determine if we generate a validation sample for this training sample
                if (!trainingOnly && valRatio > 0) {
                    const currentValCount = Math.floor(trainDataset.length * valRatio);
                    const prevValCount = Math.floor((trainDataset.length - 1) * valRatio);
                    
                    if (currentValCount > prevValCount) {
                        // Generate validation problem
                        let valAttempts = 0;
                        let valSuccess = false;
                        while (!valSuccess && valAttempts < 50) {
                            valAttempts++;
                            
                            if (generationConfig.seed !== undefined) {
                                setSeed(generationConfig.seed + 10000 + valDataset.length);
                            }
                            
                            const valStub = generator.generate(params);
                            if (valStub && !valKeys.has(valStub.id) && !trainKeys.has(valStub.id)) {
                                valKeys.add(valStub.id);
                                valSuccess = true;
                                
                                const valProblem: AbstractProblem = {
                                    ...valStub,
                                    id: `${moduleName}-val-${valDataset.length + 1}-${valStub.id}`,
                                    type: generator.type,
                                    tags: Array.from(new Set(params.labels))
                                };
                                
                                valProblem.data._permutationParams = params.constraints;
                                valDataset.push(valProblem);
                            }
                        }
                    }
                }
            }
        }
    }

    console.log(`[${moduleName}] Generated problems. Train (${trainDataset.length}), Validation (${valDataset.length})`);

    let moduleImages = 0;
    moduleImages += await renderDatasetSplit(browser, 'train', moduleName, trainDataset, moduleConfig.visualDistribution, 0, DEFAULT_CONCURRENCY);
    
    if (!trainingOnly && valDataset.length > 0) {
        moduleImages += await renderDatasetSplit(browser, 'validation', moduleName, valDataset, moduleConfig.visualDistribution, 1, DEFAULT_CONCURRENCY);
    }

    return moduleImages;
}

async function main() {
    const args = process.argv.slice(2);
    const targetModule = args.find(a => !a.startsWith('--'));

    if (!targetModule) {
        if (existsSync(OUT_DIR)) {
            console.log('Cleaning whole dataset output directory...');
            rmSync(OUT_DIR, { recursive: true, force: true });
        }
        mkdirSync(OUT_DIR, { recursive: true });
    } else {
        // Clear specific module in both splits
        ['train', 'validation'].forEach(split => {
            const moduleDir = resolve(OUT_DIR, split, targetModule);
            if (existsSync(moduleDir)) {
                console.log(`Cleaning target directory for module [${targetModule}] in split [${split}]...`);
                rmSync(moduleDir, { recursive: true, force: true });
            }
        });
        if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
    }

    const browser = await chromium.launch({ headless: true });
    const startTime = performance.now();
    let totalImages = 0;

    const generatorsPath = resolve(PROJECT_ROOT, 'src', 'generators');
    const allModules = readdirSync(generatorsPath, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);

    const trainingOnly = args.includes('--training-only');
    const modulesToRun = targetModule ? [targetModule] : allModules;

    for (const moduleName of modulesToRun) {
        try {
            totalImages += await runModulePipeline(browser, moduleName, trainingOnly);
        } catch (e) {
            console.error(`Failed to run pipeline for ${moduleName}:`, e);
        }
    }

    await browser.close();

    // Finalization step: Merge metadata
    finalizeMetadata('train');
    if (!trainingOnly) {
        finalizeMetadata('validation');
    }

    const duration = ((performance.now() - startTime) / 1000).toFixed(2);
    console.log(`\nDONE! Generated ${totalImages} images in ${duration}s.`);
}

main().catch(console.error);
