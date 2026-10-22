import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {RatioTableComparisonsGenerator} from './generator.ts';

const generator = new RatioTableComparisonsGenerator();

describe('RatioTableComparisonsGenerator', () => {
    it('rejects missing and invalid relation configurations', () => {
        for (const config of [null, {}, {relation: null}, {relation: 'not-equal'}, {relation: 1}]) {
            expect(() => generator.generate(config as never)).toThrow();
        }
    });

    it.each(['less', 'equal', 'greater'] as const)('proves %s with equivalent tables sharing a consequent', relation => {
        const inputs = new Set<string>();
        let unlikeConsequents = 0;
        for (let seed = 0; seed < 120; seed++) {
            setSeed(seed);
            const {data} = generator.generate({relation});
            expect(data.kind).toBe('ratio-table-comparison');
            expect(data.relation).toBe(relation);
            expect(data.left.quantities).toEqual(data.right.quantities);
            const normalized = data.normalized;
            for (const [table, expected] of [[data.left, normalized.leftAntecedent], [data.right, normalized.rightAntecedent]] as const) {
                expect(table.coordinateScale.xMax / table.coordinateScale.xStep).toBeLessThanOrEqual(10);
                expect(table.coordinateScale.yMax / table.coordinateScale.yStep).toBeLessThanOrEqual(10);
                expect(table.rows).toHaveLength(4);
                expect(new Set(table.rows.map(row => row.scale)).size).toBe(4);
                for (const row of table.rows) {
                    expect(row.antecedent).toBe(table.base[0] * row.scale);
                    expect(row.consequent).toBe(table.base[1] * row.scale);
                    expect(Number.isSafeInteger(row.scale)).toBe(true);
                    expect(row.scale).toBeGreaterThan(0);
                }
                expect(table.rows.at(-1)).toMatchObject({antecedent: expected, consequent: normalized.consequent});
            }
            const actual = Math.sign(normalized.leftAntecedent - normalized.rightAntecedent);
            expect(actual).toBe(relation === 'less' ? -1 : relation === 'equal' ? 0 : 1);
            const cross = Math.sign(data.left.base[0] * data.right.base[1] - data.right.base[0] * data.left.base[1]);
            expect(actual).toBe(cross);
            if (data.left.base[1] !== data.right.base[1]) unlikeConsequents++;
            inputs.add(JSON.stringify(data));
        }
        expect(unlikeConsequents).toBeGreaterThan(40);
        expect(inputs.size).toBeGreaterThan(70);
    });

    it('replays an identical comparison', () => {
        setSeed(53);
        const first = generator.generate({relation: 'greater'});
        setSeed(53);
        expect(generator.generate({relation: 'greater'})).toEqual(first);
    });
});
