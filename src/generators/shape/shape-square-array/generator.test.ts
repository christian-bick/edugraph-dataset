import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {setSeed} from '../../../lib/random.ts';
import {ShapeSquareArrayGenerator} from './generator.ts';

const generator = new ShapeSquareArrayGenerator();

describe('ShapeSquareArrayGenerator', () => {
    it('strictly requires the task ability', () => {
        expect(() => generator.generate({})).toThrow(GeneratorValidationError);
        expect(() => generator.generate({
            taskAbility: Ability.ProcedureExecution
        })).toThrow(GeneratorValidationError);
    });

    it.each([
        [Ability.VisualArticulation, 'partition'],
        [Ability.ProcedureExecution, 'count']
    ] as const)('maps %s to the %s task', (taskAbility, expectedTask) => {
        const stub = generator.generate({
            modelFeatures: [Area.Square, Area.ShapeDecomposition, Scope.BoxArrangement, Scope.EqualShares],
            taskAbility
        })!;

        expect(stub.data.task).toBe(expectedTask);
        expect(stub.data.squareCount).toBe(stub.data.rows * stub.data.columns);
    });

    it('rejects unsupported abilities', () => {
        expect(generator.generate({
            modelFeatures: [Area.Square, Area.ShapeDecomposition, Scope.BoxArrangement, Scope.EqualShares],
            taskAbility: 'unsupported' as typeof Ability.VisualArticulation
        })).toBeNull();
    });

    it('creates a single square for tile-scale interpretation', () => {
        expect(generator.generate({
            modelFeatures: [Area.Square, Scope.TileScale],
            taskAbility: Ability.Interpretation
        })!.data).toEqual({
            task: 'interpret-unit',
            rows: 1,
            columns: 1,
            squareCount: 1
        });
    });

    it('creates complete arrays for area-from-coverage interpretation', () => {
        const data = generator.generate({
            modelFeatures: [
                Area.AreaCalculation,
                Area.Iteration,
                Area.Square,
                Scope.IntegerNumbers,
                Scope.TileScale
            ],
            taskAbility: Ability.Interpretation
        })!.data;

        expect(data.task).toBe('interpret-coverage');
        expect(data.squareCount).toBe(data.rows * data.columns);
        expect(data.rows).toBeGreaterThanOrEqual(2);
        expect(data.columns).toBeGreaterThanOrEqual(2);
    });

    it.each([
        [undefined, 'square units'],
        [Scope.SquareCentimeterScale, 'square centimeters'],
        [Scope.SquareMeterScale, 'square meters'],
        [Scope.SquareInchScale, 'square inches'],
        [Scope.SquareFootScale, 'square feet']
    ] as const)('carries %s into the area-count payload', (scale, areaUnit) => {
        const data = generator.generate({
            modelFeatures: [
                Area.AreaCalculation,
                Area.Iteration,
                Area.Square,
                Scope.IntegerNumbers,
                Scope.TileScale,
                ...(scale ? [scale] : [])
            ],
            taskAbility: Ability.ProcedureExecution
        })!.data;

        expect(data.task).toBe('count-area');
        expect(data.areaUnit).toBe(areaUnit);
        expect(data.squareCount).toBe(data.rows * data.columns);
    });

    it('connects tiled side lengths to the rectangular area product', () => {
        const data = generator.generate({
            modelFeatures: [
                Area.AreaCalculation,
                Area.Multiplication,
                Area.Square,
                Scope.BoxArrangement,
                Scope.TwoOperands
            ],
            taskAbility: Ability.ProcedureUnderstanding
        })!.data;

        expect(data.task).toBe('explain-product');
        expect(data.areaUnit).toBe('square units');
        expect(data.squareCount).toBe(data.rows * data.columns);
    });

    it('calculates rectangular area from two side lengths', () => {
        const data = generator.generate({
            modelFeatures: [Area.AreaCalculation, Area.Multiplication, Scope.TwoOperands],
            taskAbility: Ability.ProcedureExecution
        })!.data;

        expect(data.task).toBe('calculate-area');
        expect(data.areaUnit).toBe('square units');
        expect(data.squareCount).toBe(data.rows * data.columns);
    });

    it('authors the rectangle area formula and complete numeric solution', () => {
        for (let seed = 0; seed < 30; seed++) {
            setSeed(`rectangle-area-formula-${seed}`);
            const data = generator.generate({
                modelFeatures: [
                    Area.AreaCalculation,
                    Area.Equation,
                    Area.Multiplication,
                    Area.Rectangle,
                    Scope.IntegerNumbers,
                    Scope.TwoOperands
                ],
                taskAbility: Ability.ProcedureExecution
            })!.data;
            expect(data.task).toBe('rectangle-area-formula');
            if (data.task !== 'rectangle-area-formula') throw new Error('Expected area formula data.');
            expect(data.length).toBe(data.columns);
            expect(data.width).toBe(data.rows);
            expect(data.area).toBe(data.length * data.width);
            expect(data.squareCount).toBe(data.area);
            expect(data.formula).toBe('A = length × width');
            expect(data.prompt).toBe(`Find the area of a rectangle with length ${data.length} units and width ${data.width} units.`);
            expect(data.questionEquation).toBe(`A = ${data.length} × ${data.width} = ?`);
            expect(data.solutionEquation).toBe(`A = ${data.length} × ${data.width} = ${data.area}`);
            expect(data.answerStatement).toBe(`The area is ${data.area} square units.`);
        }
    });

    it('inverts the area formula to recover either missing dimension', () => {
        const unknowns = new Set<string>();
        for (let seed = 0; seed < 50; seed++) {
            setSeed(`missing-area-dimension-${seed}`);
            const data = generator.generate({
                modelFeatures: [
                    Area.AreaCalculation,
                    Area.Equation,
                    Area.Multiplication,
                    Area.Rectangle,
                    Scope.IntegerNumbers,
                    Scope.TwoOperands
                ],
                taskAbility: Ability.ProcedureInversion
            })!.data;
            expect(data.task).toBe('find-missing-area-dimension');
            if (data.task !== 'find-missing-area-dimension') throw new Error('Expected inverse area data.');
            unknowns.add(data.unknownDimension);
            expect(data.knownDimension).not.toBe(data.unknownDimension);
            expect(data.missingValue).toBe(data.unknownDimension === 'length' ? data.length : data.width);
            expect(data.knownValue).toBe(data.knownDimension === 'length' ? data.length : data.width);
            expect(data.area).toBe(data.length * data.width);
            expect(data.inverseEquation).toBe(`${data.area} ÷ ${data.knownValue} = ?`);
            expect(data.solutionEquation).toBe(`${data.area} ÷ ${data.knownValue} = ${data.missingValue}`);
            expect(data.questionEquation).toContain('?');
            expect(data.answerStatement).toBe(`The ${data.unknownDimension} is ${data.missingValue} units.`);
        }
        expect(unknowns).toEqual(new Set(['length', 'width']));
    });

    it('rejects abilities without their required model features', () => {
        expect(generator.generate({
            modelFeatures: [Scope.TileScale],
            taskAbility: Ability.ProcedureExecution
        })).toBeNull();
        expect(generator.generate({
            modelFeatures: [Area.ShapeDecomposition],
            taskAbility: Ability.Interpretation
        })).toBeNull();
        expect(generator.generate({
            modelFeatures: [Area.AreaCalculation],
            taskAbility: Ability.ProcedureUnderstanding
        })).toBeNull();
        expect(generator.generate({
            modelFeatures: [Area.AreaCalculation, Area.Multiplication],
            taskAbility: Ability.ProcedureInversion
        })).toBeNull();
    });

    it('produces non-square rectangles with no more than twenty cells', () => {
        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            const data = generator.generate({
                modelFeatures: [Area.Square, Area.ShapeDecomposition, Scope.BoxArrangement, Scope.EqualShares],
                taskAbility: Ability.ProcedureExecution
            })!.data;

            expect(data.rows).not.toBe(data.columns);
            expect(data.rows).toBeGreaterThanOrEqual(2);
            expect(data.rows).toBeLessThanOrEqual(5);
            expect(data.columns).toBeGreaterThanOrEqual(2);
            expect(data.columns).toBeLessThanOrEqual(5);
            expect(data.squareCount).toBeLessThanOrEqual(20);
        }
    });

    it('is deterministic for a fixed seed', () => {
        setSeed(18);
        const config = {
            modelFeatures: [Area.Square, Area.ShapeDecomposition, Scope.BoxArrangement, Scope.EqualShares],
            taskAbility: Ability.VisualArticulation
        };
        const first = generator.generate(config);
        setSeed(18);
        const second = generator.generate(config);

        expect(second).toEqual(first);
    });
});
