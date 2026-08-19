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

function expectCoordinateClose(
    actual: LineSymmetryCoordinate,
    expected: LineSymmetryCoordinate
): void {
    expect(actual.x).toBeCloseTo(expected.x, 8);
    expect(actual.y).toBeCloseTo(expected.y, 8);
}

type Equation = LineSymmetryAxis['equation'];

function canonicalEquation(a: number, b: number, c: number): Equation {
    const length = Math.hypot(a, b);
    let normalized = {a: a / length, b: b / length, c: c / length};
    if (normalized.a < -EPSILON || (Math.abs(normalized.a) < EPSILON && normalized.b < 0)) {
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

function matchesVertexSet(
    equation: Equation,
    vertices: readonly LineSymmetryCoordinate[]
): boolean {
    const axis: LineSymmetryAxis = {
        id: 'vertical',
        start: {x: 0, y: 0},
        end: {x: 0, y: 0},
        equation,
        correspondences: []
    };
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
    expect(Math.abs(onAxis(axis.start, axis))).toBeLessThan(EPSILON);
    expect(Math.abs(onAxis(axis.end, axis))).toBeLessThan(EPSILON);
    for (const endpoint of [axis.start, axis.end]) {
        expect(endpoint.x).toBeGreaterThanOrEqual(0);
        expect(endpoint.x).toBeLessThanOrEqual(100);
        expect(endpoint.y).toBeGreaterThanOrEqual(0);
        expect(endpoint.y).toBeLessThanOrEqual(100);
    }
    expect(axis.correspondences.length).toBeGreaterThanOrEqual(2);
    for (const pair of axis.correspondences) {
        expectCoordinateClose(reflect(pair.first, axis), pair.second);
        expectCoordinateClose(pair.foldPoint, {
            x: (pair.first.x + pair.second.x) / 2,
            y: (pair.first.y + pair.second.y) / 2
        });
        expect(Math.abs(onAxis(pair.foldPoint, axis))).toBeLessThan(EPSILON);
        expect(Math.abs(onAxis(pair.first, axis))).toBeCloseTo(pair.distanceToAxis, 8);
        expect(Math.abs(onAxis(pair.second, axis))).toBeCloseTo(pair.distanceToAxis, 8);
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
    expect(figure.axisCount).toBe(figure.validAxes.length);
    expect(new Set(figure.validAxes.map(axis => axis.id)).size).toBe(figure.validAxes.length);
    for (const vertex of figure.vertices) {
        expect(vertex.x).toBeGreaterThanOrEqual(0);
        expect(vertex.x).toBeLessThanOrEqual(100);
        expect(vertex.y).toBeGreaterThanOrEqual(0);
        expect(vertex.y).toBeLessThanOrEqual(100);
    }
    for (const axis of figure.validAxes) expectValidAxis(axis, figure);
    expect(new Set(figure.validAxes.map(axis => equationKey(axis.equation))))
        .toEqual(discoverSymmetryAxes(figure.vertices));
}

function distance(
    first: LineSymmetryCoordinate,
    second: LineSymmetryCoordinate
): number {
    return Math.hypot(second.x - first.x, second.y - first.y);
}

function expectVisibleAsymmetry(figure: LineSymmetryFigure): void {
    if (figure.figureKind === 'scalene-triangle') {
        const [first, second, third] = figure.vertices;
        const sideLengths = [
            distance(first, second),
            distance(second, third),
            distance(third, first)
        ].sort((one, two) => one - two);
        expect(sideLengths[1] - sideLengths[0]).toBeGreaterThanOrEqual(10);
        expect(sideLengths[2] - sideLengths[1]).toBeGreaterThanOrEqual(20);
    }

    if (figure.figureKind === 'parallelogram') {
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

    it('classifies balanced no-, one-, and multiple-axis figures by fold validity', () => {
        setSeed('identify-line-symmetry');
        const data = generator.generate({})!.data.identification;
        expect(data.options.map(option => option.id)).toEqual(['A', 'B', 'C', 'D']);
        expect(data.options.filter(option => option.hasLineSymmetry)).toHaveLength(2);
        expect(data.options.filter(option => !option.hasLineSymmetry)).toHaveLength(2);
        expect(data.options.map(option => option.figure.axisCount).sort()).toEqual([0, 0, 1, 2]);
        expect(data.answerIds).toEqual(
            data.options.filter(option => option.hasLineSymmetry).map(option => option.id)
        );
        for (const option of data.options) {
            expect(option.hasLineSymmetry).toBe(option.figure.axisCount > 0);
            expectCompleteSymmetryGeometry(option.figure);
            if (!option.hasLineSymmetry) expectVisibleAsymmetry(option.figure);
        }
    });

    it('supplies every completed fold axis and correspondence for drawing', () => {
        const counts = new Set<number>();
        for (let seed = 0; seed < 100; seed++) {
            setSeed(`draw-line-symmetry-${seed}`);
            const data = generator.generate({})!.data.drawing;
            expect(data.figure.axisCount).toBeGreaterThan(0);
            expect(data.completedAxes).toEqual(data.figure.validAxes);
            expectCompleteSymmetryGeometry(data.figure);
            counts.add(data.figure.axisCount);
        }
        expect(counts).toEqual(new Set([1, 2, 4]));
    });

    it('is deterministic for the neutral model', () => {
        setSeed('line-symmetry-neutral');
        const first = generator.generate({});
        setSeed('line-symmetry-neutral');
        expect(generator.generate({})).toEqual(first);
    });
});
