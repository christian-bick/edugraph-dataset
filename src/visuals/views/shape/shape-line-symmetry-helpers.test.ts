import {describe, expect, it} from 'vitest';
import {ShapeLineSymmetryGenerator} from '../../../generators/shape/shape-line-symmetry/generator.ts';
import {ShapeLineSymmetryProblem} from '../../../types/problems.ts';
import {
    axisEndpoints,
    drawingFigure,
    identificationPresentation,
    isValidShapeLineSymmetryProblem,
    rotationFor
} from './shape-line-symmetry-helpers.ts';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const generator = new ShapeLineSymmetryGenerator();
const problem = (): ShapeLineSymmetryProblem => generator.generate({})!.data;

describe('shape-line-symmetry canonical validation', () => {
    it('accepts the complete five-figure catalogue', () => {
        const data = problem();
        expect(isValidShapeLineSymmetryProblem(data)).toBe(true);
        expect(data.figures.map(figure => [figure.kind, figure.validAxes.length])).toEqual([
            ['isosceles-triangle', 1],
            ['rectangle', 2],
            ['square', 4],
            ['scalene-triangle', 0],
            ['parallelogram', 0]
        ]);
    });

    it('rejects missing or duplicate catalogue members and self-crossing outlines', () => {
        const missing = clone(problem());
        missing.figures.pop();
        expect(isValidShapeLineSymmetryProblem(missing)).toBe(false);

        const duplicate = clone(problem());
        duplicate.figures[4].kind = duplicate.figures[3].kind;
        expect(isValidShapeLineSymmetryProblem(duplicate)).toBe(false);

        const crossing = clone(problem());
        crossing.figures[1].vertices = [
            {x: 20, y: 20},
            {x: 80, y: 80},
            {x: 20, y: 80},
            {x: 80, y: 20}
        ];
        expect(isValidShapeLineSymmetryProblem(crossing)).toBe(false);
    });

    it('rejects incomplete axes, non-normalized equations, and contradictory orbits', () => {
        const incomplete = clone(problem());
        incomplete.figures.find(figure => figure.kind === 'square')!.validAxes.pop();
        expect(isValidShapeLineSymmetryProblem(incomplete)).toBe(false);

        const equation = clone(problem());
        equation.figures[0].validAxes[0].equation.a *= 2;
        expect(isValidShapeLineSymmetryProblem(equation)).toBe(false);

        const contradictory = clone(problem());
        contradictory.figures[0].validAxes[0].correspondences[1].secondVertex = 1;
        expect(isValidShapeLineSymmetryProblem(contradictory)).toBe(false);

        const missingVertex = clone(problem());
        missingVertex.figures[1].validAxes[0].correspondences.pop();
        expect(isValidShapeLineSymmetryProblem(missingVertex)).toBe(false);
    });
});

describe('shape-line-symmetry view projections', () => {
    it('derives the legacy axis endpoints from equations and figure bounds', () => {
        const data = problem();
        const isosceles = data.figures.find(figure => figure.kind === 'isosceles-triangle')!;
        const rectangle = data.figures.find(figure => figure.kind === 'rectangle')!;
        const square = data.figures.find(figure => figure.kind === 'square')!;
        expect(axisEndpoints(isosceles.validAxes[0], isosceles)).toEqual([
            {x: 50, y: 8},
            {x: 50, y: 92}
        ]);
        expect(axisEndpoints(rectangle.validAxes[0], rectangle)).toEqual([
            {x: 50, y: 12},
            {x: 50, y: 88}
        ]);
        expect(axisEndpoints(rectangle.validAxes[1], rectangle)).toEqual([
            {x: 8, y: 50},
            {x: 92, y: 50}
        ]);
        expect(axisEndpoints(square.validAxes[2], square)).toEqual([
            {x: 12, y: 12},
            {x: 88, y: 88}
        ]);
        expect(axisEndpoints(square.validAxes[3], square)).toEqual([
            {x: 12, y: 88},
            {x: 88, y: 12}
        ]);
        data.figures.forEach(figure => {
            figure.validAxes.forEach(axis => expect(axisEndpoints(axis, figure)).not.toBeNull());
        });
    });

    it('keeps valid axes visible when a figure reaches the canvas boundary', () => {
        const data = clone(problem());
        const isosceles = data.figures.find(figure => figure.kind === 'isosceles-triangle')!;
        isosceles.vertices = [
            {x: 2, y: 15},
            {x: 4, y: 80},
            {x: 0, y: 80}
        ];
        isosceles.validAxes[0].equation = {a: 1, b: 0, c: -2};
        expect(isValidShapeLineSymmetryProblem(data)).toBe(true);
        expect(axisEndpoints(isosceles.validAxes[0], isosceles)).toEqual([
            {x: 2, y: 8},
            {x: 2, y: 92}
        ]);
    });

    it('projects a balanced identification set and derives its letters and answers', () => {
        const data = problem();
        const rectangle = identificationPresentation(data, 'rectangle', 42);
        const square = identificationPresentation(data, 'square', 42);
        expect(rectangle.options.map(option => option.id)).toEqual(['A', 'B', 'C', 'D']);
        expect(rectangle.answerIds).toHaveLength(2);
        expect(rectangle.options.filter(option => option.figure.validAxes.length === 0)).toHaveLength(2);
        expect(rectangle.options.map(option => option.figure.kind)).toContain('rectangle');
        expect(rectangle.options.map(option => option.figure.kind)).not.toContain('square');
        expect(square.options.map(option => option.figure.kind)).toContain('square');
        expect(square.options.map(option => option.figure.kind)).not.toContain('rectangle');
    });

    it('orders identification cards deterministically from the render seed', () => {
        const data = problem();
        const order = (seed: number) => identificationPresentation(data, 'rectangle', seed)
            .options.map(option => option.figure.kind);
        expect(order(17)).toEqual(order(17));
        expect(new Set(Array.from({length: 20}, (_, seed) => order(seed).join('|'))).size)
            .toBeGreaterThan(1);
    });

    it('selects each configured symmetric drawing figure without a copied completion branch', () => {
        const data = problem();
        expect(drawingFigure(data, 'isosceles-triangle').validAxes).toHaveLength(1);
        expect(drawingFigure(data, 'rectangle').validAxes).toHaveLength(2);
        expect(drawingFigure(data, 'square').validAxes).toHaveLength(4);
    });

    it('derives deterministic bounded whole-group rotations only from the render seed', () => {
        expect(rotationFor(42, 2)).toBe(rotationFor(42, 2));
        expect(Math.abs(rotationFor(42, 2))).toBeLessThanOrEqual(13);
        expect(new Set(Array.from({length: 4}, (_, index) => rotationFor(42, index))).size)
            .toBeGreaterThan(1);
    });
});
