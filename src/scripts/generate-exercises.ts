import puppeteer, {Browser, Page} from 'puppeteer';
import {dirname, resolve} from 'path';
import {fileURLToPath} from 'url';
import {existsSync, mkdirSync, writeFileSync, rmSync, readdirSync, appendFileSync} from 'fs';
import {createHash} from 'crypto';
import {getSortedUrlSearchParams} from "../lib/params.ts";
import {execSync} from "child_process"

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROJECT_ROOT = resolve(__dirname, '..', '..');
const OUT_DIR = resolve(PROJECT_ROOT, 'out', 'exercises');
const LOG_FILE = resolve(PROJECT_ROOT, 'out', 'logs', 'exercises.log');
const BASE_URL = 'http://localhost:5173';
const DEFAULT_CONCURRENCY = 10;
const PROTOCOL_TIMEOUT = 60000; // 60 seconds

interface Generator {
    generatePermutations: () => { params: any }[];
    generateName: (params: any) => string;
    generateLabels: (params: any) => any;
}

interface Config {
    questionImage: string;
    answerImage: string;
    params: any;
    labels: any;
    hash?: string;
}

function log(message: string) {
    const timestamp = new Date().toISOString();
    appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`);
}

function updateProgressBar(current: number, total: number, moduleName: string) {
    const percentage = Math.floor((current / total) * 100);
    const barLength = 30;
    const filledLength = Math.floor((percentage / 100) * barLength);
    const bar = '█'.repeat(filledLength) + '-'.repeat(barLength - filledLength);
    process.stdout.write(`\r[${moduleName}] [${bar}] ${percentage}% (${current}/${total})`);
    if (current === total) {
        process.stdout.write('\n');
    }
}

export async function loadConfigGenerator(moduleName: string): Promise<Generator> {
    const configGenerationPath = resolve(PROJECT_ROOT, 'src', 'exercises', moduleName, 'generator.ts');
    try {
        const {default: generator} = await import('file:///' + configGenerationPath.replace(/\\/g, '/'));
        return generator
    } catch (error) {
        const errorMsg = `Failed to load configuration for module: ${moduleName}`;
        log(errorMsg);
        log(String(error));
        console.error(errorMsg);
        process.exit(1);
    }
}

function getRelativeExerciseUrl(moduleName: string, params: any): string {
    const urlParams = new URLSearchParams(params);
    return `/exercises/${moduleName}/exercise.html?${getSortedUrlSearchParams(urlParams)}`;
}

function getExerciseUrl(moduleName: string, params: any): string {
    return `${BASE_URL}${getRelativeExerciseUrl(moduleName, params)}`;
}

export function generateConfigs(moduleName: string, generator: Generator): Config[] {
    const expandedConfigs: Config[] = [];
    const permutations = generator.generatePermutations();
    for (const perm of permutations) {
        const {params} = perm;
        const name = generator.generateName(params);
        const labels = generator.generateLabels(params);
        expandedConfigs.push({
            questionImage: `${moduleName}_${name}_question.png`,
            answerImage: `${moduleName}_${name}_answer.png`,
            params: params,
            labels: labels
        });
    }
    return expandedConfigs;
}

async function processConfiguration(
    config: Config,
    moduleName: string,
    moduleOutputDir: string,
    page: Page
) {
    const url = getExerciseUrl(moduleName, config.params);
    const hashSum = createHash('sha256');

    log(`Navigating to ${url}`);
    await page.goto(url, {waitUntil: 'networkidle0'});

    const fullHtml = await page.content();
    hashSum.update(fullHtml);
    config.hash = hashSum.digest('hex');

    const questionElement = await page.$('#exercise');
    const answerElement = await page.$('#answer');

    if (!questionElement || !answerElement) {
        throw new Error(`Exercise or Answer element not found for ${url}`);
    }

    // --- Generate Question PNG ---
    await questionElement.screenshot({
        path: resolve(moduleOutputDir, config.questionImage),
        type: 'png',
        omitBackground: true
    });
    log(`Question PNG generated for: ${config.questionImage}`);

    // --- Generate Answer PNG ---
    await answerElement.screenshot({
        path: resolve(moduleOutputDir, config.answerImage),
        type: 'png',
        omitBackground: true
    });
    log(`Answer PNG generated for: ${config.answerImage}`);
}

export async function generateExercises(moduleName: string, options: {
    concurrency?: number,
    isDryRun?: boolean
} = {}) {
    const concurrency = options.concurrency || DEFAULT_CONCURRENCY;
    const isDryRun = options.isDryRun || false;

    log(`Generating Exercises for module: ${moduleName} (concurrency: ${concurrency})`);

    const configGenerator = await loadConfigGenerator(moduleName);
    const configurations: Config[] = generateConfigs(moduleName, configGenerator);

    const moduleOutputDir = resolve(OUT_DIR, moduleName);
    const generatedFileNames = new Set<string>();

    if (!isDryRun) {
        if (existsSync(moduleOutputDir)) {
            log(`Cleaning output directory: ${moduleOutputDir}`);
            rmSync(moduleOutputDir, {recursive: true, force: true});
        }
        mkdirSync(moduleOutputDir, {recursive: true});
    }

    log('Launching browser...');
    const browser = await puppeteer.launch({
        headless: true,
        protocolTimeout: PROTOCOL_TIMEOUT
    });
    
    let completed = 0;
    const total = configurations.length;
    updateProgressBar(0, total, moduleName);

    const queue = [...configurations];
    const errors: { config: Config, error: any }[] = [];

    const processQueue = async () => {
        const page = await browser.newPage();
        try {
            while (true) {
                const config = queue.shift();
                if (!config) break;

                if (generatedFileNames.has(config.questionImage)) {
                    throw new Error(`Duplicate filename detected: ${config.questionImage}`);
                }
                generatedFileNames.add(config.questionImage);

                if (isDryRun) {
                    log(`Dry run: Would generate for ${getExerciseUrl(moduleName, config.params)} -> ${config.questionImage}`);
                } else {
                    try {
                        await processConfiguration(config, moduleName, moduleOutputDir, page);
                    } catch (err) {
                        log(`Error processing ${config.questionImage}: ${err}`);
                        errors.push({ config, error: err });
                    }
                }
                completed++;
                updateProgressBar(completed, total, moduleName);
            }
        } finally {
            await page.close();
        }
    };

    try {
        const workers = [];
        for (let i = 0; i < Math.min(concurrency, total); i++) {
            workers.push(processQueue());
        }
        await Promise.all(workers);
    } finally {
        await browser.close();
        log('Browser closed.');
    }

    if (errors.length > 0) {
        log(`${errors.length} errors occurred during generation.`);
        // We still proceed to generate meta.json for the successful ones, 
        // but we might want to filter out the ones that failed.
    }

    log('Generating meta file...');
    const versionHash = execSync('git rev-parse HEAD').toString().trim();
    const creationTimestamp = Math.floor(Date.now() / 1000);
    
    // Filter out configurations that had errors
    const errorImages = new Set(errors.map(e => e.config.questionImage));
    const successfulConfigs = configurations.filter(c => !errorImages.has(c.questionImage));

    const metaForJson = successfulConfigs.map(c => {
        const urlPath = getRelativeExerciseUrl(moduleName, c.params);
        return {
            contentHash: c.hash,
            questionImage: c.questionImage,
            answerImage: c.answerImage,
            source: urlPath,
            created: creationTimestamp,
            labels: c.labels,
            versionHash: versionHash,
        };
    });

    const metaPath = resolve(moduleOutputDir, `meta.json`);
    writeFileSync(metaPath, JSON.stringify(metaForJson, null, 2));
    log(`Meta file generated at: ${metaPath} (${successfulConfigs.length}/${configurations.length} successful)`);
}

function findExerciseModules(): string[] {
    const exercisesPath = resolve(PROJECT_ROOT, 'src', 'exercises');
    if (!existsSync(exercisesPath)) return [];
    const entries = readdirSync(exercisesPath, { withFileTypes: true });
    return entries
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
}

async function main() {
    const args = process.argv.slice(2);
    const moduleName = args.find(arg => !arg.startsWith('--'));
    const isDryRun = args.includes('--dry');
    const concurrencyArg = args.find(arg => arg.startsWith('--concurrency='));
    const concurrency = concurrencyArg ? parseInt(concurrencyArg.split('=')[1], 10) : DEFAULT_CONCURRENCY;

    const modulesToGenerate = moduleName ? [moduleName] : findExerciseModules();

    if (modulesToGenerate.length === 0) {
        console.log('No modules found to generate.');
        return;
    }

    log(`Found ${modulesToGenerate.length} exercise module(s) to generate: ${modulesToGenerate.join(', ')}`);
    console.log(`Generating exercises for ${modulesToGenerate.length} module(s)...`);

    for (const module of modulesToGenerate) {
        try {
            log(`--- Starting module: ${module} ---`);
            await generateExercises(module, {isDryRun, concurrency});
            log(`--- Successfully completed module: ${module} ---`);
        } catch (error) {
            log(`--- Error in module ${module}: ---`);
            log(String(error));
            console.error(`\nError generating Exercises for module ${module}. See logs for details.`);
        }
    }
    console.log('\nAll Exercise generation tasks completed.');
}

if (import.meta.env.VITEST === undefined) {
    main();
}
