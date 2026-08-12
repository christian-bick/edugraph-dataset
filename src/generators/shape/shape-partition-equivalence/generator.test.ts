import {Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {ShapePartitionEquivalenceGenerator} from './generator.ts';

const generator = new ShapePartitionEquivalenceGenerator();

describe('ShapePartitionEquivalenceGenerator', () => {
    it('strictly requires the shape', () => {
        expect(() => generator.generate({})).toThrow(GeneratorValidationError);
    });

    it.each([
        [Area.Circle, 'circle', 'curved'],
        [Area.Rectangle, 'rectangle', 'diagonal']
    ] as const)('creates two equal but differently shaped shares for %s', (
        shape,
        expectedShape,
        secondPartition
    ) => {
        expect(generator.generate({shape})!.data).toEqual({
            shape: expectedShape,
            parts: 2,
            firstPartition: 'straight',
            secondPartition,
            conclusion: 'equal shares can have different shapes'
        });
    });

    it('rejects unsupported shapes', () => {
        expect(generator.generate({
            shape: 'unsupported' as typeof Area.Circle
        })).toBeNull();
    });
});
