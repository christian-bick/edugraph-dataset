import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {extractSchemaLabels, generateWithLabels} from '../../../lib/utils.ts';
import {ShapeUnitSquareGridGenerator} from './generator.ts';
import {ShapeUnitSquareGridGeneratorSchema, spec} from './spec.ts';

const generator = new ShapeUnitSquareGridGenerator();

const generate = (labels: string[], seed = 11) => {
    setSeed(seed);
    return generateWithLabels(generator, labels)!;
};

describe('ShapeUnitSquareGridGenerator spec integration', () => {
    it('advertises mathematical grid and scale capabilities without Ability labels', () => {
        const labels = extractSchemaLabels(ShapeUnitSquareGridGeneratorSchema);
        expect(spec.generalLabels).toEqual([Area.Square]);
        expect(labels).toEqual(expect.arrayContaining([
            Area.AreaCalculation,
            Area.Iteration,
            Area.Multiplication,
            Scope.BoxArrangement,
            Scope.TileScale,
            Scope.SquareCentimeterScale
        ]));
        for (const ability of [
            Ability.Interpretation,
            Ability.ProcedureExecution,
            Ability.ProcedureInversion,
            Ability.ProcedureUnderstanding,
            Ability.TextualReception
        ]) {
            expect(labels).not.toContain(ability);
        }
    });

    it.each([
        [[Area.Square, Scope.TileScale, Ability.Interpretation], 1, 'square-unit'],
        [[
            Area.AreaCalculation,
            Area.Iteration,
            Area.Square,
            Scope.TileScale,
            Scope.IntegerNumbers,
            Scope.SquareCentimeterScale,
            Ability.ProcedureExecution
        ], null, 'square-centimeter'],
        [[
            Area.AreaCalculation,
            Area.Rectangle,
            Area.Square,
            Area.Multiplication,
            Scope.BoxArrangement,
            Scope.TwoOperands,
            Ability.ProcedureUnderstanding
        ], null, 'square-unit']
    ] as const)('resolves %s to one neutral grid relation', (labels, tileCount, unitId) => {
        const stub = generate([...labels]);
        expect(stub.data.kind).toBe('unit-square-grid');
        expect(stub.data.unitId).toBe(unitId);
        expect(stub.data.tileCount).toBe(tileCount ?? stub.data.rows * stub.data.columns);
        expect(stub.labels).not.toContain(labels.at(-1));
    });

    it('does not vary the mathematical grid by Ability projection', () => {
        const labels = [
            Area.AreaCalculation,
            Area.Rectangle,
            Area.Square,
            Area.Multiplication,
            Scope.BoxArrangement,
            Scope.TwoOperands
        ];
        const understanding = generate([...labels, Ability.ProcedureUnderstanding], 31);
        const inversion = generate([...labels, Ability.ProcedureInversion], 31);

        expect(inversion.data).toEqual(understanding.data);
    });
});
