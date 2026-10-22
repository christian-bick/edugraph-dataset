import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {setSeed} from '../../../lib/random.ts';
import type {StandardDivisionProblem} from '../../../types/problems.ts';
import {buildStandardDivisionProblem, StandardAlgorithmDivisionGenerator} from './generator.ts';
import type {StandardAlgorithmDivisionGeneratorConfig} from './spec.ts';

const generator = new StandardAlgorithmDivisionGenerator();
const config = (divisorDigits: 1 | 2 | 3 = 3, max = 100000): StandardAlgorithmDivisionGeneratorConfig => ({
    range: {min: 0, max}, divisorDigits
});

const assertTrace = (data: StandardDivisionProblem): void => {
    expect(data.quotient).toBe(Math.floor(data.dividend / data.divisor));
    expect(data.remainder).toBe(data.dividend % data.divisor);
    expect(data.divisor * data.quotient + data.remainder).toBe(data.dividend);
    expect(data.dividendDigits.join('')).toBe(String(data.dividend));
    expect(data.quotientDigits.join('')).toBe(String(data.quotient));
    expect(data.quotientStartColumn).toBe(data.steps[0]!.columnIndex);
    expect(data.steps.flatMap(step => step.broughtDownDigits)).toEqual(data.dividendDigits);
    expect(data.steps.at(-1)!.columnIndex).toBe(data.dividendDigits.length - 1);
    expect(data.steps).toHaveLength(data.quotientDigits.length);

    data.steps.forEach((step, index) => {
        const broughtValue = Number(step.broughtDownDigits.join(''));
        expect(step.columnIndex).toBe(data.quotientStartColumn + index);
        expect(step.placeValue).toBe(10 ** (data.dividendDigits.length - 1 - step.columnIndex));
        expect(step.previousRemainder).toBe(index === 0 ? 0 : data.steps[index - 1]!.remainder);
        expect(step.partialDividend).toBe(step.previousRemainder * 10 ** step.broughtDownDigits.length + broughtValue);
        expect(step.quotientDigit).toBe(data.quotientDigits[index]);
        expect(step.quotientDigit).toBeGreaterThanOrEqual(0);
        expect(step.quotientDigit).toBeLessThanOrEqual(9);
        expect(step.product).toBe(data.divisor * step.quotientDigit);
        expect(step.partialDividend - step.product).toBe(step.remainder);
        expect(step.remainder).toBeGreaterThanOrEqual(0);
        expect(step.remainder).toBeLessThan(data.divisor);
        if (index > 0) expect(step.broughtDownDigits).toHaveLength(1);
        const next = data.steps[index + 1];
        expect(step.nextBringDown).toEqual(next ? {
            sourceColumn: next.columnIndex,
            digit: data.dividendDigits[next.columnIndex],
            partialDividend: next.partialDividend
        } : undefined);
    });

    const first = data.steps[0]!;
    if (data.quotient > 0) {
        expect(first.partialDividend).toBeGreaterThanOrEqual(data.divisor);
        expect(Math.floor(first.partialDividend / 10)).toBeLessThan(data.divisor);
    } else {
        expect(data.steps).toHaveLength(1);
        expect(first.broughtDownDigits).toEqual(data.dividendDigits);
    }
};

describe('standard-algorithm-division mathematical trace', () => {
    it.each([
        [1005, 5, 201, 0], [1200, 12, 100, 0], [1001, 10, 100, 1],
        [12345, 123, 100, 45], [98765, 123, 802, 119], [10101, 99, 102, 3],
        [37, 125, 0, 37], [125, 125, 1, 0], [125125, 125, 1001, 0],
        [82417, 321, 256, 241], [1000, 16, 62, 8], [1002, 3, 334, 0],
        [10, 1, 10, 0], [10, 10, 1, 0], [Number.MAX_SAFE_INTEGER, 1, Number.MAX_SAFE_INTEGER, 0]
    ])('proves %i / %i = %i remainder %i', (dividend, divisor, quotient, remainder) => {
        const data = buildStandardDivisionProblem(dividend, divisor);
        expect(data).toMatchObject({kind: 'whole-number-standard-division', base: 10, quotient, remainder});
        assertTrace(data);
    });

    it('retains the zero quotient place after a zero remainder, with exact bring-down metadata', () => {
        expect(buildStandardDivisionProblem(1005, 5).steps).toEqual([
            {columnIndex: 1, placeValue: 100, previousRemainder: 0, broughtDownDigits: [1, 0],
                partialDividend: 10, quotientDigit: 2, product: 10, remainder: 0,
                nextBringDown: {sourceColumn: 2, digit: 0, partialDividend: 0}},
            {columnIndex: 2, placeValue: 10, previousRemainder: 0, broughtDownDigits: [0],
                partialDividend: 0, quotientDigit: 0, product: 0, remainder: 0,
                nextBringDown: {sourceColumn: 3, digit: 5, partialDividend: 5}},
            {columnIndex: 3, placeValue: 1, previousRemainder: 0, broughtDownDigits: [5],
                partialDividend: 5, quotientDigit: 1, product: 5, remainder: 0}
        ]);
    });

    it.each([
        [0, 3], [9, 3], [-10, 3], [10.5, 3], [NaN, 3], [Infinity, 3],
        [Number.MAX_SAFE_INTEGER + 1, 3], [100, 0], [100, -2], [100, 1.5],
        [100, NaN], [100, Infinity], [100, Number.MAX_SAFE_INTEGER + 1]
    ])('rejects invalid original operands %s / %s', (dividend, divisor) => {
        expect(() => buildStandardDivisionProblem(dividend, divisor)).toThrow(GeneratorValidationError);
    });
});

describe('standard-algorithm-division configuration and variation', () => {
    it('rejects empty and incomplete configuration', () => {
        expect(() => generator.generate({})).toThrow(GeneratorValidationError);
        expect(() => generator.generate({range: {min: 0, max: 10000}})).toThrow(GeneratorValidationError);
        expect(() => generator.generate({divisorDigits: 1})).toThrow(GeneratorValidationError);
    });

    it.each([null, 0, '10000', {}, {min: 1, max: 10000}, {min: 0, max: 1000},
        {min: 0, max: Infinity}, {min: 0, max: 10000.5}])('rejects invalid magnitude config %j', range => {
        expect(() => generator.generate({...config(), range} as StandardAlgorithmDivisionGeneratorConfig))
            .toThrow(GeneratorValidationError);
    });

    it.each([0, 4, 1.5, '2'])('rejects invalid divisor width %s', divisorDigits => {
        expect(() => generator.generate({...config(), divisorDigits} as StandardAlgorithmDivisionGeneratorConfig))
            .toThrow(GeneratorValidationError);
    });

    it('keeps every positional witness within the selected bound for all three divisor widths', () => {
        for (const max of [10000, 100000, Number.MAX_SAFE_INTEGER]) {
            for (const width of [1, 2, 3] as const) {
                for (let seed = 0; seed < 100; seed++) {
                    setSeed(seed);
                    const data = generator.generate(config(width, max)).data;
                    const bound = max === Number.MAX_SAFE_INTEGER ? 100000 : max;
                    expect(data.dividend).toBeGreaterThanOrEqual(10);
                    expect(data.dividend).toBeLessThan(bound);
                    expect(String(data.divisor)).toHaveLength(width);
                    expect(data.quotient).toBeLessThan(bound);
                    expect(data.remainder).toBeLessThan(bound);
                    data.steps.forEach(step => {
                        expect(step.partialDividend).toBeLessThan(bound);
                        expect(step.product).toBeLessThan(bound);
                        expect(step.nextBringDown?.partialDividend ?? 0).toBeLessThan(bound);
                    });
                    assertTrace(data);
                }
            }
        }
    });

    it('produces exact, imperfect, zero-quotient, internal-zero and trailing-zero instances', () => {
        const observed = new Set<string>();
        for (let seed = 0; seed < 160; seed++) {
            setSeed(seed);
            const data = generator.generate(config(3)).data;
            if (data.remainder === 0) observed.add('exact');
            if (data.remainder > 0) observed.add('imperfect');
            if (data.quotient === 0) observed.add('zero');
            if (/\d0\d/.test(String(data.quotient))) observed.add('internal-zero');
            if (data.quotient > 0 && data.quotient % 10 === 0) observed.add('trailing-zero');
        }
        expect([...observed].sort()).toEqual(['exact', 'imperfect', 'internal-zero', 'trailing-zero', 'zero']);
    });

    it('makes the magnitude configuration affect the sampled mathematical instance', () => {
        let largerInstance = false;
        for (let seed = 0; seed < 30; seed++) {
            setSeed(seed);
            const smaller = generator.generate(config(2, 10000)).data;
            setSeed(seed);
            const larger = generator.generate(config(2, 100000)).data;
            expect(larger.divisor).toBe(smaller.divisor);
            if (larger.dividend >= 10000) largerInstance = true;
        }
        expect(largerInstance).toBe(true);
    });

    it('replays exactly from its seed and returns only canonical data', () => {
        setSeed(461);
        const first = generator.generate(config());
        setSeed(461);
        expect(generator.generate(config())).toEqual(first);
        expect(Object.keys(first)).toEqual(['data']);
    });
});
