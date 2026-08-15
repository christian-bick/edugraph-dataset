import {Ability, Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {setSeed} from '../../../lib/random.ts';
import {GeometryPerimeterGenerator} from './generator.ts';

const generator = new GeometryPerimeterGenerator();

describe('GeometryPerimeterGenerator', () => {
    it('requires the polygon shape and task ability', () => {
        expect(() => generator.generate({})).toThrow(GeneratorValidationError);
        expect(() => generator.generate({polygonShape: Area.Triangle})).toThrow(GeneratorValidationError);
    });

    it.each([
        [Area.Triangle, 'triangle', 3],
        [Area.Quadrilateral, 'quadrilateral', 4],
        [Area.Pentagon, 'pentagon', 5],
        [Area.Hexagon, 'hexagon', 6]
    ] as const)('generates a closed %s perimeter task', (polygonShape, shape, sideCount) => {
        for (let seed = 0; seed < 10; seed++) {
            setSeed(seed);
            const data = generator.generate({
                polygonShape,
                taskAbility: Ability.ProcedureExecution
            })!.data;

            expect(data.task).toBe('find-perimeter');
            expect(data.shape).toBe(shape);
            expect(data.vertices).toHaveLength(sideCount);
            expect(data.sideLengths).toHaveLength(sideCount);
            expect(data.sideLengths.every(Number.isInteger)).toBe(true);
            expect(Math.max(...data.sideLengths)).toBeLessThanOrEqual(18);
            expect(data.perimeter).toBe(data.sideLengths.reduce((sum, length) => sum + length, 0));
            expect(data.perimeter).toBeLessThan(100);
            expect(data.unit).toBe('units');
        }
    });

    it.each([Area.Triangle, Area.Quadrilateral, Area.Pentagon, Area.Hexagon])(
        'hides one %s side for an inverse task',
        polygonShape => {
            for (let seed = 0; seed < 10; seed++) {
                setSeed(seed);
                const data = generator.generate({
                    polygonShape,
                    taskAbility: Ability.ProcedureInversion
                })!.data;

                expect(data.task).toBe('find-missing-side');
                if (data.task !== 'find-missing-side') throw new Error('Expected inverse data.');
                expect(data.unknownSideIndex).toBeGreaterThanOrEqual(0);
                expect(data.unknownSideIndex).toBeLessThan(data.sideLengths.length);
                expect(data.knownSideTotal).toBe(
                    data.perimeter - data.sideLengths[data.unknownSideIndex]
                );
            }
        }
    );

    it('is deterministic for a fixed seed', () => {
        const config = {
            polygonShape: Area.Hexagon,
            taskAbility: Ability.ProcedureExecution
        };
        setSeed(24);
        const first = generator.generate(config);
        setSeed(24);
        expect(generator.generate(config)).toEqual(first);
    });
});
