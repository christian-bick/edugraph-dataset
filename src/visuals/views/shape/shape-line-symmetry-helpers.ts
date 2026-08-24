import {
    LineSymmetryAxis,
    LineSymmetryCoordinate,
    LineSymmetryFigure,
    ShapeAttributeOption,
    ShapeLineSymmetryProblem
} from '../../../types/problems.ts';

const EPSILON = 0.01;
const OPTION_IDS: readonly ShapeAttributeOption['id'][] = ['A', 'B', 'C', 'D'];
const FIGURE_KINDS: readonly LineSymmetryFigure['kind'][] = [
    'isosceles-triangle',
    'rectangle',
    'square',
    'scalene-triangle',
    'parallelogram'
];
const EXPECTED_AXIS_COUNTS: Readonly<Record<LineSymmetryFigure['kind'], number>> = {
    'isosceles-triangle': 1,
    rectangle: 2,
    square: 4,
    'scalene-triangle': 0,
    parallelogram: 0
};

export type IdentificationMultiAxisKind = 'rectangle' | 'square';
export type DrawingFigureKind = 'isosceles-triangle' | IdentificationMultiAxisKind;

export type LineSymmetryIdentificationOption = {
    id: ShapeAttributeOption['id'];
    figure: LineSymmetryFigure;
};

export type LineSymmetryIdentificationPresentation = {
    options: LineSymmetryIdentificationOption[];
    answerIds: ShapeAttributeOption['id'][];
};

const isCoordinate = (point: LineSymmetryCoordinate): boolean => typeof point === 'object'
    && point !== null
    && Number.isFinite(point.x)
    && Number.isFinite(point.y)
    && point.x >= 0
    && point.x <= 100
    && point.y >= 0
    && point.y <= 100;

const samePoint = (first: LineSymmetryCoordinate, second: LineSymmetryCoordinate): boolean => (
    Math.hypot(first.x - second.x, first.y - second.y) < EPSILON
);

const cross = (
    first: LineSymmetryCoordinate,
    second: LineSymmetryCoordinate,
    third: LineSymmetryCoordinate
): number => (second.x - first.x) * (third.y - first.y)
    - (second.y - first.y) * (third.x - first.x);

const pointOnSegment = (
    point: LineSymmetryCoordinate,
    start: LineSymmetryCoordinate,
    end: LineSymmetryCoordinate
): boolean => Math.abs(cross(start, end, point)) < EPSILON
    && point.x >= Math.min(start.x, end.x) - EPSILON
    && point.x <= Math.max(start.x, end.x) + EPSILON
    && point.y >= Math.min(start.y, end.y) - EPSILON
    && point.y <= Math.max(start.y, end.y) + EPSILON;

const segmentsIntersect = (
    firstStart: LineSymmetryCoordinate,
    firstEnd: LineSymmetryCoordinate,
    secondStart: LineSymmetryCoordinate,
    secondEnd: LineSymmetryCoordinate
): boolean => {
    const turns = [
        cross(firstStart, firstEnd, secondStart),
        cross(firstStart, firstEnd, secondEnd),
        cross(secondStart, secondEnd, firstStart),
        cross(secondStart, secondEnd, firstEnd)
    ];
    const proper = (turns[0] > EPSILON && turns[1] < -EPSILON
            || turns[0] < -EPSILON && turns[1] > EPSILON)
        && (turns[2] > EPSILON && turns[3] < -EPSILON
            || turns[2] < -EPSILON && turns[3] > EPSILON);
    return proper
        || pointOnSegment(secondStart, firstStart, firstEnd)
        || pointOnSegment(secondEnd, firstStart, firstEnd)
        || pointOnSegment(firstStart, secondStart, secondEnd)
        || pointOnSegment(firstEnd, secondStart, secondEnd);
};

const isSimpleConvexPolygon = (vertices: readonly LineSymmetryCoordinate[]): boolean => {
    if (!Array.isArray(vertices)
        || vertices.length < 3
        || vertices.length > 8
        || !vertices.every(isCoordinate)
        || vertices.some((vertex, index) => vertices.some(
            (other, otherIndex) => index !== otherIndex && samePoint(vertex, other)
        ))) return false;

    const turns = vertices.map((vertex, index) => cross(
        vertex,
        vertices[(index + 1) % vertices.length],
        vertices[(index + 2) % vertices.length]
    ));
    if (turns.some(turn => Math.abs(turn) < EPSILON)
        || !(turns.every(turn => turn > 0) || turns.every(turn => turn < 0))) return false;

    for (let first = 0; first < vertices.length; first++) {
        const firstEnd = (first + 1) % vertices.length;
        for (let second = first + 1; second < vertices.length; second++) {
            const secondEnd = (second + 1) % vertices.length;
            const adjacent = firstEnd === second || secondEnd === first;
            if (!adjacent && segmentsIntersect(
                vertices[first],
                vertices[firstEnd],
                vertices[second],
                vertices[secondEnd]
            )) return false;
        }
    }
    return true;
};

type NormalizedEquation = LineSymmetryAxis['equation'];

const normalizeEquation = (equation: LineSymmetryAxis['equation']): NormalizedEquation | null => {
    if (typeof equation !== 'object'
        || equation === null
        || !Number.isFinite(equation.a)
        || !Number.isFinite(equation.b)
        || !Number.isFinite(equation.c)) return null;
    const length = Math.hypot(equation.a, equation.b);
    if (length < EPSILON) return null;
    let a = equation.a / length;
    let b = equation.b / length;
    let c = equation.c / length;
    if (a < -EPSILON || Math.abs(a) < EPSILON && b < 0) {
        a *= -1;
        b *= -1;
        c *= -1;
    }
    return {a, b, c};
};

const equationMatches = (
    first: LineSymmetryAxis['equation'],
    second: LineSymmetryAxis['equation']
): boolean => {
    const left = normalizeEquation(first);
    const right = normalizeEquation(second);
    return left !== null
        && right !== null
        && Math.abs(left.a - right.a) < EPSILON
        && Math.abs(left.b - right.b) < EPSILON
        && Math.abs(left.c - right.c) < EPSILON;
};

const signedDistance = (point: LineSymmetryCoordinate, equation: NormalizedEquation): number => (
    equation.a * point.x + equation.b * point.y + equation.c
);

const reflectedPoint = (
    point: LineSymmetryCoordinate,
    equation: NormalizedEquation
): LineSymmetryCoordinate => {
    const distance = signedDistance(point, equation);
    return {
        x: point.x - 2 * distance * equation.a,
        y: point.y - 2 * distance * equation.b
    };
};

const candidateEquation = (
    center: LineSymmetryCoordinate,
    point: LineSymmetryCoordinate
): NormalizedEquation | null => {
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    const length = Math.hypot(dx, dy);
    if (length < EPSILON) return null;
    return normalizeEquation({
        a: -dy / length,
        b: dx / length,
        c: (dy * center.x - dx * center.y) / length
    });
};

const isReflectionAxis = (
    equation: NormalizedEquation,
    vertices: readonly LineSymmetryCoordinate[]
): boolean => vertices.every(vertex => {
    const reflected = reflectedPoint(vertex, equation);
    return vertices.some(candidate => samePoint(candidate, reflected));
});

const discoverReflectionAxes = (vertices: readonly LineSymmetryCoordinate[]): NormalizedEquation[] => {
    const center = vertices.reduce(
        (sum, vertex) => ({x: sum.x + vertex.x, y: sum.y + vertex.y}),
        {x: 0, y: 0}
    );
    center.x /= vertices.length;
    center.y /= vertices.length;
    const candidates = [
        ...vertices,
        ...vertices.map((vertex, index) => ({
            x: (vertex.x + vertices[(index + 1) % vertices.length].x) / 2,
            y: (vertex.y + vertices[(index + 1) % vertices.length].y) / 2
        }))
    ];
    const discovered: NormalizedEquation[] = [];
    candidates.forEach(candidate => {
        const equation = candidateEquation(center, candidate);
        if (equation !== null
            && isReflectionAxis(equation, vertices)
            && !discovered.some(existing => equationMatches(existing, equation))) {
            discovered.push(equation);
        }
    });
    return discovered;
};

const correspondencesAreValid = (
    axis: LineSymmetryAxis,
    vertices: readonly LineSymmetryCoordinate[]
): boolean => {
    const equation = normalizeEquation(axis.equation);
    if (equation === null || !Array.isArray(axis.correspondences)) return false;
    const representedVertices: number[] = [];
    for (const correspondence of axis.correspondences) {
        if (typeof correspondence !== 'object'
            || correspondence === null
            || !Number.isInteger(correspondence.firstVertex)
            || !Number.isInteger(correspondence.secondVertex)
            || correspondence.firstVertex < 0
            || correspondence.firstVertex >= vertices.length
            || correspondence.secondVertex < correspondence.firstVertex
            || correspondence.secondVertex >= vertices.length) return false;
        const first = vertices[correspondence.firstVertex];
        const second = vertices[correspondence.secondVertex];
        if (!samePoint(reflectedPoint(first, equation), second)) return false;
        representedVertices.push(correspondence.firstVertex);
        if (correspondence.secondVertex !== correspondence.firstVertex) {
            representedVertices.push(correspondence.secondVertex);
        }
    }
    return representedVertices.length === vertices.length
        && representedVertices.sort((first, second) => first - second)
            .every((vertex, index) => vertex === index);
};

const axisIsValid = (axis: LineSymmetryAxis, figure: LineSymmetryFigure): boolean => {
    if (typeof axis !== 'object' || axis === null) return false;
    const equation = normalizeEquation(axis.equation);
    return equation !== null
        && Math.abs(Math.hypot(axis.equation.a, axis.equation.b) - 1) < EPSILON
        && isReflectionAxis(equation, figure.vertices)
        && correspondencesAreValid(axis, figure.vertices);
};

const figureIsValid = (figure: LineSymmetryFigure): boolean => {
    if (typeof figure !== 'object'
        || figure === null
        || !FIGURE_KINDS.includes(figure.kind)
        || !isSimpleConvexPolygon(figure.vertices)
        || !Array.isArray(figure.validAxes)
        || figure.validAxes.length !== EXPECTED_AXIS_COUNTS[figure.kind]
        || !figure.validAxes.every(axis => axisIsValid(axis, figure))) return false;
    const discovered = discoverReflectionAxes(figure.vertices);
    return discovered.length === figure.validAxes.length
        && discovered.every(equation => figure.validAxes.some(axis => equationMatches(axis.equation, equation)));
};

export const isValidShapeLineSymmetryProblem = (data: ShapeLineSymmetryProblem): boolean => {
    if (!data || !Array.isArray(data.figures) || data.figures.length !== FIGURE_KINDS.length) return false;
    const kinds = data.figures.map(figure => figure.kind);
    return new Set(kinds).size === FIGURE_KINDS.length
        && FIGURE_KINDS.every(kind => kinds.includes(kind))
        && data.figures.every(figureIsValid);
};

const figureOfKind = <TKind extends LineSymmetryFigure['kind']>(
    data: ShapeLineSymmetryProblem,
    kind: TKind
): LineSymmetryFigure => data.figures.find(figure => figure.kind === kind)!;

function shuffled<T>(values: readonly T[], seed: number): T[] {
    const result = [...values];
    let state = (seed ^ 0x9E3779B9) >>> 0;
    for (let index = result.length - 1; index > 0; index--) {
        state = Math.imul(state ^ state >>> 16, 0x21F0AAAD) >>> 0;
        state = Math.imul(state ^ state >>> 15, 0x735A2D97) >>> 0;
        const swapIndex = ((state ^ state >>> 15) >>> 0) % (index + 1);
        [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
}

export const identificationPresentation = (
    data: ShapeLineSymmetryProblem,
    multiAxisKind: IdentificationMultiAxisKind,
    seed: number
): LineSymmetryIdentificationPresentation => {
    const figures = shuffled([
        figureOfKind(data, 'isosceles-triangle'),
        figureOfKind(data, multiAxisKind),
        figureOfKind(data, 'scalene-triangle'),
        figureOfKind(data, 'parallelogram')
    ], seed);
    const options = figures.map((figure, index) => ({id: OPTION_IDS[index], figure}));
    return {
        options,
        answerIds: options.filter(option => option.figure.validAxes.length > 0).map(option => option.id)
    };
};

export const drawingFigure = (
    data: ShapeLineSymmetryProblem,
    kind: DrawingFigureKind
): LineSymmetryFigure => figureOfKind(data, kind);

export const axisEndpoints = (
    axis: LineSymmetryAxis,
    figure: LineSymmetryFigure
): readonly [LineSymmetryCoordinate, LineSymmetryCoordinate] | null => {
    const equation = normalizeEquation(axis.equation);
    if (equation === null || figure.vertices.length === 0) return null;
    const xs = figure.vertices.map(vertex => vertex.x);
    const ys = figure.vertices.map(vertex => vertex.y);
    const figureBounds = {
        minX: Math.min(...xs),
        maxX: Math.max(...xs),
        minY: Math.min(...ys),
        maxY: Math.max(...ys)
    };
    const bounds = {
        minX: Math.min(Math.max(8, figureBounds.minX - 13), figureBounds.minX),
        maxX: Math.max(Math.min(92, figureBounds.maxX + 13), figureBounds.maxX),
        minY: Math.min(Math.max(8, figureBounds.minY - 13), figureBounds.minY),
        maxY: Math.max(Math.min(92, figureBounds.maxY + 13), figureBounds.maxY)
    };
    const candidates: LineSymmetryCoordinate[] = [];
    const add = (point: LineSymmetryCoordinate): void => {
        const snapped = {
            x: Math.abs(point.x - Math.round(point.x)) < EPSILON ? Math.round(point.x) : point.x,
            y: Math.abs(point.y - Math.round(point.y)) < EPSILON ? Math.round(point.y) : point.y
        };
        if (snapped.x < bounds.minX - EPSILON || snapped.x > bounds.maxX + EPSILON
            || snapped.y < bounds.minY - EPSILON || snapped.y > bounds.maxY + EPSILON
            || candidates.some(candidate => samePoint(candidate, snapped))) return;
        candidates.push(snapped);
    };
    if (Math.abs(equation.b) >= EPSILON) {
        add({x: bounds.minX, y: (-equation.a * bounds.minX - equation.c) / equation.b});
        add({x: bounds.maxX, y: (-equation.a * bounds.maxX - equation.c) / equation.b});
    }
    if (Math.abs(equation.a) >= EPSILON) {
        add({x: (-equation.b * bounds.minY - equation.c) / equation.a, y: bounds.minY});
        add({x: (-equation.b * bounds.maxY - equation.c) / equation.a, y: bounds.maxY});
    }
    if (candidates.length < 2) return null;
    let endpoints: readonly [LineSymmetryCoordinate, LineSymmetryCoordinate] = [
        candidates[0],
        candidates[1]
    ];
    let greatestDistance = 0;
    for (let first = 0; first < candidates.length; first++) {
        for (let second = first + 1; second < candidates.length; second++) {
            const distance = Math.hypot(
                candidates[first].x - candidates[second].x,
                candidates[first].y - candidates[second].y
            );
            if (distance > greatestDistance) {
                greatestDistance = distance;
                endpoints = [candidates[first], candidates[second]];
            }
        }
    }
    return endpoints;
};

export const rotationFor = (seed: number, index: number): number => {
    const rotations = [-12, -6, 0, 7, 13] as const;
    return rotations[Math.abs(seed + index * 7) % rotations.length];
};
