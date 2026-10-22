import type {CoordinateAlignedSeparation, CoordinateAxisDistanceProblem, CoordinateMetricContext, CoordinatePolygonProblem, CoordinateRouteProblem, RationalCoordinateAxis, RationalCoordinateAxes, RationalCoordinatePoint, SignedRational} from '../../../types/problems.ts';

const r = (numerator: number, denominator = 1): SignedRational => ({numerator, denominator});
const axis = (ticks: SignedRational[], step: SignedRational, zeroIndex: number): RationalCoordinateAxis => ({minimum: ticks[0]!, maximum: ticks.at(-1)!, step, ticks, zeroIndex,
    tickNotations: ticks.map(value => value.denominator === 1 ? {kind: 'integer', numeral: String(value.numerator)} : {kind: 'fraction', ...value}), stepNotation: step.denominator === 1 ? {kind: 'integer', numeral: String(step.numerator)} : {kind: 'fraction', ...step}});
const point = (id: string, axes: RationalCoordinateAxes, x: number, y: number): RationalCoordinatePoint => {
    const part = (scale: RationalCoordinateAxis, tickIndex: number) => ({value: scale.ticks[tickIndex]!, tickIndex, magnitude: {...scale.ticks[tickIndex]!, numerator: Math.abs(scale.ticks[tickIndex]!.numerator)}, sign: Math.sign(scale.ticks[tickIndex]!.numerator) as -1 | 0 | 1, notation: scale.tickNotations[tickIndex]!});
    const px = part(axes.x, x), py = part(axes.y, y);
    return {id, x: px, y: py, locationTag: px.sign === 0 ? py.sign === 0 ? 'origin' : 'y-axis' : py.sign === 0 ? 'x-axis' : px.sign > 0 ? py.sign > 0 ? 'quadrant-I' : 'quadrant-IV' : py.sign > 0 ? 'quadrant-II' : 'quadrant-III'};
};
const context = (points: readonly RationalCoordinatePoint[]): CoordinateMetricContext => ({kind: 'survey-map', reference: 'survey-origin', lengthUnit: 'meters', positiveX: 'east', positiveY: 'north',
    landmarks: points.map((item, index) => ({pointId: item.id, role: (['entrance', 'bench', 'fountain', 'tree', 'corner'] as const)[Math.min(index, 4)]!}))});
const relation = (fromId: string, toId: string, varyingAxis: 'x' | 'y', fixedCoordinate: SignedRational, fromCoordinate: SignedRational, toCoordinate: SignedRational,
    direction: CoordinateAlignedSeparation['direction'], lower: SignedRational, upper: SignedRational, distance: SignedRational): CoordinateAlignedSeparation =>
    ({fromId, toId, varyingAxis, fixedCoordinate, fromCoordinate, toCoordinate, direction, lower, upper, orderedDifference: distance, distance});

export const metricSquareAxes: RationalCoordinateAxes = {x: axis([r(0), r(1, 2), r(1), r(3, 2), r(2)], r(1, 2), 0), y: axis([r(0), r(1), r(2)], r(1), 0)};
const squareVertices = [point('A', metricSquareAxes, 0, 0), point('B', metricSquareAxes, 4, 0), point('C', metricSquareAxes, 4, 2), point('D', metricSquareAxes, 0, 2)] as const;
export const metricSquareOracle: CoordinatePolygonProblem = {
    kind: 'coordinate-polygons', axes: metricSquareAxes, vertices: squareVertices,
    edges: [{fromId: 'A', toId: 'B'}, {fromId: 'B', toId: 'C'}, {fromId: 'C', toId: 'D'}, {fromId: 'D', toId: 'A'}],
    alignedSides: [
        {edgeIndex: 0, separation: relation('A', 'B', 'x', r(0), r(0), r(2), 'increasing', r(0), r(2), r(2))},
        {edgeIndex: 1, separation: relation('B', 'C', 'y', r(2), r(0), r(2), 'increasing', r(0), r(2), r(2))},
        {edgeIndex: 2, separation: relation('C', 'D', 'x', r(2), r(2), r(0), 'decreasing', r(0), r(2), r(2))},
        {edgeIndex: 3, separation: relation('D', 'A', 'y', r(0), r(2), r(0), 'decreasing', r(0), r(2), r(2))}
    ], sideDistanceEquations: [], context: context(squareVertices)
};

const distanceAxes: RationalCoordinateAxes = {x: axis([r(-3, 2), r(-1), r(-1, 2), r(0)], r(1, 2), 3),
    y: axis([r(-2), r(-7, 4), r(-3, 2), r(-5, 4), r(-1), r(-3, 4), r(-1, 2), r(-1, 4), r(0), r(1, 4), r(1, 2), r(3, 4), r(1), r(5, 4)], r(1, 4), 8)};
const distancePoints = [point('P', distanceAxes, 0, 0), point('Q', distanceAxes, 0, 13)] as const;
export const metricDistanceOracle: CoordinateAxisDistanceProblem = {
    kind: 'coordinate-axis-distance', axes: distanceAxes, first: distancePoints[0], second: distancePoints[1],
    separation: relation('P', 'Q', 'y', r(-3, 2), r(-2), r(5, 4), 'increasing', r(-2), r(5, 4), r(13, 4)),
    absoluteDifference: {minuend: r(5, 4), subtrahend: r(-2), difference: r(13, 4), magnitude: r(13, 4)}, context: context(distancePoints)
};

const routeAxes: RationalCoordinateAxes = {x: axis([r(-2), r(-1), r(0), r(1), r(2), r(3)], r(1), 2), y: axis([r(-1), r(0), r(1), r(2)], r(1), 1)};
const routePoints = [point('A', routeAxes, 0, 0), point('B', routeAxes, 5, 0), point('C', routeAxes, 5, 3)] as const;
export const metricRouteOracle: CoordinateRouteProblem = {
    kind: 'coordinate-problems', axes: routeAxes, landmarks: routePoints, path: ['A', 'B', 'C'],
    legs: [relation('A', 'B', 'x', r(-1), r(-2), r(3), 'increasing', r(-2), r(3), r(5)), relation('B', 'C', 'y', r(3), r(-1), r(2), 'increasing', r(-1), r(2), r(3))],
    cumulativeLengths: [r(0), r(5), r(8)], totalLength: r(8), context: context(routePoints)
};

const diagonalAxes: RationalCoordinateAxes = {x: axis([r(0), r(1), r(2), r(3), r(4)], r(1), 0), y: axis([r(0), r(1), r(2)], r(1), 0)};
const diagonalVertices = [point('A', diagonalAxes, 0, 0), point('B', diagonalAxes, 2, 2), point('C', diagonalAxes, 4, 0), point('D', diagonalAxes, 3, 0), point('E', diagonalAxes, 2, 1), point('F', diagonalAxes, 1, 0)] as const;
export const metricConcaveDiagonalOracle: CoordinatePolygonProblem = {
    kind: 'coordinate-polygons', axes: diagonalAxes, vertices: diagonalVertices,
    edges: [{fromId: 'A', toId: 'B'}, {fromId: 'B', toId: 'C'}, {fromId: 'C', toId: 'D'}, {fromId: 'D', toId: 'E'}, {fromId: 'E', toId: 'F'}, {fromId: 'F', toId: 'A'}],
    alignedSides: [{edgeIndex: 2, separation: relation('C', 'D', 'x', r(0), r(4), r(3), 'decreasing', r(3), r(4), r(1))},
        {edgeIndex: 5, separation: relation('F', 'A', 'x', r(0), r(1), r(0), 'decreasing', r(0), r(1), r(1))}],
    sideDistanceEquations: [{edgeIndex: 5, minuend: r(1), subtrahend: r(0), difference: r(1)}], context: context(diagonalVertices)
};

const rectangleAxes: RationalCoordinateAxes = {x: axis([r(0), r(1), r(2), r(3), r(4), r(5)], r(1), 0), y: axis([r(0), r(1), r(2), r(3)], r(1), 0)};
const rectangleVertices = [point('D', rectangleAxes, 0, 3), point('A', rectangleAxes, 0, 0), point('B', rectangleAxes, 5, 0), point('C', rectangleAxes, 5, 3)] as const;
export const metricDownwardSideOracle: CoordinatePolygonProblem = {
    kind: 'coordinate-polygons', axes: rectangleAxes, vertices: rectangleVertices,
    edges: [{fromId: 'D', toId: 'A'}, {fromId: 'A', toId: 'B'}, {fromId: 'B', toId: 'C'}, {fromId: 'C', toId: 'D'}],
    alignedSides: [{edgeIndex: 0, separation: relation('D', 'A', 'y', r(0), r(3), r(0), 'decreasing', r(0), r(3), r(3))},
        {edgeIndex: 1, separation: relation('A', 'B', 'x', r(0), r(0), r(5), 'increasing', r(0), r(5), r(5))},
        {edgeIndex: 2, separation: relation('B', 'C', 'y', r(5), r(0), r(3), 'increasing', r(0), r(3), r(3))},
        {edgeIndex: 3, separation: relation('C', 'D', 'x', r(3), r(5), r(0), 'decreasing', r(0), r(5), r(5))}],
    sideDistanceEquations: [{edgeIndex: 0, minuend: r(3), subtrahend: r(0), difference: r(3)}], context: context(rectangleVertices)
};
