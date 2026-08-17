import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {GeometryPerimeterGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('GeometryPerimeterGenerator spec integration', () => {
    it('declares perimeter calculation with integer lengths', () => {
        expect(spec.generalLabels).toEqual([
            Area.PerimeterCalculation,
            Scope.IntegerNumbers
        ]);
    });

    it.each([Area.Triangle, Area.Quadrilateral, Area.Pentagon, Area.Hexagon])(
        'generates the reviewed %s target',
        polygonShape => {
            const stub = generateWithLabels(new GeometryPerimeterGenerator(), [
                Area.PerimeterCalculation,
                Scope.IntegerNumbers,
                Ability.ProcedureExecution,
                polygonShape
            ]);

            expect(stub).not.toBeNull();
            expect(stub!.data.vertices).toHaveLength(stub!.data.sideLengths.length);
            expect(stub!.data.perimeter).toBe(
                stub!.data.sideLengths.reduce((sum, length) => sum + length, 0)
            );
        }
    );

    it('retains exact Quadrilateral capability matching alongside Rectangle', () => {
        const stub = generateWithLabels(new GeometryPerimeterGenerator(), [
            Area.PerimeterCalculation,
            Scope.IntegerNumbers,
            Ability.ProcedureExecution,
            Area.Quadrilateral
        ]);

        expect(stub).not.toBeNull();
        expect(stub!.data).toMatchObject({task: 'find-perimeter', shape: 'quadrilateral'});
        expect(stub!.tags).toContain(Area.Quadrilateral);
    });

    it.each([Area.Triangle, Area.Quadrilateral, Area.Pentagon, Area.Hexagon])(
        'generates the reviewed inverse %s target',
        polygonShape => {
            const stub = generateWithLabels(new GeometryPerimeterGenerator(), [
                Area.PerimeterCalculation,
                Scope.IntegerNumbers,
                Ability.ProcedureInversion,
                polygonShape
            ]);

            expect(stub).not.toBeNull();
            expect(stub!.data.task).toBe('find-missing-side');
        }
    );

    it('resolves the Grade 4 rectangle perimeter formula', () => {
        const stub = generateWithLabels(new GeometryPerimeterGenerator(), [
            Area.PerimeterCalculation,
            Area.Equation,
            Area.Rectangle,
            Area.Addition,
            Scope.IntegerNumbers,
            Ability.ProcedureExecution
        ]);

        expect(stub).not.toBeNull();
        expect(stub!.data.task).toBe('rectangle-perimeter-formula');
        expect(stub!.tags).toEqual(expect.arrayContaining([
            Area.Equation,
            Area.Addition,
            Area.Rectangle
        ]));
    });

    it('resolves Grade 4 inverse rectangle perimeter to a missing dimension', () => {
        const stub = generateWithLabels(new GeometryPerimeterGenerator(), [
            Area.PerimeterCalculation,
            Area.Equation,
            Area.Rectangle,
            Area.Addition,
            Scope.IntegerNumbers,
            Ability.ProcedureInversion
        ]);

        expect(stub).not.toBeNull();
        expect(stub!.data.task).toBe('find-missing-perimeter-dimension');
    });
});
