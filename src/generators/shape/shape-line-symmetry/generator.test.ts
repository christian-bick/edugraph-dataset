import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {setSeed} from '../../../lib/random.ts';
import {
    LineSymmetryAxis,
    LineSymmetryCoordinate,
    LineSymmetryFigure
} from '../../../types/problems.ts';
import {ShapeLineSymmetryGenerator} from './generator.ts';

const generator = new ShapeLineSymmetryGenerator();
const EPSILON = 1e-8;

function onAxis(point: LineSymmetryCoordinate, axis: LineSymmetryAxis): number {
    return axis.equation.a * point.x + axis.equation.b * point.y + axis.equation.c;
}

function reflect(point: LineSymmetryCoordinate, axis: LineSymmetryAxis): LineSymmetryCoordinate {
    const denominator = axis.equation.a ** 2 + axis.equation.b ** 2;
    const scale = 2 * onAxis(point, axis) / denominator;
    return {
        x: point.x - scale * axis.equation.a,
        y: point.y - scale * axis.equation.b
    };
}

function expectCoordinateClose(actual: LineSymmetryCoordinate, expected: LineSymmetryCoordinate): void {
    expect(actual.x).toBeCloseTo(expected.x, 8);
    expect(actual.y).toBeCloseTo(expected.y, 8);
}

type Equation = LineSymmetryAxis['equation'];

function canonicalEquation(a: number, b: number, c: number): Equation {
    const length = Math.hypot(a, b);
    let normalized = {a: a / length, b: b / length, c: c / length};
    if (normalized.a < -EPSILON || Math.abs(normalized.a) < EPSILON && normalized.b < 0) {
        normalized = {a: -normalized.a, b: -normalized.b, c: -normalized.c};
    }
    return normalized;
}

function equationKey(equation: Equation): string {
    const normalized = canonicalEquation(equation.a, equation.b, equation.c);
    return [normalized.a, normalized.b, normalized.c]
        .map(value => Math.abs(value) < EPSILON ? '0.000000' : value.toFixed(6))
        .join('|');
}

function matchesVertexSet(equation: Equation, vertices: readonly LineSymmetryCoordinate[]): boolean {
    const axis: LineSymmetryAxis = {equation, correspondences: []};
    return vertices.every(vertex => {
        const reflected = reflect(vertex, axis);
        return vertices.some(candidate =>
            Math.abs(candidate.x - reflected.x) < 1e-6
            && Math.abs(candidate.y - reflected.y) < 1e-6
        );
    });
}

function discoverSymmetryAxes(vertices: readonly LineSymmetryCoordinate[]): Set<string> {
    const candidates = new Map<string, Equation>();
    for (let first = 0; first < vertices.length; first++) {
        for (let second = first + 1; second < vertices.length; second++) {
            const one = vertices[first];
            const two = vertices[second];
            const through = canonicalEquation(
                two.y - one.y,
                one.x - two.x,
                -(two.y - one.y) * one.x - (one.x - two.x) * one.y
            );
            candidates.set(equationKey(through), through);

            const midpoint = {x: (one.x + two.x) / 2, y: (one.y + two.y) / 2};
            const bisector = canonicalEquation(
                two.x - one.x,
                two.y - one.y,
                -(two.x - one.x) * midpoint.x - (two.y - one.y) * midpoint.y
            );
            candidates.set(equationKey(bisector), bisector);
        }
    }
    return new Set([...candidates.values()]
        .filter(equation => matchesVertexSet(equation, vertices))
        .map(equationKey));
}

function expectValidAxis(axis: LineSymmetryAxis, figure: LineSymmetryFigure): void {
    expect(Math.hypot(axis.equation.a, axis.equation.b)).toBeCloseTo(1, 10);
    const representedVertices = axis.correspondences.flatMap(({firstVertex, secondVertex}) =>
        firstVertex === secondVertex ? [firstVertex] : [firstVertex, secondVertex]
    );
    expect([...representedVertices].sort((first, second) => first - second))
        .toEqual(figure.vertices.map((_, index) => index));
    for (const {firstVertex, secondVertex} of axis.correspondences) {
        expect(firstVertex).toBeLessThanOrEqual(secondVertex);
        expectCoordinateClose(
            reflect(figure.vertices[firstVertex], axis),
            figure.vertices[secondVertex]
        );
    }
    expect(figure.vertices.every(vertex => {
        const reflected = reflect(vertex, axis);
        return figure.vertices.some(candidate =>
            Math.abs(candidate.x - reflected.x) < 1e-6
            && Math.abs(candidate.y - reflected.y) < 1e-6
        );
    })).toBe(true);
}

function expectCompleteSymmetryGeometry(figure: LineSymmetryFigure): void {
    for (const vertex of figure.vertices) {
        expect(vertex.x).toBeGreaterThanOrEqual(0);
        expect(vertex.x).toBeLessThanOrEqual(100);
        expect(vertex.y).toBeGreaterThanOrEqual(0);
        expect(vertex.y).toBeLessThanOrEqual(100);
    }
    for (const axis of figure.validAxes) expectValidAxis(axis, figure);
    expect(new Set(figure.validAxes.map(axis => equationKey(axis.equation))).size)
        .toBe(figure.validAxes.length);
    expect(new Set(figure.validAxes.map(axis => equationKey(axis.equation))))
        .toEqual(discoverSymmetryAxes(figure.vertices));
}

function distance(first: LineSymmetryCoordinate, second: LineSymmetryCoordinate): number {
    return Math.hypot(second.x - first.x, second.y - first.y);
}

function expectVisibleAsymmetry(figure: LineSymmetryFigure): void {
    if (figure.kind === 'scalene-triangle') {
        const [first, second, third] = figure.vertices;
        const sideLengths = [
            distance(first, second),
            distance(second, third),
            distance(third, first)
        ].sort((one, two) => one - two);
        expect(sideLengths[1] - sideLengths[0]).toBeGreaterThanOrEqual(10);
        expect(sideLengths[2] - sideLengths[1]).toBeGreaterThanOrEqual(20);
    }
    if (figure.kind === 'parallelogram') {
        const [first, second, third] = figure.vertices;
        const base = distance(first, second);
        const side = distance(second, third);
        const baseVector = {x: second.x - first.x, y: second.y - first.y};
        const sideVector = {x: third.x - second.x, y: third.y - second.y};
        expect(Math.abs(base - side)).toBeGreaterThan(25);
        expect(Math.abs(baseVector.x * sideVector.x + baseVector.y * sideVector.y))
            .toBeGreaterThan(500);
    }
}

describe('ShapeLineSymmetryGenerator', () => {
    it('accepts only its empty neutral configuration', () => {
        expect(() => generator.generate(null as never)).toThrow(GeneratorValidationError);
        expect(generator.generate({})).not.toBeNull();
    });

    it('provides one canonical catalogue with every valid reflection axis', () => {
        const figures = generator.generate({})!.data.figures;
        expect(figures.map(figure => figure.kind)).toEqual([
            'isosceles-triangle',
            'rectangle',
            'square',
            'scalene-triangle',
            'parallelogram'
        ]);
        expect(figures.map(figure => figure.validAxes.length)).toEqual([1, 2, 4, 0, 0]);
        figures.forEach(figure => {
            expectCompleteSymmetryGeometry(figure);
            if (figure.validAxes.length === 0) expectVisibleAsymmetry(figure);
        });
    });

    it('is independent of presentation seeds', () => {
        setSeed('line-symmetry-first');
        const first = generator.generate({});
        setSeed('line-symmetry-second');
        expect(generator.generate({})).toEqual(first);
    });
});
