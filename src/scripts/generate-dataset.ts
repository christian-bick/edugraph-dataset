import {Browser, chromium} from 'playwright';
import {dirname, resolve} from 'path';
import {fileURLToPath, pathToFileURL} from 'url';
import {appendFileSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync} from 'fs';
import {AbstractProblem} from '../types/ml-engine.ts';
import { isSubConceptOf, isCompatibleConcept } from '../lib/ontology.ts';
import { getViewToProblemTypeMap, getGeneratorProblemType } from '../lib/type-parser.ts';
import { findLeafModules, LeafModule } from '../lib/module-resolver.ts';
import { extractSchemaLabels, generateWithLabels, formatLabelsKey, shortenLabel } from '../lib/utils.ts';
import { Ability } from 'edugraph-ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..', '..');
let OUT_DIR = resolve(PROJECT_ROOT, 'out', 'dataset');
const BASE_URL = 'http://localhost:5173';
const DEFAULT_CONCURRENCY = 8;

function createSafeFilename(problemId: string, rendererId: string, params: any, instance: number): string {
    const safeId = problemId.replace(/[^a-zA-Z0-9-]/g, '-');
    const paramStrings = Object.keys(params || {})
        .sort()
        .map((k) => `${k}-${params[k]}`)
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
        .map(d => d.name)
        .sort();

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

class TargetInstanceRegistry {
    private registry = new Map<string, number>();

    public getNextInstance(
        moduleName: string,
        splitName: string,
        targetLabels: string[],
        targetConstraints: Record<string, any>
    ): number {
        const sortedLabels = formatLabelsKey(targetLabels);
        const sortedConstraintsKeys = Object.keys(targetConstraints || {}).sort();
        const sortedConstraints = sortedConstraintsKeys.map(k => `${k}:${targetConstraints[k]}`).join('|');
        const targetKey = `${moduleName}#${splitName}#${sortedLabels}#${sortedConstraints}`;

        const current = this.registry.get(targetKey) || 0;
        this.registry.set(targetKey, current + 1);
        return current;
    }
}

function computeTargetKey(
    moduleName: string,
    splitName: string,
    targetLabels: string[],
    targetConstraints: Record<string, any>,
    instance: number
): string {
    const sortedLabels = formatLabelsKey(targetLabels);
    const sortedConstraintsKeys = Object.keys(targetConstraints || {}).sort();
    const sortedConstraints = sortedConstraintsKeys.map(k => `${k}:${targetConstraints[k]}`).join('|');
    return `${moduleName}#${splitName}#${sortedLabels}#${sortedConstraints}#inst:${instance}`;
}

function computeTargetSeed(
    targetKey: string,
    attempt: number
): { seed: number; hashHex: string } {
    const rawKey = `${targetKey}#att:${attempt}`;

    let hash = 0x811c9dc5;
    for (let i = 0; i < rawKey.length; i++) {
        hash ^= rawKey.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }
    const positiveHash = Math.abs(hash);
    const seed = positiveHash % 2147483647;
    const hashHex = positiveHash.toString(16).padStart(8, '0');
    return { seed, hashHex };
}

async function renderDatasetSplit(
    browser: Browser,
    splitName: string,
    moduleName: string,
    problems: AbstractProblem[],
    concurrency: number,
    viewPathMap: Record<string, string> = {}
) {
    if (problems.length === 0) return 0;
    
    console.log(`\n--- Rendering [${moduleName}] Split: ${splitName} (${problems.length} abstract problems) ---`);
    const splitOutputDir = resolve(OUT_DIR, splitName, moduleName);
    if (!existsSync(splitOutputDir)) {
        mkdirSync(splitOutputDir, { recursive: true });
    }

    let totalImages = 0;
    const metadata: any[] = [];

    
    const taskQueue: { problem: AbstractProblem, blueprint: any, instance: number }[] = [];
    problems.forEach((problem) => {
        const problemBlueprints = (problem as any).matchedBlueprints;
        if (problemBlueprints) {
            problemBlueprints.forEach((blueprint: any) => {
                const mergedConstraints = { 
                    ...blueprint.constraints, 
                    ...(problem.data._permutationParams || {}) 
                };
                const specificBlueprint = { ...blueprint, constraints: mergedConstraints };
                for (let i = 0; i < blueprint.instancesPerProblem; i++) {
                    taskQueue.push({ problem, blueprint: specificBlueprint, instance: i });
                }
            });
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
                const viewPath = viewPathMap[blueprint.viewId] || blueprint.viewId;
                const url = `${BASE_URL}/visuals/views/${viewPath}/view.html`;

                if (currentViewUrl !== url) {
                    await page.goto(url, { waitUntil: 'networkidle' });
                    await page.waitForFunction(() => typeof (window as any).renderView === 'function');
                    currentViewUrl = url;
                }

                const baseFilename = createSafeFilename(problem.id, blueprint.viewId, blueprint.constraints, instance);

                const renderAndRecord = async (probObj: AbstractProblem, isSolutionView: boolean, modeTag: string, modeName: string) => {
                    const payload: any = {
                        problem: probObj,
                        viewId: blueprint.viewId,
                        labels: probObj.tags || [],
                        isSolutionView
                    };

                    await page.evaluate((p) => window.renderView!(p), payload);
                    await page.waitForTimeout(60);

                    const filename = `${baseFilename}_mode-${modeTag}.png`;
                    const outPath = resolve(splitOutputDir, filename);
                    await page.locator('#view').screenshot({ path: outPath, omitBackground: true });
                    
                    totalImages++;

                    const { _permutationParams, ...cleanedData } = probObj.data;

                    return {
                        file_name: filename,
                        problem_id: probObj.id,
                        generator: moduleName,
                        view: blueprint.viewId,
                        type: probObj.type,
                        solution_visible: isSolutionView,
                        mode: modeName,
                        target_key: (probObj as any).targetKey || '',
                        tags: (probObj.tags || []).map(shortenLabel).sort(),
                        parameters: {
                            ...cleanedData,
                            ...blueprint.constraints
                        }
                    };
                };

                const qMeta = await renderAndRecord(problem, false, 'Q', 'question');
                const solProblem = (problem as any).solutionProblem || problem;
                const aMeta = await renderAndRecord(solProblem, true, 'S', 'solution');
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
    
    metadata.sort((a, b) => a.file_name.localeCompare(b.file_name));
    const metaPath = resolve(splitOutputDir, '.metadata.jsonl');
    const jsonlContent = metadata.map(entry => JSON.stringify(entry)).join('\n') + '\n';
    writeFileSync(metaPath, jsonlContent);
    console.log(`[${moduleName}:${splitName}] Wrote modular metadata to .metadata.jsonl`);
    
    return totalImages;
}

async function runModulePipeline(
    browser: any,
    leafMod: LeafModule,
    trainingOnly: boolean,
    allTargets: any[],
    targetView?: string
) {
    const moduleName = leafMod.id;
    console.log(`\n--- Starting Pipeline for Module: ${moduleName} (${leafMod.relativePath}) ---`);
    
    // Dynamic import of spec.ts
    const specPath = resolve(leafMod.absolutePath, 'spec.ts');
    if (!existsSync(specPath)) {
        throw new Error(`spec.ts not found in generator ${moduleName} at ${leafMod.absolutePath}`);
    }
    const specModule = await import(pathToFileURL(specPath).href);
    const generatorSpec = specModule.spec;
    const camelCase = (str: string) => str.replace(/-([a-z])/g, g => g[1].toUpperCase());
    const className = camelCase(moduleName[0].toUpperCase() + moduleName.slice(1)) + 'Generator';
    
    // Dynamic import of generator class
    const generatorPath = resolve(leafMod.absolutePath, 'generator.ts');
    const generatorModule = await import(pathToFileURL(generatorPath).href);
    const GeneratorClass = generatorModule[className];
    if (!GeneratorClass) {
        throw new Error(`Could not find generator class ${className} in ${moduleName}`);
    }
    const generator = new GeneratorClass();
    
    // Combine base supported labels with dynamically extracted schema labels
    const generatorGeneralLabels = Array.from(new Set([
        ...(generatorSpec?.generalLabels || []),
        ...extractSchemaLabels(generator.schema)
    ]));

    const { setSeed } = await import(`../lib/random.ts`);

    const trainDataset: AbstractProblem[] = [];
    const valDataset: AbstractProblem[] = [];
    
    const trainKeys = new Set<string>();
    const valKeys = new Set<string>();

    const valRatio = 0.25; // Default 80/20 train/val split

    console.log(`Using decoupled ontology-driven matching for ${moduleName}...`);
    
    const viewToType = getViewToProblemTypeMap();
    const abilitiesList = new Set<string>(Object.values(Ability));
    const genTypeName = getGeneratorProblemType(moduleName);

    // Scan src/visuals/views directory to dynamically load specs for ALL views
    const viewsDir = resolve(PROJECT_ROOT, 'src', 'visuals', 'views');
    const allViewModules = findLeafModules(viewsDir);
    
    const compatibleViews = [];
    const viewGeneralLabelsMap: Record<string, string[]> = {};
    const viewPathMap: Record<string, string> = {};
    const viewCategoryMap: Record<string, string | null> = {};

    for (const vMod of allViewModules) {
        try {
            const viewSpecModule = await import(pathToFileURL(resolve(vMod.absolutePath, 'spec.ts')).href);
            compatibleViews.push(viewSpecModule.spec);
            viewPathMap[vMod.id] = vMod.relativePath;
            viewCategoryMap[vMod.id] = vMod.category;
            
            const viewCamelCase = vMod.id[0].toUpperCase() + vMod.id.slice(1);
            const viewSchema = viewSpecModule[`${viewCamelCase}ViewSchema`];
            const viewLabels = Array.from(new Set([
                ...(viewSpecModule.spec?.generalLabels || []),
                ...extractSchemaLabels(viewSchema)
            ]));
            viewGeneralLabelsMap[vMod.id] = viewLabels;
        } catch (e) {
            console.warn(`Could not import view spec for ${vMod.id}:`, e);
        }
    }

    const filteredViews = compatibleViews.filter(v => viewToType[v.viewId] === genTypeName && (!targetView || v.viewId === targetView || viewCategoryMap[v.viewId] === targetView));

    // Filter competency targets for this generator using union of labels
    const matchedTargets = allTargets.filter(target => {
        if (!generatorGeneralLabels) return false;
        return filteredViews.some(viewSpec => {
            const viewLabels = viewGeneralLabelsMap[viewSpec.viewId];
            if (!viewLabels) return false;
            return target.labels.every((compLabel: string) => {
                if (!compLabel.startsWith('http://edugraph.io/edu/')) return true;
                if (abilitiesList.has(compLabel)) {
                    return viewLabels.some((viewLabel: string) => isCompatibleConcept(compLabel, viewLabel));
                }
                const supportedByGen = generatorGeneralLabels.some((genLabel: string) => isSubConceptOf(compLabel, genLabel));
                const supportedByView = viewLabels.some((viewLabel: string) => isCompatibleConcept(compLabel, viewLabel));
                return supportedByGen || supportedByView;
            });
        });
    });

    console.log(`Found ${matchedTargets.length} matched competency targets for generator [${moduleName}]`);

    const targetRegistry = new TargetInstanceRegistry();

    for (const target of matchedTargets) {
        let countForThisTarget = 0;
        let attempts = 0;
        const countPerPermutation = 1;
        const maxAttempts = 50;

        while (countForThisTarget < countPerPermutation && attempts < maxAttempts) {
            attempts++;
            
            const qInstance = targetRegistry.getNextInstance(moduleName, 'train', target.labels, target.constraints || {});
            const qTargetKey = computeTargetKey(moduleName, 'train', target.labels, target.constraints || {}, qInstance);
            const { seed: qSeed, hashHex: qHashHex } = computeTargetSeed(qTargetKey, attempts);
            setSeed(qSeed);
            
            const problemStub = generateWithLabels(generator, target.labels);

            if (problemStub) {
                // Match views that support this problem
                const matchedViews = filteredViews.filter(viewSpec => {
                    const viewLabels = viewGeneralLabelsMap[viewSpec.viewId];
                    if (!viewLabels || !generatorGeneralLabels) return false;
                    const labelsMatch = target.labels.every((compLabel: string) => {
                        if (!compLabel.startsWith('http://edugraph.io/edu/')) return true;
                        if (abilitiesList.has(compLabel)) {
                            return viewLabels.some((viewLabel: string) => isCompatibleConcept(compLabel, viewLabel));
                        }
                        const supportedByGen = generatorGeneralLabels.some((genLabel: string) => isSubConceptOf(compLabel, genLabel));
                        const supportedByView = viewLabels.some((viewLabel: string) => isCompatibleConcept(compLabel, viewLabel));
                        return supportedByGen || supportedByView;
                    });
                    if (!labelsMatch) return false;

                    // Check physical constraints
                    if (viewSpec.constraints) {
                        for (const [key, constraint] of Object.entries(viewSpec.constraints) as any) {
                            const targetConstraints = target.constraints || {};
                            const val = problemStub.data[key] !== undefined ? problemStub.data[key] : targetConstraints[key];
                            if (val === undefined) {
                                const VISUAL_PARAMS = new Set(['outline', 'reverse', 'decimal', 'desc', 'asc']);
                                if (VISUAL_PARAMS.has(key)) {
                                    continue;
                                }
                                return false;
                            }
                            if (constraint.type === 'range') {
                                if (val < constraint.min || val > constraint.max) return false;
                            } else if (constraint.type === 'options') {
                                if (!constraint.values.includes(val)) return false;
                            }
                        }
                        return true;
                    }
                    return true;
                });

                const newMatchedViews = matchedViews.filter(v => !trainKeys.has(`${problemStub.id}-${v.viewId}`));

                if (newMatchedViews.length === 0) {
                    continue;
                }

                for (const v of newMatchedViews) {
                    trainKeys.add(`${problemStub.id}-${v.viewId}`);
                }
                countForThisTarget++;

                const sInstance = targetRegistry.getNextInstance(moduleName, 'train', target.labels, target.constraints || {});
                const sTargetKey = computeTargetKey(moduleName, 'train', target.labels, target.constraints || {}, sInstance);
                const { seed: sSeed, hashHex: sHashHex } = computeTargetSeed(sTargetKey, attempts);
                setSeed(sSeed);
                const solutionStub = generateWithLabels(generator, target.labels) || problemStub;

                const problem: AbstractProblem = {
                    ...problemStub,
                    id: `${moduleName}-train-${trainDataset.length + 1}-${problemStub.id}`,
                    type: generator.type,
                    tags: Array.from(new Set([...target.labels, ...(problemStub.tags || [])]))
                };
                (problem as any).targetKey = qTargetKey;
                (problem as any).targetKeyHash = qHashHex;

                const solutionProblem: AbstractProblem = {
                    ...solutionStub,
                    id: `${moduleName}-train-sol-${trainDataset.length + 1}-${solutionStub.id}`,
                    type: generator.type,
                    tags: Array.from(new Set([...target.labels, ...(solutionStub.tags || [])]))
                };
                (solutionProblem as any).targetKey = sTargetKey;
                (solutionProblem as any).targetKeyHash = sHashHex;

                (problem as any).matchedBlueprints = newMatchedViews.map(v => ({
                    viewId: v.viewId,
                    constraints: {},
                    instancesPerProblem: 1
                }));
                (problem as any).solutionProblem = solutionProblem;
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
                            const valQInstance = targetRegistry.getNextInstance(moduleName, 'val', target.labels, target.constraints || {});
                            const valQTargetKey = computeTargetKey(moduleName, 'val', target.labels, target.constraints || {}, valQInstance);
                            const { seed: valQSeed, hashHex: valQHashHex } = computeTargetSeed(valQTargetKey, valAttempts);
                            setSeed(valQSeed);
                            const valStub = generateWithLabels(generator, target.labels);

                            const valSInstance = targetRegistry.getNextInstance(moduleName, 'val', target.labels, target.constraints || {});
                            const valSTargetKey = computeTargetKey(moduleName, 'val', target.labels, target.constraints || {}, valSInstance);
                            const { seed: valSSeed, hashHex: valSHashHex } = computeTargetSeed(valSTargetKey, valAttempts);
                            setSeed(valSSeed);
                            const valSolutionStub = generateWithLabels(generator, target.labels) || valStub;

                            if (valStub) {
                                const valMatchedViews = newMatchedViews.filter(v => 
                                    !valKeys.has(`${valStub.id}-${v.viewId}`) && 
                                    !trainKeys.has(`${valStub.id}-${v.viewId}`)
                                );
                                if (valMatchedViews.length > 0) {
                                    for (const v of valMatchedViews) {
                                        valKeys.add(`${valStub.id}-${v.viewId}`);
                                    }
                                    valSuccess = true;

                                    const valProblem: AbstractProblem = {
                                        ...valStub,
                                        id: `${moduleName}-val-${valDataset.length + 1}-${valStub.id}`,
                                        type: generator.type,
                                        tags: Array.from(new Set([...target.labels, ...(valStub.tags || [])]))
                                    };
                                    (valProblem as any).targetKey = valQTargetKey;
                                    (valProblem as any).targetKeyHash = valQHashHex;

                                    const activeValSolStub = valSolutionStub || valStub;
                                    const valSolutionProblem: AbstractProblem = {
                                        ...activeValSolStub,
                                        id: `${moduleName}-val-sol-${valDataset.length + 1}-${activeValSolStub.id}`,
                                        type: generator.type,
                                        tags: Array.from(new Set([...target.labels, ...(activeValSolStub.tags || [])]))
                                    };
                                    (valSolutionProblem as any).targetKey = valSTargetKey;
                                    (valSolutionProblem as any).targetKeyHash = valSHashHex;

                                    (valProblem as any).matchedBlueprints = valMatchedViews.map(v => ({
                                        viewId: v.viewId,
                                        constraints: {},
                                        instancesPerProblem: 1
                                    }));
                                    (valProblem as any).solutionProblem = valSolutionProblem;
                                    valDataset.push(valProblem);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    console.log(`[${moduleName}] Generated problems. Train (${trainDataset.length}), Validation (${valDataset.length})`);

    let moduleImages = 0;
    moduleImages += await renderDatasetSplit(browser, 'train', moduleName, trainDataset, DEFAULT_CONCURRENCY, viewPathMap);
    
    if (!trainingOnly && valDataset.length > 0) {
        moduleImages += await renderDatasetSplit(browser, 'validation', moduleName, valDataset, DEFAULT_CONCURRENCY, viewPathMap);
    }
    return moduleImages;
}

async function main() {
    const args = process.argv.slice(2);

    const specName = process.env.npm_config_spec || (args.find(a => a.includes('spec='))?.split('spec=')[1]);
    if (!specName) {
        console.error('Error: The --spec parameter is required.');
        console.error('Usage: npm run generate:dataset -- --spec=<spec_module> [--generator=<generator_name>] [--view=<view_id>] [--training-only]');
        console.error('Example: npm run generate:dataset -- --spec=test');
        console.error('Example: npm run generate:dataset -- --spec=ccss');
        process.exit(1);
    }

    if (specName === 'test') {
        OUT_DIR = resolve(PROJECT_ROOT, 'out', 'dataset-test');
    }

    const specPath = resolve(PROJECT_ROOT, 'src', 'spec', specName);
    const specDir = existsSync(specPath) && lstatSync(specPath).isDirectory() ? specPath : null;
    const specFile = !specDir && existsSync(`${specPath}.ts`) ? `${specPath}.ts` : null;

    if (!specDir && !specFile) {
        console.error(`Error: Spec module not found at: ${specPath}`);
        process.exit(1);
    }

    const allTargets: any[] = [];
    if (specDir) {
        const files = readdirSync(specDir).filter(f => f.endsWith('.ts')).sort();
        for (const file of files) {
            const filePath = resolve(specDir, file);
            const module = await import(pathToFileURL(filePath).href);
            for (const [, value] of Object.entries(module)) {
                if (Array.isArray(value)) {
                    allTargets.push(...value);
                }
            }
        }
    } else if (specFile) {
        const module = await import(pathToFileURL(specFile).href);
        for (const [, value] of Object.entries(module)) {
            if (Array.isArray(value)) {
                allTargets.push(...value);
            }
        }
    }

    const targetModule = process.env.npm_config_generator || (args.find(a => a.includes('generator='))?.split('generator=')[1]);
    const targetView = process.env.npm_config_view || (args.find(a => a.includes('view='))?.split('view=')[1]);
    const trainingOnly = process.env.npm_config_training_only === 'true' || process.env.npm_config_training_only === '' || args.some(a => a.includes('training-only'));

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
    const allModules = findLeafModules(generatorsPath);
    const modulesToRun = targetModule
        ? allModules.filter(m => m.id === targetModule || m.relativePath === targetModule || m.category === targetModule)
        : allModules;

    for (const leafMod of modulesToRun) {
        try {
            totalImages += await runModulePipeline(browser, leafMod, trainingOnly, allTargets, targetView);
        } catch (e) {
            console.error(`Failed to run pipeline for ${leafMod.id}:`, e);
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
