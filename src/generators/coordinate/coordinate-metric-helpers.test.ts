import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../lib/errors.ts';
import type {CoordinateAlignedSeparation, RationalCoordinatePoint, SignedRational} from '../../types/problems.ts';
import {makeCoordinateAxis, makeCoordinatePoint} from './coordinate-helpers.ts';
import {addCoordinateValues, assertCoordinateMetricBounds, makeCoordinateAbsoluteDifference, makeCoordinateAlignedSeparation,
    makeCoordinateMetricContext, makeCoordinateRouteEvidence, subtractCoordinateValues} from './coordinate-metric-helpers.ts';

const r = (numerator: number, denominator = 1): SignedRational => ({numerator, denominator});
const axes = {x: makeCoordinateAxis(r(1), -2, 3, 'integer'), y: makeCoordinateAxis(r(1), -2, 3, 'integer')};
const point = (id: string, x: number, y: number) => makeCoordinatePoint(id, axes, x + 2, y + 2);
const a = point('A', -2, -1);
const b = point('B', 3, -1);
const c = point('C', 3, 2);
const d = point('D', -2, 2);

describe('exact coordinate arithmetic', () => {
    it('reduces unsafe cross-products before safe conversion and canonicalizes zero', () => {
        expect(addCoordinateValues(r(-3, 2), r(5, 4))).toEqual(r(-1, 4));
        expect(subtractCoordinateValues(r(5, 4), r(-3, 2))).toEqual(r(11, 4));
        expect(subtractCoordinateValues(r(-3, 2), r(5, 4))).toEqual(r(-11, 4));
        expect(addCoordinateValues(r(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER - 1),
            r(-Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER - 1))).toEqual(r(0));
        expect(subtractCoordinateValues(r(1, Number.MAX_SAFE_INTEGER), r(1, Number.MAX_SAFE_INTEGER))).toEqual(r(0));
        for (const invalid of [null, r(2, 2), r(1, 0), r(-0), r(0, 2)]) {
            expect(() => addCoordinateValues(invalid as SignedRational, r(1))).toThrow(GeneratorValidationError);
            expect(() => subtractCoordinateValues(r(1), invalid as SignedRational)).toThrow(GeneratorValidationError);
        }
        expect(() => addCoordinateValues(r(Number.MAX_SAFE_INTEGER), r(1))).toThrow(GeneratorValidationError);
        expect(() => subtractCoordinateValues(r(1, Number.MAX_SAFE_INTEGER), r(1, Number.MAX_SAFE_INTEGER - 1))).toThrow(GeneratorValidationError);
    });
});

describe('alignment, direction and absolute subtraction', () => {
    it('keeps endpoint roles for both axes/directions, crossing zero and stationary endpoints', () => {
        const forward = makeCoordinateAlignedSeparation(a, b);
        expect(forward).toEqual({fromId: 'A', toId: 'B', varyingAxis: 'x', fixedCoordinate: r(-1), fromCoordinate: r(-2),
            toCoordinate: r(3), direction: 'increasing', lower: r(-2), upper: r(3), orderedDifference: r(5), distance: r(5)});
        expect(makeCoordinateAlignedSeparation(b, a).direction).toBe('decreasing');
        expect(makeCoordinateAlignedSeparation(b, c).distance).toEqual(r(3));
        expect(makeCoordinateAlignedSeparation(c, b).direction).toBe('decreasing');
        expect(makeCoordinateAlignedSeparation(a, {...a, id: 'Z'})).toMatchObject({varyingAxis: 'x', direction: 'stationary', distance: r(0)});
        expect(makeCoordinateAlignedSeparation(a, a, 'y')).toMatchObject({varyingAxis: 'y', direction: 'stationary', distance: r(0)});
        expect(makeCoordinateAbsoluteDifference(forward)).toEqual({minuend: r(3), subtrahend: r(-2), difference: r(5), magnitude: r(5)});
        expect(makeCoordinateAbsoluteDifference(makeCoordinateAlignedSeparation(b, a), 'to-from'))
            .toEqual({minuend: r(-2), subtrahend: r(3), difference: r(-5), magnitude: r(5)});
        expect(makeCoordinateAbsoluteDifference(makeCoordinateAlignedSeparation(a, a), 'to-from').difference).toEqual(r(0));
    });

    it('rejects diagonals, wrong axes, ambiguous identities and false absolute witnesses', () => {
        for (const [from, to, axis] of [[a, c, undefined], [a, b, 'y'], [a, b, 'z'], [a, {...b, id: 'A'}, 'x'],
            [null, b, 'x'], [{...a, id: ''}, b, 'x'], [{...a, x: {}}, b, 'x'], [{...a, y: {value: r(2, 2)}}, b, 'x']] as const) {
            expect(() => makeCoordinateAlignedSeparation(from as RationalCoordinatePoint, to as RationalCoordinatePoint, axis as 'x')).toThrow(GeneratorValidationError);
        }
        const separation = makeCoordinateAlignedSeparation(a, b);
        for (const [value, order] of [[null, 'upper-lower'], [separation, 'bad'], [{...separation, distance: r(4)}, 'to-from'],
            [{...separation, distance: r(2, 2)}, 'upper-lower']] as const) {
            expect(() => makeCoordinateAbsoluteDifference(value as CoordinateAlignedSeparation, order as 'to-from')).toThrow(GeneratorValidationError);
        }
    });
});

describe('semantic context and complete numeric bounds', () => {
    it('assigns one role per ID, including repeated corners and more than five landmarks', () => {
        expect(makeCoordinateMetricContext([a, b], ['corner', 'corner']).landmarks)
            .toEqual([{pointId: 'A', role: 'corner'}, {pointId: 'B', role: 'corner'}]);
        const points = Array.from({length: 6}, (_, i) => ({...a, id: String(i)}));
        expect(makeCoordinateMetricContext(points)).toEqual({kind: 'survey-map', reference: 'survey-origin', lengthUnit: 'meters',
            positiveX: 'east', positiveY: 'north', landmarks: ['entrance', 'bench', 'fountain', 'tree', 'corner', 'entrance']
                .map((role, i) => ({pointId: String(i), role}))});
        const sparse = new Array<RationalCoordinatePoint>(1);
        for (const points of [null, [], [a, a], sparse, [{...a, id: ' A'}], [null]]) {
            expect(() => makeCoordinateMetricContext(points as RationalCoordinatePoint[])).toThrow(GeneratorValidationError);
        }
        for (const selected of [null, [], ['bad'], new Array(1)]) {
            expect(() => makeCoordinateMetricContext([a], selected as ['corner'])).toThrow(GeneratorValidationError);
        }
    });

    it('bounds all frame, coordinate, magnitude, separation and extra working values', () => {
        const separation = makeCoordinateAlignedSeparation(a, b);
        expect(() => assertCoordinateMetricBounds({axes, points: [a, b], separations: [separation], additionalValues: [r(5)], range: 5, signDomain: 'signed'})).not.toThrow();
        expect(() => assertCoordinateMetricBounds({axes, points: [], range: 3})).not.toThrow();
        const nonnegative = {x: makeCoordinateAxis(r(1), 0, 2, 'integer'), y: makeCoordinateAxis(r(1), 0, 2, 'integer')};
        expect(() => assertCoordinateMetricBounds({axes: nonnegative, points: [makeCoordinatePoint('P', nonnegative, 0, 2)], range: 2, signDomain: 'nonnegative'})).not.toThrow();
        const left = makeCoordinatePoint('L', nonnegative, 2, 1);
        const right = makeCoordinatePoint('R', nonnegative, 0, 1);
        const decreasing = makeCoordinateAlignedSeparation(left, right);
        const subtraction = makeCoordinateAbsoluteDifference(decreasing);
        expect(decreasing.direction).toBe('decreasing');
        expect(subtraction).toEqual({minuend: r(2), subtrahend: r(0), difference: r(2), magnitude: r(2)});
        expect(() => assertCoordinateMetricBounds({axes: nonnegative, points: [left, right], separations: [decreasing],
            additionalValues: Object.values(subtraction), range: 2, signDomain: 'nonnegative'})).not.toThrow();
        for (const options of [null, {axes, points: [a], range: 2}, {axes, points: [a], range: 3, signDomain: 'nonnegative'},
            {axes, points: [a], range: 3, signDomain: 'other'}, {axes: {}, points: [a], range: 3},
            {axes, points: null, range: 3}, {axes, points: [a, a], range: 3}, {axes, points: new Array(1), range: 3},
            {axes, points: [{...a, x: {...a.x, tickIndex: 0.5}}], range: 3},
            {axes, points: [a], range: 3, separations: null}, {axes, points: [a], range: 3, additionalValues: null},
            {axes, points: [a], range: 3, separations: new Array(1)}, {axes, points: [a], range: 3, additionalValues: new Array(1)},
            {axes, points: [a, b], range: 3, separations: [separation]}, {axes, points: [a], range: 3, additionalValues: [r(4)]}]) {
            expect(() => assertCoordinateMetricBounds(options as never)).toThrow(GeneratorValidationError);
        }
        for (const range of [0, -0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
            expect(() => assertCoordinateMetricBounds({axes, points: [a], range})).toThrow(GeneratorValidationError);
        }
    });
});

describe('complete route evidence', () => {
    it('supplies the rectilinear sum, every prefix, repeated visits and stationary legs', () => {
        const route = makeCoordinateRouteEvidence(axes, [a, b, c], ['A', 'B', 'C']);
        expect(route.legs.map(leg => leg.distance)).toEqual([r(5), r(3)]);
        expect(route.cumulativeLengths).toEqual([r(0), r(5), r(8)]);
        expect(route.totalLength).toEqual(r(8));
        expect(makeCoordinateRouteEvidence(axes, [a, b, d], ['A', 'B', 'A', 'D']).cumulativeLengths).toEqual([r(0), r(5), r(10), r(13)]);
        expect(makeCoordinateRouteEvidence(axes, [a, b], ['A', 'A', 'B']).cumulativeLengths).toEqual([r(0), r(0), r(5)]);
        const named = {...a, id: '__proto__'};
        expect(makeCoordinateRouteEvidence(axes, [named, b], ['__proto__', 'B']).totalLength).toEqual(r(5));
    });

    it('rejects incomplete, sparse, dangling and diagonal routes', () => {
        for (const [landmarks, path] of [[[a], ['A', 'A']], [[a, b], null], [[a, b], []], [[a, b], ['A']],
            [[a, b], ['A', 'missing']], [[a, b], [1, 'B']], [[a, b], new Array(2)], [[a, c], ['A', 'C']]] as const) {
            expect(() => makeCoordinateRouteEvidence(axes, landmarks as readonly RationalCoordinatePoint[], path as readonly string[])).toThrow(GeneratorValidationError);
        }
    });
});
