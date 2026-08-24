import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {ShapeEqualSquarePartitionGenerator} from './generator.ts';

const generator = new ShapeEqualSquarePartitionGenerator();

describe('ShapeEqualSquarePartitionGenerator', () => {
    it('authors a canonical equal-square partition relation', () => {
        setSeed(7);
        const data = generator.generate({}).data;

        expect(data).toEqual({
            kind: 'equal-square-partition',
            rows: expect.any(Number),
            columns: expect.any(Number),
            partCount: data.rows * data.columns
        });
        expect(data.rows).not.toBe(data.columns);
        expect(data).not.toHaveProperty('areaUnit');
        expect(data).not.toHaveProperty('model');
    });

    it('is deterministic for a fixed seed', () => {
        setSeed(18);
        const first = generator.generate({});
        setSeed(18);
        expect(generator.generate({})).toEqual(first);
    });
});
