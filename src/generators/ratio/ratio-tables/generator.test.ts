import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {RatioTablesGenerator} from './generator.ts';

const generator = new RatioTablesGenerator();

describe('RatioTablesGenerator', () => {
    it('requires the resolved mathematical range', () => {
        for (const config of [null, {}, {range: null}, {range: {min: 0, max: 5}}]) {
            expect(() => generator.generate(config as never)).toThrow();
        }
    });

    it.each([20, 100])('keeps four equivalent positive integer rows below %s', max => {
        const instances = new Set<string>();
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const {data} = generator.generate({range: {min: 0, max}});
            expect(data.kind).toBe('ratio-table');
            expect(data.rows).toHaveLength(4);
            expect(new Set(data.rows.map(row => row.scale)).size).toBe(4);
            for (const row of data.rows) {
                expect(row.antecedent).toBe(data.base[0] * row.scale);
                expect(row.consequent).toBe(data.base[1] * row.scale);
                expect(Number.isSafeInteger(row.antecedent)).toBe(true);
                expect(Number.isSafeInteger(row.consequent)).toBe(true);
                expect(row.antecedent).toBeGreaterThan(0);
                expect(row.consequent).toBeGreaterThan(0);
                expect(row.antecedent).toBeLessThan(max);
                expect(row.consequent).toBeLessThan(max);
                expect(row.antecedent).toBeLessThanOrEqual(data.coordinateScale.xMax);
                expect(row.consequent).toBeLessThanOrEqual(data.coordinateScale.yMax);
                expect(row.antecedent % data.coordinateScale.xStep).toBe(0);
                expect(row.consequent % data.coordinateScale.yStep).toBe(0);
            }
            expect(data.coordinateScale.xMax / data.coordinateScale.xStep).toBeLessThanOrEqual(10);
            expect(data.coordinateScale.yMax / data.coordinateScale.yStep).toBeLessThanOrEqual(10);
            expect(Object.keys(data).sort()).toEqual(['base', 'coordinateScale', 'kind', 'quantities', 'rows']);
            instances.add(JSON.stringify(data));
        }
        expect(instances.size).toBeGreaterThan(25);
    });

    it('replays identical rows', () => {
        setSeed(48);
        const first = generator.generate({range: {min: 0, max: 20}});
        setSeed(48);
        expect(generator.generate({range: {min: 0, max: 20}})).toEqual(first);
    });
});
