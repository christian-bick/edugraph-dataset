import {afterEach, describe, expect, it, vi} from 'vitest';
import {hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import * as randomness from '../../../lib/random.ts';
import {ratioQuantities} from '../helpers.ts';
import {RatioTablesGenerator} from './generator.ts';
import {ratioTableBaseRows, ratioTableRangeProfiles} from './numeric-domain.ts';

describe('ratio-table canonical base domains', () => {
    afterEach(() => vi.restoreAllMocks());
    it('retains all576 original pairs in one canonical profile and preserves uniform pair weights', () => {
        const seen = new Set<string>(), sizes = [];
        for (const {range} of ratioTableRangeProfiles) {
            const rows = ratioTableBaseRows(range);
            sizes.push(rows.reduce((sum, row) => sum + row.seconds.length, 0));
            for (const row of rows) for (const second of row.seconds) {
                const key = `${row.first}/${second}`;
                expect(seen.has(key)).toBe(false);
                seen.add(key);
                expect(row.weight / row.seconds.length).toBe(1);
                const table = [1,2,3,4].flatMap(scale => [row.first * scale, second * scale]);
                // Distinct, actual quantity sets for all three required tasks.
                expect(hasCanonicalRangeWitness([...table,2,3,4], range)).toBe(true);
                expect(hasCanonicalRangeWitness([...table,3,4], range)).toBe(true);
                expect(hasCanonicalRangeWitness([...table,0,row.first,second,4*row.first,4*second], range)).toBe(true);
            }
        }
        expect(sizes).toEqual([1,3,21,551]);
        expect(seen.size).toBe(576);
        for (let first = 1; first <= 24; first++) for (let second = 1; second <= 24; second++)
            expect(seen.has(`${first}/${second}`)).toBe(true);
    });
    it('generates all2304 original numeric/context frames in exact weighted bins with three draws', () => {
        const draw = vi.spyOn(randomness, 'random'), producer = new RatioTablesGenerator();
        let frames = 0;
        for (const {range} of ratioTableRangeProfiles) {
            const rows = ratioTableBaseRows(range), total = rows.reduce((sum, row) => sum + row.weight, 0);
            let offset = 0;
            for (const row of rows) {
                for (let index = 0; index < row.seconds.length; index++) for (let context = 0; context < ratioQuantities.length; context++) {
                    draw.mockReset().mockReturnValueOnce((offset + row.weight / 2) / total)
                        .mockReturnValueOnce((index + .5) / row.seconds.length)
                        .mockReturnValueOnce((context + .5) / ratioQuantities.length);
                    const second = row.seconds[index]!, data = producer.generate({range}).data;
                    expect(data).toEqual({kind: 'ratio-table', base: [row.first, second], quantities: ratioQuantities[context],
                        rows: [1,2,3,4].map(scale => ({antecedent: row.first * scale, consequent: second * scale, scale})),
                        coordinateScale: {xStep: row.first, yStep: second, xMax: row.first * 4, yMax: second * 4}});
                    expect(draw).toHaveBeenCalledTimes(3);
                    frames++;
                }
                offset += row.weight;
            }
        }
        expect(frames).toBe(2304);
    });
    it('consumes three original mathematical draws and rejects malformed witnesses before entropy', () => {
        const producer = new RatioTablesGenerator(), config = {range: ratioTableRangeProfiles[3]!.range};
        randomness.setSeed(42); randomness.random(); randomness.random(); randomness.random();
        const continuation = randomness.getRandomState();
        randomness.setSeed(42); producer.generate(config);
        expect(randomness.getRandomState()).toBe(continuation);
        const draw = vi.spyOn(randomness, 'random');
        expect(() => producer.generate({range: {...config.range, maximumAbove: 0}})).toThrow();
        expect(draw).not.toHaveBeenCalled();
        expect(ratioTableBaseRows({...config.range, min: 5})).toEqual([]);
    });
});
