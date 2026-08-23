import {Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {setSeed} from '../../../lib/random.ts';
import {GeometryPerimeterGenerator} from './generator.ts';
import {GeometryPerimeterGeneratorConfig} from './spec.ts';

const generator = new GeometryPerimeterGenerator();

describe('GeometryPerimeterGenerator', () => {
    it('requires a supported polygon shape', () => {
        expect(() => generator.generate({})).toThrow(GeneratorValidationError);
        expect(generator.generate({
            polygonShape: 'unsupported' as Area.Triangle,
            operationFeatures: []
        })).toBeNull();
    });

    it.each([
        [Area.Triangle, 'triangle', 3],
        [Area.Quadrilateral, 'quadrilateral', 4],
        [Area.Pentagon, 'pentagon', 5],
        [Area.Hexagon, 'hexagon', 6]
    ] as const)('generates a complete neutral %s perimeter model', (polygonShape, shape, sideCount) => {
        for (let seed = 0; seed < 10; seed++) {
            setSeed(seed);
            const data = generator.generate({polygonShape, operationFeatures: []})!.data;
            if (data.shape === 'rectangle') throw new Error('Expected polygon perimeter data.');

            expect(data.shape).toBe(shape);
            expect(data.vertices).toHaveLength(sideCount);
            expect(data.sideLengths).toHaveLength(sideCount);
            expect(data.sideLengths.every(Number.isInteger)).toBe(true);
            expect(Math.max(...data.sideLengths)).toBeLessThanOrEqual(18);
            expect(data.perimeter).toBe(data.sideLengths.reduce((sum, length) => sum + length, 0));
            expect(data.perimeter).toBeLessThan(100);
        }
    });

    it('is deterministic for a fixed seed', () => {
        const config: GeometryPerimeterGeneratorConfig = {
            polygonShape: Area.Hexagon,
            operationFeatures: []
        };
        setSeed(24);
        const first = generator.generate(config);
        setSeed(24);
        expect(generator.generate(config)).toEqual(first);
    });

    it('authors one neutral rectangle perimeter relation', () => {
        for (let seed = 0; seed < 50; seed++) {
            setSeed(`rectangle-perimeter-${seed}`);
            const data = generator.generate({
                polygonShape: Area.Rectangle,
                operationFeatures: [Area.Addition, Area.Equation]
            })!.data;
            if (data.shape !== 'rectangle') throw new Error('Expected rectangle perimeter data.');

            expect(data.perimeter).toBe(2 * (data.length + data.width));
            expect(data).toEqual({
                shape: 'rectangle',
                length: data.length,
                width: data.width,
                perimeter: data.perimeter
            });
        }
    });

    it('requires the authored equation and addition evidence for rectangles', () => {
        expect(generator.generate({
            polygonShape: Area.Rectangle,
            operationFeatures: []
        })).toBeNull();
        expect(generator.generate({
            polygonShape: Area.Rectangle,
            operationFeatures: [Area.Addition]
        })).toBeNull();
    });
});
