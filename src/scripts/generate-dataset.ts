import {Browser, chromium} from 'playwright';
import {dirname, resolve} from 'path';
import {fileURLToPath} from 'url';
import {appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync} from 'fs';
import {AbstractProblem, VisualBlueprint} from '../types/ml-engine.ts';
import {doesGeneratorSupportCompetency, doesViewSupportProblem} from '../lib/ontology.ts';
import {KindergartenSpec} from '../../config/spec/ccss/kindergarten.ts';
import {Grade1Spec} from '../../config/spec/ccss/grade-01.ts';

const allTargets = [...KindergartenSpec, ...Grade1Spec];

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
        const problemBlueprints = (problem as any).matchedBlueprints;
        if (problemBlueprints) {
            problemBlueprints.forEach((blueprint: any) => {
                const mergedVisualParams = { 
                    ...blueprint.visualParams, 
                    ...(problem.data._permutationParams || {}) 
                };
                const specificBlueprint = { ...blueprint, visualParams: mergedVisualParams };
                for (let i = 0; i < blueprint.instancesPerProblem; i++) {
                    taskQueue.push({ problem, blueprint: specificBlueprint, instance: i });
                }
            });
        } else {
            if (blueprints && blueprints.length > 0) {
                const blueprint = blueprints[(index + viewIndexOffset) % blueprints.length];
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

                    // Client-Side Bounding Box Overlap Checker
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

                                if (a.el.contains(b.el) || b.el.contains(a.el) || a.el.parentElement === b.el.parentElement) continue;

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

                        return {
                            pass: errors.length === 0,
                            errors
                        };
                    });

                    if (!layoutCheck.pass) {
                        console.warn(`[Layout Warning] Overlaps detected in ${baseFilename}_mode-${modeTag}.png:`, layoutCheck.errors);
                    }

                    const filename = `${baseFilename}_mode-${modeTag}.png`;
                    const outPath = resolve(splitOutputDir, filename);
                    await page.locator('#view').screenshot({ path: outPath, omitBackground: true });
                    
                    totalImages++;

                    const { _permutationParams, ...cleanedData } = problem.data;

                    return {
                        file_name: filename,
                        problem_id: problem.id,
                        generator: moduleName,
                        view: blueprint.viewId,
                        type: problem.type,
                        solution_visible: isSolutionView,
                        mode: modeName,
                        tags: problem.tags,
                        parameters: {
                            ...cleanedData,
                            ...blueprint.visualParams
                        },
                        layout_checks: layoutCheck
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

    // Dynamic import of spec.ts
    const specPath = resolve(modulePath, 'spec.ts');
    if (!existsSync(specPath)) {
        throw new Error(`spec.ts not found in generator ${moduleName}`);
    }
    const specModule = await import(`../generators/${moduleName}/spec.ts`);
    const generatorSpec = specModule.spec;

    // Dynamic import of generator class
    const camelCase = (str: string) => str.replace(/-([a-z])/g, g => g[1].toUpperCase());
    const className = camelCase(moduleName[0].toUpperCase() + moduleName.slice(1)) + 'Generator';
    const generatorModule = await import(`../generators/${moduleName}/generator.ts`);
    const GeneratorClass = generatorModule[className];
    if (!GeneratorClass) {
        throw new Error(`Could not find generator class ${className} in ${moduleName}`);
    }
    const generator = new GeneratorClass();

    const { setSeed } = await import(`../lib/random.ts`);

    const trainDataset: AbstractProblem[] = [];
    const valDataset: AbstractProblem[] = [];
    
    const trainKeys = new Set<string>();
    const valKeys = new Set<string>();

    const valRatio = 0.25; // Default 80/20 train/val split

    console.log(`Using decoupled ontology-driven matching for ${moduleName}...`);
    
    // Scan src/visuals/views directory to dynamically load specs for ALL views
    const viewsDir = resolve(PROJECT_ROOT, 'src', 'visuals', 'views');
    const allViewDirs = readdirSync(viewsDir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);
    
    const compatibleViews = [];
    for (const viewId of allViewDirs) {
        const viewSpecPath = resolve(viewsDir, viewId, 'spec.ts');
        if (existsSync(viewSpecPath)) {
            try {
                const viewSpecModule = await import(`../visuals/views/${viewId}/spec.ts`);
                compatibleViews.push(viewSpecModule.spec);
            } catch (e) {
                console.warn(`Could not import view spec for ${viewId}:`, e);
            }
        }
    }

    // Filter competency targets for this generator
    const matchedTargets = allTargets.filter(target =>
        doesGeneratorSupportCompetency(generatorSpec.supportedLabels || [], target.labels)
    );

    console.log(`Found ${matchedTargets.length} matched competency targets for generator [${moduleName}]`);

    for (const target of matchedTargets) {
        let countForThisTarget = 0;
        let attempts = 0;
        const countPerPermutation = 1;
        const maxAttempts = 50;

        while (countForThisTarget < countPerPermutation && attempts < maxAttempts) {
            attempts++;
            
            setSeed(42 + trainDataset.length);
            
            const problemStub = generator.generate({
                labels: target.labels,
                constraints: target.constraints
            });

            if (problemStub && !trainKeys.has(problemStub.id)) {
                // Match views that support this problem
                const matchedViews = compatibleViews.filter(viewSpec => {
                    const labelsMatch = doesViewSupportProblem(viewSpec.supportedLabels || [], target.labels);
                    if (!labelsMatch) return false;

                    // Check physical constraints
                    if (viewSpec.constraints) {
                        for (const [key, constraint] of Object.entries(viewSpec.constraints) as any) {
                            const val = problemStub.data[key];
                            if (val === undefined) continue;
                            if (constraint.type === 'range') {
                                if (val < constraint.min || val > constraint.max) return false;
                            } else if (constraint.type === 'options') {
                                if (!constraint.values.includes(val)) return false;
                            }
                        }
                    }
                    return true;
                });

                if (matchedViews.length === 0) {
                    continue;
                }

                trainKeys.add(problemStub.id);
                countForThisTarget++;

                const problem: AbstractProblem = {
                    ...problemStub,
                    id: `${moduleName}-train-${trainDataset.length + 1}-${problemStub.id}`,
                    type: generator.type,
                    tags: Array.from(new Set(target.labels))
                };
                problem.data._permutationParams = target.constraints;
                (problem as any).matchedBlueprints = matchedViews.map(v => ({
                    viewId: v.viewId,
                    visualParams: {},
                    instancesPerProblem: 1
                }));
                trainDataset.push(problem);

                // Generate validation sample
                if (!trainingOnly) {
                    const currentValCount = Math.floor(trainDataset.length * valRatio);
                    const prevValCount = Math.floor((trainDataset.length - 1) * valRatio);
                    
                    if (currentValCount > prevValCount) {
                        let valAttempts = 0;
                        let valSuccess = false;
                        while (!valSuccess && valAttempts < 50) {
                            valAttempts++;
                            setSeed(42 + 10000 + valDataset.length);
                            const valStub = generator.generate({
                                labels: target.labels,
                                constraints: target.constraints
                            });
                            if (valStub && !valKeys.has(valStub.id) && !trainKeys.has(valStub.id)) {
                                valKeys.add(valStub.id);
                                valSuccess = true;

                                const valProblem: AbstractProblem = {
                                    ...valStub,
                                    id: `${moduleName}-val-${valDataset.length + 1}-${valStub.id}`,
                                    type: generator.type,
                                    tags: Array.from(new Set(target.labels))
                                };
                                valProblem.data._permutationParams = target.constraints;
                                (valProblem as any).matchedBlueprints = matchedViews.map(v => ({
                                    viewId: v.viewId,
                                    visualParams: {},
                                    instancesPerProblem: 1
                                }));
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
    moduleImages += await renderDatasetSplit(browser, 'train', moduleName, trainDataset, generatorSpec.visualDistribution || [], 0, DEFAULT_CONCURRENCY);
    
    if (!trainingOnly && valDataset.length > 0) {
        moduleImages += await renderDatasetSplit(browser, 'validation', moduleName, valDataset, generatorSpec.visualDistribution || [], 1, DEFAULT_CONCURRENCY);
    }
    return moduleImages;
}

async function main() {
    const args = process.argv.slice(2);
    let targetModule: string | undefined = undefined;

    // Check for positional arguments
    const positionalArgs = args.filter(a => !a.startsWith('--'));
    if (positionalArgs.length > 0) {
        console.error('Error: Positional arguments are not allowed.');
        console.error('Usage: npm run generate:dataset -- --generator=X [--training-only]');
        process.exit(1);
    }

    const generatorArg = args.find(a => a.startsWith('--generator='));
    if (generatorArg) {
        targetModule = generatorArg.split('=')[1];
    }

    const trainingOnly = args.includes('--training-only');

    if (!targetModule) {
        if (existsSync(OUT_DIR)) {
            console.log('Cleaning whole dataset output directory...');
            rmSync(OUT_DIR, { recursive: true, force: true });
        }
        mkdirSync(OUT_DIR, { recursive: true });
    } else {
        // Clear specific module in both splits
        ['train', 'validation'].forEach(split => {
            const moduleDir = resolve(OUT_DIR, split, targetModule!);
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
