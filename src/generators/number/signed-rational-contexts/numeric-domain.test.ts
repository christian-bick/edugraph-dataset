import {describe, expect, it, vi} from 'vitest';
import {Area, Scope} from 'edugraph-ts';
import * as rng from '../../../lib/random.ts';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {extractConfig} from '../../../lib/utils.ts';
import {resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {createLabelDependencyEvaluator} from '../../../lib/label-dependencies.ts';
import {makeSignedRational} from '../signed-rational-helpers.ts';
import {isSignedRationalContext} from '../../../visuals/views/numbers/signed-meaning-helpers.ts';
import {SignedRationalContextsGenerator} from './generator.ts';
import {SignedRationalContextsGeneratorSchema as schema, spec} from './spec.ts';
import {directedContextCaseCount, directedContextFrameAt, signedContextRangeProfiles} from './numeric-domain.ts';

const contexts = ['temperature', 'elevation', 'balance', 'charge'] as const;

describe('compact weighted signed-context domains', () => {
    it('preserves every original non-singleton path with its exact conditional probability weight', () => {
        const expected = new Map<string, number>(), seen = new Map<string, number>();
        let retired = 0, retiredWeight = 0;
        for (const context of contexts) for (const denominator of context === 'balance' ? [1, 2, 4, 5] : [1, 2, 3, 4, 5, 6]) {
            for (let numerator = 1; numerator <= 10 * denominator; numerator++) for (const neighbor of [false, true]) for (const positiveFirst of [false, true]) {
                const weight = (context === 'balance' ? 180 : 120) / denominator;
                if (!neighbor && (numerator === 5 * denominator || numerator === 10 * denominator)) {
                    retired++; retiredWeight += weight; continue;
                }
                expected.set([context, denominator, numerator, neighbor, positiveFirst].join(':'), weight);
            }
        }
        expect(retired).toBe(88);
        expect(retiredWeight).toBe(4932);
        const generator = new SignedRationalContextsGenerator(), draw = vi.spyOn(rng, 'random');
        const rawCounts: number[] = [];
        try {
            for (const {range} of signedContextRangeProfiles) {
                const count = directedContextCaseCount(range), paths = new Set<string>();
                for (let index = 0; index < count; index++) {
                    const frame = directedContextFrameAt(range, index);
                    const key = [frame.context, frame.denominator, frame.numerator, frame.neighbor, frame.positiveFirst].join(':');
                    seen.set(key, (seen.get(key) ?? 0) + 1);
                    if (paths.has(key)) continue;
                    paths.add(key);
                    draw.mockClear().mockReturnValue((index + 0.5) / count);
                    const {data} = generator.generate({relation: 'directed-pair', range});
                    const positive = makeSignedRational(frame.numerator, frame.denominator);
                    const other = frame.neighbor ? makeSignedRational(positive.numerator
                        + (positive.numerator < 10 * positive.denominator ? 1 : -1), positive.denominator) : positive;
                    const values = frame.positiveFirst ? [positive, {...other, numerator: -other.numerator}]
                        : [{...other, numerator: -other.numerator}, positive];
                    expect(data.context.kind).toBe(frame.context);
                    expect(data.observations.map(observation => observation.value)).toEqual(values);
                    expect(isSignedRationalContext(data)).toBe(true);
                    expect(hasCanonicalRangeWitness(values.map(value => value.numerator / value.denominator), range)).toBe(true);
                    expect(draw).toHaveBeenCalledTimes(1);
                }
                rawCounts.push(paths.size);
            }
            expect(seen).toEqual(expected);
            expect(seen.size).toBe(2912);
            expect(rawCounts).toEqual([1412, 1500]);
            expect(signedContextRangeProfiles.map(({range}) => directedContextCaseCount(range))).toEqual([52668, 57600]);
        } finally { draw.mockRestore(); }
    }, 20000);

    it('qualifies all four original reference-zero choices without changing their one-draw sampler', () => {
        const generator = new SignedRationalContextsGenerator(), draw = vi.spyOn(rng, 'random');
        try {
            for (let index = 0; index < contexts.length; index++) {
                draw.mockClear().mockReturnValue((index + 0.5) / contexts.length);
                const {data} = generator.generate({relation: 'reference-zero', range: createCanonicalNumericRange(5)});
                expect(data.context.kind).toBe(contexts[index]);
                expect(data.observations.map(observation => observation.value)).toEqual([{numerator: 0, denominator: 1}]);
                expect(draw).toHaveBeenCalledTimes(1);
            }
        } finally { draw.mockRestore(); }
    });

    it('resolves only three feasible relation/range cells in both paths and rejects the nonexistent U10/no-floor case', () => {
        const relations = [
            [[Area.Zero, Scope.NumbersWithZero, Scope.NumbersWithoutNegatives], 'reference-zero'],
            [[Area.SignNotation, Scope.NumbersWithNegatives, Scope.NumbersWithoutZero], 'directed-pair']
        ] as const;
        const evaluator = createLabelDependencyEvaluator();
        let cells = 0;
        for (const [labels, relation] of relations) for (const profile of signedContextRangeProfiles) {
            if (relation === 'reference-zero' && profile.range.max !== 5) continue;
            const request = [...labels, ...profile.labels];
            expect(extractConfig(schema, request).config).toEqual({relation, range: profile.range});
            expect(resolveSchemaChoices(schema, request, {relation: labels, range: profile.labels}).config).toEqual({relation, range: profile.range});
            const result = evaluator.evaluate([...spec.generalLabels!, ...request, Scope.ArabicNumerals, Scope.Base10]);
            expect(result.errors).toEqual([]);
            expect(result.conflicts).toEqual([]);
            expect(result.assessments.filter(item => item.status === 'missing')).toEqual([]);
            cells++;
        }
        expect(cells).toBe(3);
        expect(directedContextCaseCount(createCanonicalNumericRange(10))).toBe(0);
    });

    it('rejects malformed ranges and invalid ticket indices before drawing', () => {
        const generator = new SignedRationalContextsGenerator(), draw = vi.spyOn(rng, 'random');
        const range = signedContextRangeProfiles[0]!.range;
        try {
            expect(() => generator.generate({relation: 'reference-zero'})).toThrow();
            expect(() => generator.generate({relation: 'reference-zero', range: signedContextRangeProfiles[1]!.range})).toThrow();
            expect(() => generator.generate({relation: 'directed-pair', range: createCanonicalNumericRange(10)})).toThrow();
            expect(() => generator.generate({relation: 'directed-pair', range: {min: 0, max: 5}} as never)).toThrow();
            for (const index of [-1, 0.5, directedContextCaseCount(range)]) expect(() => directedContextFrameAt(range, index)).toThrow();
            expect(draw).not.toHaveBeenCalled();
        } finally { draw.mockRestore(); }
    });
});
