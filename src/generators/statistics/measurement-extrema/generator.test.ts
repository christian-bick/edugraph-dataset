import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {MeasurementExtremaGenerator} from './generator.ts';

describe('MeasurementExtremaGenerator', () => {
    const generator = new MeasurementExtremaGenerator();

    it.each(['addition', 'subtraction'] as const)('generates coherent extrema %s for either unit', operation => {
        const starts = new Set<number>();
        for (const unitScale of ['cm', 'in'] as const) for (let seed = 0; seed < 200; seed++) {
            const config = {operation, unitScale};
            setSeed(seed);
            const data = generator.generate(config).data;
            const values = data.observations.map(({value}) => value);
            const eighths = values.map(value => value * 8);
            expect(data.unit).toBe(unitScale);
            expect(data.subdivisions).toBe(8);
            expect(values).toHaveLength(6);
            expect(new Set(values).size).toBeLessThan(6);
            expect(eighths.every(value => Number.isInteger(value) && value >= 8 && value <= 32)).toBe(true);
            for (const remainder of [1, 2, 4]) expect(eighths.some(value => value % 8 === remainder)).toBe(true);
            const shortest = Math.min(...values);
            const longest = Math.max(...values);
            expect(data.extremaRelation).toEqual({
                operation, shortest, longest,
                answer: operation === 'addition' ? shortest + longest : longest - shortest
            });
            starts.add(Math.floor(shortest));
            setSeed(seed);
            expect(generator.generate(config).data).toEqual(data);
        }
        expect(starts).toEqual(new Set([1, 2]));
    });

    it('rejects incomplete or unsupported configuration', () => {
        expect(() => generator.generate({})).toThrow();
        expect(() => generator.generate(null as never)).toThrow();
        expect(() => generator.generate({operation: 'addition'})).toThrow();
        expect(() => generator.generate({unitScale: 'in'})).toThrow();
        expect(() => generator.generate({unitScale: 'in', operation: 'multiply'} as never)).toThrow();
        expect(() => generator.generate({unitScale: 'm', operation: 'addition'} as never)).toThrow();
    });
});
