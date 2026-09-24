import {describe, expect, it} from 'vitest';
import {planCompatibility, sampleGenerationPlan} from './compatibility.ts';
import {computeSampleSeed} from './generation.ts';
import {readSampleReplayRecord, selectSampleReplay} from './sample-replay.ts';

const key = (mode = 'question') => `target#generator#view#train#${mode}#inst:0`;
const result = planCompatibility({identity: {targetId: 'target', generatorId: 'generator', viewId: 'view'},
    targetLabels: [], generatorLabels: [], viewLabels: [], fields: []});
if (!result.supported) throw new Error('Invalid replay test fixture');
const plan = result.plan;
const record = (mode = 'question', origin = mode, attempt = 2) => ({
    sample_key: key(mode), generation_plan: plan, generation_plan_hash: plan.hash,
    generation_replay: {version: 1, sampleKey: key(origin), attempt, seed: computeSampleSeed(key(origin), attempt),
        selection: sampleGenerationPlan(plan, () => 0)},
    attempt, seed: computeSampleSeed(key(origin), attempt)
});

describe('recorded sample replay', () => {
    it('prefers operational metadata over an older cache recipe', () => {
        const selected = selectSampleReplay({sampleKey: key(), metadata: record(), cached: record('question', 'question', 5)});
        expect(selected.source).toBe('metadata');
        expect(selected.attempt).toBe(2);
        expect(selected.replay).toEqual(record().generation_replay);
    });

    it('falls back to a complete cache recipe when the metadata row is absent', () => {
        expect(selectSampleReplay({sampleKey: key(), cached: record()}).source).toBe('cache');
    });

    it('preserves a question draw reused by a solution artifact', () => {
        const replay = readSampleReplayRecord(key('solution'), JSON.parse(JSON.stringify(record('solution', 'question'))));
        expect(replay.replay.sampleKey).toBe(key('question'));
        expect(replay.replay.seed).toBe(computeSampleSeed(key('question'), 2));
        expect(replay.replay.seed).not.toBe(computeSampleSeed(key('solution'), 2));
    });

    it('allows an explicit fresh attempt to bypass obsolete recorded provenance', () => {
        expect(selectSampleReplay({sampleKey: key(), attempt: 3, metadata: {generation_plan: {version: 0}}}))
            .toEqual({attempt: 3, source: 'fresh'});
        for (const attempt of [0, -1, NaN, 1.5, Infinity]) expect(() => selectSampleReplay({sampleKey: key(), attempt})).toThrow(/positive integer/);
    });

    it('rejects absent and legacy records without fabricating an unconstrained draw', () => {
        expect(() => selectSampleReplay({sampleKey: key()})).toThrow(/No recorded sample recipe/);
        expect(() => selectSampleReplay({sampleKey: key(), metadata: {sample_key: key()}, cached: record()})).toThrow(/no generation plan\/receipt/);
    });

    it('rejects foreign origins, unsupported recipes, invalid seeds and changed plans', () => {
        expect(() => readSampleReplayRecord(key(), {...record(), sample_key: key('solution')})).toThrow(/different sample key/);
        expect(() => readSampleReplayRecord(key(), record('question', 'solution'))).toThrow(/different sample slot/);
        expect(() => readSampleReplayRecord(key(), {...record(), generation_plan_hash: 'wrong'})).toThrow(/hash mismatch/);
        expect(() => readSampleReplayRecord(key(), {...record(), seed: 7})).toThrow(/seed\/attempt/);
        expect(() => readSampleReplayRecord(key(), {...record(), attempt: 7})).toThrow(/seed\/attempt/);
        expect(() => readSampleReplayRecord(key(), {...record(), generation_replay: {...record().generation_replay, version: 0}})).toThrow(/invalid generation replay/);
        expect(() => readSampleReplayRecord(key(), {...record(), generation_replay: {...record().generation_replay, seed: 7}})).toThrow(/seed\/attempt/);
        expect(() => readSampleReplayRecord(key(), {...record(), generation_replay: {...record().generation_replay,
            selection: {...record().generation_replay.selection, planHash: 'wrong'}}})).toThrow(/different generation plan/);
        expect(() => readSampleReplayRecord(key(), {...record(), generation_replay: {...record().generation_replay,
            sampleKey: 'target#generator#view#val#question#inst:0'}})).toThrow(/different sample slot/);
    });
});
