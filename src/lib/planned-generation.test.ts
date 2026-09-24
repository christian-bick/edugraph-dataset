import {describe, expect, it, vi} from 'vitest';
import {planCompatibility, createGenerationSelectionReceipt, sampleGenerationPlan} from './compatibility.ts';
import {normalizeSchemaChoices} from './schema-choices.ts';
import {generatePlannedDraw, resolvePlannedConfigurations, selectionAdmittedByPlan} from './planned-generation.ts';
import {computeSampleSeed, generatePlannedSampleWithRetry} from './generation.ts';
import {getRandomState, random, setRandomState, setSeed} from './random.ts';
import {ontologyNeutral} from './resolvers.ts';
import type {GenerationPlan} from '../types/compatibility.ts';
import type {ProblemGenerator} from '../types/ml-engine.ts';

const generatorSchema = {kind: ['a', 'b']} as const;
const viewSchema = {layout: ['grid', 'row'], decoration: ontologyNeutral(() => Math.floor(random() * 100))} as const;
const sampleKey = 't#g#v#train#question#inst:0';
function plan(targetId = 't', restrict = true): GenerationPlan {
    const result = planCompatibility({identity: {targetId, generatorId: 'g', viewId: 'v'},
        targetLabels: [], generatorLabels: [], viewLabels: [],
        fields: [...normalizeSchemaChoices(generatorSchema, [], 'generator'), ...normalizeSchemaChoices(viewSchema, [], 'view')],
        viewRules: restrict ? [{id: 'matching-layout', dependencies: [{scope: 'generator', label: 'a'}, {scope: 'view', label: 'grid'}],
            predicate: labels => labels.exact('generator', 'a') === labels.exact('view', 'grid')}] : []});
    if (!result.supported) throw new Error(result.reason);
    return result.plan;
}
const generator: ProblemGenerator = {type: 'statistics', schema: generatorSchema,
    generate: config => ({data: {kind: config.kind, number: Math.floor(random() * 100)}})};

describe('planned generation handover', () => {
    it('keeps generator/view choices correlated across seeds and independently replays exact draws', () => {
        const accepted = plan();
        const kinds = new Set();
        for (let seed = 1; seed <= 64; seed++) {
            const input = {generator, viewSchema, plan: accepted, sampleKey, attempt: 1, seed};
            const draw = generatePlannedDraw(input);
            kinds.add(draw.stub!.data.kind);
            expect(draw.stub!.data.kind === 'a').toBe(draw.view.config.layout === 'grid');
            setSeed(9999);
            random();
            expect(generatePlannedDraw({...input, replay: JSON.parse(JSON.stringify(draw.replay))})).toEqual(draw);
        }
        expect([...kinds].sort()).toEqual(['a', 'b']);
    });

    it('prepares configuration without invoking a generator and preserves presentation continuation', () => {
        const resolved = resolvePlannedConfigurations({generatorSchema, viewSchema, plan: plan(), sampleKey, seed: 17, attempt: 1});
        setSeed(17);
        const decoration = Math.floor(random() * 100);
        const nextDraw = random();
        expect(resolved.view.config.decoration).toBe(decoration);
        setSeed(901);
        setRandomState(resolved.view.randomState);
        expect(random()).toBe(nextDraw);
    });

    it('rejects missing bindings, foreign sample slots, invalid origins and stale receipts before generation', () => {
        const generate = vi.fn(generator.generate);
        const input = {generator: {...generator, generate}, viewSchema, plan: plan(), sampleKey, attempt: 1, seed: 4};
        const draw = generatePlannedDraw(input);
        generate.mockClear();
        expect(() => generatePlannedDraw({...input, sampleKey: 'other#g#v#train#question#inst:0'})).toThrow('sample slot');
        expect(() => generatePlannedDraw({...input, attempt: 0})).toThrow('attempt and seed');
        expect(() => generatePlannedDraw({...input, replay: {...draw.replay, seed: 8}})).toThrow('origin');
        expect(() => generatePlannedDraw({...input, replay: {...draw.replay,
            selection: {...draw.replay.selection, planHash: 'stale'}}})).toThrow('different generation plan');
        expect(generate).not.toHaveBeenCalled();
    });

    it('uses mathematical retries without escaping the admitted plan', () => {
        let count = 0;
        const retrying = {...generator, generate: (config: {kind: string}) => {
            count++;
            return count <= 2 ? null : {data: {kind: config.kind}};
        }};
        const result = generatePlannedSampleWithRetry({generator: retrying, viewSchema, plan: plan(), sampleKey, maxAttempts: 5});
        expect(result.attempt).toBe(3);
        expect(result.replay.attempt).toBe(3);
        expect(result.seed).toBe(computeSampleSeed(sampleKey, 3));
        expect(result.stub!.data.kind === 'a').toBe(result.view.config.layout === 'grid');
        expect(() => generatePlannedSampleWithRetry({generator, viewSchema, plan: plan(), sampleKey, maxAttempts: 0})).toThrow('maxAttempts');
        const exhausted = generatePlannedSampleWithRetry({generator, viewSchema, plan: plan(), sampleKey,
            maxAttempts: 2, isDuplicate: () => true});
        expect(exhausted.stub).toBeNull();
        expect(exhausted.attempt).toBe(2);
        expect(exhausted.replay.attempt).toBe(2);
    });

    it('does not treat a generator assertion as an unsupported candidate or retry', () => {
        const generate = vi.fn(() => {throw new Error('generator assertion');});
        expect(() => generatePlannedSampleWithRetry({generator: {...generator, generate}, viewSchema,
            plan: plan(), sampleKey})).toThrow('generator assertion');
        expect(generate).toHaveBeenCalledOnce();
    });

    it('associates only an actually realized assignment accepted by the second plan', () => {
        const source = plan('t', false);
        const destination = plan('another-target');
        const valid = createGenerationSelectionReceipt(source, [
            {owner: 'generator', field: 'kind', alternativeId: '["a"]'},
            {owner: 'view', field: 'layout', alternativeId: '["grid"]'}
        ]);
        expect(selectionAdmittedByPlan(destination, source, valid)?.planHash).toBe(destination.hash);
        const incompatible = createGenerationSelectionReceipt(source, [
            {owner: 'generator', field: 'kind', alternativeId: '["a"]'},
            {owner: 'view', field: 'layout', alternativeId: '["row"]'}
        ]);
        expect(selectionAdmittedByPlan(destination, source, incompatible)).toBeNull();
        expect(() => createGenerationSelectionReceipt(destination, incompatible.choices)).toThrow('correlation');
        expect(() => createGenerationSelectionReceipt(destination, [])).toThrow('outside');
        expect(sampleGenerationPlan(destination, () => 0).planHash).toBe(destination.hash);
    });
});

describe('random state receipts', () => {
    it('restores long-running random streams after integer wraparound', () => {
        setSeed(7);
        for (let i = 0; i < 200; i++) random();
        const state = getRandomState();
        const expected = [random(), random()];
        setRandomState(state);
        expect([random(), random()]).toEqual(expected);
    });
    it.each([-1, 0x100000000, 0.5, NaN])('rejects invalid state %s', state => {
        expect(() => setRandomState(state)).toThrow('unsigned 32-bit');
    });
});
