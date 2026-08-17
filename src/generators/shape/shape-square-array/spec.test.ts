import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {ShapeSquareArrayGenerator} from './generator.ts';
import {spec} from './spec.ts';

const generator = new ShapeSquareArrayGenerator();

describe('ShapeSquareArrayGenerator spec integration', () => {
    it('keeps task-specific shape identities in the schema', () => {
        expect(spec.generalLabels).toEqual([]);
        expect(spec.generalLabels).not.toContain(Area.Rectangle);
    });

    it.each([
        [Ability.VisualArticulation, 'partition'],
        [Ability.ProcedureExecution, 'count']
    ] as const)('resolves %s to one exact task', (ability, task) => {
        const stub = generateWithLabels(generator, [
            Area.Rectangle,
            Area.Square,
            Area.ShapeDecomposition,
            Scope.BoxArrangement,
            Scope.EqualShares,
            ability
        ])!;

        expect(stub.data.task).toBe(task);
        expect(stub.tags).toContain(ability);
    });

    it('resolves tile-scale interpretation to one unit square', () => {
        const stub = generateWithLabels(generator, [
            Area.Square,
            Scope.TileScale,
            Ability.Interpretation
        ])!;

        expect(stub.data).toEqual({
            task: 'interpret-unit',
            rows: 1,
            columns: 1,
            squareCount: 1
        });
        expect(stub.tags).toEqual(expect.arrayContaining([
            Scope.TileScale,
            Ability.Interpretation
        ]));
    });

    it('resolves iterated tile-scale interpretation to exhaustive coverage', () => {
        const stub = generateWithLabels(generator, [
            Area.AreaCalculation,
            Area.Iteration,
            Area.Square,
            Scope.TileScale,
            Scope.IntegerNumbers,
            Ability.Interpretation
        ])!;

        expect(stub.data.task).toBe('interpret-coverage');
        expect(stub.data.squareCount).toBe(stub.data.rows * stub.data.columns);
        expect(stub.tags).toEqual(expect.arrayContaining([
            Area.AreaCalculation,
            Area.Iteration,
            Scope.TileScale,
            Scope.IntegerNumbers,
            Ability.Interpretation
        ]));
    });

    it.each([
        [undefined, 'square units'],
        [Scope.SquareCentimeterScale, 'square centimeters'],
        [Scope.SquareMeterScale, 'square meters'],
        [Scope.SquareInchScale, 'square inches'],
        [Scope.SquareFootScale, 'square feet']
    ] as const)('resolves area counting for %s', (scale, areaUnit) => {
        const stub = generateWithLabels(generator, [
            Area.AreaCalculation,
            Area.Iteration,
            Area.Square,
            Scope.TileScale,
            Scope.IntegerNumbers,
            Ability.ProcedureExecution,
            ...(scale ? [scale] : [])
        ])!;

        expect(stub.data.task).toBe('count-area');
        expect(stub.data.areaUnit).toBe(areaUnit);
        expect(stub.data.squareCount).toBe(stub.data.rows * stub.data.columns);
    });

    it('resolves procedure understanding to a tiled side-length product', () => {
        const stub = generateWithLabels(generator, [
            Area.AreaCalculation,
            Area.Rectangle,
            Area.Square,
            Area.Multiplication,
            Scope.BoxArrangement,
            Scope.TwoOperands,
            Ability.ProcedureUnderstanding
        ])!;

        expect(stub.data.task).toBe('explain-product');
        expect(stub.data.areaUnit).toBe('square units');
        expect(stub.data.squareCount).toBe(stub.data.rows * stub.data.columns);
    });

    it.each([false, true])('resolves rectangular area calculation with story=%s', useStory => {
        const stub = generateWithLabels(generator, [
            Area.AreaCalculation,
            Area.Rectangle,
            Area.Multiplication,
            Scope.TwoOperands,
            Ability.ProcedureExecution,
            ...(useStory ? [Ability.TextualReception] : [])
        ])!;

        expect(stub.data.task).toBe('calculate-area');
        expect(stub.data.areaUnit).toBe('square units');
        expect(stub.data.squareCount).toBe(stub.data.rows * stub.data.columns);
    });

    it('resolves the Grade 4 rectangle area formula separately from legacy calculation', () => {
        const stub = generateWithLabels(generator, [
            Area.AreaCalculation,
            Area.Equation,
            Area.Rectangle,
            Area.Multiplication,
            Scope.IntegerNumbers,
            Scope.TwoOperands,
            Ability.ProcedureExecution
        ])!;

        expect(stub.data.task).toBe('rectangle-area-formula');
        expect(stub.tags).toEqual(expect.arrayContaining([
            Area.Equation,
            Scope.TwoOperands,
            Ability.ProcedureExecution
        ]));
    });

    it('resolves Grade 4 inverse rectangle area to a missing dimension', () => {
        const stub = generateWithLabels(generator, [
            Area.AreaCalculation,
            Area.Equation,
            Area.Rectangle,
            Area.Multiplication,
            Scope.IntegerNumbers,
            Scope.TwoOperands,
            Ability.ProcedureInversion
        ])!;

        expect(stub.data.task).toBe('find-missing-area-dimension');
        expect(stub.tags).toContain(Ability.ProcedureInversion);
    });
});
