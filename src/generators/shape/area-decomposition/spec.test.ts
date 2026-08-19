import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {AreaDecompositionGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('AreaDecompositionGenerator spec integration', () => {
    it('declares the shared additive area-decomposition structure', () => {
        expect(spec.generalLabels).toEqual([
            Area.AreaCalculation,
            Area.Rectangle,
            Area.ShapeDecomposition,
            Area.Addition
        ]);
    });

    it('generates from the reviewed target labels', () => {
        const stub = generateWithLabels(new AreaDecompositionGenerator(), [
            Area.AreaCalculation,
            Area.Rectangle,
            Area.ShapeDecomposition,
            Area.Multiplication,
            Area.Addition,
            Area.DistributiveLaw,
            Scope.ThreeOperands,
            Ability.ProcedureUnderstanding
        ]);

        expect(stub).not.toBeNull();
        expect(stub!.data.totalArea).toBe(stub!.data.leftArea + stub!.data.rightArea);
    });

    it('generates the reviewed rectilinear decomposition target', () => {
        const stub = generateWithLabels(new AreaDecompositionGenerator(), [
            Area.AreaCalculation,
            Area.Rectangle,
            Area.ShapeDecomposition,
            Area.Addition,
            Ability.VisualDecomposition,
            Ability.ProcedureExecution
        ]);

        expect(stub).not.toBeNull();
        expect(stub!.data.kind).toBe('rectilinear');
        expect(stub!.data.totalArea).toBe(stub!.data.leftArea + stub!.data.rightArea);
        expect(stub!.tags).not.toContain(Ability.VisualDecomposition);
    });
});
