import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {ShapeSquareArrayGenerator} from './generator.ts';
import {spec} from './spec.ts';

const generator = new ShapeSquareArrayGenerator();

describe('ShapeSquareArrayGenerator spec integration', () => {
    it('declares the shared square identity once', () => {
        expect(spec.generalLabels).toEqual([Area.Square]);
        expect(spec.generalLabels).not.toContain(Area.Rectangle);
    });

    it.each([
        [Ability.VisualArticulation, 'partition'],
        [Ability.ProcedureExecution, 'count']
    ] as const)('resolves %s to one exact task', (ability, task) => {
        const stub = generateWithLabels(generator, [
            Area.Rectangle,
            Area.Square,
            Area.ShapeComposition,
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
});
