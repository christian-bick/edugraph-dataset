import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {setSeed} from '../../../lib/random.ts';
import {ShapeSquareArrayGenerator} from './generator.ts';

const generator = new ShapeSquareArrayGenerator();

describe('ShapeSquareArrayGenerator', () => {
    it('strictly requires mathematical model features', () => {
        expect(() => generator.generate({})).toThrow(GeneratorValidationError);
    });

    it.each([
        [
            [Area.Square, Area.ShapeDecomposition, Scope.BoxArrangement, Scope.EqualShares],
            'equal-square-array'
        ],
        [
            [
                Area.AreaCalculation,
                Area.Iteration,
                Area.Square,
                Scope.IntegerNumbers,
                Scope.TileScale
            ],
            'unit-square-coverage'
        ],
        [
            [
                Area.AreaCalculation,
                Area.Multiplication,
                Area.Square,
                Scope.BoxArrangement,
                Scope.TwoOperands
            ],
            'tiled-area-product'
        ],
        [
            [Area.AreaCalculation, Area.Multiplication, Scope.TwoOperands],
            'rectangle-area-product'
        ]
    ] as const)('maps mathematical features to the %s model', (modelFeatures, model) => {
        const data = generator.generate({modelFeatures: [...modelFeatures]})!.data;

        expect(data.model).toBe(model);
        expect(data.squareCount).toBe(data.rows * data.columns);
    });

    it('creates the complete unit-square model independently of its task', () => {
        expect(generator.generate({
            modelFeatures: [Area.Square, Scope.TileScale]
        })!.data).toEqual({
            model: 'unit-square',
            rows: 1,
            columns: 1,
            squareCount: 1,
            areaUnit: 'square units'
        });
    });

    it.each([
        [undefined, 'square units'],
        [Scope.SquareCentimeterScale, 'square centimeters'],
        [Scope.SquareMeterScale, 'square meters'],
        [Scope.SquareInchScale, 'square inches'],
        [Scope.SquareFootScale, 'square feet']
    ] as const)('carries %s into the unit-square coverage model', (scale, areaUnit) => {
        const data = generator.generate({
            modelFeatures: [
                Area.AreaCalculation,
                Area.Iteration,
                Area.Square,
                Scope.IntegerNumbers,
                Scope.TileScale,
                ...(scale ? [scale] : [])
            ]
        })!.data;

        expect(data.model).toBe('unit-square-coverage');
        expect(data.areaUnit).toBe(areaUnit);
        expect(data.squareCount).toBe(data.rows * data.columns);
    });

    it('authors a complete rectangle-area formula model without selecting a task', () => {
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
                ]
            })!.data;
            expect(data.model).toBe('rectangle-area-formula');
            if (data.model !== 'rectangle-area-formula') {
                throw new Error('Expected a rectangle-area formula model.');
            }
            expect(data.length).toBe(data.columns);
            expect(data.width).toBe(data.rows);
            expect(data.area).toBe(data.length * data.width);
            expect(data.squareCount).toBe(data.area);
            expect(data.formula).toBe('A = length × width');
            expect(data).not.toHaveProperty('prompt');
            expect(data).not.toHaveProperty('unknownDimension');
        }
    });

    it('rejects incomplete mathematical feature sets', () => {
        expect(generator.generate({modelFeatures: [Scope.TileScale]})).toBeNull();
        expect(generator.generate({modelFeatures: [Area.ShapeDecomposition]})).toBeNull();
        expect(generator.generate({
            modelFeatures: [Area.AreaCalculation, Area.Equation, Area.Multiplication]
        })).toBeNull();
    });

    it('produces non-square rectangles with no more than twenty cells', () => {
        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            const data = generator.generate({
                modelFeatures: [
                    Area.Square,
                    Area.ShapeDecomposition,
                    Scope.BoxArrangement,
                    Scope.EqualShares
                ]
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
        const config = {
            modelFeatures: [
                Area.Square,
                Area.ShapeDecomposition,
                Scope.BoxArrangement,
                Scope.EqualShares
            ]
        };
        setSeed(18);
        const first = generator.generate(config);
        setSeed(18);
        const second = generator.generate(config);

        expect(second).toEqual(first);
    });
});
