import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {extractSchemaLabels, generateWithLabels} from '../../../lib/utils.ts';
import {ShapeSquareArrayGenerator} from './generator.ts';
import {ShapeSquareArrayGeneratorSchema, spec} from './spec.ts';

const generator = new ShapeSquareArrayGenerator();

const generate = (labels: string[], seed: number) => {
    setSeed(seed);
    return generateWithLabels(generator, labels)!;
};

describe('ShapeSquareArrayGenerator spec integration', () => {
    it('contains no Ability capability or parameter', () => {
        const labels = extractSchemaLabels(ShapeSquareArrayGeneratorSchema);
        const abilities = [
            Ability.Interpretation,
            Ability.VisualArticulation,
            Ability.ProcedureExecution,
            Ability.ProcedureInversion,
            Ability.ProcedureUnderstanding
        ];

        expect(spec.generalLabels).toEqual([]);
        for (const ability of abilities) expect(labels).not.toContain(ability);
    });

    it.each([
        [
            [
                Area.Rectangle,
                Area.Square,
                Area.ShapeDecomposition,
                Scope.BoxArrangement,
                Scope.EqualShares
            ],
            Ability.VisualArticulation,
            Ability.ProcedureExecution,
            'equal-square-array'
        ],
        [
            [
                Area.AreaCalculation,
                Area.Iteration,
                Area.Square,
                Scope.TileScale,
                Scope.IntegerNumbers
            ],
            Ability.Interpretation,
            Ability.ProcedureExecution,
            'unit-square-coverage'
        ],
        [
            [
                Area.AreaCalculation,
                Area.Equation,
                Area.Rectangle,
                Area.Multiplication,
                Scope.IntegerNumbers,
                Scope.TwoOperands
            ],
            Ability.ProcedureExecution,
            Ability.ProcedureInversion,
            'rectangle-area-formula'
        ]
    ] as const)(
        'generates one %s model for either Ability projection',
        (mathematicalLabels, firstAbility, secondAbility, model) => {
            const first = generate([...mathematicalLabels, firstAbility], 31);
            const second = generate([...mathematicalLabels, secondAbility], 31);

            expect(first.data).toEqual(second.data);
            expect(first.data.model).toBe(model);
            expect(first.tags).not.toContain(firstAbility);
            expect(second.tags).not.toContain(secondAbility);
        }
    );

    it('resolves tile scale to one complete unit-square model', () => {
        const stub = generate([
            Area.Square,
            Scope.TileScale,
            Ability.Interpretation
        ], 7);

        expect(stub.data).toEqual({
            model: 'unit-square',
            rows: 1,
            columns: 1,
            squareCount: 1,
            areaUnit: 'square units'
        });
        expect(stub.tags).toEqual(expect.arrayContaining([
            Area.Square,
            Scope.TileScale
        ]));
        expect(stub.tags).not.toContain(Ability.Interpretation);
    });

    it.each([
        [undefined, 'square units'],
        [Scope.SquareCentimeterScale, 'square centimeters'],
        [Scope.SquareMeterScale, 'square meters'],
        [Scope.SquareInchScale, 'square inches'],
        [Scope.SquareFootScale, 'square feet']
    ] as const)('resolves unit-square coverage for %s', (scale, areaUnit) => {
        const stub = generate([
            Area.AreaCalculation,
            Area.Iteration,
            Area.Square,
            Scope.TileScale,
            Scope.IntegerNumbers,
            Ability.ProcedureExecution,
            ...(scale ? [scale] : [])
        ], 11);

        expect(stub.data.model).toBe('unit-square-coverage');
        expect(stub.data.areaUnit).toBe(areaUnit);
        expect(stub.data.squareCount).toBe(stub.data.rows * stub.data.columns);
    });

    it('resolves tiled and untiled rectangular products from Area and Scope only', () => {
        const tiled = generate([
            Area.AreaCalculation,
            Area.Rectangle,
            Area.Square,
            Area.Multiplication,
            Scope.BoxArrangement,
            Scope.TwoOperands,
            Ability.ProcedureUnderstanding
        ], 13);
        const untiled = generate([
            Area.AreaCalculation,
            Area.Rectangle,
            Area.Multiplication,
            Scope.TwoOperands,
            Ability.ProcedureExecution
        ], 13);

        expect(tiled.data.model).toBe('tiled-area-product');
        expect(untiled.data.model).toBe('rectangle-area-product');
    });
});
