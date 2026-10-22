import type {CoordinatePointsProblem, CoordinateReflectionRelationProblem, CoordinateLocationTag, FormattedSignedRationalLocation, RationalCoordinateAxis, RationalCoordinatePoint, SignedRational, SignedRationalNotation} from '../../../types/problems.ts';

const r = (numerator: number, denominator = 1): SignedRational => ({numerator, denominator});
const fraction = (numerator: number, denominator = 1): SignedRationalNotation => ({kind: 'fraction', numerator, denominator});
function axis(values: readonly (readonly [number, number])[], zeroIndex: number, step: readonly [number, number]): RationalCoordinateAxis {
    const ticks = values.map(([n, d]) => r(n, d));
    return {minimum: ticks[0]!, maximum: ticks.at(-1)!, step: r(...step), ticks, zeroIndex,
        tickNotations: values.map(([n, d]) => fraction(n, d)), stepNotation: fraction(...step)};
}
function component(n: number, d: number, index: number, sign: -1 | 0 | 1, magnitude: number, notation: SignedRationalNotation): FormattedSignedRationalLocation {
    return {value: r(n, d), tickIndex: index, sign, magnitude: r(magnitude, d), notation};
}
function point(id: string, x: FormattedSignedRationalLocation, y: FormattedSignedRationalLocation, locationTag: CoordinateLocationTag): RationalCoordinatePoint {
    return {id, x, y, locationTag};
}
const x0 = component(0, 1, 4, 0, 0, fraction(0)), y0 = component(0, 1, 3, 0, 0, fraction(0));
const xm = component(-3, 2, 1, -1, 3, fraction(-3, 2)), xp = component(3, 2, 7, 1, 3, fraction(3, 2));
const y1 = component(1, 1, 4, 1, 1, fraction(1)), ym1 = component(-1, 1, 2, -1, 1, fraction(-1));

/** Literal unequal-scale frame and all location classes, independent of producer calculation. */
export const coordinateOracle: CoordinatePointsProblem = {
    kind: 'coordinate-points',
    axes: {x: axis([[-2, 1], [-3, 2], [-1, 1], [-1, 2], [0, 1], [1, 2], [1, 1], [3, 2], [2, 1]], 4, [1, 2]),
        y: axis([[-3, 1], [-2, 1], [-1, 1], [0, 1], [1, 1], [2, 1], [3, 1]], 3, [1, 1])},
    points: [point('A', xm, component(2, 1, 5, 1, 2, fraction(2)), 'quadrant-II'),
        point('B', component(1, 2, 5, 1, 1, fraction(1, 2)), ym1, 'quadrant-IV'),
        point('C', component(1, 1, 6, 1, 1, fraction(1)), y1, 'quadrant-I'),
        point('D', component(-1, 1, 2, -1, 1, fraction(-1)), ym1, 'quadrant-III'),
        point('E', x0, component(2, 1, 5, 1, 2, fraction(2)), 'y-axis'),
        point('F', component(-1, 1, 2, -1, 1, fraction(-1)), y0, 'x-axis'), point('O', x0, y0, 'origin')]
};
const decimal = (coefficient: number, numeral: string): SignedRationalNotation => ({kind: 'decimal', coefficient, scale: 2, numeral});
export const decimalCoordinateOracle: CoordinatePointsProblem = {
    kind: 'coordinate-points', axes: {
        x: {...axis([[0, 1], [1, 2], [1, 1], [3, 2], [2, 1]], 0, [1, 2]), tickNotations: [decimal(0, '0.00'), decimal(50, '0.50'), decimal(100, '1.00'), decimal(150, '1.50'), decimal(200, '2.00')], stepNotation: decimal(50, '0.50')},
        y: {...axis([[0, 1], [1, 4], [1, 2], [3, 4], [1, 1]], 0, [1, 4]), tickNotations: [decimal(0, '0.00'), decimal(25, '0.25'), decimal(50, '0.50'), decimal(75, '0.75'), decimal(100, '1.00')], stepNotation: decimal(25, '0.25')}
    }, points: [point('P', component(3, 2, 3, 1, 3, decimal(150, '1.50')), component(1, 4, 1, 1, 1, decimal(25, '0.25')), 'quadrant-I')]
};
export const unreducedCoordinateOracle: CoordinatePointsProblem = {...coordinateOracle, points: [point('U', component(1, 2, 5, 1, 1, fraction(2, 4)), component(2, 1, 5, 1, 2, fraction(4, 2)), 'quadrant-I')]};
const original = point('P', xm, y1, 'quadrant-II'), first = point("P'", xm, ym1, 'quadrant-III'), final = point("P''", xp, ym1, 'quadrant-IV');
export const reflectionOracle: CoordinateReflectionRelationProblem = {
    kind: 'coordinate-reflection-relations', axes: coordinateOracle.axes, original,
    steps: [{axis: 'x', before: original, after: first, unchanged: {component: 'x', value: r(-3, 2)}, negated: {component: 'y', before: r(1), after: r(-1), valueChanged: true},
        mirror: {foot: point('F1', xm, y0, 'x-axis'), beforeDistance: r(1), afterDistance: r(1)}},
    {axis: 'y', before: first, after: final, unchanged: {component: 'y', value: r(-1)}, negated: {component: 'x', before: r(-3, 2), after: r(3, 2), valueChanged: true},
        mirror: {foot: point('F2', x0, ym1, 'y-axis'), beforeDistance: r(3, 2), afterDistance: r(3, 2)}}]
};
const origin = point('P', x0, y0, 'origin');
export const fixedReflectionOracle: CoordinateReflectionRelationProblem = {kind: 'coordinate-reflection-relations', axes: coordinateOracle.axes, original: origin,
    steps: [{axis: 'x', before: origin, after: {...origin, id: "P'"}, unchanged: {component: 'x', value: r(0)},
        negated: {component: 'y', before: r(0), after: r(0), valueChanged: false}, mirror: {foot: {...origin, id: 'F1'}, beforeDistance: r(0), afterDistance: r(0)}}]};
