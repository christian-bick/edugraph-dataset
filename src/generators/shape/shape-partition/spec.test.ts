import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {ShapePartitionGenerator} from './generator.ts';

describe('ShapePartitionGenerator spec integration', () => {
    const generator = new ShapePartitionGenerator();

    it('resolves circle and rectangle partition targets', () => {
        for (const shape of [Area.Circle, Area.Rectangle] as const) {
            const stub = generateWithLabels(generator, [
                Area.FractionNotation,
                Scope.ShapeProperties,
                Ability.ConceptDerivation,
                shape
            ]);
            expect(stub).not.toBeNull();
            expect(stub!.tags).toContain(shape);
        }
    });
});
