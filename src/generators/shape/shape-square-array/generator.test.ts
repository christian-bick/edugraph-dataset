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

    it('rejects abilities without their required model features', () => {
        expect(generator.generate({
            modelFeatures: [Scope.TileScale],
            taskAbility: Ability.ProcedureExecution
        })).toBeNull();
        expect(generator.generate({
            modelFeatures: [Area.ShapeDecomposition],
            taskAbility: Ability.Interpretation
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
