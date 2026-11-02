import {afterEach, describe, expect, it, vi} from 'vitest';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import * as rng from '../../../lib/random.ts';
import {exactDecimal} from '../standard-decimal-helpers.ts';
import {decimalDivisionMaximum, decimalDivisionSourceProfiles, roundedDivisionPreimages,
    STANDARD_DECIMAL_DIVISION_UPPERS, standardDecimalDivisionCases} from './domain.ts';
import {buildDecimalStandardDivisionProblem, StandardAlgorithmDecimalDivisionGenerator} from './generator.ts';

afterEach(() => vi.restoreAllMocks());
const maximum = (data: ReturnType<typeof buildDecimalStandardDivisionProblem>) => Math.max(
    data.dividend.coefficient / 10 ** data.dividend.scale,
    data.divisor.coefficient / 10 ** data.divisor.scale,
    data.quotient.coefficient / 10 ** data.quotient.scale,
    data.normalization.powerOfTen, data.normalization.divisor,
    data.normalization.dividend.coefficient / 10 ** data.normalization.dividend.scale,
    ...data.steps.flatMap(s => [s.partialDividend, s.product, s.quotientDigit, s.remainder])
);

describe('standard decimal division finite prefix and analytic tails', () => {
    it('retains all 16592798 existing source rows and their exact four-scenario conditional masses', () => {
        const source = decimalDivisionSourceProfiles();
        expect(source).toHaveLength(139);
        const all = STANDARD_DECIMAL_DIVISION_UPPERS.flatMap(upper =>
            standardDecimalDivisionCases(createCanonicalNumericRange(upper)).map(block => ({...block, upper})));
        let rows = 0, errors = 0, totalMass = 0;
        for (const p of source) {
            const mass = new Float64Array(p.maximum + 1);
            for (const block of all.filter(b => b.divisorScale === p.divisorScale
                && b.quotientScale === p.quotientScale && b.divisorCoefficient === p.divisorCoefficient)) {
                const count = Math.floor((block.last - block.first) / block.step) + 1;
                totalMass += block.weight;
                for (let C = block.first; C <= block.last; C += block.step) {
                    const M = C < 10 ** (p.quotientScale + 1) ? decimalDivisionMaximum(p, C)
                        : p.divisorCoefficient * C / 10 ** p.quotientScale;
                    if (STANDARD_DECIMAL_DIVISION_UPPERS.find(u => M <= u) !== block.upper) errors++;
                    mass[C] += block.weight / count;
                }
            }
            for (let C = p.minimum; C <= p.maximum; C++) {
                // Independent inverse image count of each old raw scenario.
                const roundCount = C % 5 === 0 ? Math.min(5, p.maximum - C + 1)
                    : Math.floor(C / 5) * 5 < p.minimum ? 1 : 0;
                const expected = ((p.minimum === 0 ? 2 : 3) + roundCount)
                    / (4 * (p.maximum - p.minimum + 1) * source.length)
                    + (p.minimum === 0 && C === 0 ? 1 / 4 / source.length : 0);
                if (Math.abs(mass[C]! - expected) > 1e-14) errors++;
                rows++;
            }
        }
        expect(rows).toBe(16592798);
        expect(errors).toBe(0);
        expect(totalMass).toBeCloseTo(1, 12);
    });

    it('checks every finite-prefix coefficient and every supplied trailing-zero trim against actual long division', () => {
        let rows = 0, traces = 0, errors = 0;
        for (const p of decimalDivisionSourceProfiles()) {
            for (let C = p.minimum; C <= Math.min(p.maximum, 10 ** (p.quotientScale + 1) - 1); C++) {
                const coefficient = p.divisorCoefficient * C, scale = p.divisorScale + p.quotientScale;
                let trims = 0;
                while (trims < scale - (p.divisorScale === 0 ? 1 : 0)
                    && coefficient % 10 ** (trims + 1) === 0) trims++;
                for (let trim = 0; trim <= trims; trim++) {
                    const data = buildDecimalStandardDivisionProblem(exactDecimal(coefficient / 10 ** trim, scale - trim).numeral,
                        exactDecimal(p.divisorCoefficient, p.divisorScale).numeral);
                    if (maximum(data) !== decimalDivisionMaximum(p, C) || data.steps.at(-1)!.remainder !== 0) errors++;
                    traces++;
                }
                rows++;
            }
        }
        expect(rows).toBe(20530);
        expect(traces).toBe(33174);
        expect(errors).toBe(0);
    });

    it('proves the short round-down preimage formula for all 651 bounded source intervals', () => {
        let errors = 0;
        for (let L = 0; L <= 20; L++) for (let R = L; R <= L + 30; R++) {
            const counts = new Map<number, number>();
            for (let raw = L; raw <= R; raw++) {
                const C = Math.floor(raw / 5) * 5 >= L ? Math.floor(raw / 5) * 5 : raw;
                counts.set(C, (counts.get(C) ?? 0) + 1);
            }
            for (let C = L - 1; C <= R + 1; C++)
                if (roundedDivisionPreimages(C, L, R) !== (counts.get(C) ?? 0)) errors++;
        }
        expect(errors).toBe(0);
    });

    it('selects compact tail endpoints with the original conditional supplied-precision choices', () => {
        const draw = vi.spyOn(rng, 'random');
        const generator = new StandardAlgorithmDecimalDivisionGenerator();
        let endpoints = 0;
        for (const upper of STANDARD_DECIMAL_DIVISION_UPPERS) {
            const range = createCanonicalNumericRange(upper), cases = standardDecimalDivisionCases(range);
            const total = cases.reduce((n, b) => n + b.weight, 0);
            let before = 0;
            for (const b of cases) {
                if (b.first !== b.last) for (const edge of [0, 1]) {
                    const inputs = [(before + b.weight / 2) / total, edge ? 1 - 1e-12 : 0, edge ? 1 - 1e-12 : 0];
                    draw.mockReset().mockImplementation(() => inputs.shift()!);
                    const data = generator.generate({range}).data;
                    const C = b.first + b.step * (edge ? Math.floor((b.last - b.first) / b.step) : 0);
                    expect(data.quotient.coefficient / 10 ** data.quotient.scale).toBe(C / 10 ** b.quotientScale);
                    expect(maximum(data)).toBeLessThanOrEqual(upper);
                    expect(maximum(data)).toBeGreaterThan(range.maximumAbove);
                    expect(inputs).toEqual([]);
                    endpoints++;
                }
                before += b.weight;
            }
        }
        expect(endpoints).toBeGreaterThan(600);
    });

    it('rejects unsupported, incomplete and contradictory bounds before randomness', () => {
        const draw = vi.spyOn(rng, 'random');
        for (const range of [undefined, createCanonicalNumericRange(5), createCanonicalNumericRange(100, 5),
            {...createCanonicalNumericRange(100), maximumAbove: 0}, {...createCanonicalNumericRange(100), minimumBelow: 10}])
            expect(() => new StandardAlgorithmDecimalDivisionGenerator().generate({range: range as never})).toThrow();
        expect(draw).not.toHaveBeenCalled();
    });

    it('accepts the exact zero and maximum Mulberry32 draw at every sampling boundary', () => {
        const draw = vi.spyOn(rng, 'random');
        for (const upper of STANDARD_DECIMAL_DIVISION_UPPERS) for (const value of [0, (2 ** 32 - 1) / 2 ** 32]) {
            draw.mockReset().mockReturnValue(value);
            const data = new StandardAlgorithmDecimalDivisionGenerator().generate({range: createCanonicalNumericRange(upper)}).data;
            expect(maximum(data)).toBeLessThanOrEqual(upper);
            expect(maximum(data)).toBeGreaterThan(createCanonicalNumericRange(upper).maximumAbove);
            expect(draw).toHaveBeenCalledTimes(3);
        }
    });
});
