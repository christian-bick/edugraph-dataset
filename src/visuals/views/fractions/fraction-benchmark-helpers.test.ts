import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import type {FractionBenchmarkArithmeticProblem} from '../../../types/problems.ts';
import {FractionBenchmarkArithmeticGenerator} from '../../../generators/fraction/fraction-benchmark-arithmetic/generator.ts';
import {formatBenchmarkFraction, formatQuarterTick, isValidFractionBenchmark} from './fraction-benchmark-helpers.ts';

const generator = new FractionBenchmarkArithmeticGenerator();
const sample = (operation: 'addition' | 'subtraction', approximationModel: 'bounds-only' | 'nearest-quarter') => {
    setSeed(`view-benchmark-${operation}-${approximationModel}`);
    return generator.generate({operation, approximationModel}).data;
};

describe('fraction benchmark view contract', () => {
    it.each(['addition', 'subtraction'] as const)('accepts both %s profiles across seeds', operation => {
        for (const approximationModel of ['bounds-only', 'nearest-quarter'] as const) {
            for (let seed = 0; seed < 30; seed++) {
                setSeed(`view-${operation}-${approximationModel}-${seed}`);
                expect(isValidFractionBenchmark(generator.generate({operation, approximationModel}).data)).toBe(true);
            }
        }
    });

    it('rejects inconsistent whole, operand bracket, bound, verdict, and approximation', () => {
        const base = sample('addition', 'nearest-quarter');
        expect(isValidFractionBenchmark({...base, sharedWhole: 2} as unknown as FractionBenchmarkArithmeticProblem)).toBe(false);
        expect(isValidFractionBenchmark({...base, first: {...base.first, lowerTick: 4}})).toBe(false);
        expect(isValidFractionBenchmark({...base, resultBounds: {...base.resultBounds, upper: {numerator: 2, denominator: 1}}})).toBe(false);
        expect(isValidFractionBenchmark({...base, candidate: {...base.candidate,
            judgment: base.candidate.judgment === 'reasonable' ? 'unreasonable' : 'reasonable'}})).toBe(false);
        expect(isValidFractionBenchmark({...base, approximation: {...base.approximation!, firstTick: 4}})).toBe(false);
        expect(isValidFractionBenchmark({...base, approximation: {...base.approximation!,
            estimatedResult: {numerator: 42, denominator: 1}}})).toBe(false);
    });

    it('formats exact rational and quarter labels', () => {
        expect(formatBenchmarkFraction({numerator: 3, denominator: 4})).toBe('3/4');
        expect(formatBenchmarkFraction({numerator: 2, denominator: 1})).toBe('2');
        expect([0, 1, 2, 3, 4].map(formatQuarterTick)).toEqual(['0', '1/4', '1/2', '3/4', '1']);
    });
});
