import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {AreaDecompositionGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('AreaDecompositionGenerator spec integration', () => {
    it('declares the distributive area-model structure', () => {
        expect(spec.generalLabels).toEqual([
            Area.AreaCalculation,
            Area.Rectangle,
            Area.ShapeComposition,
            Area.Multiplication,
            Area.Addition,
            Area.DistributiveLaw,
            Scope.ThreeOperands
        ]);
    });

    it('generates from the reviewed target labels', () => {
        const stub = generateWithLabels(new AreaDecompositionGenerator(), [
            Area.AreaCalculation,
            Area.Rectangle,
            Area.ShapeComposition,
            Area.Multiplication,
            Area.Addition,
            Area.DistributiveLaw,
            Scope.ThreeOperands,
            Ability.ProcedureUnderstanding
        ]);

        expect(stub).not.toBeNull();
        expect(stub!.data.totalArea).toBe(stub!.data.leftArea + stub!.data.rightArea);
    });
});
