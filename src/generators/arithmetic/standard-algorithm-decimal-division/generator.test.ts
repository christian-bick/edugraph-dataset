import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {setSeed} from '../../../lib/random.ts';
import type {DecimalStandardDivisionProblem} from '../../../types/problems.ts';
import {buildDecimalStandardDivisionProblem, StandardAlgorithmDecimalDivisionGenerator} from './generator.ts';

const generator = new StandardAlgorithmDecimalDivisionGenerator();
const parsed = (numeral: string) => {
    const [whole, fractional = ''] = numeral.split('.');
    return {coefficient: BigInt(`${whole}${fractional}`), scale: fractional.length};
};

function assertDivision(data: DecimalStandardDivisionProblem): void {
    const a = parsed(data.dividend.numeral);
    const b = parsed(data.divisor.numeral);
    const q = parsed(data.quotient.numeral);
    expect(a.coefficient * 10n ** BigInt(b.scale + q.scale))
        .toBe(b.coefficient * q.coefficient * 10n ** BigInt(a.scale));
    const normalized = parsed(data.normalization.dividend.numeral);
    expect(normalized.coefficient * 10n ** BigInt(a.scale))
        .toBe(a.coefficient * 10n ** BigInt(b.scale + normalized.scale));
    expect(data.normalization.powerOfTen).toBe(10 ** b.scale);
    expect(data.normalization.shiftPlaces).toBe(b.scale);
    expect(data.normalization.divisor).toBe(Number(b.coefficient));
    expect(data.sourceDigits.join('')).toBe(data.normalization.dividend.numeral.replace('.', ''));
    expect(data.decimalIndex).toBe(data.sourceDigits.length - normalized.scale);
    expect(data.quotientStartColumn).toBe(data.steps[0]!.endColumnIndex);
    expect(data.steps.filter(step => step.source === 'original').flatMap(step => step.broughtDownDigits)).toEqual(data.sourceDigits);
    expect(data.quotientDigits).toEqual(data.steps.map(step => step.quotientDigit));
    expect(BigInt(data.quotientDigits.join(''))).toBe(q.coefficient);
    expect(data.steps.at(-1)!.remainder).toBe(0);
    expect(data.steps.at(-1)!.quotientPlaceExponent).toBe(0 - q.scale);
    expect(q.scale).toBeGreaterThanOrEqual(normalized.scale);

    data.steps.forEach((step, index) => {
        expect(step.endColumnIndex).toBe(data.quotientStartColumn + index);
        expect(step.quotientPlaceExponent).toBe(data.decimalIndex - 1 - step.endColumnIndex);
        expect(step.previousRemainder).toBe(index === 0 ? 0 : data.steps[index - 1]!.remainder);
        expect(BigInt(step.partialDividend)).toBe(BigInt(step.previousRemainder) * 10n ** BigInt(step.broughtDownDigits.length)
            + BigInt(step.broughtDownDigits.join('')));
        expect(step.product).toBe(data.normalization.divisor * step.quotientDigit);
        expect(step.remainder).toBe(step.partialDividend - step.product);
        expect(step.remainder).toBeGreaterThanOrEqual(0);
        expect(step.remainder).toBeLessThan(data.normalization.divisor);
        expect(step.quotientDigit).toBeGreaterThanOrEqual(0);
        expect(step.quotientDigit).toBeLessThanOrEqual(9);
        if (index > 0) expect(step.broughtDownDigits).toHaveLength(1);
        expect(step.source).toBe(step.endColumnIndex < data.sourceDigits.length ? 'original' : 'extension-zero');
        if (step.source === 'extension-zero') expect(step.broughtDownDigits).toEqual([0]);
        if (index < data.steps.length - 1 && step.endColumnIndex >= data.sourceDigits.length - 1) {
            expect(step.remainder).toBeGreaterThan(0);
        }
    });
    const first = data.steps[0]!;
    expect(first.endColumnIndex).toBeLessThan(data.decimalIndex);
    if (first.quotientDigit === 0) expect(first.endColumnIndex).toBe(data.decimalIndex - 1);
    else expect(Math.floor(first.partialDividend / 10)).toBeLessThan(data.normalization.divisor);
}

describe('exact standard decimal division', () => {
    it.each([
        ['12.345', '0.3', '41.15'], ['1.005', '0.5', '2.01'],
        ['0.0012', '0.3', '0.004'], ['1.2', '0.003', '400'],
        ['1.20', '0.3', '4.0'], ['20.04', '0.4', '50.1'],
        ['100.2', '2', '50.1'], ['10', '4', '2.5'],
        ['0.000', '12.0', '0.00'], ['10', '0.8', '12.5'],
        ['123.450', '1.50', '82.3'], ['1000.0', '0.001', '1000000'],
        ['9007199254740991', '1', '9007199254740991']
    ])('proves %s / %s = %s with complete positional evidence', (dividend, divisor, quotient) => {
        const data = buildDecimalStandardDivisionProblem(dividend, divisor);
        expect(data.quotient.numeral).toBe(quotient);
        assertDivision(data);
    });

    it('normalizes both sides while retaining a decimal dividend and early-zero source places', () => {
        const data = buildDecimalStandardDivisionProblem('1.005', '0.5');
        expect(data.normalization.dividend.numeral).toBe('10.05');
        expect(data.normalization.divisor).toBe(5);
        expect(data.sourceDigits).toEqual([1, 0, 0, 5]);
        expect(data.steps).toEqual([
            {endColumnIndex: 1, quotientPlaceExponent: 0, source: 'original', previousRemainder: 0,
                broughtDownDigits: [1, 0], partialDividend: 10, quotientDigit: 2, product: 10, remainder: 0},
            {endColumnIndex: 2, quotientPlaceExponent: -1, source: 'original', previousRemainder: 0,
                broughtDownDigits: [0], partialDividend: 0, quotientDigit: 0, product: 0, remainder: 0},
            {endColumnIndex: 3, quotientPlaceExponent: -2, source: 'original', previousRemainder: 0,
                broughtDownDigits: [5], partialDividend: 5, quotientDigit: 1, product: 5, remainder: 0}
        ]);
    });

    it('appends zeros only after consuming every original digit and stops at exact termination', () => {
        const data = buildDecimalStandardDivisionProblem('10', '4');
        expect(data.steps.map(step => step.source)).toEqual(['original', 'extension-zero']);
        expect(data.steps[1]).toEqual({endColumnIndex: 2, quotientPlaceExponent: -1, source: 'extension-zero',
            previousRemainder: 2, broughtDownDigits: [0], partialDividend: 20, quotientDigit: 5, product: 20, remainder: 0});
        expect(buildDecimalStandardDivisionProblem('1.20', '0.3').steps.map(step => step.quotientDigit)).toEqual([4, 0]);
    });

    it.each([['10', '3'], ['1', '6'], ['0.1', '0.3']])('rejects recurring decimal %s / %s without truncation', (a, b) => {
        expect(() => buildDecimalStandardDivisionProblem(a, b)).toThrow('recurring');
    });

    it.each([['10', '0'], ['01.0', '2'], ['-1', '2'], ['1e2', '2'],
        ['9007199254740992', '1'], ['9007199254740991', '0.1'],
        ['9007199254740990', '4'], ['4503599627370495', '9007199254740990'],
        ['1', '4503599627370496']])('rejects invalid or unsafe %s / %s', (a, b) => {
        expect(() => buildDecimalStandardDivisionProblem(a, b)).toThrow(GeneratorValidationError);
    });
});

describe('standard decimal division configuration', () => {
    it('rejects missing configuration and unsupported ranges', () => {
        expect(() => generator.generate({})).toThrow(GeneratorValidationError);
        for (const range of [null, '100000', {}, {min: -1, max: 100000}, {min: 0, max: 10000}]) {
            expect(() => generator.generate({range} as never)).toThrow(GeneratorValidationError);
        }
    });

    it('satisfies canonical labels and all magnitude bounds with genuine fine-scale/zero/extension variation', () => {
        const features = new Set<string>();
        for (const max of [100000, 1000000, Number.MAX_SAFE_INTEGER]) {
            const cap = max === Number.MAX_SAFE_INTEGER ? 999999 : max;
            for (let seed = 0; seed < 240; seed++) {
                setSeed(seed);
                const data = generator.generate({range: {min: 0, max}}).data;
                assertDivision(data);
                expect(Math.max(data.dividend.coefficient / 10 ** data.dividend.scale,
                    data.divisor.coefficient / 10 ** data.divisor.scale)).toBeGreaterThanOrEqual(10);
                expect(data.dividend.scale + data.divisor.scale).toBeGreaterThan(0);
                for (const value of [data.dividend.coefficient, data.divisor.coefficient, data.quotient.coefficient,
                    data.normalization.dividend.coefficient, data.normalization.divisor, data.normalization.powerOfTen,
                    ...data.steps.flatMap(step => [step.partialDividend, step.product, step.remainder])]) {
                    expect(value).toBeGreaterThanOrEqual(0);
                    expect(value).toBeLessThanOrEqual(cap);
                }
                if (data.dividend.coefficient === 0) features.add('zero');
                if ([data.dividend, data.divisor].some(value => value.scale >= 3 && value.coefficient % 10 ** value.scale !== 0)) features.add('fine');
                if (data.normalization.dividend.scale > 0) features.add('decimal-normalized');
                if (data.steps.some(step => step.source === 'extension-zero')) features.add('extension');
                if (/\d0\d/.test(data.quotientDigits.join(''))) features.add('internal-zero');
                if (data.divisor.scale > data.dividend.scale) features.add('integer-expansion');
            }
        }
        expect([...features].sort()).toEqual(['decimal-normalized', 'extension', 'fine', 'integer-expansion', 'internal-zero', 'zero']);
    });

    it('replays from seed and gives the mathematical range a measurable effect', () => {
        let larger = false;
        for (let seed = 0; seed < 30; seed++) {
            setSeed(seed);
            const first = generator.generate({range: {min: 0, max: 100000}});
            setSeed(seed);
            expect(generator.generate({range: {min: 0, max: 100000}})).toEqual(first);
            expect(Object.keys(first)).toEqual(['data']);
            setSeed(seed);
            const second = generator.generate({range: {min: 0, max: 1000000}}).data;
            if (second.dividend.coefficient > 100000 || second.quotient.coefficient > 100000) larger = true;
        }
        expect(larger).toBe(true);
    });
});
