import {afterEach, describe, expect, it, vi} from 'vitest';
import * as rng from '../../../lib/random.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {unitScaleDomain} from '../unit-scale-domain.ts';
import {MeasurementUnitCountRelationsGenerator} from './generator.ts';

afterEach(() => vi.restoreAllMocks());
const generator = new MeasurementUnitCountRelationsGenerator();
const cells = [[0, 10], [0, 20], [5, 10], [5, 20]] as const;

describe('generic unit count relations', () => {
    it.each(cells)('retains every native count relation in lower%i/upper%i and omits the factor', (lower, upper) => {
        const range = createCanonicalNumericRange(upper, lower), rows = unitScaleDomain('counts', range);
        const draw = vi.spyOn(rng, 'random');
        for (const frame of rows) {
            const qRows = rows.filter(row => row.largeUnitCount === frame.largeUnitCount);
            draw.mockReturnValueOnce((rows.filter(row => row.largeUnitCount < frame.largeUnitCount).length + qRows.length / 2) / rows.length);
            draw.mockReturnValueOnce((qRows.findIndex(row => row.unitsPerLarge === frame.unitsPerLarge) + 0.5) / qRows.length);
            expect(generator.generate({range})).toEqual({data: {kind: 'generic-unit-count-relation',
                largeUnitCount: frame.largeUnitCount, smallUnitCount: frame.smallUnitCount}});
        }
        expect(draw).toHaveBeenCalledTimes(rows.length * 2);
    });

    it.each(cells)('replays lower%i/upper%i with exactly two original draws', (lower, upper) => {
        const range = createCanonicalNumericRange(upper, lower);
        rng.setSeed('unit-counts'); rng.random(); rng.random(); const state = rng.getRandomState();
        rng.setSeed('unit-counts'); const first = generator.generate({range});
        expect(rng.getRandomState()).toBe(state);
        rng.setSeed('unit-counts'); expect(generator.generate({range})).toEqual(first);
    });

    it('rejects absent, malformed and unsupported range constraints', () => {
        expect(() => generator.generate({})).toThrow(/Required field "range"/);
        expect(() => generator.generate(null as never)).toThrow();
        expect(() => generator.generate(undefined as never)).toThrow();
        expect(() => generator.generate({range: createCanonicalNumericRange(5)})).toThrow();
        expect(() => generator.generate({range: createCanonicalNumericRange(20, 10)})).toThrow();
        expect(() => generator.generate({range: {...createCanonicalNumericRange(10), maximumAbove: 0}})).toThrow();
    });
});
