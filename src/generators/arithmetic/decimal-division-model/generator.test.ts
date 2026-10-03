import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import type {DecimalDivisionProblem} from '../../../types/problems.ts';
import {createDecimalDivisionProblem, DecimalDivisionModelGenerator} from './generator.ts';

const generator = new DecimalDivisionModelGenerator();
const PLACES = [
    'ones', 'tenths', 'hundredths', 'thousandths', 'ten-thousandths'
] as const;

function expectExactDivision(data: DecimalDivisionProblem): void {
    expect(data.kind).toBe('decimal-division-model');
    expect(data.base).toBe(10);
    expect(data.operandScale).toBe(100);
    expect(data.quotientScale).toBe(10000);
    const A = data.dividend.valueInHundredths;
    const B = data.divisor.valueInHundredths;
    const Q = data.quotient.valueInTenThousandths;
    expect(B).toBeGreaterThan(0);
    expect(Q).toBe(A * 10000 / B);
    expect(B * Q).toBe(A * 10000);
    expect(data.inverse).toEqual({
        divisorTimesQuotientInMillionths: B * Q,
        dividendInMillionths: A * 10000
    });

    for (const value of [data.dividend, data.divisor]) {
        const count = value.valueInHundredths;
        const fractional = String(count % 100).padStart(2, '0').replace(/0+$/, '');
        expect(value.canonicalNumeral).toBe(fractional
            ? `${Math.floor(count / 100)}.${fractional}`
            : String(Math.floor(count / 100)));
        expect(value.alignedDigits).toEqual([
            Math.floor(count / 100), Math.floor(count / 10) % 10, count % 10
        ]);
    }
    const quotientFraction = String(Q % 10000).padStart(4, '0').replace(/0+$/, '');
    expect(data.quotient.canonicalNumeral).toBe(quotientFraction
        ? `${Math.floor(Q / 10000)}.${quotientFraction}`
        : String(Math.floor(Q / 10000)));
    expect(data.quotient.precision).toBe(quotientFraction.length);
    expect(data.quotient.alignedDigits).toEqual([
        Math.floor(Q / 10000), Math.floor(Q / 1000) % 10,
        Math.floor(Q / 100) % 10, Math.floor(Q / 10) % 10, Q % 10
    ]);

    const grouping = data.grouping;
    const fullGroups = Math.floor(A / B);
    const remainderCells = A % B;
    expect(grouping.unitValueInHundredths).toBe(1);
    expect(grouping.cellsPerGroup).toBe(B);
    expect(grouping.fullGroupCount).toBe(fullGroups);
    expect(grouping.remainderCells).toBe(remainderCells);
    expect(grouping.bars.length).toBe(fullGroups + Number(remainderCells > 0));
    let filledTotal = 0;
    let contributionTotal = 0;
    grouping.bars.forEach((bar, index) => {
        expect(bar.index).toBe(index);
        expect(bar.capacityCells).toBe(B);
        expect(bar.kind).toBe(index < fullGroups ? 'full' : 'partial');
        expect(bar.filledCells).toBe(index < fullGroups ? B : remainderCells);
        expect(bar.filledCells).toBeGreaterThan(0);
        expect(bar.filledCells).toBeLessThanOrEqual(B);
        expect(bar.quotientContributionInTenThousandths)
            .toBe(bar.filledCells * 10000 / B);
        expect(Number.isInteger(bar.quotientContributionInTenThousandths)).toBe(true);
        filledTotal += bar.filledCells;
        contributionTotal += bar.quotientContributionInTenThousandths;
    });
    expect(filledTotal).toBe(A);
    expect(contributionTotal).toBe(Q);

    const trace = data.divisionTrace;
    expect(trace.dividendUnitCount).toBe(A);
    expect(trace.divisorUnitCount).toBe(B);
    expect(trace.steps.length).toBeGreaterThan(0);
    expect(trace.steps.length).toBeLessThanOrEqual(5);
    let previousRemainder = 0;
    const digits = [0, 0, 0, 0, 0];
    trace.steps.forEach((step, index) => {
        expect(step.place).toBe(PLACES[index]);
        expect(step.partialDividend).toBe(index === 0 ? A : previousRemainder * 10);
        expect(step.quotientDigit).toBe(Math.floor(step.partialDividend / B));
        expect(step.quotientDigit).toBeGreaterThanOrEqual(0);
        expect(step.quotientDigit).toBeLessThanOrEqual(9);
        expect(step.subtrahend).toBe(B * step.quotientDigit);
        expect(step.remainder).toBe(step.partialDividend - step.subtrahend);
        expect(step.remainder).toBeGreaterThanOrEqual(0);
        expect(step.remainder).toBeLessThan(B);
        if (index < trace.steps.length - 1) expect(step.remainder).toBeGreaterThan(0);
        previousRemainder = step.remainder;
        digits[index] = step.quotientDigit;
    });
    expect(previousRemainder).toBe(0);
    expect(digits).toEqual(data.quotient.alignedDigits);
    expect(data).not.toHaveProperty('prompt');
    expect(data).not.toHaveProperty('answerProse');
}

describe('createDecimalDivisionProblem', () => {
    it.each([
        [25, 8, '3.125', 3],
        [17, 16, '1.0625', 4],
        [1, 16, '0.0625', 4],
        [24, 8, '3', 0],
        [12, 5, '2.4', 1],
        [1, 4, '0.25', 2],
        [0, 8, '0', 0]
    ])('derives the exact grouping for %i hundredths ÷ %i hundredths', (
        dividend, divisor, numeral, precision
    ) => {
        const data = createDecimalDivisionProblem(dividend, divisor)!;
        expectExactDivision(data);
        expect(data.quotient.canonicalNumeral).toBe(numeral);
        expect(data.quotient.precision).toBe(precision);
    });

    it('retains a zero tenths digit while resolving 0.17 ÷ 0.16', () => {
        const data = createDecimalDivisionProblem(17, 16)!;
        expect(data.quotient.alignedDigits).toEqual([1, 0, 6, 2, 5]);
        expect(data.divisionTrace.steps).toEqual([
            {place: 'ones', partialDividend: 17, quotientDigit: 1,
                subtrahend: 16, remainder: 1},
            {place: 'tenths', partialDividend: 10, quotientDigit: 0,
                subtrahend: 0, remainder: 10},
            {place: 'hundredths', partialDividend: 100, quotientDigit: 6,
                subtrahend: 96, remainder: 4},
            {place: 'thousandths', partialDividend: 40, quotientDigit: 2,
                subtrahend: 32, remainder: 8},
            {place: 'ten-thousandths', partialDividend: 80, quotientDigit: 5,
                subtrahend: 80, remainder: 0}
        ]);
    });

    it('uses three full bars and one eighth-bar for 0.25 ÷ 0.08', () => {
        const data = createDecimalDivisionProblem(25, 8)!;
        expect(data.grouping.bars.map(bar => [bar.index, bar.kind,
            bar.filledCells, bar.quotientContributionInTenThousandths])).toEqual([
            [0, 'full', 8, 10000],
            [1, 'full', 8, 10000],
            [2, 'full', 8, 10000],
            [3, 'partial', 1, 1250]
        ]);
        expect(data.quotient.valueInTenThousandths).toBe(31250);
    });

    it('rejects zero divisor, nonterminating fractions, oversized quotients and invalid counts', () => {
        for (const [A, B] of [
            [1, 0], [1, 3], [100, 10], [999, 1], [-1, 8], [1, -8],
            [1000, 8], [1, 1000], [0.5, 8], [1, 8.5], [NaN, 8], [1, Infinity]
        ]) {
            expect(createDecimalDivisionProblem(A, B)).toBeNull();
        }
    });
});

describe('DecimalDivisionModelGenerator', () => {
    it('requires an empty configuration object', () => {
        expect(() => generator.generate(null as never)).toThrow();
        expect(() => generator.generate({variant: 'unsupported'} as never)).toThrow();
    });

    it('samples bounded exact three- and four-place quotient profiles', () => {
        const seenDivisors = new Set<number>();
        const seenGroupCounts = new Set<number>();
        for (let seed = 0; seed < 240; seed++) {
            setSeed(`decimal-division-${seed}`);
            const data = generator.generate({}).data;
            expectExactDivision(data);
            const A = data.dividend.valueInHundredths;
            const B = data.divisor.valueInHundredths;
            seenDivisors.add(B);
            seenGroupCounts.add(data.grouping.fullGroupCount);
            expect([8, 16]).toContain(B);
            expect(A).toBeLessThanOrEqual(80);
            expect(data.grouping.fullGroupCount).toBeGreaterThanOrEqual(1);
            expect(data.grouping.fullGroupCount).toBeLessThanOrEqual(4);
            expect(data.grouping.remainderCells % 2).toBe(1);
            expect(data.grouping.bars.length).toBeLessThanOrEqual(5);
            expect(data.grouping.bars.reduce((sum, bar) => sum + bar.capacityCells, 0))
                .toBeLessThanOrEqual(80);
            expect(data.quotient.precision).toBe(B === 8 ? 3 : 4);
        }
        expect(seenDivisors).toEqual(new Set([8, 16]));
        expect(seenGroupCounts).toEqual(new Set([1, 2, 3, 4]));
    });

    it('replays the same exact grouping and trace for one seed', () => {
        setSeed('decimal-division-replay');
        const first = generator.generate({});
        setSeed('decimal-division-replay');
        expect(generator.generate({})).toEqual(first);
    });
});
