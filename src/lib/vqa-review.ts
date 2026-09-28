import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import type {VqaCacheEntry} from './vqa-cache.ts';
import {applyVqaValidationPolicy, VQA_RESPONSE_SCHEMA} from './vqa-policy.ts';

export const VQA_MODEL = 'gemini-3.8-flash';
export const VQA_THINKING_LEVELS = ['LOW', 'HIGH'] as const;
export const VQA_HTTP_OPTIONS = {timeout: 240_000, retryOptions: {attempts: 3}} as const;

export interface VqaReviewStage {
    model: string;
    thinking_level: typeof VQA_THINKING_LEVELS[number];
    model_version?: string;
    response_id?: string;
    validated_at: string;
    elapsed_ms: number;
    usage?: {
        input_tokens?: number;
        answer_tokens?: number;
        thinking_tokens?: number;
        total_tokens?: number;
        cached_tokens?: number;
    };
    evaluation: VqaCacheEntry['evaluation'];
}

export interface VqaReview {
    version: 1;
    /** Binds resumable work to the image, exact prompt, schema and request settings. */
    request_hash: string;
    stages: VqaReviewStage[];
}

export function vqaReviewRequestHash(imageSha256: string, prompt: {systemInstruction: string; userPrompt: string}): string {
    return createHash('sha256').update(JSON.stringify({
        imageSha256, ...prompt, schema: VQA_RESPONSE_SCHEMA,
        model: VQA_MODEL, thinkingLevels: VQA_THINKING_LEVELS, httpOptions: VQA_HTTP_OPTIONS
    })).digest('hex');
}

/** Historical records are accepted; new records must retain a coherent two-stage decision. */
export function vqaReviewIssue(entry: VqaCacheEntry): string | undefined {
    const review = entry.review;
    if (review === undefined) return;
    if (!review || review.version !== 1 || !/^[a-f0-9]{64}$/.test(review.request_hash)
        || !Array.isArray(review.stages) || review.stages.length < 1 || review.stages.length > 2) {
        return 'Invalid VQA review structure.';
    }
    let labels: string[] | undefined;
    for (const [index, stage] of review.stages.entries()) {
        if (!stage || stage.thinking_level !== VQA_THINKING_LEVELS[index]
            || typeof stage.model !== 'string' || !stage.model
            || stage.model !== review.stages[0].model
            || typeof stage.validated_at !== 'string' || !Number.isFinite(Date.parse(stage.validated_at))
            || !Number.isFinite(stage.elapsed_ms) || stage.elapsed_ms < 0) {
            return 'Invalid VQA review stage metadata.';
        }
        try {
            const stageLabels = stage.evaluation.label_checks.map(check => check.label).sort();
            if (new Set(stageLabels).size !== stageLabels.length
                || (labels && !isDeepStrictEqual(labels, stageLabels))) return 'VQA review label sets disagree.';
            labels = stageLabels;
            const normalized = applyVqaValidationPolicy(stage.evaluation,
                stageLabels.map(label => ({label, iri: label, definition: ''})));
            if (!isDeepStrictEqual(normalized, stage.evaluation)) return 'VQA review verdict contradicts its checks.';
        } catch {
            return 'Invalid VQA review evaluation.';
        }
    }
    if (review.stages.length === 2 && review.stages[0].evaluation.pass) {
        return 'A passing LOW evaluation cannot trigger HIGH.';
    }
    const final = review.stages.at(-1)!;
    if (!isDeepStrictEqual(entry.evaluation, final.evaluation) || entry.validated_at !== final.validated_at) {
        return 'Effective VQA verdict disagrees with its final recorded stage.';
    }
}

export function isPendingVqaReview(entry: VqaCacheEntry): boolean {
    return entry.review?.stages?.length === 1 && entry.review.stages[0]?.evaluation?.pass === false;
}

export function shouldEvaluateVqa(
    entry: VqaCacheEntry | undefined,
    options: {force?: boolean; retryFailed?: boolean} = {}
): boolean {
    return !entry || !!options.force || !!vqaReviewIssue(entry) || isPendingVqaReview(entry)
        || (!!options.retryFailed && !entry.evaluation.pass);
}
