import 'dotenv/config';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { findLeafModules } from './module-resolver.ts';
import {
    computeChecklistHash,
    computeImageSha256,
    computeValidationCacheKey,
    VqaCacheEntry,
    VqaCacheManager
} from './vqa-cache.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..', '..');
const GENERATORS_ROOT = resolve(PROJECT_ROOT, 'src', 'generators');
const VIEWS_ROOT = resolve(PROJECT_ROOT, 'src', 'visuals', 'views');

export function resolveTreeChecklists(rootDir: string, moduleId: string): string[] {
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

export function getChecklistPaths(moduleName: string, viewId: string): string[] {
    return [
        ...resolveTreeChecklists(GENERATORS_ROOT, moduleName),
        ...resolveTreeChecklists(VIEWS_ROOT, viewId)
    ];
}

export function initVqaModel(apiKey?: string) {
    const key = apiKey !== undefined ? apiKey : process.env.GEMINI_API_KEY;
    if (!key) return null;

    const genAI = new GoogleGenerativeAI(key);
    return genAI.getGenerativeModel({
        model: 'gemini-3.5-flash',
        generationConfig: {
            responseMimeType: 'application/json',
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
                        required: ['no_overlaps', 'no_placeholders', 'sane_padding']
                    },
                    coloring_pass: { type: SchemaType.BOOLEAN },
                    layout_pass: { type: SchemaType.BOOLEAN },
                    reasoning: { type: SchemaType.STRING }
                },
                required: ['pass', 'general_checks', 'reasoning']
            }
        }
    });
}

export interface EvaluateSampleVqaInput {
    imagePath: string;
    sampleKey: string;
    targetId: string;
    generatorId: string;
    viewId: string;
    modeName: string;
    instanceIdx: number;
    attempt: number;
    seed: number;
    fileName: string;
    apiKey?: string;
    cacheManager?: VqaCacheManager;
}

export interface EvaluateSampleVqaResult {
    entry: VqaCacheEntry;
    isLiveEvaluated: boolean;
}

export async function evaluateSampleVqa(input: EvaluateSampleVqaInput): Promise<EvaluateSampleVqaResult | null> {
    const {
        imagePath,
        sampleKey,
        targetId,
        generatorId,
        viewId,
        modeName,
        instanceIdx,
        attempt,
        seed,
        fileName,
        apiKey,
        cacheManager
    } = input;

    if (!existsSync(imagePath)) return null;

    const imageBuffer = readFileSync(imagePath);
    const imageSha256 = computeImageSha256(imageBuffer);
    const checklistPaths = getChecklistPaths(generatorId, viewId);

    let checklistText = '';
    for (const p of checklistPaths) {
        checklistText += readFileSync(p, 'utf-8') + '\n\n';
    }

    const checklistHash = computeChecklistHash(checklistPaths);
    const valCacheKey = computeValidationCacheKey(imageSha256, checklistHash);

    // If cache manager is provided and already has this exact cache key, return cached entry
    if (cacheManager) {
        const cached = cacheManager.get(valCacheKey);
        if (cached) {
            return { entry: cached, isLiveEvaluated: false };
        }
    }

    const model = initVqaModel(apiKey);
    if (!model) {
        return null;
    }

    const isSolution = modeName === 'solution';
    const prompt = `
You are a senior Visual QA Engineer. Evaluate this math exercise image:
Mode: "${isSolution ? 'Solution Mode (_mode-S)' : 'Question Mode (_mode-Q)'}"
Module: "${generatorId}"
View ID: "${viewId}"

CHECKLIST:
${checklistText}

IMPORTANT: If pass is true and all checks pass, set "reasoning" to "" (empty string). Only provide a non-empty reasoning string if pass is false or any check fails.

Respond only in the provided JSON schema.
`;

    const imagePart = { inlineData: { data: imageBuffer.toString('base64'), mimeType: 'image/png' } };
    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();
    const parsed = JSON.parse(responseText);

    if (parsed.pass && parsed.general_checks?.no_overlaps && parsed.general_checks?.no_placeholders && parsed.general_checks?.sane_padding) {
        parsed.reasoning = '';
    }

    const entry: VqaCacheEntry = {
        validation_cache_key: valCacheKey,
        sample_key: sampleKey,
        target_id: targetId,
        generator: generatorId,
        view: viewId,
        mode: modeName,
        instance: instanceIdx,
        attempt,
        seed,
        file_name: fileName,
        image_sha256: imageSha256,
        checklist_hash: checklistHash,
        validated_at: new Date().toISOString(),
        evaluation: parsed
    };

    if (cacheManager) {
        cacheManager.set(entry);
    }

    return { entry, isLiveEvaluated: true };
}
