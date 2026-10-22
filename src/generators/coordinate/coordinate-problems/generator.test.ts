import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {setSeed} from '../../../lib/random.ts';
import type {SignedRational} from '../../../types/problems.ts';
import {makeCoordinateAxis, makeCoordinatePoint} from '../coordinate-helpers.ts';
import {buildCoordinateRouteProblem, CoordinateProblemsGenerator} from './generator.ts';

const r = (numerator: number, denominator = 1): SignedRational => ({numerator, denominator});
const values = (value: unknown): SignedRational[] => {
    if (!value || typeof value !== 'object') return [];
    if ('numerator' in value && 'denominator' in value) return [value as SignedRational];
    return Object.values(value).flatMap(values);
};

describe('complete rectilinear route builder', () => {
    it('preserves a known route and independently supplied prefix sums, not diagonal distance', () => {
        const axes = {x: makeCoordinateAxis(r(1), -2, 3, 'integer'), y: makeCoordinateAxis(r(1), -2, 3, 'integer')};
        const landmarks = [makeCoordinatePoint('A', axes, 0, 1), makeCoordinatePoint('B', axes, 5, 1), makeCoordinatePoint('C', axes, 5, 4)];
        const data = buildCoordinateRouteProblem({axes, landmarks, path: ['A', 'B', 'C']});
        expect(data.legs.map(leg => [leg.fromId, leg.toId, leg.varyingAxis, leg.distance])).toEqual([['A', 'B', 'x', r(5)], ['B', 'C', 'y', r(3)]]);
        expect(data.cumulativeLengths).toEqual([r(0), r(5), r(8)]);
        expect(data.totalLength).toEqual(r(8));
        expect(data.path).toEqual(['A', 'B', 'C']);
        expect(data.context.landmarks).toHaveLength(3);
    });

    it('accepts wide/asymmetric exact frames, original notation, reversals, revisits and zero legs', () => {
        const axes = {x: makeCoordinateAxis(r(25), -1, 2, 'integer'), y: makeCoordinateAxis(r(1, 2), 0, 1, 'decimal', 3)};
        const a = makeCoordinatePoint('A', axes, 0, 0);
        const b = makeCoordinatePoint('B', axes, 3, 0);
        const c = makeCoordinatePoint('C', axes, 0, 1, {x: a.x.notation, y: {kind: 'fraction', numerator: 2, denominator: 4}});
        const data = buildCoordinateRouteProblem({axes, landmarks: [a, b, c], path: ['A', 'A', 'B', 'A', 'C']});
        expect(data.legs.map(leg => leg.direction)).toEqual(['stationary', 'increasing', 'decreasing', 'increasing']);
        expect(data.cumulativeLengths).toEqual([r(0), r(0), r(75), r(150), r(301, 2)]);
        expect(data.totalLength).toEqual(r(301, 2));
        expect(data.landmarks[2]!.y.notation).toEqual({kind: 'fraction', numerator: 2, denominator: 4});
        expect(data.landmarks[0]!.y.notation).toMatchObject({kind: 'decimal', numeral: '0.000'});
    });

    it('rejects malformed route parameters, frames, paths and diagonal legs', () => {
        const axes = {x: makeCoordinateAxis(r(1), -1, 1, 'integer'), y: makeCoordinateAxis(r(1), -1, 1, 'integer')};
        const a = makeCoordinatePoint('A', axes, 0, 0);
        const b = makeCoordinatePoint('B', axes, 2, 2);
        for (const parameters of [null, [], {}, {axes, landmarks: [a, b], path: ['A', 'B']},
            {axes, landmarks: [a], path: ['A', 'A']}, {axes, landmarks: [a, a], path: ['A', 'A']}]) {
            expect(() => buildCoordinateRouteProblem(parameters as never)).toThrow(GeneratorValidationError);
        }
    });
});

describe('bounded supplied-route sampling', () => {
    it.each([20, 100, Number.MAX_SAFE_INTEGER])('supplies all exact prefixes and globally respects range%s', max => {
        const generator = new CoordinateProblemsGenerator();
        const cap = max === Number.MAX_SAFE_INTEGER ? 100 : max;
        const seen = new Set<string>();
        let beyond20 = false;
        for (let seed = 0; seed < 320; seed++) {
            setSeed(seed);
            const {data} = generator.generate({range: {min: 0, max}});
            expect(data.path).toHaveLength(data.legs.length + 1);
            expect(data.cumulativeLengths).toHaveLength(data.path.length);
            expect(data.cumulativeLengths[0]).toEqual(r(0));
            expect(data.totalLength).toEqual(data.cumulativeLengths[data.cumulativeLengths.length - 1]);
            for (const [index, leg] of data.legs.entries()) {
                expect([leg.fromId, leg.toId]).toEqual(data.path.slice(index, index + 2));
                const prior = data.cumulativeLengths[index]!;
                const next = data.cumulativeLengths[index + 1]!;
                const expected = BigInt(prior.numerator) * BigInt(leg.distance.denominator) + BigInt(leg.distance.numerator) * BigInt(prior.denominator);
                expect(expected * BigInt(next.denominator)).toBe(BigInt(next.numerator) * BigInt(prior.denominator) * BigInt(leg.distance.denominator));
                seen.add(leg.varyingAxis); seen.add(leg.direction);
            }
            if (new Set(data.path).size < data.path.length) seen.add('revisit');
            for (const point of data.landmarks) seen.add(point.locationTag);
            for (const value of values(data)) {
                expect(BigInt(Math.abs(value.numerator)) <= BigInt(cap) * BigInt(value.denominator)).toBe(true);
                if (Math.abs(value.numerator) > 20 * value.denominator) beyond20 = true;
            }
            const x = data.axes.x.step.numerator / data.axes.x.step.denominator;
            const y = data.axes.y.step.numerator / data.axes.y.step.denominator;
            expect(Math.max(x, y) / Math.min(x, y)).toBeLessThanOrEqual(2);
            expect(Object.keys(data).sort()).toEqual(['axes', 'context', 'cumulativeLengths', 'kind', 'landmarks', 'legs', 'path', 'totalLength']);
        }
        for (const required of ['x', 'y', 'increasing', 'decreasing', 'revisit', 'origin', 'x-axis', 'y-axis', 'quadrant-I', 'quadrant-II', 'quadrant-III', 'quadrant-IV']) expect(seen.has(required)).toBe(true);
        expect(beyond20).toBe(cap > 20);
    });

    it('replays and rejects empty/invalid range configuration', () => {
        const generator = new CoordinateProblemsGenerator();
        setSeed(71); const first = generator.generate({range: {min: 0, max: 100}});
        setSeed(71); expect(generator.generate({range: {min: 0, max: Number.MAX_SAFE_INTEGER}})).toEqual(first);
        for (const config of [null, {}, {range: null}, {range: []}, {range: {min: 1, max: 20}}, {range: {min: -0, max: 20}},
            {range: {min: 0, max: 5}}, {range: {min: 0, max: NaN}}]) {
            expect(() => generator.generate(config as never)).toThrow(GeneratorValidationError);
        }
    });
});
