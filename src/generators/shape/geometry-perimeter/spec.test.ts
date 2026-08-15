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
});
