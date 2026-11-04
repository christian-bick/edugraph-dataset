import {Area} from 'edugraph-ts';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import * as rng from '../../../lib/random.ts';
import {decimalNativePaths} from '../decimal-writing.test-fixtures.ts';
import {DecimalReadingRelationsGenerator} from '../decimal-reading-relations/generator.ts';
import {DecimalWritingGenerator} from './generator.ts';

afterEach(() => vi.restoreAllMocks());

describe('complete decimal-value native support and conditional law', () => {
    it.each(Array.from({length: 10}, (_, whole) => whole))(
        'retains all1008 original precision/pattern paths and999 complete values for whole%s', whole => {
            const paths = decimalNativePaths(whole), writing = new DecimalWritingGenerator(), reading = new DecimalReadingRelationsGenerator();
            const range = createCanonicalNumericRange(whole < 5 ? 5 : 10, whole < 5 ? 0 : 5);
            const wholeDraw = (whole % 5 + 0.5) / 5;
            let queue: number[] = [];
            const draw = vi.spyOn(rng, 'random').mockImplementation(() => {
                const next = queue.shift();
                if (next === undefined) throw Error('Unexpected conditional draw or retry');
                return next;
            });
            const masses = new Map<string, number>(), precisionMasses = new Map<string, number>();
            for (const path of paths) {
                for (const notationFamily of [Area.DecimalNotation, Area.NumberNameNotation] as const) {
                    queue = [wholeDraw, ...path.fractionDraws];
                    draw.mockClear();
                    expect(writing.generate({notationFamily, range})!.data).toEqual(path.data);
                    expect(queue).toEqual([]);
                    expect(draw).toHaveBeenCalledTimes(path.fractionDraws.length + 1);
                }
                queue = [wholeDraw, ...path.fractionDraws];
                draw.mockClear();
                const relation = reading.generate({range})!.data;
                const fraction = path.data.valueInThousandths % 1000;
                expect(relation).toEqual({kind: 'decimal-reading-relation', source: path.data,
                    comparisonValues: [1, 10, 100].map(offset => whole * 1000
                        + (fraction + offset <= 999 ? fraction + offset : fraction - offset))});
                expect(queue).toEqual([]);
                expect(draw).toHaveBeenCalledTimes(path.fractionDraws.length + 1);
                const quantities = [relation.source.valueInThousandths, ...relation.comparisonValues].map(value => value / 1000);
                expect(quantities.every(value => value > 0 && value >= range.min && value <= range.max)).toBe(true);
                masses.set(path.data.canonicalNumeral, (masses.get(path.data.canonicalNumeral) ?? 0) + path.mass);
                const precision = path.data.fractionalPart.precision;
                precisionMasses.set(precision, (precisionMasses.get(precision) ?? 0) + path.mass);
            }
            expect(paths).toHaveLength(1008);
            expect(masses.size).toBe(999);
            expect([...masses.values()].reduce((a, b) => a + b, 0)).toBe(364500);
            expect(Object.fromEntries(precisionMasses)).toEqual({tenths: 43740, hundredths: 43740, thousandths: 277020});
            // Hundredths with a zero tenths digit retain both proposal paths:
            // 1/2 directly selects zero; 1/2 ×1/10 selects it again.
            expect(masses.get(whole + '.05')).toBe(2673);
            expect(masses.get(whole + '.15')).toBe(243);
            expect(masses.get(whole + '.5')).toBe(4860);
            expect(masses.get(whole + '.005')).toBe(7695);
            expect(masses.get(whole + '.105')).toBe(855);
            expect(masses.get(whole + '.015')).toBe(855);
            expect(masses.get(whole + '.115')).toBe(95);
        }
    );

    it.each([0, 5])('conditions the original uniform whole proposal on the band starting at%s', lower => {
        const generator = new DecimalWritingGenerator();
        const range = createCanonicalNumericRange(lower === 0 ? 5 : 10, lower);
        let queue: number[] = [];
        const draw = vi.spyOn(rng, 'random').mockImplementation(() => queue.shift()!);
        for (let bin = 0; bin < 5; bin++) {
            for (const first of [bin / 5, (bin + 1) / 5 - 2 ** -33]) {
                queue = [first, 0.06, 0.5];
                draw.mockClear();
                expect(generator.generate({notationFamily: Area.DecimalNotation, range})!.data.wholePart).toBe(lower + bin);
                expect(draw).toHaveBeenCalledTimes(3);
                expect(queue).toEqual([]);
            }
        }
        // Each band contains five equally weighted whole values:1822500 raw
        // mass units. U5's former zero/positive-whole components have mass1:4.
        const originalMasses = [0, 1, 2, 3, 4].map(whole => decimalNativePaths(whole + lower).reduce((sum, path) => sum + path.mass, 0));
        expect(originalMasses).toEqual([364500, 364500, 364500, 364500, 364500]);
        expect(originalMasses.reduce((a, b) => a + b, 0)).toBe(1822500);
        expect(originalMasses.slice(1).reduce((a, b) => a + b, 0)).toBe(originalMasses[0]! * 4);
    });
});
