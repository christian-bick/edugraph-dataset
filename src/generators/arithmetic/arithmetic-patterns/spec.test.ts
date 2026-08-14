import {Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {ArithmeticPatternsGenerator} from './generator.ts';

describe('ArithmeticPatternsGenerator spec integration', () => {
    const generator = new ArithmeticPatternsGenerator();

    it.each([
        [Area.Addition, undefined],
        [Area.Multiplication, undefined],
        [Area.Addition, Area.CommutativeLaw],
        [Area.Addition, Area.AssociativeLaw],
        [Area.Multiplication, Area.CommutativeLaw],
        [Area.Multiplication, Area.AssociativeLaw],
        [Area.Multiplication, Area.DistributiveLaw]
    ] as const)('resolves %s with %s', (operation, property) => {
        const labels = property ? [operation, property] : [operation];
        const stub = generateWithLabels(generator, labels)!;
        expect(stub).not.toBeNull();
        expect(stub.tags).toEqual(expect.arrayContaining(labels));
    });
});
