import {Ability, Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {setSeed} from '../../../lib/random.ts';
import {GeometryPerimeterGenerator} from './generator.ts';
import {GeometryPerimeterGeneratorConfig} from './spec.ts';

const generator = new GeometryPerimeterGenerator();

describe('GeometryPerimeterGenerator', () => {
    it('requires the polygon shape and task ability', () => {
        expect(() => generator.generate({})).toThrow(GeneratorValidationError);
        expect(() => generator.generate({polygonShape: Area.Triangle})).toThrow(GeneratorValidationError);
    });

    it('rejects unsupported abilities and polygon identities', () => {
        expect(generator.generate({
            polygonShape: Area.Triangle,
            taskAbility: 'unsupported' as Ability.ProcedureExecution,
            operationFeatures: []
        })).toBeNull();
        expect(generator.generate({
            polygonShape: 'unsupported' as Area.Triangle,
            taskAbility: Ability.ProcedureExecution,
            operationFeatures: []
        })).toBeNull();
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
                taskAbility: Ability.ProcedureExecution,
                operationFeatures: []
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

    it.each([Area.Triangle, Area.Quadrilateral, Area.Pentagon, Area.Hexagon] as const)(
        'hides one %s side for an inverse task',
        polygonShape => {
            for (let seed = 0; seed < 10; seed++) {
                setSeed(seed);
                const data = generator.generate({
                    polygonShape,
                    taskAbility: Ability.ProcedureInversion,
                    operationFeatures: []
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
        const config: GeometryPerimeterGeneratorConfig = {
            polygonShape: Area.Hexagon,
            taskAbility: Ability.ProcedureExecution,
            operationFeatures: []
        };
        setSeed(24);
        const first = generator.generate(config);
        setSeed(24);
        expect(generator.generate(config)).toEqual(first);
    });

    it('authors the repeated-side rectangle perimeter formula', () => {
        for (let seed = 0; seed < 30; seed++) {
            setSeed(`rectangle-perimeter-${seed}`);
            const data = generator.generate({
                polygonShape: Area.Rectangle,
                taskAbility: Ability.ProcedureExecution,
                operationFeatures: [Area.Addition, Area.Equation]
            })!.data;
            expect(data.task).toBe('rectangle-perimeter-formula');
            if (data.task !== 'rectangle-perimeter-formula') throw new Error('Expected rectangle perimeter data.');
            expect(data.sideLengths).toEqual([data.length, data.width, data.length, data.width]);
            expect(data.perimeter).toBe(2 * (data.length + data.width));
            expect(data.formula).toBe('P = length + width + length + width');
            expect(data.questionEquation).toBe(`P = ${data.length} + ${data.width} + ${data.length} + ${data.width} = ?`);
            expect(data.solutionEquation).toBe(`P = ${data.length} + ${data.width} + ${data.length} + ${data.width} = ${data.perimeter}`);
            expect(data.answerStatement).toBe(`The perimeter is ${data.perimeter} units.`);
        }
    });

    it('uses the perimeter addition relation to recover either dimension', () => {
        const unknowns = new Set<string>();
        for (let seed = 0; seed < 50; seed++) {
            setSeed(`missing-perimeter-dimension-${seed}`);
            const data = generator.generate({
                polygonShape: Area.Rectangle,
                taskAbility: Ability.ProcedureInversion,
                operationFeatures: [Area.Addition, Area.Equation]
            })!.data;
            expect(data.task).toBe('find-missing-perimeter-dimension');
            if (data.task !== 'find-missing-perimeter-dimension') throw new Error('Expected inverse perimeter data.');
            unknowns.add(data.unknownDimension);
            expect(data.knownDimension).not.toBe(data.unknownDimension);
            expect(data.knownSideTotal).toBe(2 * data.knownValue);
            expect(data.missingValue).toBe(data.unknownDimension === 'length' ? data.length : data.width);
            expect(data.inverseEquation).toBe(`(${data.perimeter} - ${data.knownSideTotal}) ÷ 2 = ?`);
            expect(data.solutionEquation).toBe(`(${data.perimeter} - ${data.knownSideTotal}) ÷ 2 = ${data.missingValue}`);
            expect(data.questionEquation).toContain('?');
            expect(data.answerStatement).toBe(`The ${data.unknownDimension} is ${data.missingValue} units.`);
        }
        expect(unknowns).toEqual(new Set(['length', 'width']));
    });

    it('requires the authored equation and addition evidence for rectangle branches', () => {
        expect(generator.generate({
            polygonShape: Area.Rectangle,
            taskAbility: Ability.ProcedureExecution,
            operationFeatures: []
        })).toBeNull();
        expect(generator.generate({
            polygonShape: Area.Rectangle,
            taskAbility: Ability.ProcedureInversion,
            operationFeatures: [Area.Addition]
        })).toBeNull();
    });
});
