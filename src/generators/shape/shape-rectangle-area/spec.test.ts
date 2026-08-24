import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {extractSchemaLabels, generateWithLabels} from '../../../lib/utils.ts';
import {ShapeRectangleAreaGenerator} from './generator.ts';
import {ShapeRectangleAreaGeneratorSchema, spec} from './spec.ts';

const generator = new ShapeRectangleAreaGenerator();
const baseLabels = [
    Area.AreaCalculation,
    Area.Rectangle,
    Area.Multiplication,
    Scope.IntegerNumbers,
    Scope.TwoOperands
];

describe('ShapeRectangleAreaGenerator spec integration', () => {
    it('supports Equation through the typed relation without Ability labels', () => {
        expect(spec.generalLabels).toEqual(baseLabels);
        expect(extractSchemaLabels(ShapeRectangleAreaGeneratorSchema)).toEqual([Area.Equation]);
    });

    it('keeps plain, equation, and inverse projections mathematically identical', () => {
        const generate = (extraLabels: string[]) => {
            setSeed(31);
            return generateWithLabels(generator, [...baseLabels, ...extraLabels])!;
        };
        const plain = generate([Ability.ProcedureExecution]);
        const equation = generate([Area.Equation, Ability.ProcedureExecution]);
        const inverse = generate([Area.Equation, Ability.ProcedureInversion]);

        expect(equation.data).toEqual(plain.data);
        expect(inverse.data).toEqual(plain.data);
        expect(equation.labels).toContain(Area.Equation);
        expect(inverse.labels).not.toContain(Ability.ProcedureInversion);
    });
});
