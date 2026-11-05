import {afterAll, afterEach, describe, expect, it, vi} from 'vitest';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import * as rng from '../../../lib/random.ts';
import {exactDecimal} from '../standard-decimal-helpers.ts';
import {nonzeroDecimalDigitsAtMost, nonzeroSubtractionAtMost, nonzeroSubtractionCount,
    sampleDecimalColumnPair, STANDARD_DECIMAL_COLUMN_UPPERS, standardDecimalColumnCases} from './domain.ts';
import {buildDecimalStandardAddSubtractProblem, StandardAlgorithmDecimalAddSubtractGenerator} from './generator.ts';
import {hasDecimalColumnZero} from './zero-profile.ts';

afterEach(() => vi.restoreAllMocks());

export const columnQuantities = (data: ReturnType<typeof buildDecimalStandardAddSubtractProblem>): number[] => {
    const topWidth = data.top.numeral.split('.')[0]!.length, bottomWidth = data.bottom.numeral.split('.')[0]!.length;
    return [data.top.coefficient / 10 ** data.top.scale, data.bottom.coefficient / 10 ** data.bottom.scale,
        data.result.coefficient / 10 ** data.result.scale, ...data.columns.flatMap(c => [
            ...(c.placeExponent < topWidth ? [c.topDigit] : []), ...(c.placeExponent < bottomWidth ? [c.bottomDigit] : []),
            c.workingValue, ...(c.regroupIn > 0 ? [c.regroupIn] : []),
            ...(data.operation === 'subtraction' ? [c.resultDigit] : [])
        ])];
};

describe('standard decimal column constructive domains', () => {
    it('counts every all-nonzero coefficient through the complete old 1m corpus', () => {
        let count = 0, errors = 0;
        for (let n = 0; n <= 1000000; n++) {
            if (n > 0 && !String(n).includes('0')) count++;
            if (nonzeroDecimalDigitsAtMost(n) !== count) errors++;
        }
        expect(errors).toBe(0);
        expect(count).toBe(597870);
    });

    const borrowHundreds = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
    const borrowTraceCounts = new Map<number, number>();
    it.each(borrowHundreds)('proves borrow traces and bounded ranks for top coefficients in hundred %i', hundred => {
        let traces = 0, errors = 0;
        const first = hundred * 100, last = first + 99;
        for (const scale of [1, 2]) for (let top = Math.max(10 ** (scale + 1), first); top <= last; top++) {
            let count = 0;
            for (let bottom = 0; bottom <= top; bottom++) {
                const data = buildDecimalStandardAddSubtractProblem('subtraction', exactDecimal(top, scale).numeral, exactDecimal(bottom, scale).numeral);
                if (!hasDecimalColumnZero(data)) count++;
                if (top <= 199 && nonzeroSubtractionAtMost(top, scale, bottom) !== count) errors++;
                traces++;
            }
            if (nonzeroSubtractionCount(top, scale) !== count) errors++;
        }
        expect(errors).toBe(0);
        expect(traces).toBe((last + 1) * (last + 2) / 2 - first * (first + 1) / 2);
        borrowTraceCounts.set(hundred, traces);
    });

    it('retains the bounded-rank boundary checks', () => {
        expect(nonzeroSubtractionAtMost(333, 1, -1)).toBe(0);
        expect(nonzeroSubtractionAtMost(333, 1, 1000)).toBe(nonzeroSubtractionCount(333, 1));
    });

    const columnProfiles = (['addition', 'subtraction'] as const).flatMap(operation =>
        STANDARD_DECIMAL_COLUMN_UPPERS.flatMap(upper => [true, false]
            .filter(zero => zero || upper !== 10).map(zero => ({operation, upper, zero}))));
    const columnMasses = new Map<string, {operation: 'addition' | 'subtraction'; mass: number}>();
    it.each(columnProfiles)('retains the old law for $operation / upper$upper / zero=$zero', ({operation, upper, zero}) => {
        let mass = 0;
        const cases = standardDecimalColumnCases(operation, createCanonicalNumericRange(upper), zero);
        expect(cases.length).toBeGreaterThan(0);
        for (const entry of cases) {
            expect(entry.weight).toBeGreaterThan(0);
            mass += entry.weight;
        }
        columnMasses.set(`${operation}/${upper}/${zero}`, {operation, mass});
    });

    afterAll(() => {
        expect([...borrowTraceCounts.keys()]).toEqual(borrowHundreds);
        expect([...borrowTraceCounts.values()].reduce((sum, count) => sum + count, 0)).toBe(495450);
        expect(columnProfiles).toHaveLength(26);
        expect(columnMasses.size).toBe(columnProfiles.length);
        for (const operation of ['addition', 'subtraction'] as const)
            expect([...columnMasses.values()].filter(entry => entry.operation === operation)
                .reduce((sum, entry) => sum + entry.mass, 0)).toBeCloseTo(1, 9);
    });

    it('retains each original variant/scale/top/bottom probability on independently enumerated ordinary rows', () => {
        let errors = 0, rows = 0;
        const range = createCanonicalNumericRange(20);
        for (const operation of ['addition', 'subtraction'] as const) for (let scale = 1; scale <= 3; scale++) {
            const top = Number(`12${'3'.repeat(scale)}`);
            for (let bottomScale = 0; bottomScale <= scale; bottomScale++) {
                const factor = 10 ** (scale - bottomScale);
                const sourceMaximum = Math.floor((operation === 'addition' ? 1000000 - top : top) / factor);
                // This profile's previous threshold is10, not an integer storage ceiling.
                const lo = operation === 'addition' ? Math.max(0, Math.ceil((10 * 10 ** scale + 1 - top) / factor)) : 0;
                const hi = operation === 'addition' ? Math.min(sourceMaximum, Math.floor((20 * 10 ** scale - top) / factor)) : sourceMaximum;
                let nonzero = 0;
                for (let bottom = lo; bottom <= hi; bottom++) {
                    const data = buildDecimalStandardAddSubtractProblem(operation, exactDecimal(top, scale).numeral,
                        exactDecimal(bottom, bottomScale).numeral);
                    if (!hasDecimalColumnZero(data)) nonzero++;
                    rows++;
                }
                const domain = standardDecimalColumnCases(operation, range, true).find(b => b.kind === 'regular'
                    && b.scale === scale && b.bottomScale === bottomScale);
                if (!domain || domain.kind !== 'regular') throw Error('Missing original precision path');
                const at = top - domain.first;
                const allIncrement = domain.all ? domain.all[at]! - (domain.all[at - 1] ?? 0) : 1;
                const nonzeroIncrement = domain.nonzero ? domain.nonzero[at]! - (domain.nonzero[at - 1] ?? 0) : 0;
                if (Math.abs(allIncrement - (hi - lo + 1) / (sourceMaximum + 1)) > 1e-11
                    || Math.abs(nonzeroIncrement - nonzero / (sourceMaximum + 1)) > 1e-11) errors++;
                const sourceFirst = 10 * 10 ** scale, sourceLast = operation === 'addition' ? 500000 : 1000000;
                expect(domain.prior).toBe(1 / 4 / 3 * (1 / (scale + 1) + (bottomScale < scale ? 1 / scale : 0))
                    / (sourceLast - sourceFirst + 1));
            }
        }
        expect(errors).toBe(0);
        expect(rows).toBeGreaterThan(20000);
    });

    it('constructs actual Q/S quantities at both true Mulberry32 boundaries of every compact source case', () => {
        let errors = 0, cases = 0;
        for (const operation of ['addition', 'subtraction'] as const) for (const upper of STANDARD_DECIMAL_COLUMN_UPPERS)
            for (const zero of [true, false]) {
                if (!zero && upper === 10) continue;
                const range = createCanonicalNumericRange(upper);
                for (const block of standardDecimalColumnCases(operation, range, zero)) {
                    for (const edge of [0, (2 ** 32 - 1) / 2 ** 32]) {
                        const pair = sampleDecimalColumnPair(block, range, zero, () => edge);
                        const data = buildDecimalStandardAddSubtractProblem(operation, exactDecimal(pair.top, pair.topScale).numeral,
                            exactDecimal(pair.bottom, pair.bottomScale).numeral);
                        if (hasDecimalColumnZero(data) !== zero || !hasCanonicalRangeWitness(columnQuantities(data), range)) errors++;
                    }
                    cases++;
                }
            }
        expect(errors).toBe(0);
        expect(cases).toBeGreaterThan(1000);
    });

    it('handles exact zero/max RNG through native selection and rejects invalid domains before drawing', () => {
        const draw = vi.spyOn(rng, 'random'), generator = new StandardAlgorithmDecimalAddSubtractGenerator();
        for (const operation of ['addition', 'subtraction'] as const) for (const upper of STANDARD_DECIMAL_COLUMN_UPPERS)
            for (const zeroPresence of [true, false]) {
                if (!zeroPresence && upper === 10) continue;
                for (const edge of [0, (2 ** 32 - 1) / 2 ** 32]) {
                    draw.mockReset().mockReturnValue(edge);
                    const range = createCanonicalNumericRange(upper), data = generator.generate({operation, range, zeroPresence}).data;
                    expect(hasDecimalColumnZero(data)).toBe(zeroPresence);
                    expect(hasCanonicalRangeWitness(columnQuantities(data), range)).toBe(true);
                }
            }
        draw.mockClear();
        for (const range of [undefined, createCanonicalNumericRange(1000000), createCanonicalNumericRange(100, 5),
            {...createCanonicalNumericRange(100), maximumAbove: 0}, {...createCanonicalNumericRange(100), minimumBelow: 10}])
            expect(() => generator.generate({operation: 'addition', range: range as never, zeroPresence: true})).toThrow();
        expect(() => generator.generate({operation: 'addition', range: createCanonicalNumericRange(10), zeroPresence: false})).toThrow();
        expect(draw).not.toHaveBeenCalled();
    });
});
