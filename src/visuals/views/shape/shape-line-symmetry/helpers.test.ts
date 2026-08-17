import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {ShapeLineSymmetryGenerator} from '../../../../generators/shape/shape-line-symmetry/generator.ts';
import {setSeed} from '../../../../lib/random.ts';
import {
    DrawLineSymmetryProblem,
    IdentifyLineSymmetryProblem
} from '../../../../types/problems.ts';
import {isValidShapeLineSymmetryProblem, rotationFor} from './helpers.ts';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const generator = new ShapeLineSymmetryGenerator();

const identifyProblem = (): IdentifyLineSymmetryProblem => {
    setSeed('identify-symmetry-view');
    const data = generator.generate({
        abilities: [Ability.ConceptClassification, Ability.VisualRecognition]
    })!.data;
    if (data.task !== 'identify-line-symmetry') throw new Error('Expected identification.');
    return data;
};

const drawProblem = (seed: string): DrawLineSymmetryProblem => {
    setSeed(seed);
    const data = generator.generate({abilities: [Ability.VisualArticulation]})!.data;
    if (data.task !== 'draw-line-symmetry') throw new Error('Expected drawing.');
    return data;
};

describe('shape-line-symmetry view validation', () => {
    it('accepts the coherent identify task with no-, one-, and multiple-axis figures', () => {
        const data = identifyProblem();
        expect(isValidShapeLineSymmetryProblem(data)).toBe(true);
        expect(data.options.filter(option => option.figure.axisCount === 0)).toHaveLength(2);
        expect(data.options.some(option => option.figure.axisCount === 1)).toBe(true);
        expect(data.options.some(option => option.figure.axisCount > 1)).toBe(true);
    });

    it('accepts complete one-, two-, and four-axis drawing tasks', () => {
        const counts = new Set<number>();
        for (let seed = 0; seed < 80; seed++) {
            const data = drawProblem(`draw-symmetry-${seed}`);
            expect(isValidShapeLineSymmetryProblem(data)).toBe(true);
            counts.add(data.figure.axisCount);
        }
        expect(counts).toEqual(new Set([1, 2, 4]));
    });

    it('rejects a no-symmetry claim for an outline that has a reflection axis', () => {
        const data = clone(identifyProblem());
        const symmetric = data.options.find(option => option.hasLineSymmetry)!;
        const negative = data.options.find(option => !option.hasLineSymmetry)!;
        negative.figure.vertices = clone(symmetric.figure.vertices);
        expect(isValidShapeLineSymmetryProblem(data)).toBe(false);
    });

    it('rejects self-crossing outlines and incomplete axis sets', () => {
        const data = clone(identifyProblem());
        data.options[0].figure.vertices = [
            {x: 20, y: 20},
            {x: 80, y: 80},
            {x: 20, y: 80},
            {x: 80, y: 20}
        ];
        expect(isValidShapeLineSymmetryProblem(data)).toBe(false);

        let square = drawProblem('square-0');
        for (let seed = 1; square.figure.axisCount !== 4 && seed < 20; seed++) {
            square = drawProblem(`square-${seed}`);
        }
        square = clone(square);
        expect(square.figure.axisCount).toBe(4);
        square.completedAxes.pop();
        expect(isValidShapeLineSymmetryProblem(square)).toBe(false);
    });

    it('rejects non-normalized axes and contradictory fold witnesses', () => {
        const axisData = clone(drawProblem('axis-geometry'));
        axisData.figure.validAxes[0].equation.a *= 2;
        axisData.completedAxes = axisData.figure.validAxes;
        expect(isValidShapeLineSymmetryProblem(axisData)).toBe(false);

        const witnessData = clone(drawProblem('witness-geometry'));
        witnessData.figure.validAxes[0].correspondences[0].foldPoint.x += 4;
        witnessData.completedAxes = witnessData.figure.validAxes;
        expect(isValidShapeLineSymmetryProblem(witnessData)).toBe(false);

        const completedData = clone(drawProblem('completed-witness'));
        completedData.completedAxes[0].correspondences[0].distanceToAxis += 3;
        expect(isValidShapeLineSymmetryProblem(completedData)).toBe(false);
    });

    it('rejects membership, answer, and visible prose contradictions', () => {
        const identify = clone(identifyProblem());
        identify.options[0].hasLineSymmetry = !identify.options[0].hasLineSymmetry;
        expect(isValidShapeLineSymmetryProblem(identify)).toBe(false);

        const draw = clone(drawProblem('answer-prose'));
        draw.answer = '99 lines of symmetry';
        expect(isValidShapeLineSymmetryProblem(draw)).toBe(false);
        const prose = clone(identifyProblem());
        prose.answerStatement = 'Every figure has line symmetry.';
        expect(isValidShapeLineSymmetryProblem(prose)).toBe(false);
    });

    it('derives deterministic bounded whole-group rotations only from the render seed', () => {
        expect(rotationFor(42, 2)).toBe(rotationFor(42, 2));
        expect(Math.abs(rotationFor(42, 2))).toBeLessThanOrEqual(13);
        expect(new Set(Array.from({length: 4}, (_, index) => rotationFor(42, index))).size)
            .toBeGreaterThan(1);
    });
});
