import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {ShapePartitionEquivalenceGenerator} from './generator.ts';
import {spec} from './spec.ts';

const generator = new ShapePartitionEquivalenceGenerator();

describe('ShapePartitionEquivalenceGenerator spec integration', () => {
    it('declares only the invariant mathematics', () => {
        expect(spec.generalLabels).toEqual([
            Area.ShapeEquivalenceRelations,
            Scope.EqualShares
        ]);
    });

    it.each([
        [Area.Circle, 'circle'],
        [Area.Rectangle, 'rectangle']
    ] as const)('resolves the %s variant', (shape, expectedShape) => {
        const stub = generateWithLabels(generator, [
            Area.ShapeEquivalenceRelations,
            Scope.EqualShares,
            Ability.ConceptDerivation,
            shape
        ])!;

        expect(stub.data.shape).toBe(expectedShape);
        expect(stub.tags).toContain(shape);
        expect(stub.tags).not.toContain(Ability.ConceptDerivation);
    });
});
