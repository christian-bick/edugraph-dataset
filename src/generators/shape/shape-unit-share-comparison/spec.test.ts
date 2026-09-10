import {Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {ShapeUnitShareComparisonGenerator} from './generator.ts';

describe('ShapeUnitShareComparisonGenerator schema', () => {
    it.each([[Area.Circle, 'circle'], [Area.Rectangle, 'rectangle']] as const)('resolves the whole shape %s', (label, shape) => {
        const result = generateWithLabels(new ShapeUnitShareComparisonGenerator(), [label])!;
        expect(result.data.shape).toBe(shape);
        expect(result.labels).toEqual([label]);
    });
});
