import {describe, expect, it} from 'vitest';
import {makeCoordinatePoint} from '../../../generators/coordinate/coordinate-helpers.ts';
import {buildCoordinateAxisDistanceProblem} from '../../../generators/coordinate/coordinate-axis-distance/generator.ts';
import {buildCoordinateRouteProblem} from '../../../generators/coordinate/coordinate-problems/generator.ts';
import {buildCoordinatePolygonProblem} from '../../../generators/coordinate/coordinate-polygons/generator.ts';
import {isCoordinateAxisDistance, isCoordinatePolygon, isCoordinateRoute} from './coordinate-metric-helpers.ts';
import {metricConcaveDiagonalOracle, metricDistanceOracle, metricDownwardSideOracle, metricRouteOracle, metricSquareOracle} from './coordinate-metric-fixtures.ts';

describe('exact coordinate metric contracts', () => {
    it('accepts independent13/4 distance,5+3 route,square,concave and downward-side oracles', () => {
        expect(isCoordinateAxisDistance(metricDistanceOracle)).toBe(true);
        expect(isCoordinateRoute(metricRouteOracle)).toBe(true);
        for (const data of [metricSquareOracle, metricConcaveDiagonalOracle, metricDownwardSideOracle]) expect(isCoordinatePolygon(data)).toBe(true);
    });
    it('accepts coincident endpoints and either exact subtraction orientation', () => {
        const first = metricDistanceOracle.first, second = {...first, id: 'Z'};
        const zero = buildCoordinateAxisDistanceProblem({axes: metricDistanceOracle.axes, first, second, varyingAxis: 'x'});
        expect(zero.separation.distance).toEqual({numerator: 0, denominator: 1});
        expect(isCoordinateAxisDistance(zero)).toBe(true);
        const reversed = {...metricDistanceOracle, absoluteDifference: {minuend: {numerator: -2, denominator: 1}, subtrahend: {numerator: 5, denominator: 4}, difference: {numerator: -13, denominator: 4}, magnitude: {numerator: 13, denominator: 4}}};
        expect(isCoordinateAxisDistance(reversed)).toBe(true);
        expect(isCoordinateAxisDistance({...reversed, absoluteDifference: {...reversed.absoluteDifference, difference: {numerator: 13, denominator: 4}}})).toBe(false);
    });
    it('rejects incoherent endpoint roles, diagonal distance, incorrect absolute values and noncanonical metadata', () => {
        for (const separation of [{...metricDistanceOracle.separation, fromId: 'Q'}, {...metricDistanceOracle.separation, varyingAxis: 'x'},
            {...metricDistanceOracle.separation, fixedCoordinate: {numerator: 0, denominator: 1}}, {...metricDistanceOracle.separation, direction: 'decreasing'},
            {...metricDistanceOracle.separation, distance: {numerator: 13, denominator: 5}}]) expect(isCoordinateAxisDistance({...metricDistanceOracle, separation})).toBe(false);
        expect(isCoordinateAxisDistance({...metricDistanceOracle, second: metricSquareOracle.vertices[2]})).toBe(false);
        expect(isCoordinateAxisDistance({...metricDistanceOracle, absoluteDifference: {...metricDistanceOracle.absoluteDifference, magnitude: {numerator: -13, denominator: 4}}})).toBe(false);
        expect(isCoordinateAxisDistance({...metricDistanceOracle, first: {...metricDistanceOracle.first, x: {...metricDistanceOracle.first.x, sign: -0}}})).toBe(false);
    });
    it('preserves route revisits, stationary legs and every exact prefix', () => {
        const data = buildCoordinateRouteProblem({axes: metricRouteOracle.axes, landmarks: metricRouteOracle.landmarks, path: ['A', 'B', 'A', 'A', 'B', 'C']});
        expect(data.cumulativeLengths).toEqual([0, 5, 10, 10, 15, 18].map(numerator => ({numerator, denominator: 1})));
        expect(isCoordinateRoute(data)).toBe(true);
        expect(data.legs[2]!.direction).toBe('stationary');
        expect(isCoordinateRoute({...data, cumulativeLengths: [...data.cumulativeLengths.slice(0, 3), {numerator: 11, denominator: 1}, ...data.cumulativeLengths.slice(4)]})).toBe(false);
        expect(isCoordinateRoute({...data, totalLength: {numerator: 8, denominator: 1}})).toBe(false);
        expect(isCoordinateRoute({...data, path: ['A', 'B', 'missing']})).toBe(false);
    });
    it('accepts every coherent selected side-equation subset without narrowing the geometry type', () => {
        for (const indices of [[], [0], [3], [0, 1, 2, 3]]) {
            const data = buildCoordinatePolygonProblem(metricSquareOracle.axes, metricSquareOracle.vertices, indices);
            expect(isCoordinatePolygon(data)).toBe(true);
        }
        const downward = metricDownwardSideOracle;
        expect(downward.alignedSides[0].separation.direction).toBe('decreasing');
        expect(downward.sideDistanceEquations[0]).toEqual({edgeIndex: 0, minuend: {numerator: 3, denominator: 1}, subtrahend: {numerator: 0, denominator: 1}, difference: {numerator: 3, denominator: 1}});
        expect(isCoordinatePolygon({...downward, sideDistanceEquations: []})).toBe(true);
    });
    it('rejects crossed and overlapping geometry independently of valid exact point/edge data', () => {
        const axes = metricSquareOracle.axes;
        const vertices = [makeCoordinatePoint('A', axes, 0, 0), makeCoordinatePoint('B', axes, 4, 2), makeCoordinatePoint('C', axes, 0, 2), makeCoordinatePoint('D', axes, 4, 0)] as const;
        const horizontal = (fromId: string, toId: string, y: number, from: number, to: number) => ({fromId, toId, varyingAxis: 'x', fixedCoordinate: {numerator: y, denominator: 1}, fromCoordinate: {numerator: from, denominator: 1}, toCoordinate: {numerator: to, denominator: 1}, direction: 'decreasing', lower: {numerator: 0, denominator: 1}, upper: {numerator: 2, denominator: 1}, orderedDifference: {numerator: 2, denominator: 1}, distance: {numerator: 2, denominator: 1}});
        const crossed = {...metricSquareOracle, vertices, alignedSides: [{edgeIndex: 1, separation: horizontal('B', 'C', 2, 2, 0)}, {edgeIndex: 3, separation: horizontal('D', 'A', 0, 2, 0)}]};
        expect(isCoordinatePolygon(crossed)).toBe(false);
        const overlap = [makeCoordinatePoint('A', axes, 0, 0), makeCoordinatePoint('B', axes, 4, 0), makeCoordinatePoint('C', axes, 2, 0), makeCoordinatePoint('D', axes, 2, 2)];
        expect(isCoordinatePolygon({...metricSquareOracle, vertices: overlap})).toBe(false);
        expect(isCoordinatePolygon({...metricSquareOracle, vertices: [vertices[0], vertices[1], vertices[0], vertices[3]]})).toBe(false);
    });
    it('rejects incomplete closure/aligned lists, diagonal proofs and wrong exact subtraction equations', () => {
        expect(isCoordinatePolygon({...metricSquareOracle, edges: [...metricSquareOracle.edges.slice(0, 3), {fromId: 'D', toId: 'B'}]})).toBe(false);
        expect(isCoordinatePolygon({...metricSquareOracle, alignedSides: metricSquareOracle.alignedSides.slice(0, 3)})).toBe(false);
        expect(isCoordinatePolygon({...metricConcaveDiagonalOracle, sideDistanceEquations: [{edgeIndex: 0, minuend: {numerator: 2, denominator: 1}, subtrahend: {numerator: 0, denominator: 1}, difference: {numerator: 2, denominator: 1}}]})).toBe(false);
        for (const equation of [{...metricDownwardSideOracle.sideDistanceEquations[0]!, difference: {numerator: -3, denominator: 1}}, {...metricDownwardSideOracle.sideDistanceEquations[0]!, minuend: {numerator: 0, denominator: 1}}, {...metricDownwardSideOracle.sideDistanceEquations[0]!, edgeIndex: -0}]) expect(isCoordinatePolygon({...metricDownwardSideOracle, sideDistanceEquations: [equation]})).toBe(false);
        expect(isCoordinatePolygon({...metricDownwardSideOracle, sideDistanceEquations: [metricDownwardSideOracle.sideDistanceEquations[0], metricDownwardSideOracle.sideDistanceEquations[0]]})).toBe(false);
    });
    it('rejects sparse arrays and incomplete/prototype-like context mappings before rendering', () => {
        const sparse = [...metricSquareOracle.vertices]; delete sparse[1];
        expect(isCoordinatePolygon({...metricSquareOracle, vertices: sparse})).toBe(false);
        expect(isCoordinatePolygon({...metricSquareOracle, sideDistanceEquations: new Array(1)})).toBe(false);
        expect(isCoordinateRoute({...metricRouteOracle, path: new Array(3)})).toBe(false);
        expect(isCoordinateRoute({...metricRouteOracle, legs: new Array(2)})).toBe(false);
        for (const context of [{...metricSquareOracle.context, landmarks: new Array(4)}, {...metricSquareOracle.context, landmarks: metricSquareOracle.context.landmarks.slice(1)},
            {...metricSquareOracle.context, landmarks: metricSquareOracle.context.landmarks.map((item, index) => index === 0 ? {...item, role: 'toString'} : item)}, {...metricSquareOracle.context, lengthUnit: 'feet'}]) expect(isCoordinatePolygon({...metricSquareOracle, context})).toBe(false);
        for (const data of [null, undefined, {}, []]) for (const guard of [isCoordinateAxisDistance, isCoordinateRoute, isCoordinatePolygon]) expect(guard(data)).toBe(false);
    });
});
