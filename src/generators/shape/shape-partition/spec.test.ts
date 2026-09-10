import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {ShapePartitionGenerator} from './generator.ts';

const generator = new ShapePartitionGenerator();
describe('ShapePartitionGenerator schema', () => {
    it.each([
        [Scope.HalfFractions, 2], [Scope.ThirdFractions, 3], [Scope.QuarterFractions, 4],
        [Scope.SixthFractions, 6], [Scope.EighthFractions, 8]
    ] as const)('resolves and records the exact denominator %s', (label, parts) => {
        const result = generateWithLabels(generator, [Area.Rectangle, label])!;
        expect(result.data).toEqual({kind: 'partition', shape: 'rectangle', parts});
        expect(result.labels.sort()).toEqual([Area.Rectangle, label].sort());
    });
    it('keeps the same mathematical relation across task projections', () => {
        const labels = [Area.Circle, Scope.SixthFractions];
        const partition = generateWithLabels(generator, [...labels, Area.ShapeDecomposition, Ability.VisualArticulation])!;
        const composition = generateWithLabels(generator, [...labels, Area.ShapeSynthesis, Ability.ConceptComposition])!;
        expect(composition).toEqual(partition);
    });
    it('rejects competing shape or denominator alternatives', () => {
        expect(() => generateWithLabels(generator, [Area.Circle, Area.Rectangle, Scope.HalfFractions])).toThrow();
        expect(() => generateWithLabels(generator, [Area.Circle, Scope.HalfFractions, Scope.QuarterFractions])).toThrow();
    });
});
