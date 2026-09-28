import {describe, expect, it} from 'vitest';
import type {VqaCacheEntry} from './vqa-cache.ts';
import {
    isPendingVqaReview, shouldEvaluateVqa, vqaReviewIssue, vqaReviewRequestHash,
    VQA_MODEL, type VqaReviewStage
} from './vqa-review.ts';

function stage(level: 'LOW' | 'HIGH', pass: boolean): VqaReviewStage {
    return {model: VQA_MODEL, thinking_level: level, validated_at: '2026-09-28T10:00:00Z', elapsed_ms: 500,
        evaluation: {pass, reasoning: pass ? '' : 'Rejected', label_checks: [{label: 'Addition',
            verdict: pass ? 'defendable' : 'not_defendable', evidence: 'Example'}],
        general_checks: {no_overlaps: true, no_placeholders: true, sane_padding: true,
            task_identifiable: true, mode_valid: true, text_minimal: true, math_coherent: true}}};
}

function entry(...stages: VqaReviewStage[]): VqaCacheEntry {
    const final = stages.at(-1)!;
    return {validated_at: final.validated_at, evaluation: structuredClone(final.evaluation),
        review: {version: 1, request_hash: 'a'.repeat(64), stages}} as VqaCacheEntry;
}

describe('VQA review decisions', () => {
    it('distinguishes an unfinished review from a completed rejection', () => {
        const pending = entry(stage('LOW', false));
        const failed = entry(stage('LOW', false), stage('HIGH', false));
        const passed = entry(stage('LOW', true));
        expect(vqaReviewIssue(pending)).toBeUndefined();
        expect(vqaReviewIssue(failed)).toBeUndefined();
        expect(vqaReviewIssue(passed)).toBeUndefined();
        expect(isPendingVqaReview(pending)).toBe(true);
        expect(isPendingVqaReview(failed)).toBe(false);
        expect(shouldEvaluateVqa(undefined)).toBe(true);
        expect(shouldEvaluateVqa(pending)).toBe(true);
        expect(shouldEvaluateVqa(failed)).toBe(false);
        expect(shouldEvaluateVqa(failed, {retryFailed: true})).toBe(true);
        expect(shouldEvaluateVqa(passed, {retryFailed: true})).toBe(false);
        expect(shouldEvaluateVqa(passed, {force: true})).toBe(true);
        const {review: _review, ...legacy} = failed;
        expect(vqaReviewIssue(legacy)).toBeUndefined();
        expect(shouldEvaluateVqa(legacy)).toBe(false);
        expect(shouldEvaluateVqa(legacy, {retryFailed: true})).toBe(true);
    });

    it.each([
        ['null review', (value: VqaCacheEntry) => {value.review = null as any;}],
        ['unknown version', (value: VqaCacheEntry) => {value.review!.version = 2 as any;}],
        ['missing request identity', (value: VqaCacheEntry) => {value.review!.request_hash = '';}],
        ['missing stages', (value: VqaCacheEntry) => {value.review!.stages = [];}],
        ['third evaluation', (value: VqaCacheEntry) => {value.review!.stages.push(stage('HIGH', true));}],
        ['HIGH first', (value: VqaCacheEntry) => {value.review!.stages[0].thinking_level = 'HIGH';}],
        ['missing stage', (value: VqaCacheEntry) => {value.review!.stages[0] = null as any;}],
        ['different model', (value: VqaCacheEntry) => {value.review!.stages[1].model = 'different';}],
        ['empty model', (value: VqaCacheEntry) => {value.review!.stages[0].model = '';}],
        ['invalid time', (value: VqaCacheEntry) => {value.review!.stages[0].validated_at = 'invalid';}],
        ['negative latency', (value: VqaCacheEntry) => {value.review!.stages[0].elapsed_ms = -1;}],
        ['different labels', (value: VqaCacheEntry) => {value.review!.stages[1].evaluation.label_checks[0].label = 'Subtraction';}],
        ['duplicate labels', (value: VqaCacheEntry) => {value.review!.stages[0].evaluation.label_checks.push(value.review!.stages[0].evaluation.label_checks[0]);}],
        ['missing checks', (value: VqaCacheEntry) => {delete value.review!.stages[0].evaluation.general_checks;}],
        ['contradictory policy', (value: VqaCacheEntry) => {value.review!.stages[0].evaluation.pass = true;}],
        ['unnecessary escalation', (value: VqaCacheEntry) => {value.review!.stages[0] = stage('LOW', true);}],
        ['different final verdict', (value: VqaCacheEntry) => {value.evaluation.pass = false;}],
        ['different final timestamp', (value: VqaCacheEntry) => {value.validated_at = '2026-01-01T00:00:00Z';}]
    ] as const)('rejects %s without accepting the effective verdict', (_name, mutate) => {
        const value = entry(stage('LOW', false), stage('HIGH', true));
        mutate(value);
        expect(vqaReviewIssue(value)).toBeTruthy();
        expect(shouldEvaluateVqa(value)).toBe(true);
    });

    it('binds resumable stages to exact image and prompt content', () => {
        const prompt = {systemInstruction: 'System', userPrompt: 'Task'};
        const hash = vqaReviewRequestHash('image-a', prompt);
        expect(hash).toMatch(/^[a-f0-9]{64}$/);
        expect(vqaReviewRequestHash('image-a', {...prompt})).toBe(hash);
        expect(vqaReviewRequestHash('image-b', prompt)).not.toBe(hash);
        expect(vqaReviewRequestHash('image-a', {...prompt, userPrompt: 'Changed'})).not.toBe(hash);
        expect(vqaReviewRequestHash('image-a', {...prompt, systemInstruction: 'Changed'})).not.toBe(hash);
    });
});
