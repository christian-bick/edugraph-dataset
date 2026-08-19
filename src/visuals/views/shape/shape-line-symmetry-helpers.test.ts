import {describe, expect, it} from 'vitest';
import {ShapeLineSymmetryGenerator} from '../../../generators/shape/shape-line-symmetry/generator.ts';
import {setSeed} from '../../../lib/random.ts';
import {ShapeLineSymmetryProblem} from '../../../types/problems.ts';
import {isValidShapeLineSymmetryProblem, rotationFor} from './shape-line-symmetry-helpers.ts';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const generator = new ShapeLineSymmetryGenerator();

const problem = (seed: string): ShapeLineSymmetryProblem => {
    setSeed(seed);
    return generator.generate({})!.data;
};

describe('shape-line-symmetry view validation', () => {
    it('accepts the coherent identify task with no-, one-, and multiple-axis figures', () => {
        const data = problem('identify-symmetry-view');
        expect(isValidShapeLineSymmetryProblem(data)).toBe(true);
        expect(data.identification.options.filter(option => option.figure.axisCount === 0))
            .toHaveLength(2);
        expect(data.identification.options.some(option => option.figure.axisCount === 1)).toBe(true);
        expect(data.identification.options.some(option => option.figure.axisCount > 1)).toBe(true);
    });

    it('accepts complete one-, two-, and four-axis drawing tasks', () => {
        const counts = new Set<number>();
        for (let seed = 0; seed < 80; seed++) {
            const data = problem(`draw-symmetry-${seed}`);
            expect(isValidShapeLineSymmetryProblem(data)).toBe(true);
            counts.add(data.drawing.figure.axisCount);
        }
        expect(counts).toEqual(new Set([1, 2, 4]));
    });

    it('rejects a no-symmetry claim for an outline that has a reflection axis', () => {
        const data = clone(problem('identify-symmetry-view'));
        const symmetric = data.identification.options.find(option => option.hasLineSymmetry)!;
        const negative = data.identification.options.find(option => !option.hasLineSymmetry)!;
        negative.figure.vertices = clone(symmetric.figure.vertices);
        expect(isValidShapeLineSymmetryProblem(data)).toBe(false);
    });

    it('rejects self-crossing outlines and incomplete axis sets', () => {
        const data = clone(problem('identify-symmetry-view'));
        data.identification.options[0].figure.vertices = [
            {x: 20, y: 20},
            {x: 80, y: 80},
            {x: 20, y: 80},
            {x: 80, y: 20}
        ];
        expect(isValidShapeLineSymmetryProblem(data)).toBe(false);

        let square = problem('square-0');
        for (let seed = 1; square.drawing.figure.axisCount !== 4 && seed < 20; seed++) {
            square = problem(`square-${seed}`);
        }
        square = clone(square);
        expect(square.drawing.figure.axisCount).toBe(4);
        square.drawing.completedAxes.pop();
        expect(isValidShapeLineSymmetryProblem(square)).toBe(false);
    });

    it('rejects non-normalized axes and contradictory fold witnesses', () => {
        const axisData = clone(problem('axis-geometry'));
        axisData.drawing.figure.validAxes[0].equation.a *= 2;
        axisData.drawing.completedAxes = axisData.drawing.figure.validAxes;
        expect(isValidShapeLineSymmetryProblem(axisData)).toBe(false);

        const witnessData = clone(problem('witness-geometry'));
        witnessData.drawing.figure.validAxes[0].correspondences[0].foldPoint.x += 4;
        witnessData.drawing.completedAxes = witnessData.drawing.figure.validAxes;
        expect(isValidShapeLineSymmetryProblem(witnessData)).toBe(false);

        const completedData = clone(problem('completed-witness'));
        completedData.drawing.completedAxes[0].correspondences[0].distanceToAxis += 3;
        expect(isValidShapeLineSymmetryProblem(completedData)).toBe(false);
    });

    it('rejects membership and completed-axis contradictions', () => {
        const identify = clone(problem('identify-symmetry-view'));
        identify.identification.options[0].hasLineSymmetry =
            !identify.identification.options[0].hasLineSymmetry;
        expect(isValidShapeLineSymmetryProblem(identify)).toBe(false);

        const draw = clone(problem('answer-prose'));
        draw.drawing.completedAxes = [];
        expect(isValidShapeLineSymmetryProblem(draw)).toBe(false);
    });

    it('derives deterministic bounded whole-group rotations only from the render seed', () => {
        expect(rotationFor(42, 2)).toBe(rotationFor(42, 2));
        expect(Math.abs(rotationFor(42, 2))).toBeLessThanOrEqual(13);
        expect(new Set(Array.from({length: 4}, (_, index) => rotationFor(42, index))).size)
            .toBeGreaterThan(1);
    });
});
