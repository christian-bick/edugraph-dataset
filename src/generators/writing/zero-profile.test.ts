import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it, vi} from 'vitest';
import {getRandomState, setSeed} from '../../lib/random.ts';
import {extractConfig, findSchemaFallbackContractIssues} from '../../lib/utils.ts';
import {hasStaticResolution} from '../../lib/static-resolvers.ts';
import {normalizeSchemaChoices} from '../../lib/schema-choices.ts';
import {planModelCompatibility} from '../../lib/model-compatibility.ts';
import {WritingGenerator} from './generator.ts';
import {spec, WritingGeneratorSchema} from './spec.ts';
import {resolveWritingZero} from './zero-profile.ts';
import * as rng from '../../lib/random.ts';
import {nameIntegerInterval, nameRangeProfiles} from './range-profile.ts';

const positiveRange = [Scope.NumbersLarger100000, Scope.NumbersSmaller1000000];
const model = {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema: WritingGeneratorSchema, spec};
const view = {viewId: 'writing-test', generalLabels: [], schema: {}, spec: {viewId: 'writing-test', generalLabels: []}};

describe('writing scalar-zero choices', () => {
    it('rejects contradictory zero choices and ranges that cannot contain the requested scalar', () => {
        const rule = spec.compatibility![0]!;
        for (const [labels, expected] of [
            [[Scope.NumbersWithZero, Scope.NumbersWithoutZero], false],
            [[Scope.NumbersWithoutZero, Scope.Numberline], false],
            [[Scope.NumbersWithZero, Scope.NumbersSmaller20], true],
            [[Scope.NumbersWithZero, ...positiveRange], false],
            [[Scope.NumbersWithoutZero, Scope.NumbersLarger1000000, Scope.NumbersSmaller10000], false],
            [[Scope.NumbersWithoutZero, ...positiveRange], true]
        ] as const) {
            expect(rule.predicate({exact: (_scope, label) => (labels as readonly string[]).includes(label),
                has: (_scope, label) => (labels as readonly string[]).includes(label)})).toBe(expected);
        }
    });

    it('keeps the reviewed pure resolver and the legacy contextual boundaries', () => {
        expect(hasStaticResolution(resolveWritingZero)).toBe(true);
        expect(hasStaticResolution(Object.assign((labels: string[]) => resolveWritingZero(labels), resolveWritingZero))).toBe(false);
        expect(findSchemaFallbackContractIssues(WritingGeneratorSchema)).toEqual([]);
        expect(resolveWritingZero([])).toBe(false);
        expect(resolveWritingZero([Scope.NumbersWithZero])).toBe(true);
        expect(resolveWritingZero([Scope.NumbersWithoutZero])).toBe(false);
        expect(resolveWritingZero([Scope.NumbersWithZero, Scope.NumbersWithoutZero])).toBeUndefined();
        expect(resolveWritingZero([Scope.NumbersWithoutZero, Scope.Numberline])).toBeUndefined();
        expect(resolveWritingZero([Scope.NumbersSmaller1000000])).toBeUndefined();
        expect(resolveWritingZero([Scope.NumbersLarger1000])).toBe(false);
        expect(resolveWritingZero([Scope.NumbersLarger1000, Scope.NumbersWithZero])).toBeUndefined();
        const state = getRandomState();
        expect(resolveWritingZero([...positiveRange, Scope.NumbersWithoutZero])).toBe(false);
        expect(resolveWritingZero([...positiveRange, Scope.NumbersWithZero])).toBeUndefined();
        expect(getRandomState()).toBe(state);
    });

    it('admits only scalar zero absence throughout a reviewed positive Grade 4 band', () => {
        for (const notation of [Area.DigitNotation, Area.NumberNameNotation]) {
            const bounds = notation === Area.NumberNameNotation ? [Scope.NumbersLarger1000, Scope.NumbersSmaller10000] : positiveRange;
            const target = {id: 'positive-writing', labels: [notation, ...bounds]};
            const result = planModelCompatibility(target, model, view);
            expect(result.supported).toBe(true);
            if (!result.supported) throw new Error('Expected the positive writing target to remain supported.');
            expect(result.plan.domains.find(domain => domain.field === 'requireZero')!.alternatives
                .map(alternative => alternative.labels)).toEqual([[Scope.NumbersWithoutZero]]);
            expect(planModelCompatibility({...target, labels: [...target.labels, Scope.NumbersWithZero]}, model, view)
                .supported).toBe(false);
            expect(() => extractConfig(WritingGeneratorSchema, [...target.labels, Scope.NumbersWithZero])).toThrow();
            for (let seed = 0; seed < 64; seed++) {
                setSeed(seed);
                const resolved = extractConfig(WritingGeneratorSchema, target.labels, {spec, owner: 'generator'});
                expect(resolved.config.requireZero).toBe(false);
                expect(resolved.resolvedLabels).toContain(Scope.NumbersWithoutZero);
                expect(resolved.resolvedLabels).not.toContain(Scope.NumbersWithZero);
                expect(new WritingGenerator().generate(resolved.config)!.data.number).toBeGreaterThan(0);
            }
        }
    });

    it('retains zero digits in every nonthreshold scalar and preserves the scalar-zero teaching branch', () => {
        const generator = new WritingGenerator();
        const draw = vi.spyOn(rng, 'random');
        try {
            for (const number of [101, 1001, 1005, 1010, 1111]) {
                const profile = nameRangeProfiles.find(({range}) => {
                    const [first, last] = nameIntegerInterval(range, false);
                    return first <= number && last >= number;
                })!;
                const [first, last] = nameIntegerInterval(profile.range, false);
                draw.mockReturnValue((number - first + 0.5) / (last - first + 1));
                const data = generator.generate({notationFamily: Area.DigitNotation,
                    range: profile.range, requireZero: false})!.data;
                expect(data.number).toBe(number);
                expect('placeValues' in data).toBe(number > 1000);
            }
            for (const number of [10, 1000, 1_000_000])
                expect(() => generator.generate({notationFamily: Area.DigitNotation,
                    range: {min: number, max: number}, requireZero: false})).toThrow();
        } finally { draw.mockRestore(); }
        expect(generator.generate({notationFamily: Area.DigitNotation, range: {min: 0, max: 20}, requireZero: true})!.data)
            .toEqual({number: 0});
        for (const requireZero of ['coefficient-zero', 'coefficient-nonzero', 'other']) {
            expect(() => generator.generate({notationFamily: Area.DigitNotation, range: {min: 0, max: 20}, requireZero} as never))
                .toThrow('boolean scalar-zero selector');
        }
    });

    it('declares positive zero absence before generation for unspecified and tighter scalar bounds', () => {
        for (const labels of [[Scope.NumbersLarger1000], [Scope.NumbersSmaller1000, Scope.NumbersSmaller10000]]) {
            const choices = normalizeSchemaChoices(WritingGeneratorSchema, labels, 'generator');
            expect(choices.find(choice => choice.field === 'requireZero')!.alternatives.map(choice => choice.labels))
                .toEqual([[Scope.NumbersWithoutZero]]);
        }
    });
});
