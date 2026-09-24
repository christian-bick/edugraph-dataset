import type {GenerationPlan} from '../types/compatibility.ts';
import type {GenerationReplay} from '../types/generation-plan.ts';
import {CompatibilityContractError, validateGenerationPlan, validateGenerationSelectionReceipt} from './compatibility.ts';
import {computeSampleSeed, parseSampleKey} from './generation.ts';

export interface SampleReplayRecord {
    sample_key?: string;
    generation_plan?: unknown;
    generation_plan_hash?: unknown;
    generation_replay?: unknown;
    attempt?: unknown;
    seed?: unknown;
}

export interface RecordedSampleReplay {
    attempt: number;
    recordedPlan: GenerationPlan;
    replay: GenerationReplay;
}

/** Validates recorded provenance without generating or inspecting any payload. */
export function readSampleReplayRecord(sampleKey: string, record: SampleReplayRecord): RecordedSampleReplay {
    const identity = parseSampleKey(sampleKey);
    if (record.sample_key !== undefined && record.sample_key !== sampleKey) {
        throw new CompatibilityContractError('Replay record belongs to a different sample key.');
    }
    if (!record.generation_plan || !record.generation_replay) {
        throw new CompatibilityContractError('Recorded sample has no generation plan/receipt. Regenerate it, or use --attempt=<n> to request a fresh draw explicitly.');
    }
    const plan = validateGenerationPlan(record.generation_plan);
    if (plan.identity.targetId !== identity.targetId || plan.identity.generatorId !== identity.generatorId
        || plan.identity.viewId !== identity.viewId) throw new CompatibilityContractError('Recorded plan belongs to another sample.');
    if (record.generation_plan_hash !== undefined && record.generation_plan_hash !== plan.hash) {
        throw new CompatibilityContractError('Recorded sample generation plan hash mismatch.');
    }
    const candidate = record.generation_replay as Partial<GenerationReplay>;
    if (candidate.version !== 1 || typeof candidate.sampleKey !== 'string'
        || !Number.isSafeInteger(candidate.attempt) || (candidate.attempt ?? 0) < 1
        || !Number.isSafeInteger(candidate.seed) || (candidate.seed ?? -1) < 0) {
        throw new CompatibilityContractError('Recorded sample has an invalid generation replay.');
    }
    const origin = parseSampleKey(candidate.sampleKey);
    if (origin.targetId !== identity.targetId || origin.generatorId !== identity.generatorId
        || origin.viewId !== identity.viewId || origin.split !== identity.split || origin.instanceIdx !== identity.instanceIdx
        || (origin.mode !== identity.mode && !(identity.mode === 'solution' && origin.mode === 'question'))) {
        throw new CompatibilityContractError('Recorded draw origin belongs to a different sample slot.');
    }
    const attempt = candidate.attempt as number;
    const seed = candidate.seed as number;
    if (seed !== computeSampleSeed(candidate.sampleKey, attempt)
        || (record.seed !== undefined && record.seed !== seed)
        || (record.attempt !== undefined && record.attempt !== attempt)) {
        throw new CompatibilityContractError('Recorded sample seed/attempt disagrees with its actual draw origin.');
    }
    const selection = validateGenerationSelectionReceipt(plan, candidate.selection);
    return {attempt, recordedPlan: plan, replay: {version: 1, sampleKey: candidate.sampleKey, attempt, seed, selection}};
}

/** Metadata is authoritative; a missing row may fall back to a cache-held recipe. */
export function selectSampleReplay(input: {
    sampleKey: string;
    attempt?: number;
    metadata?: SampleReplayRecord;
    cached?: SampleReplayRecord;
}): {attempt: number; recordedPlan?: GenerationPlan; replay?: GenerationReplay; source: 'fresh' | 'metadata' | 'cache'} {
    if (input.attempt !== undefined) {
        if (!Number.isSafeInteger(input.attempt) || input.attempt < 1) {
            throw new CompatibilityContractError('--attempt must be a positive integer.');
        }
        return {attempt: input.attempt, source: 'fresh'};
    }
    if (input.metadata) return {...readSampleReplayRecord(input.sampleKey, input.metadata), source: 'metadata'};
    if (input.cached) return {...readSampleReplayRecord(input.sampleKey, input.cached), source: 'cache'};
    throw new CompatibilityContractError('No recorded sample recipe was found. Use --attempt=<n> to request a fresh draw explicitly.');
}
