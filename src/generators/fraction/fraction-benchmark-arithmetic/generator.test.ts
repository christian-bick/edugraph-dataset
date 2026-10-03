import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import type {
    FractionBenchmarkArithmeticProblem,
    FractionBenchmarkOperand,
    FractionBenchmarkRational
} from '../../../types/problems.ts';
import {FractionBenchmarkArithmeticGenerator} from './generator.ts';

const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
const compare = (a: FractionBenchmarkRational, b: FractionBenchmarkRational): number =>
    Math.sign(a.numerator * b.denominator - b.numerator * a.denominator);
const sameValue = (a: FractionBenchmarkRational, b: FractionBenchmarkRational): boolean => compare(a, b) === 0;

function assertRational(value: FractionBenchmarkRational): void {
    expect(Number.isSafeInteger(value.numerator)).toBe(true);
    expect(Number.isSafeInteger(value.denominator)).toBe(true);
    expect(value.numerator).toBeGreaterThanOrEqual(0);
    expect(value.denominator).toBeGreaterThan(0);
    expect(gcd(value.numerator, value.denominator)).toBe(1);
}

function assertOperand(item: FractionBenchmarkOperand): void {
    assertRational(item.value);
    expect(item.value.numerator).toBeGreaterThan(0);
    expect(item.value.numerator).toBeLessThan(item.value.denominator);
    expect(item.lowerTick).toBe(Math.floor(4 * item.value.numerator / item.value.denominator));
    expect(item.upperTick).toBe(Math.ceil(4 * item.value.numerator / item.value.denominator));
    expect(item.upperTick - item.lowerTick).toBeLessThanOrEqual(1);
    expect(4 * item.value.numerator).toBeGreaterThanOrEqual(item.lowerTick * item.value.denominator);
    expect(4 * item.value.numerator).toBeLessThanOrEqual(item.upperTick * item.value.denominator);
    const halfDifference = 2 * item.value.numerator - item.value.denominator;
    expect(item.relationToHalf).toBe(halfDifference < 0 ? 'less' : halfDifference > 0 ? 'greater' : 'equal');
}

const expectedNearestTick = (item: FractionBenchmarkOperand): number => {
    const lowerDistance = 4 * item.value.numerator - item.lowerTick * item.value.denominator;
    const upperDistance = item.upperTick * item.value.denominator - 4 * item.value.numerator;
    return upperDistance <= lowerDistance ? item.upperTick : item.lowerTick;
};

function assertProblem(data: FractionBenchmarkArithmeticProblem, operation: 'addition' | 'subtraction',
    approximationModel: 'bounds-only' | 'nearest-quarter'): void {
    expect(data.kind).toBe('fraction-benchmark-arithmetic');
    expect(data.operation).toBe(operation);
    expect(data.sharedWhole).toBe(1);
    assertOperand(data.first);
    assertOperand(data.second);
    expect(data.first.lowerTick !== data.first.upperTick
        || data.second.lowerTick !== data.second.upperTick).toBe(true);

    const sign = operation === 'addition' ? 1 : -1;
    const exactNumerator = data.first.value.numerator * data.second.value.denominator
        + sign * data.second.value.numerator * data.first.value.denominator;
    const exactDenominator = data.first.value.denominator * data.second.value.denominator;
    assertRational(data.exactResult);
    expect(data.exactResult.numerator * exactDenominator).toBe(exactNumerator * data.exactResult.denominator);

    const expectedLowerTick = operation === 'addition'
        ? data.first.lowerTick + data.second.lowerTick
        : data.first.lowerTick - data.second.upperTick;
    const expectedUpperTick = operation === 'addition'
        ? data.first.upperTick + data.second.upperTick
        : data.first.upperTick - data.second.lowerTick;
    expect(expectedLowerTick).toBeGreaterThanOrEqual(0);
    expect(expectedUpperTick).toBeGreaterThan(expectedLowerTick);
    const {lower, upper} = data.resultBounds;
    assertRational(lower);
    assertRational(upper);
    expect(lower.numerator * 4).toBe(expectedLowerTick * lower.denominator);
    expect(upper.numerator * 4).toBe(expectedUpperTick * upper.denominator);
    expect(compare(lower, data.exactResult)).toBeLessThanOrEqual(0);
    expect(compare(data.exactResult, upper)).toBeLessThanOrEqual(0);

    assertRational(data.candidate.value);
    expect(compare(data.candidate.value, {numerator: 2, denominator: 1})).toBeLessThanOrEqual(0);
    if (data.candidate.judgment === 'reasonable') {
        expect(sameValue(data.candidate.value, data.exactResult)).toBe(true);
    } else {
        expect(data.candidate.judgment).toBe('unreasonable');
        expect(compare(data.candidate.value, lower) < 0
            || compare(data.candidate.value, upper) > 0).toBe(true);
    }

    if (approximationModel === 'bounds-only') {
        expect(data.approximation).toBeUndefined();
    } else {
        const approximation = data.approximation!;
        expect(approximation.kind).toBe('nearest-quarter');
        expect(approximation.firstTick).toBe(expectedNearestTick(data.first));
        expect(approximation.secondTick).toBe(expectedNearestTick(data.second));
        const estimatedNumerator = approximation.firstTick + sign * approximation.secondTick;
        assertRational(approximation.estimatedResult);
        expect(approximation.estimatedResult.numerator * 4)
            .toBe(estimatedNumerator * approximation.estimatedResult.denominator);
        expect(approximation.firstTick * data.first.value.denominator !== 4 * data.first.value.numerator
            || approximation.secondTick * data.second.value.denominator !== 4 * data.second.value.numerator)
            .toBe(true);
    }
}

describe('FractionBenchmarkArithmeticGenerator', () => {
    const generator = new FractionBenchmarkArithmeticGenerator();

    it.each([
        ['addition', 'bounds-only'], ['addition', 'nearest-quarter'],
        ['subtraction', 'bounds-only'], ['subtraction', 'nearest-quarter']
    ] as const)('generates exact %s / %s benchmark math across seeds', (operation, approximationModel) => {
        const candidates = new Set<string>();
        const denominatorValues = new Set<number>();
        const operandPairs = new Set<string>();
        let observedZeroBound = false;
        let observedTie = false;
        let observedEstimateDifferentFromExact = false;
        for (let seed = 0; seed < 360; seed++) {
            setSeed(`fraction-benchmark-${operation}-${approximationModel}-${seed}`);
            const data = generator.generate({operation, approximationModel}).data;
            assertProblem(data, operation, approximationModel);
            candidates.add(data.candidate.judgment);
            denominatorValues.add(data.first.value.denominator);
            denominatorValues.add(data.second.value.denominator);
            operandPairs.add(`${data.first.value.numerator}/${data.first.value.denominator}:`
                + `${data.second.value.numerator}/${data.second.value.denominator}`);
            observedZeroBound ||= data.resultBounds.lower.numerator === 0;
            if (data.approximation) {
                observedEstimateDifferentFromExact ||= !sameValue(data.approximation.estimatedResult, data.exactResult);
                observedTie ||= [data.first, data.second].some(item => item.lowerTick !== item.upperTick
                    && 2 * (4 * item.value.numerator - item.lowerTick * item.value.denominator)
                    === item.value.denominator);
            }
            setSeed(`fraction-benchmark-${operation}-${approximationModel}-${seed}`);
            expect(generator.generate({operation, approximationModel}).data).toEqual(data);
        }
        expect(candidates).toEqual(new Set(['reasonable', 'unreasonable']));
        expect(denominatorValues).toContain(5);
        expect(operandPairs.size).toBeGreaterThanOrEqual(50);
        if (operation === 'subtraction') expect(observedZeroBound).toBe(true);
        if (approximationModel === 'nearest-quarter') {
            expect(observedTie).toBe(true);
            expect(observedEstimateDifferentFromExact).toBe(true);
        }
    });

    it('rejects missing or invalid mathematical configuration', () => {
        expect(() => generator.generate({} as never)).toThrow('Required field "operation" is missing.');
        expect(() => generator.generate({operation: 'addition'} as never))
            .toThrow('Required field "approximationModel" is missing.');
        expect(() => generator.generate({operation: 'product', approximationModel: 'bounds-only'} as never))
            .toThrow('Unsupported operation');
        expect(() => generator.generate({operation: 'addition', approximationModel: 'other'} as never))
            .toThrow('Unsupported approximation model');
        expect(() => generator.generate(null as never)).toThrow('Configuration object is missing or null.');
    });
});
