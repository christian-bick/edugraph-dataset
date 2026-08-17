import {
    DrawLineSymmetryProblem,
    IdentifyLineSymmetryProblem,
    LineSymmetryAxis,
    LineSymmetryCoordinate,
    LineSymmetryFigure,
    ShapeLineSymmetryProblem
} from '../../../../types/problems.ts';

const EPSILON = 0.01;
const OPTION_IDS = ['A', 'B', 'C', 'D'] as const;

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

const pointOnBoundary = (point: LineSymmetryCoordinate, vertices: readonly LineSymmetryCoordinate[]): boolean => (
    vertices.some((vertex, index) => pointOnSegment(
        point,
        vertex,
        vertices[(index + 1) % vertices.length]
    ))
);

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

const correspondenceIsValid = (
    axis: LineSymmetryAxis,
    vertices: readonly LineSymmetryCoordinate[]
): boolean => {
    const equation = normalizeEquation(axis.equation);
    if (equation === null
        || !Array.isArray(axis.correspondences)
        || axis.correspondences.length < 1
        || axis.correspondences.length > 3) return false;
    return axis.correspondences.every(pair => {
        if (typeof pair !== 'object'
            || pair === null
            || !isCoordinate(pair.first)
            || !isCoordinate(pair.second)
            || !isCoordinate(pair.foldPoint)
            || !Number.isFinite(pair.distanceToAxis)
            || pair.distanceToAxis <= 0
            || !pointOnBoundary(pair.first, vertices)
            || !pointOnBoundary(pair.second, vertices)) return false;
        const expectedFold = {
            x: (pair.first.x + pair.second.x) / 2,
            y: (pair.first.y + pair.second.y) / 2
        };
        const firstDistance = Math.abs(signedDistance(pair.first, equation));
        const secondDistance = Math.abs(signedDistance(pair.second, equation));
        return samePoint(pair.foldPoint, expectedFold)
            && Math.abs(signedDistance(pair.foldPoint, equation)) < EPSILON
            && Math.abs(firstDistance - secondDistance) < EPSILON
            && Math.abs(pair.distanceToAxis - firstDistance) < EPSILON
            && samePoint(reflectedPoint(pair.first, equation), pair.second);
    });
};

const axisIsValid = (axis: LineSymmetryAxis, figure: LineSymmetryFigure): boolean => {
    if (typeof axis !== 'object'
        || axis === null
        || !['vertical', 'horizontal', 'diagonal-rise', 'diagonal-fall'].includes(axis.id)
        || !isCoordinate(axis.start)
        || !isCoordinate(axis.end)
        || samePoint(axis.start, axis.end)) return false;
    const equation = normalizeEquation(axis.equation);
    return equation !== null
        && Math.abs(Math.hypot(axis.equation.a, axis.equation.b) - 1) < EPSILON
        && Math.abs(signedDistance(axis.start, equation)) < EPSILON
        && Math.abs(signedDistance(axis.end, equation)) < EPSILON
        && isReflectionAxis(equation, figure.vertices)
        && correspondenceIsValid(axis, figure.vertices);
};

const figureIsValid = (figure: LineSymmetryFigure): boolean => {
    if (typeof figure !== 'object'
        || figure === null
        || !['isosceles-triangle', 'rectangle', 'square', 'scalene-triangle', 'parallelogram']
            .includes(figure.figureKind)
        || !isSimpleConvexPolygon(figure.vertices)
        || ![0, 1, 2, 4].includes(figure.axisCount)
        || !Array.isArray(figure.validAxes)
        || figure.validAxes.length !== figure.axisCount
        || new Set(figure.validAxes.map(axis => axis.id)).size !== figure.validAxes.length
        || !figure.validAxes.every(axis => axisIsValid(axis, figure))) return false;
    const discovered = discoverReflectionAxes(figure.vertices);
    return discovered.length === figure.validAxes.length
        && discovered.every(equation => figure.validAxes.some(axis => equationMatches(axis.equation, equation)));
};

const axesMatch = (first: readonly LineSymmetryAxis[], second: readonly LineSymmetryAxis[]): boolean => (
    first.length === second.length
    && first.every(axis => second.some(candidate => candidate.id === axis.id
        && equationMatches(candidate.equation, axis.equation)
        && candidate.correspondences.length === axis.correspondences.length
        && axis.correspondences.every((pair, index) => {
            const other = candidate.correspondences[index];
            return samePoint(pair.first, other.first)
                && samePoint(pair.second, other.second)
                && samePoint(pair.foldPoint, other.foldPoint)
                && Math.abs(pair.distanceToAxis - other.distanceToAxis) < EPSILON;
        })))
);

const identifyProblemIsValid = (data: IdentifyLineSymmetryProblem): boolean => {
    if (data.prompt !== 'Classify each figure by whether it can be folded along a line into exactly matching halves.'
        || data.positiveLabel !== 'has line symmetry'
        || data.negativeLabel !== 'does not have line symmetry'
        || !Array.isArray(data.options)
        || data.options.length !== 4
        || !Array.isArray(data.answerIds)
        || data.answerIds.length !== 2
        || data.explanation !== 'Each selected figure can be folded along a valid line so its matching parts coincide.') {
        return false;
    }
    const ids = data.options.map(option => option.id);
    const positiveIds = data.options.filter(option => option.hasLineSymmetry).map(option => option.id);
    return ids.every((id, index) => id === OPTION_IDS[index])
        && new Set(ids).size === 4
        && data.options.every(option => figureIsValid(option.figure)
            && option.hasLineSymmetry === (option.figure.axisCount > 0))
        && positiveIds.length === 2
        && new Set(data.answerIds).size === 2
        && data.answerIds.every((id, index) => id === positiveIds[index])
        && data.options.some(option => option.hasLineSymmetry && option.figure.axisCount === 1)
        && data.options.some(option => option.hasLineSymmetry && option.figure.axisCount > 1)
        && data.options.filter(option => !option.hasLineSymmetry).every(option => option.figure.axisCount === 0)
        && data.answerStatement === `Figures ${data.answerIds.join(' and ')} have at least one line of symmetry.`;
};

const lineCountPhrase = (count: number): string => `${count} ${count === 1 ? 'line' : 'lines'} of symmetry`;

const drawProblemIsValid = (data: DrawLineSymmetryProblem): boolean => {
    if (data.prompt !== 'Draw every line where folding the figure makes exactly matching halves.'
        || !figureIsValid(data.figure)
        || data.figure.axisCount === 0
        || !Array.isArray(data.completedAxes)
        || !data.completedAxes.every(axis => axisIsValid(axis, data.figure))
        || !axesMatch(data.completedAxes, data.figure.validAxes)) return false;
    const answer = lineCountPhrase(data.figure.axisCount);
    return data.answer === answer
        && data.answerStatement === `The figure has ${answer}.`
        && data.explanation === 'Folding along each completed line maps every supplied pair of points onto each other.';
};

export const isValidShapeLineSymmetryProblem = (data: ShapeLineSymmetryProblem): boolean => (
    data.task === 'identify-line-symmetry'
        ? identifyProblemIsValid(data)
        : drawProblemIsValid(data)
);

export const rotationFor = (seed: number, index: number): number => {
    const rotations = [-12, -6, 0, 7, 13] as const;
    return rotations[Math.abs(seed + index * 7) % rotations.length];
};
