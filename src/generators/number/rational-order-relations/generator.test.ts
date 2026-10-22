import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {setSeed} from '../../../lib/random.ts';
import type {SignedRational, SignedRationalAxis} from '../../../types/problems.ts';
import {isSignedRationalLocation, makeSignedRationalAxis} from '../signed-rational-axis-helpers.ts';
import {buildRationalOrderRelationProblem, RationalOrderRelationsGenerator} from './generator.ts';

const r = (numerator: number, denominator = 1): SignedRational => ({numerator, denominator});
const ticks = [r(-2), r(-3, 2), r(-1), r(-1, 2), r(0), r(1, 2), r(1), r(3, 2), r(2)];
const axis: SignedRationalAxis = {minimum: r(-2), maximum: r(2), step: r(1, 2), ticks, zeroIndex: 4};

describe('pure exact rational order', () => {
    it('preserves nominal roles and exact signed comparison in independent literal cases', () => {
        const less = buildRationalOrderRelationProblem(axis, 1, 5);
        expect(less.first.value).toEqual(r(-3, 2));
        expect(less.second.value).toEqual(r(1, 2));
        expect(less.relation).toBe('less');
        expect(buildRationalOrderRelationProblem(axis, 5, 1).relation).toBe('greater');
        expect(buildRationalOrderRelationProblem(axis, 2, 0).relation).toBe('greater');
        expect(buildRationalOrderRelationProblem(axis, 4, 3).relation).toBe('greater');
        expect(buildRationalOrderRelationProblem(axis, 7, 8).relation).toBe('less');
    });

    it('accepts broad asymmetric, endpoint-zero and two-tick axes', () => {
        for (const frame of [makeSignedRationalAxis(r(1, 4), -3, 2), makeSignedRationalAxis(r(1), 0, 1),
            makeSignedRationalAxis(r(1), -1, 0)]) {
            const relation = buildRationalOrderRelationProblem(frame, 0, frame.ticks.length - 1);
            expect(relation.relation).toBe('less');
            expect(isSignedRationalLocation(relation.first, frame)).toBe(true);
            expect(isSignedRationalLocation(relation.second, frame)).toBe(true);
        }
    });

    it('rejects equality, malformed axes and invalid tick positions', () => {
        expect(() => buildRationalOrderRelationProblem(axis, 4, 4)).toThrow(GeneratorValidationError);
        const sparse = [...ticks]; delete sparse[1];
        for (const frame of [null, {}, {...axis, ticks: sparse}, {...axis, step: r(0)}]) {
            expect(() => buildRationalOrderRelationProblem(frame as SignedRationalAxis, 0, 1)).toThrow(GeneratorValidationError);
        }
        for (const index of [-1, 9, -0, NaN, 0.5]) {
            expect(() => buildRationalOrderRelationProblem(axis, index, 1)).toThrow(GeneratorValidationError);
            expect(() => buildRationalOrderRelationProblem(axis, 1, index)).toThrow(GeneratorValidationError);
        }
    });
});

describe('configured strict-order generation', () => {
    it.each(['less', 'greater'] as const)('constructs %s exactly across all sign patterns, fractions and endpoints', relation => {
        const generator = new RationalOrderRelationsGenerator();
        const seen = new Set<string>();
        const denominators = new Set<number>();
        for (let seed = 0; seed < 320; seed++) {
            setSeed(seed);
            const {data} = generator.generate({relation});
            expect(data.relation).toBe(relation);
            const {first, second, axis: frame} = data;
            const difference = BigInt(first.value.numerator) * BigInt(second.value.denominator)
                - BigInt(second.value.numerator) * BigInt(first.value.denominator);
            expect(difference < 0n ? 'less' : 'greater').toBe(relation);
            expect(frame.ticks.length).toBeGreaterThanOrEqual(5);
            expect(frame.ticks.length).toBeLessThanOrEqual(11);
            expect(frame.ticks.every(value => Math.abs(value.numerator) <= 5 * value.denominator)).toBe(true);
            denominators.add(frame.step.denominator);
            if (first.sign === 0 || second.sign === 0) seen.add('zero');
            else if (first.sign === second.sign) seen.add(first.sign === -1 ? 'two-negative' : 'two-positive');
            else seen.add('mixed');
            if ([first.tickIndex, second.tickIndex].includes(0)) seen.add('minimum');
            if ([first.tickIndex, second.tickIndex].includes(frame.ticks.length - 1)) seen.add('maximum');
            expect(Object.keys(data).sort()).toEqual(['axis', 'first', 'kind', 'relation', 'second']);
        }
        expect(seen).toEqual(new Set(['zero', 'two-negative', 'two-positive', 'mixed', 'minimum', 'maximum']));
        expect(denominators).toEqual(new Set([1, 2, 3, 4]));
    });

    it('replays seeded values and rejects missing or unsupported strict-order configuration', () => {
        const generator = new RationalOrderRelationsGenerator();
        setSeed(71); const first = generator.generate({relation: 'greater'});
        setSeed(71); expect(generator.generate({relation: 'greater'})).toEqual(first);
        for (const config of [null, {}, {relation: ''}, {relation: 'equal'}, {relation: 1}]) {
            expect(() => generator.generate(config as never)).toThrow(GeneratorValidationError);
        }
    });
});
