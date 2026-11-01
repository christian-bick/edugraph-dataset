import {describe, expect, it, vi} from 'vitest';
import * as rng from '../../../lib/random.ts';
import {hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {assertRatioComparison} from '../../../visuals/views/ratio/ratio-table-helpers.ts';
import {RatioTableComparisonsGenerator} from './generator.ts';
import {comparisonFramesForRange, comparisonRangeProfiles} from './numeric-domain.ts';

describe('RatioTableComparisonsGenerator', () => {
    it('preserves every original comparison in all four quantity contexts with exact canonical bounds', () => {
        const generator = new RatioTableComparisonsGenerator();
        const expected = new Set<string>();
        const contexts = ['red beads', 'apples', 'flour', 'paint'];
        for (let numerator = 1; numerator <= 8; numerator++) for (let denominator = 1; denominator <= 4; denominator++) {
            for (const context of contexts) {
                for (const multiple of [2, 3]) expected.add(`equal:${numerator},${denominator}:${numerator * multiple},${denominator * multiple}:${context}`);
                for (let secondDenominator = 1; secondDenominator <= 4; secondDenominator++) for (let gap = 1; gap <= 3; gap++) {
                    const small = `${numerator},${denominator}`;
                    const large = `${Math.floor(numerator * secondDenominator / denominator) + gap},${secondDenominator}`;
                    expected.add(`less:${small}:${large}:${context}`);
                    expected.add(`greater:${large}:${small}:${context}`);
                }
            }
        }
        const seen = new Set<string>();
        const draw = vi.spyOn(rng, 'random');
        try {
            for (const relation of ['less', 'equal', 'greater'] as const) for (const {range} of comparisonRangeProfiles) {
                const pool = comparisonFramesForRange(relation, range);
                for (let index = 0; index < pool.length; index++) for (let context = 0; context < contexts.length; context++) {
                    draw.mockClear().mockReturnValueOnce((context + 0.5) / contexts.length).mockReturnValueOnce((index + 0.5) / pool.length);
                    const {data} = generator.generate({relation, range});
                    assertRatioComparison('ratio-table-comparison', data);
                    const key = `${relation}:${data.left.base}:${data.right.base}:${data.left.quantities[0].name}`;
                    expect(seen.has(key)).toBe(false);
                    seen.add(key);
                    const values = [data.left, data.right].flatMap(table => table.rows.flatMap(row => [row.antecedent, row.consequent]));
                    expect(hasCanonicalRangeWitness(values, range)).toBe(true);
                    expect(data.left.quantities).toEqual(data.right.quantities);
                    expect(Math.sign(data.normalized.leftAntecedent - data.normalized.rightAntecedent))
                        .toBe(relation === 'less' ? -1 : relation === 'equal' ? 0 : 1);
                    for (const table of [data.left, data.right]) {
                        expect(new Set(table.rows.map(row => row.scale)).size).toBe(4);
                        expect(table.coordinateScale.xMax / table.coordinateScale.xStep).toBeLessThanOrEqual(10);
                        expect(table.coordinateScale.yMax / table.coordinateScale.yStep).toBeLessThanOrEqual(10);
                    }
                    expect(draw).toHaveBeenCalledTimes(2);
                }
            }
            expect(seen).toEqual(expected);
            expect(seen.size).toBe(3328);
        } finally { draw.mockRestore(); }
    }, 20000);

    it('rejects missing, invalid and infeasible configurations before drawing', () => {
        const generator = new RatioTableComparisonsGenerator();
        const draw = vi.spyOn(rng, 'random');
        try {
            for (const config of [null, {}, {relation: null}, {relation: 'not-equal'}, {relation: 1},
                {relation: 'equal'}, {relation: 'equal', range: {min: 0, max: 10}},
                {relation: 'equal', range: comparisonRangeProfiles.at(-1)!.range}]) {
                expect(() => generator.generate(config as never)).toThrow();
            }
            expect(draw).not.toHaveBeenCalled();
        } finally { draw.mockRestore(); }
    });

    it('replays a selected profile and preserves its random continuation', () => {
        const generator = new RatioTableComparisonsGenerator();
        const config = {relation: 'greater', range: comparisonRangeProfiles[0]!.range} as const;
        rng.setSeed(53);
        const first = generator.generate(config);
        const continuation = rng.random();
        rng.setSeed(53);
        expect(generator.generate(config)).toEqual(first);
        expect(rng.random()).toBe(continuation);
    });
});
