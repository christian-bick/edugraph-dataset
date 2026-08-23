import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { findLeafModules } from './module-resolver.ts';
import {
    buildVqaValidationContext,
    computeImageSha256,
    type VqaLabelDefinition,
    type VqaValidationContext,
    type VqaCacheEntry,
    VqaCacheManager
} from './vqa-cache.ts';
import {
    VQA_RESPONSE_SCHEMA,
    applyVqaValidationPolicy,
    readVqaSystemInstruction
} from './vqa-policy.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..', '..');
const VIEWS_ROOT = resolve(PROJECT_ROOT, 'src', 'visuals', 'views');
const VQA_MODEL = 'gemini-3.5-flash';

export function resolveViewChecklistPaths(viewsRoot: string, viewId: string): string[] {
    const rootChecklist = resolve(viewsRoot, 'checklist.md');
    if (!existsSync(rootChecklist)) {
        throw new Error(`Missing global view checklist: ${rootChecklist}`);
    }

    const viewModule = findLeafModules(viewsRoot).find(module => module.id === viewId);
    if (!viewModule) {
        throw new Error(`Cannot resolve checklist for unknown view: ${viewId}`);
    }

    const leafChecklist = resolve(viewModule.absolutePath, 'checklist.md');
    if (!existsSync(leafChecklist)) {
        throw new Error(`Missing checklist for view "${viewId}": ${leafChecklist}`);
    }

    return [rootChecklist, leafChecklist];
}

export function getChecklistPaths(viewId: string): string[] {
    return resolveViewChecklistPaths(VIEWS_ROOT, viewId);
}

export function initVqaClient(apiKey?: string) {
    const key = apiKey !== undefined ? apiKey : process.env.GEMINI_API_KEY;
    if (!key) return null;

    return new GoogleGenAI({ apiKey: key });
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
    labels: readonly string[];
    apiKey?: string;
    cacheManager?: VqaCacheManager;
    logPrompt?: boolean;
    /** Prepared single-pass inputs; omitted by one-off callers. */
    imageBuffer?: Buffer;
    imageSha256?: string;
    checklistPaths?: string[];
    checklistContents?: {global: string; view: string};
    validationContext?: VqaValidationContext;
}

export interface EvaluateSampleVqaResult {
    entry: VqaCacheEntry;
    isLiveEvaluated: boolean;
}

function formatLabelDefinitions(labelDefinitions: readonly VqaLabelDefinition[]): string {
    return labelDefinitions
        .map(({ label, definition: labelDefinition }) => `- ${label}: ${labelDefinition}`)
        .join('\n');
}

export interface VqaPromptPartsInput {
    modeName: string;
    labelDefinitions: readonly VqaLabelDefinition[];
    globalChecklist: string;
    viewChecklist: string;
}

export interface VqaPromptParts {
    systemInstruction: string;
    userPrompt: string;
}

export function buildVqaPromptParts(input: VqaPromptPartsInput): VqaPromptParts {
    const {
        modeName,
        labelDefinitions,
        globalChecklist,
        viewChecklist
    } = input;
    const isSolution = modeName === 'solution';
    const userPrompt = `Mode: ${isSolution ? 'Solution Mode (`_mode-S`)' : 'Question Mode (`_mode-Q`)'}

## Ontology labels

${formatLabelDefinitions(labelDefinitions)}

## View-specific checklist

${viewChecklist.trim()}

${globalChecklist.trim()}`;

    return {systemInstruction: readVqaSystemInstruction(), userPrompt};
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
        labels,
        apiKey,
        cacheManager,
        logPrompt = false,
        imageBuffer: preparedImageBuffer,
        imageSha256: preparedImageSha256,
        checklistPaths: preparedChecklistPaths,
        checklistContents,
        validationContext: preparedValidationContext
    } = input;

    if (!preparedImageBuffer && !existsSync(imagePath)) return null;

    const imageBuffer = preparedImageBuffer ?? readFileSync(imagePath);
    const imageSha256 = preparedImageSha256 ?? computeImageSha256(imageBuffer);
    const checklistPaths = preparedChecklistPaths ?? getChecklistPaths(viewId);

    const [globalChecklistPath, viewChecklistPath] = checklistPaths;
    const globalChecklist = checklistContents?.global
        ?? readFileSync(globalChecklistPath, 'utf-8');
    const viewChecklist = checklistContents?.view
        ?? readFileSync(viewChecklistPath, 'utf-8');

    const validationContext = preparedValidationContext
        ?? buildVqaValidationContext(imageSha256, checklistPaths, labels);
    const valCacheKey = validationContext.validationCacheKey;

    // If cache manager is provided and already has this exact cache key, return cached entry
    if (cacheManager) {
        const cached = cacheManager.get(valCacheKey);
        if (cached) {
            return { entry: cached, isLiveEvaluated: false };
        }
    }

    const client = initVqaClient(apiKey);
    if (!client) {
        return null;
    }

    const promptParts = buildVqaPromptParts({
        modeName,
        labelDefinitions: validationContext.labelDefinitions,
        globalChecklist,
        viewChecklist
    });

    if (logPrompt) {
        console.log(`\n=== VQA PROMPT: ${sampleKey} ===\n\n` +
            `--- SYSTEM INSTRUCTION ---\n${promptParts.systemInstruction}\n\n` +
            `--- USER PROMPT ---\n${promptParts.userPrompt}\n\n` +
            `--- IMAGE ---\n${imagePath}\n` +
            `=== END VQA PROMPT ===\n`);
    }

    const imagePart = { inlineData: { data: imageBuffer.toString('base64'), mimeType: 'image/png' } };
    const response = await client.models.generateContent({
        model: VQA_MODEL,
        contents: [promptParts.userPrompt, imagePart],
        config: {
            systemInstruction: promptParts.systemInstruction,
            responseMimeType: 'application/json',
            responseJsonSchema: VQA_RESPONSE_SCHEMA
        }
    });
    const responseText = response.text;
    if (!responseText) {
        throw new Error('Invalid VQA response: Gemini returned no text');
    }
    const parsed = applyVqaValidationPolicy(
        JSON.parse(responseText),
        validationContext.labelDefinitions
    );

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
        checklist_hash: validationContext.checklistHash,
        label_context_hash: validationContext.labelContextHash,
        validation_context_hash: validationContext.validationContextHash,
        validation_policy_hash: validationContext.validationPolicyHash,
        validated_at: new Date().toISOString(),
        evaluation: parsed
    };

    if (cacheManager) {
        cacheManager.set(entry);
    }

    return { entry, isLiveEvaluated: true };
}
