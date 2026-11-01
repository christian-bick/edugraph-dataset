import {afterEach, describe, expect, it, vi} from 'vitest';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import * as rng from '../../../lib/random.ts';
import {FractionDivisionRelationsGenerator} from './generator.ts';
import {commonDivisionMaximum, divisionRangeRows, hasSharedDivisionRange, sampleDivisionRangeOperands} from './numeric-domain.ts';
import {divisionOperandDistribution, divisionOperandProfiles} from './operand-profiles.ts';

afterEach(() => vi.restoreAllMocks());
const bounds = [5, 10, 20, 100];
const expectedCounts = {
    'fraction-by-fraction-improper:zero': [11, 118, 444, 564],
    'fraction-by-fraction-improper:positive': [513, 566, 495, 229],
    'fraction-by-integer-proper:zero': [23, 14, 18, 5],
    'fraction-by-integer-improper:zero': [2, 23, 47, 18],
    'fraction-by-integer-improper:positive': [53, 32, 21, 0],
    'integer-by-fraction-proper:positive': [22, 15, 6, 1],
    'integer-by-fraction-improper:zero': [56, 29, 42, 12],
    'integer-by-fraction-improper:positive': [50, 29, 24, 3]
};

describe('shared common-part division finite ranges', () => {
    it('partitions all3485 settled original rows with their original nonuniform conditional weights', () => {
        let total = 0;
        for (const profile of Object.keys(divisionOperandProfiles) as (keyof typeof divisionOperandProfiles)[])
            for (const group of ['zero', 'positive'] as const) {
                if (!hasSharedDivisionRange(profile, group)) continue;
                const original = divisionOperandDistribution(profile, group);
                if (!original.length) continue;
                const seen = new Set<string>();
                let mass = 0;
                for (const [index, upper] of bounds.entries()) {
                    const rows = divisionRangeRows(profile, group, createCanonicalNumericRange(upper));
                    expect(rows).toHaveLength(expectedCounts[`${profile}:${group}` as keyof typeof expectedCounts][index]!);
                    const keptMass = rows.reduce((sum, row) => sum + row.weight, 0);
                    const originalMass = original.reduce((sum, row) => sum + row.weight, 0);
                    for (const row of rows) {
                        const key = JSON.stringify([row.dividend, row.divisor]);
                        expect(seen.has(key)).toBe(false); seen.add(key);
                        expect(original).toContain(row);
                        expect((row.weight / originalMass) / (keptMass / originalMass)).toBeCloseTo(row.weight / keptMass, 14);
                        mass += row.weight; total++;
                    }
                }
                expect(seen).toEqual(new Set(original.map(row => JSON.stringify([row.dividend, row.divisor]))));
                expect(mass).toBeCloseTo(original.reduce((sum, row) => sum + row.weight, 0), 12);
            }
        expect(total).toBe(3485);
    });

    it('verifies every original safe pair through production and the optional reciprocal boundary', () => {
        const generator = new FractionDivisionRelationsGenerator(), draw = vi.spyOn(rng, 'random');
        let count = 0;
        for (const profile of Object.keys(divisionOperandProfiles) as (keyof typeof divisionOperandProfiles)[])
            for (const group of ['zero', 'positive'] as const) {
                if (!hasSharedDivisionRange(profile, group)) continue;
                for (const upper of bounds) {
                    const range = createCanonicalNumericRange(upper), rows = divisionRangeRows(profile, group, range);
                    const mass = rows.reduce((sum, row) => sum + row.weight, 0);
                    let prior = 0;
                    for (const row of rows) {
                        const inputs = [(prior + row.weight / 2) / mass, 0.25];
                        draw.mockReset().mockImplementation(() => inputs.shift()!);
                        const data = generator.generate({operandProfile: profile, groupCountProfile: group,
                            withEquation: false, withMultiplication: false, range}).data;
                        expect([data.dividend, data.divisor]).toEqual([row.dividend, row.divisor]);
                        const model = data.model;
                        const values = [data.dividend.numerator / data.dividend.denominator,
                            data.divisor.numerator / data.divisor.denominator, data.quotient.numerator / data.quotient.denominator,
                            model.completeGroups, Math.floor(model.coverageTicks / model.ticksPerWhole),
                            ...(model.remainderTicks > 0 ? [model.remainderTicks, model.divisorTicks] : [])];
                        expect(Math.max(...values)).toBe(commonDivisionMaximum(row.dividend, row.divisor));
                        expect(hasCanonicalRangeWitness(values, range)).toBe(true);
                        // Execution and inverse leaves also use the reciprocal.
                        // It cannot change the band in any adopted source role.
                        expect(hasCanonicalRangeWitness([...values, data.reciprocal.numerator / data.reciprocal.denominator], range)).toBe(true);
                        expect(inputs).toEqual([]); prior += row.weight; count++;
                    }
                }
            }
        expect(count).toBe(3485);
    });

    it('retains reciprocal-sensitive roles for review and rejects invalid or empty domains before a draw', () => {
        const draw = vi.spyOn(rng, 'random');
        expect(divisionRangeRows('fraction-by-fraction-proper', 'positive', createCanonicalNumericRange(5))).toEqual([]);
        expect(divisionRangeRows('integer-by-fraction-proper', 'zero', createCanonicalNumericRange(5))).toEqual([]);
        for (const range of [undefined, createCanonicalNumericRange(1000), createCanonicalNumericRange(10, 5),
            {...createCanonicalNumericRange(5), maximumAbove: 0}, {...createCanonicalNumericRange(5), minimumBelow: 10}])
            expect(() => sampleDivisionRangeOperands('fraction-by-fraction-improper', 'positive', range as never, rng.random)).toThrow();
        expect(() => sampleDivisionRangeOperands('fraction-by-integer-improper', 'positive', createCanonicalNumericRange(100), rng.random)).toThrow(/No source/);
        const generator = new FractionDivisionRelationsGenerator();
        for (const withEquation of [null, 'false']) expect(() => generator.generate({operandProfile: 'fraction-by-integer-improper',
            groupCountProfile: 'positive', range: createCanonicalNumericRange(5), withEquation: withEquation as never, withMultiplication: false})).toThrow(/withEquation|booleans/);
        expect(draw).not.toHaveBeenCalled();
    });
});
