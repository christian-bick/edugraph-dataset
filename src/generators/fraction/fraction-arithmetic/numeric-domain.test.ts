import {afterEach, describe, expect, it, vi} from 'vitest';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import * as rng from '../../../lib/random.ts';
import type {FractionArithmeticProblem} from '../../../types/problems.ts';
import {FractionArithmeticGenerator} from './generator.ts';
import {binaryFractionCases, fractionDecompositionCases, mixedFractionCases, wholeFractionProductCases} from './numeric-domain.ts';

afterEach(() => vi.restoreAllMocks());
const bounds = [5, 10, 20, 100];
const domains = [
    {task: 'fraction-operation', operation: 'addition', counts: [10, 43, 0, 0], rows: (r: ReturnType<typeof createCanonicalNumericRange>) => binaryFractionCases('addition', r)},
    {task: 'fraction-operation', operation: 'subtraction', counts: [10, 43, 0, 0], rows: (r: ReturnType<typeof createCanonicalNumericRange>) => binaryFractionCases('subtraction', r)},
    {task: 'decompose-proper', operation: 'addition', counts: [1, 8, 0, 0], rows: (r: ReturnType<typeof createCanonicalNumericRange>) => fractionDecompositionCases('proper', r)},
    {task: 'decompose-mixed', operation: 'addition', counts: [1, 4, 10, 3], rows: (r: ReturnType<typeof createCanonicalNumericRange>) => fractionDecompositionCases('mixed', r)},
    {task: 'mixed-operation', operation: 'addition', counts: [0, 3, 28, 39], rows: (r: ReturnType<typeof createCanonicalNumericRange>) => mixedFractionCases('addition', r)},
    {task: 'mixed-operation', operation: 'subtraction', counts: [0, 6, 46, 18], rows: (r: ReturnType<typeof createCanonicalNumericRange>) => mixedFractionCases('subtraction', r)},
    {task: 'unit-fraction-multiple', operation: 'multiplication', counts: [9, 6, 0, 0], rows: (r: ReturnType<typeof createCanonicalNumericRange>) => wholeFractionProductCases('unit', r)},
    {task: 'whole-number-fraction-product-proper', operation: 'multiplication', counts: [0, 4, 0, 0], rows: (r: ReturnType<typeof createCanonicalNumericRange>) => wholeFractionProductCases('proper', r)},
    {task: 'whole-number-fraction-product-improper', operation: 'multiplication', counts: [1, 10, 10, 2], rows: (r: ReturnType<typeof createCanonicalNumericRange>) => wholeFractionProductCases('improper', r)}
] as const;

/** Independent task quantities: explicitly counted parts and converted numerator
 * arithmetic, not arbitrary storage integers or diagram frame indexes. */
function quantities(data: FractionArithmeticProblem): number[] {
    const base: number[] = [data.sharedWhole];
    if (data.task === 'unlike-fraction-operation' || data.task === 'unlike-mixed-operation') throw new Error('Deferred task');
    base.push(data.denominator, 1 / data.denominator);
    if (data.task === 'fraction-operation') return [...base, data.first.numerator, data.second.numerator, data.result.numerator];
    if (data.task === 'decompose') return [...base, data.source.kind === 'mixed'
        ? 2 * data.denominator + data.source.value.numerator : data.source.value.numerator,
        ...data.decompositions.flatMap(decomposition => decomposition.terms.map(term => term.numerator))];
    if (data.task === 'mixed-operation') return [...base, ...[data.first, data.second, data.result]
        .flatMap(value => [value.whole, value.numerator, value.whole * value.denominator + value.numerator])];
    if (data.task === 'unit-fraction-multiple') return [...base, data.wholeFactor, data.product.numerator];
    if (data.task === 'whole-number-fraction-product') return [...base, data.wholeFactor, data.fractionFactor.numerator, data.product.numerator];
    return [...base, data.conversionFactor, data.convertedFirst.numerator, data.secondHundredths.numerator, data.result.numerator];
}

describe('same-whole fraction arithmetic finite ranges', () => {
    it('partitions all315 former finite paths and preserves their original nested probabilities', () => {
        let total = 0;
        for (const domain of domains) {
            const seen = new Set<string>();
            let mass = 0;
            for (const [index, upper] of bounds.entries()) {
                const rows = domain.rows(createCanonicalNumericRange(upper));
                expect(rows).toHaveLength(domain.counts[index]!);
                for (const row of rows) {
                    const {weight, ...input} = row;
                    const key = JSON.stringify(input);
                    expect(seen.has(key)).toBe(false); seen.add(key);
                    let expected: number;
                    if ('sourceNumerator' in row) expected = domain.task === 'decompose-proper' ? 1 / 3 / (row.denominator - 3)
                        : 1 / 5 / (row.denominator - 1);
                    else if ('wholeFactor' in row) expected = domain.task === 'unit-fraction-multiple' ? 1 / 15
                        : 1 / (domain.task.endsWith('-proper') ? 4 : 23);
                    else if (domain.task === 'fraction-operation') expected = 1 / 5 / (row.denominator - 1)
                        / (domain.operation === 'addition' ? row.denominator - row.firstNumerator : row.firstNumerator - 1);
                    else {
                        const a = row.firstNumerator, b = row.secondNumerator, d = row.denominator;
                        const regroup = domain.operation === 'addition' ? a + b > d : a < b;
                        const secondCount = domain.operation === 'addition' ? regroup ? a - 1 : d - a - 1 : regroup ? d - a - 1 : a - 1;
                        expected = 1 / 2 / 4 / (d - 2) / secondCount;
                    }
                    expect(weight).toBeCloseTo(expected, 14);
                    mass += weight; total++;
                }
            }
            expect(mass).toBeCloseTo(1, 12);
        }
        expect(total).toBe(315);
    });

    it('reaches and validates every finite case through the production sampler', () => {
        const draw = vi.spyOn(rng, 'random');
        const generator = new FractionArithmeticGenerator();
        let visited = 0;
        for (const domain of domains) for (const upper of bounds) {
            const range = createCanonicalNumericRange(upper), rows = domain.rows(range);
            const mass = rows.reduce((sum, row) => sum + row.weight, 0);
            let prior = 0;
            for (const row of rows) {
                draw.mockReset().mockReturnValue((prior + row.weight / 2) / mass);
                const data = generator.generate({task: domain.task, operation: domain.operation,
                    usesCommonDenominator: domain.operation !== 'multiplication', range}).data;
                expect(hasCanonicalRangeWitness(quantities(data), range)).toBe(true);
                expect(draw).toHaveBeenCalledTimes(1);
                prior += row.weight; visited++;
            }
        }
        expect(visited).toBe(315);
    });

    it('retains all450 tenths/hundredths pairs with the required factor10 and denominator product100', () => {
        const draw = vi.spyOn(rng, 'random');
        const seen = new Set<string>(), generator = new FractionArithmeticGenerator();
        for (let index = 0; index < 450; index++) {
            draw.mockReset().mockReturnValue((index + 0.5) / 450);
            const range = createCanonicalNumericRange(100);
            const data = generator.generate({task: 'tenths-hundredths-addition', operation: 'addition', usesCommonDenominator: true, range}).data;
            if (data.task !== 'tenths-hundredths-addition') throw new Error('Wrong task');
            seen.add(`${data.firstTenths.numerator}:${data.secondHundredths.numerator}`);
            expect(hasCanonicalRangeWitness(quantities(data), range)).toBe(true);
        }
        expect(seen.size).toBe(450);
    });

    it('rejects missing, malformed or empty ranges before drawing values', () => {
        const draw = vi.spyOn(rng, 'random'), generator = new FractionArithmeticGenerator();
        for (const range of [undefined, createCanonicalNumericRange(1000), createCanonicalNumericRange(10, 5),
            {...createCanonicalNumericRange(10), maximumAbove: 0}, {...createCanonicalNumericRange(10), minimumBelow: 10}])
            expect(() => generator.generate({task: 'fraction-operation', operation: 'addition', usesCommonDenominator: true, range})).toThrow();
        expect(() => generator.generate({task: 'whole-number-fraction-product-proper', operation: 'multiplication',
            usesCommonDenominator: false, range: createCanonicalNumericRange(5)})).toThrow(/No source/);
        expect(draw).not.toHaveBeenCalled();
    });
});
