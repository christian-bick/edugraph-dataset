import 'dotenv/config';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
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
import type {GenerationPlan} from '../types/compatibility.ts';
import type {GenerationReplay} from '../types/generation-plan.ts';
import {readSampleReplayRecord} from './sample-replay.ts';
import {parseSampleKey} from './generation.ts';
import {
    isPendingVqaReview, shouldEvaluateVqa, vqaReviewIssue, vqaReviewRequestHash,
    VQA_HTTP_OPTIONS, VQA_MODEL, VQA_THINKING_LEVELS, type VqaReviewStage
} from './vqa-review.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..', '..');
const VIEWS_ROOT = resolve(PROJECT_ROOT, 'src', 'visuals', 'views');

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
    generationPlan: GenerationPlan;
    /** Optional stored identity; authoritative metadata must agree with its serialized plan. */
    generationPlanHash?: string;
    generationReplay: GenerationReplay;
    fileName: string;
    labels: readonly string[];
    apiKey?: string;
    cacheManager?: VqaCacheManager;
    /** Discard any prior decision and start a fresh LOW / HIGH sequence. */
    force?: boolean;
    /** Re-evaluate completed rejections, retaining passing records and resumable LOW work. */
    retryFailed?: boolean;
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

export type VqaSampleProvenanceInput = Pick<EvaluateSampleVqaInput,
    'sampleKey' | 'targetId' | 'generatorId' | 'viewId' | 'modeName' | 'instanceIdx'
    | 'attempt' | 'seed' | 'generationPlan' | 'generationPlanHash' | 'generationReplay' | 'fileName'>;

/** Validates the current artifact recipe without reading images, calling Gemini, or writing caches. */
export function buildVqaSampleProvenance(input: VqaSampleProvenanceInput) {
    const {sampleKey, targetId, generatorId, viewId, modeName, instanceIdx, attempt, seed, fileName} = input;
    const recipe = readSampleReplayRecord(sampleKey, {
        generation_plan: input.generationPlan, generation_plan_hash: input.generationPlanHash,
        generation_replay: input.generationReplay,
        attempt, seed
    });
    const identity = parseSampleKey(sampleKey);
    if (identity.targetId !== targetId || identity.generatorId !== generatorId || identity.viewId !== viewId
        || identity.mode !== modeName || identity.instanceIdx !== instanceIdx) {
        throw new Error('VQA sample metadata disagrees with its structural identity.');
    }
    return {
        sample_key: sampleKey, target_id: targetId, generator: generatorId, view: viewId,
        mode: modeName, instance: instanceIdx, attempt, seed, file_name: fileName,
        generation_plan: recipe.recordedPlan, generation_plan_hash: recipe.recordedPlan.hash, generation_replay: recipe.replay
    };
}

/** A content-addressed verdict remains valid while the artifact's replay provenance changes. */
export function refreshCachedVqaProvenance(cached: VqaCacheEntry, input: VqaSampleProvenanceInput): VqaCacheEntry {
    return {...cached, ...buildVqaSampleProvenance(input)};
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
        viewId,
        modeName,
        labels,
        apiKey,
        cacheManager,
        force = false,
        retryFailed = false,
        logPrompt = false,
        imageBuffer: preparedImageBuffer,
        imageSha256: preparedImageSha256,
        checklistPaths: preparedChecklistPaths,
        checklistContents,
        validationContext: preparedValidationContext
    } = input;

    if (!preparedImageBuffer && !existsSync(imagePath)) return null;
    const provenance = buildVqaSampleProvenance(input);

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

    const cached = cacheManager?.get(valCacheKey);
    if (cached && !shouldEvaluateVqa(cached, {force, retryFailed})) {
        const entry = {...cached, ...provenance};
        cacheManager!.set(entry);
        return {entry, isLiveEvaluated: false};
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

    const requestHash = vqaReviewRequestHash(imageSha256, promptParts);
    const stages: VqaReviewStage[] = !force && cached && !vqaReviewIssue(cached)
        && isPendingVqaReview(cached) && cached.review!.request_hash === requestHash
        ? [...cached.review!.stages] : [];
    let entry: VqaCacheEntry | undefined;
    for (let index = stages.length; index < VQA_THINKING_LEVELS.length; index++) {
        const level = VQA_THINKING_LEVELS[index];
        const started = performance.now();
        // Each stage is a new independent request. Never include the LOW verdict in HIGH's input.
        const response = await client.models.generateContent({
            model: VQA_MODEL,
            contents: [promptParts.userPrompt, {inlineData: {data: imageBuffer.toString('base64'), mimeType: 'image/png'}}],
            config: {
                systemInstruction: promptParts.systemInstruction,
                responseMimeType: 'application/json',
                responseJsonSchema: VQA_RESPONSE_SCHEMA,
                thinkingConfig: {thinkingLevel: ThinkingLevel[level]},
                httpOptions: VQA_HTTP_OPTIONS
            }
        });
        if (!response.text) throw new Error('Invalid VQA response: Gemini returned no text');
        const evaluation = applyVqaValidationPolicy(JSON.parse(response.text), validationContext.labelDefinitions);
        const usage = response.usageMetadata;
        const stage: VqaReviewStage = {
            model: VQA_MODEL, thinking_level: level,
            model_version: response.modelVersion, response_id: response.responseId,
            validated_at: new Date().toISOString(), elapsed_ms: Math.round(performance.now() - started),
            usage: usage ? {
                input_tokens: usage.promptTokenCount, answer_tokens: usage.candidatesTokenCount,
                thinking_tokens: usage.thoughtsTokenCount, total_tokens: usage.totalTokenCount,
                cached_tokens: usage.cachedContentTokenCount
            } : undefined,
            evaluation
        };
        stages.push(stage);
        entry = {
            ...provenance,
            validation_cache_key: valCacheKey,
            image_sha256: imageSha256,
            checklist_hash: validationContext.checklistHash,
            label_context_hash: validationContext.labelContextHash,
            validation_context_hash: validationContext.validationContextHash,
            validation_policy_hash: validationContext.validationPolicyHash,
            validated_at: stage.validated_at,
            evaluation,
            review: {version: 1, request_hash: requestHash, stages: [...stages]}
        };
        // Checkpoint a rejected LOW before spending on HIGH; errors leave it resumable.
        cacheManager?.set(entry);
        if (evaluation.pass) break;
    }
    return {entry: entry!, isLiveEvaluated: true};
}
