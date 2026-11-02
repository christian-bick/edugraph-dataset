import {afterEach, describe, expect, it, vi} from 'vitest';
import * as randomness from '../../../lib/random.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {CountingSelectionGenerator} from './generator.ts';
import {countingSupplyRows, selectionCountingProfiles} from '../canonical-counting-domains.ts';

describe('CountingSelectionGenerator', () => {
    const generator = new CountingSelectionGenerator();
    afterEach(() => vi.restoreAllMocks());
    it('requires range and requested-count parity', () => {
        expect(() => generator.generate(null as never)).toThrow();
        expect(() => generator.generate({})).toThrow();
        expect(() => generator.generate({range: createCanonicalNumericRange(5)})).toThrow('parity');
        expect(() => generator.generate({parity: 'any'})).toThrow('range');
    });
    it('retains every feasible pair in exact weighted row bins, drawing request before supply', () => {
        const draw = vi.spyOn(randomness, 'random');
        for (const parity of ['any', 'even', 'odd'] as const) for (const {range} of selectionCountingProfiles) {
            const rows = countingSupplyRows(range, parity);
            const total = rows.reduce((sum, row) => sum + row.weight, 0);
            let offset = 0;
            for (const row of rows) {
                for (let available = row.first; available <= row.last; available++) {
                    draw.mockReset().mockReturnValueOnce((offset + row.weight / 2) / total)
                        .mockReturnValueOnce((available - row.first + .5) / (row.last - row.first + 1));
                    expect(generator.generate({range, parity})!.data).toEqual({
                        numObjects: row.requested, simpleAnswer: row.requested, availableCount: available,
                        ...(parity === 'any' ? {} : {parity})
                    });
                    expect(draw).toHaveBeenCalledTimes(2);
                }
                offset += row.weight;
            }
        }
    });
    it.each(['even', 'odd'] as const)('does not apply requested parity %s to the available collection', parity => {
        const rows = countingSupplyRows(createCanonicalNumericRange(5), parity);
        const row = rows[0]!;
        vi.spyOn(randomness, 'random').mockReturnValueOnce(0)
            .mockReturnValueOnce((1.5) / (row.last - row.first + 1));
        const data = generator.generate({range: createCanonicalNumericRange(5), parity})!.data;
        expect(data.numObjects % 2).toBe(parity === 'even' ? 0 : 1);
        expect(data.availableCount).toBe(data.numObjects + 1);
    });
    it('retains equality away from threshold singletons and excludes only threshold equality', () => {
        const range = createCanonicalNumericRange(10, 5);
        const rows = countingSupplyRows(range, 'any');
        const row = rows.find(row => row.requested === 6)!;
        const total = rows.reduce((sum, row) => sum + row.weight, 0);
        const before = rows.slice(0, rows.indexOf(row)).reduce((sum, row) => sum + row.weight, 0);
        vi.spyOn(randomness, 'random').mockReturnValueOnce((before + row.weight / 2) / total).mockReturnValueOnce(0);
        expect(generator.generate({range, parity: 'any'})!.data).toEqual({
            numObjects: 6, simpleAnswer: 6, availableCount: 6});
        for (const threshold of [5, 10, 20]) {
            const all = selectionCountingProfiles.flatMap(({range}) => countingSupplyRows(range, 'any'));
            expect(all.some(row => row.requested === threshold && row.first <= threshold && row.last >= threshold)).toBe(false);
        }
    });
    it('replays deterministically with exactly two draws', () => {
        const config = {range: createCanonicalNumericRange(20, 5), parity: 'any' as const};
        randomness.setSeed(42); randomness.random(); randomness.random(); const continuation = randomness.getRandomState();
        randomness.setSeed(42); const first = generator.generate(config);
        expect(first).not.toBeNull(); expect(randomness.getRandomState()).toBe(continuation);
        randomness.setSeed(42); expect(generator.generate(config)).toEqual(first);
        expect(randomness.getRandomState()).toBe(continuation);
    });
    it('rejects invalid and noncanonical bounds without drawing', () => {
        const draw = vi.spyOn(randomness, 'random');
        for (const range of [{min: 10, max: 5}, {min: 0, max: 0}, {min: 1.5, max: 10},
            {min: NaN, max: 10}, {min: 0, max: Infinity}, {min: 5, max: 5},
            {...createCanonicalNumericRange(5), minimumBelow: 10}]) {
            expect(generator.generate({range: range as never, parity: 'any'})).toBeNull();
        }
        expect(draw).not.toHaveBeenCalled();
    });
});
