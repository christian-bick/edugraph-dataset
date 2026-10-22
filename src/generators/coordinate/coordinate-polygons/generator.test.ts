import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {setSeed} from '../../../lib/random.ts';
import type {RationalCoordinateAxes, SignedRational} from '../../../types/problems.ts';
import {makeSignedRational} from '../../number/signed-rational-helpers.ts';
import {makeCoordinateAxis, makeCoordinatePoint} from '../coordinate-helpers.ts';
import {coordinateOrientation} from '../polygon-geometry-helpers.ts';
import {buildCoordinatePolygonProblem, CoordinatePolygonsGenerator} from './generator.ts';

const rational = (numerator: number, denominator = 1): SignedRational => ({numerator, denominator});
const axis = makeCoordinateAxis(rational(1), 0, 6, 'integer');
const axes: RationalCoordinateAxes = {x: axis, y: axis};
const points = (values: readonly (readonly [number, number])[], frame = axes) => values.map(([x, y], index) =>
    makeCoordinatePoint(String.fromCharCode(65 + index), frame, x, y));
const rectangle = points([[0, 0], [5, 0], [5, 3], [0, 3]]);
const generator = new CoordinatePolygonsGenerator();
const allScalars = (value: unknown): SignedRational[] => {
    if (typeof value !== 'object' || value === null) return [];
    if ('numerator' in value && 'denominator' in value) return [value as SignedRational];
    return Object.values(value).flatMap(allScalars);
};

describe('complete canonical polygon geometry and selected coordinate equations', () => {
    it('closes the boundary and supplies every nonnegative side including left/down edges', () => {
        const before = structuredClone({axes, rectangle});
        const data = buildCoordinatePolygonProblem(axes, rectangle, [0, 2, 3]);
        expect(data.edges).toEqual([{fromId: 'A', toId: 'B'}, {fromId: 'B', toId: 'C'}, {fromId: 'C', toId: 'D'}, {fromId: 'D', toId: 'A'}]);
        expect(data.alignedSides.map(({edgeIndex, separation}) => [edgeIndex, separation.varyingAxis, separation.direction, separation.distance]))
            .toEqual([[0, 'x', 'increasing', rational(5)], [1, 'y', 'increasing', rational(3)],
                [2, 'x', 'decreasing', rational(5)], [3, 'y', 'decreasing', rational(3)]]);
        expect(data.sideDistanceEquations).toEqual([
            {edgeIndex: 0, minuend: rational(5), subtrahend: rational(0), difference: rational(5)},
            {edgeIndex: 2, minuend: rational(5), subtrahend: rational(0), difference: rational(5)},
            {edgeIndex: 3, minuend: rational(3), subtrahend: rational(0), difference: rational(3)}
        ]);
        expect(allScalars(data).every(value => value.numerator >= 0)).toBe(true);
        expect(data.context).toEqual({kind: 'survey-map', reference: 'survey-origin', lengthUnit: 'meters', positiveX: 'east', positiveY: 'north',
            landmarks: ['A', 'B', 'C', 'D'].map(pointId => ({pointId, role: 'corner'}))});
        expect({axes, rectangle}).toEqual(before);
        expect(Object.keys(data)).toEqual(['kind', 'axes', 'vertices', 'edges', 'alignedSides', 'sideDistanceEquations', 'context']);
    });

    it('supports every coherent proof subset without inventing a requested side', () => {
        for (let mask = 0; mask < 16; mask++) {
            const indices = [0, 1, 2, 3].filter(index => mask & 1 << index);
            const data = buildCoordinatePolygonProblem(axes, rectangle, indices);
            expect(data.sideDistanceEquations.map(proof => proof.edgeIndex)).toEqual(indices);
            expect(data.alignedSides).toHaveLength(4);
            for (const proof of data.sideDistanceEquations) {
                const left = BigInt(proof.minuend.numerator) * BigInt(proof.subtrahend.denominator)
                    - BigInt(proof.subtrahend.numerator) * BigInt(proof.minuend.denominator);
                expect(left * BigInt(proof.difference.denominator)).toBe(BigInt(proof.difference.numerator)
                    * BigInt(proof.minuend.denominator) * BigInt(proof.subtrahend.denominator));
            }
        }
    });

    it('includes genuine triangles/diagonal edges and concave polygons with complete aligned-side lists', () => {
        const triangle = buildCoordinatePolygonProblem(axes, points([[0, 0], [4, 0], [0, 3]]), [2]);
        expect(triangle.alignedSides.map(side => side.edgeIndex)).toEqual([0, 2]);
        expect(triangle.edges[2]).toEqual({fromId: 'C', toId: 'A'});
        expect(triangle.sideDistanceEquations[0]).toEqual({edgeIndex: 2, minuend: rational(3), subtrahend: rational(0), difference: rational(3)});
        const concave = buildCoordinatePolygonProblem(axes, points([[0, 0], [4, 0], [4, 1], [1, 1], [1, 4], [0, 4]]), []);
        expect(concave.alignedSides.map(side => side.separation.distance)).toEqual([4, 1, 3, 3, 1, 4].map(value => rational(value)));
        const diagonal = buildCoordinatePolygonProblem(axes, points([[0, 0], [4, 0], [4, 4], [2, 2], [0, 4]]), [1, 4]);
        expect(diagonal.alignedSides.map(side => side.edgeIndex)).toEqual([0, 1, 4]);
    });

    it('accepts unequal exact half/full-step physical-square frames and supplied unreduced notation', () => {
        const frame = {x: makeCoordinateAxis(rational(1, 2), 0, 6, 'fraction'), y: makeCoordinateAxis(rational(1), 0, 4, 'integer')};
        const vertices = points([[0, 0], [4, 0], [4, 2], [0, 2]], frame);
        const data = buildCoordinatePolygonProblem(frame, vertices, [0, 1]);
        expect(data.alignedSides.map(side => side.separation.distance)).toEqual([rational(2), rational(2), rational(2), rational(2)]);
        const fractional = points([[0, 0], [1, 0], [1, 1], [0, 1]], frame);
        fractional[1] = makeCoordinatePoint('B', frame, 1, 0, {x: {kind: 'fraction', numerator: 2, denominator: 4}, y: {kind: 'integer', numeral: '0'}});
        expect(buildCoordinatePolygonProblem(frame, fractional, [0]).vertices[1].x.notation).toEqual({kind: 'fraction', numerator: 2, denominator: 4});
        const ticks = Array.from({length: 13}, (_, index) => rational(index));
        const wide = {minimum: rational(0), maximum: rational(12), step: rational(1), ticks, zeroIndex: 0,
            tickNotations: ticks.map(value => ({kind: 'integer' as const, numeral: String(value.numerator)})), stepNotation: {kind: 'integer' as const, numeral: '1'}};
        const wideFrame = {x: wide, y: wide};
        expect(buildCoordinatePolygonProblem(wideFrame, points([[0, 0], [10, 0], [10, 10], [0, 10]], wideFrame), [2]).sideDistanceEquations[0]!.difference).toEqual(rational(10));
    });

    it('rejects malformed frames/vertices, duplicate identities/positions and nonsimple or degenerate boundaries', () => {
        const sparse = [...rectangle]; delete sparse[1];
        const invalidVertices = [null, undefined, {}, [], new Array(3), sparse,
            [rectangle[0], rectangle[1]],
            [rectangle[0], rectangle[1], {...rectangle[2]!, id: 'A'}],
            [rectangle[0], rectangle[1], {...rectangle[0]!, id: 'C'}],
            [rectangle[0], rectangle[1], {...rectangle[2]!, locationTag: 'origin'}],
            points([[0, 0], [1, 0], [2, 0]]),
            points([[0, 0], [2, 2], [0, 2], [2, 0]]),
            points([[0, 0], [3, 0], [3, 3], [1, 0], [0, 3]])];
        for (const vertices of invalidVertices) expect(() => buildCoordinatePolygonProblem(axes, vertices as never, [])).toThrow(GeneratorValidationError);
        for (const frame of [null, {}, {...axes, x: {...axis, step: rational(0)}}]) {
            expect(() => buildCoordinatePolygonProblem(frame as never, rectangle, [])).toThrow(GeneratorValidationError);
        }
        expect(() => buildCoordinatePolygonProblem(axes, points([[0, 0], [2, 1], [1, 3]]), [])).toThrow('At least one boundary edge');
    });

    it('rejects sparse/unordered/repeated/nonaligned or malformed selected proof references', () => {
        const triangle = points([[0, 0], [4, 0], [0, 3]]);
        for (const indices of [null, undefined, {}, new Array(1), [-1], [-0], [0.5], [NaN], ['0'], [3], [1], [0, 0], [2, 0]]) {
            expect(() => buildCoordinatePolygonProblem(axes, triangle, indices as never)).toThrow(GeneratorValidationError);
        }
    });
});

describe('genuine polygon sampling domains, evidence and global ranges', () => {
    it('rejects missing/empty/unsupported configuration and invalid mathematical bounds', () => {
        const config = {signDomain: 'nonnegative', distanceEvidence: 'geometry-only', range: {min: 0, max: 20}} as const;
        for (const value of [null, undefined, {}, {...config, signDomain: 'positive'}, {...config, distanceEvidence: 'construct'},
            {...config, distanceEvidence: []}, {...config, range: null}, {...config, range: []}]) {
            expect(() => generator.generate(value as never)).toThrow(GeneratorValidationError);
        }
        for (const range of [{}, {min: -1, max: 20}, {min: -0, max: 20}, {min: 1, max: 100}, {min: 0, max: 5},
            {min: 0, max: 200}, {min: 0, max: Infinity}, {min: 0, max: '20'}, 20]) {
            expect(() => generator.generate({...config, range} as never)).toThrow(GeneratorValidationError);
        }
    });

    it.each(['nonnegative', 'signed'] as const)('samples full %s polygons with proof data, concavity and readable unequal metric scales', signDomain => {
        const features = new Set<string>();
        for (const maximum of [20, 100]) for (const distanceEvidence of ['geometry-only', 'side-equations'] as const) {
            for (let seed = 0; seed < 120; seed++) {
                setSeed(seed);
                const stub = generator.generate({signDomain, distanceEvidence, range: {min: 0, max: maximum}});
                const data = stub.data;
                expect(Object.keys(stub)).toEqual(['data']);
                expect(data.edges).toHaveLength(data.vertices.length);
                expect(data.edges[data.edges.length - 1]).toEqual({fromId: data.vertices[data.vertices.length - 1]!.id, toId: data.vertices[0].id});
                expect(data.sideDistanceEquations).toHaveLength(distanceEvidence === 'geometry-only' ? 0 : 1);
                if (distanceEvidence === 'side-equations') expect(data.sideDistanceEquations[0]!.edgeIndex).toBe(data.alignedSides[0].edgeIndex);
                const orientations = data.vertices.map((point, index) => coordinateOrientation(
                    {x: point.x.value, y: point.y.value},
                    {x: data.vertices[(index + 1) % data.vertices.length]!.x.value, y: data.vertices[(index + 1) % data.vertices.length]!.y.value},
                    {x: data.vertices[(index + 2) % data.vertices.length]!.x.value, y: data.vertices[(index + 2) % data.vertices.length]!.y.value}));
                if (orientations.includes(1) && orientations.includes(-1)) features.add('concave');
                if (data.alignedSides.length < data.edges.length) features.add('diagonal');
                features.add(`vertices-${data.vertices.length}`);
                for (const value of allScalars(data)) {
                    expect(Number.isSafeInteger(value.numerator)).toBe(true);
                    expect(value.denominator).toBeGreaterThan(0);
                    expect(Math.abs(value.numerator)).toBeLessThanOrEqual(maximum * value.denominator);
                    expect(Object.is(value.numerator, -0)).toBe(false);
                    if (value.denominator > 1) features.add('fraction');
                    if (Math.abs(value.numerator) > 20 * value.denominator) features.add('above-twenty');
                    if (signDomain === 'nonnegative') expect(value.numerator).toBeGreaterThanOrEqual(0);
                }
                if (signDomain === 'signed') expect(data.vertices.some(point => point.x.sign < 0 || point.y.sign < 0)).toBe(true);
                const xStep = data.axes.x.step, yStep = data.axes.y.step;
                const ratio = xStep.numerator * yStep.denominator / (xStep.denominator * yStep.numerator);
                expect([0.5, 1, 2]).toContain(ratio);
                if (ratio !== 1) features.add('unequal-step');
                expect(data.axes.x.ticks.length).toBeLessThanOrEqual(11);
                expect(data.axes.y.ticks.length).toBeLessThanOrEqual(11);
            }
        }
        for (const feature of ['concave', 'diagonal', 'vertices-3', 'vertices-4', 'vertices-5', 'vertices-6', 'fraction', 'above-twenty', 'unequal-step']) {
            expect(features.has(feature)).toBe(true);
        }
    });

    it('replays exact mathematical data and handles the real no-bound sentinel explicitly', () => {
        const config = {signDomain: 'signed', distanceEvidence: 'side-equations', range: {min: 0, max: 100}} as const;
        setSeed(719); const first = generator.generate(config);
        setSeed(719); expect(generator.generate(config)).toEqual(first);
        setSeed(719); expect(generator.generate({...config, range: {min: 0, max: Number.MAX_SAFE_INTEGER}})).toEqual(first);
        setSeed(719); expect(generator.generate({...config, range: {min: 0, max: 20}})).not.toEqual(first);
        expect(makeSignedRational(first.data.sideDistanceEquations[0]!.difference.numerator,
            first.data.sideDistanceEquations[0]!.difference.denominator)).toEqual(first.data.sideDistanceEquations[0]!.difference);
    });
});
