import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {setSeed} from '../../../lib/random.ts';
import type {CoordinatePointsProblem, RationalCoordinateAxes, SignedRational} from '../../../types/problems.ts';
import {makeCoordinateAxis} from '../coordinate-helpers.ts';
import {buildCoordinatePointsProblem, CoordinatePointsGenerator, type CoordinatePointParameters} from './generator.ts';
import type {CoordinatePointsGeneratorConfig} from './spec.ts';

const r = (numerator: number, denominator = 1): SignedRational => ({numerator, denominator});
const generator = new CoordinatePointsGenerator();
const axes = {x: makeCoordinateAxis(r(1, 2), -4, 4, 'fraction'), y: makeCoordinateAxis(r(1), -3, 3, 'integer')};
const compare = (first: SignedRational, second: SignedRational) => BigInt(first.numerator) * BigInt(second.denominator)
    - BigInt(second.numerator) * BigInt(first.denominator);

function assertExact(data: CoordinatePointsProblem): void {
    for (const axis of [data.axes.x, data.axes.y]) {
        expect(axis.ticks.length).toBeLessThanOrEqual(11);
        expect(axis.tickNotations).toHaveLength(axis.ticks.length);
        expect(axis.ticks[axis.zeroIndex]).toEqual(r(0));
        for (let index = 1; index < axis.ticks.length; index++) {
            const before = axis.ticks[index - 1]!;
            const after = axis.ticks[index]!;
            expect(compare(after, before) * BigInt(axis.step.denominator)).toBe(
                BigInt(axis.step.numerator) * BigInt(before.denominator) * BigInt(after.denominator));
        }
        for (const value of axis.ticks) {
            expect(BigInt(Math.abs(value.numerator))).toBeLessThanOrEqual(5n * BigInt(value.denominator));
            expect(Object.is(value.numerator, -0)).toBe(false);
        }
    }
    expect(new Set(data.points.map(point => point.id)).size).toBe(data.points.length);
    for (const point of data.points) {
        for (const [component, axis] of [[point.x, data.axes.x], [point.y, data.axes.y]] as const) {
            expect(component.value).toEqual(axis.ticks[component.tickIndex]);
            expect(component.sign).toBe(component.value.numerator < 0 ? -1 : component.value.numerator > 0 ? 1 : 0);
            expect(component.magnitude).toEqual({...component.value, numerator: Math.abs(component.value.numerator)});
            if (component.notation.kind === 'integer') expect(component.notation.numeral).toBe(String(component.value.numerator));
            else if (component.notation.kind === 'fraction') expect(compare(component.value, component.notation)).toBe(0n);
            else expect(BigInt(component.notation.coefficient) * BigInt(component.value.denominator)).toBe(
                BigInt(component.value.numerator) * 10n ** BigInt(component.notation.scale));
        }
        const x = point.x.sign; const y = point.y.sign;
        expect(point.locationTag).toBe(x === 0 ? y === 0 ? 'origin' : 'y-axis' : y === 0 ? 'x-axis'
            : x > 0 ? y > 0 ? 'quadrant-I' : 'quadrant-IV' : y > 0 ? 'quadrant-II' : 'quadrant-III');
    }
    expect(Object.keys(data).sort()).toEqual(['axes', 'kind', 'points']);
}

describe('exact located point builder', () => {
    it('preserves unequal scales, exact positions and all zero/quadrant tags', () => {
        const positions = [[1, 5], [5, 2], [4, 5], [2, 3], [4, 3]];
        const data = buildCoordinatePointsProblem(axes, positions.map(([xTickIndex, yTickIndex], index) => ({id: String.fromCharCode(65 + index), xTickIndex: xTickIndex!, yTickIndex: yTickIndex!})));
        assertExact(data);
        expect(data.points.map(point => [point.x.value, point.y.value, point.locationTag])).toEqual([
            [r(-3, 2), r(2), 'quadrant-II'], [r(1, 2), r(-1), 'quadrant-IV'], [r(0), r(2), 'y-axis'],
            [r(-1), r(0), 'x-axis'], [r(0), r(0), 'origin']]);
    });

    it('retains nonnegative 1.50/0.25 notation, unreduced fractions and coherent coincident IDs', () => {
        const frame = {x: makeCoordinateAxis(r(1, 2), 0, 4, 'decimal'), y: makeCoordinateAxis(r(1, 4), 0, 4, 'decimal')};
        const parameters = [{id: 'P', xTickIndex: 3, yTickIndex: 1}, {id: 'Q', xTickIndex: 1, yTickIndex: 0,
            notations: {x: {kind: 'fraction', numerator: 2, denominator: 4}, y: {kind: 'integer', numeral: '0'}}},
        {id: 'R', xTickIndex: 3, yTickIndex: 1}] as const;
        const data = buildCoordinatePointsProblem(frame, parameters);
        assertExact(data);
        expect(data.points[0].x.notation).toEqual({kind: 'decimal', coefficient: 150, scale: 2, numeral: '1.50'});
        expect(data.points[0].y.notation).toEqual({kind: 'decimal', coefficient: 25, scale: 2, numeral: '0.25'});
        expect(data.points[1]!.x.notation).toEqual({kind: 'fraction', numerator: 2, denominator: 4});
        expect(data.points[0].x.value).toEqual(data.points[2]!.x.value);
        expect(data.points[0].id).not.toBe(data.points[2]!.id);
    });

    it('rejects malformed frames and missing, sparse, duplicate or invalid point records', () => {
        expect(() => buildCoordinatePointsProblem({} as RationalCoordinateAxes, [{id: 'P', xTickIndex: 0, yTickIndex: 0}])).toThrow(GeneratorValidationError);
        for (const values of [null, undefined, [], new Array(1), [null], [{id: 'P', xTickIndex: 0, yTickIndex: 0}, {id: 'P', xTickIndex: 1, yTickIndex: 1}],
            [{id: ' ', xTickIndex: 0, yTickIndex: 0}], [{id: 'P', xTickIndex: -1, yTickIndex: 0}], [1]]) {
            expect(() => buildCoordinatePointsProblem(axes, values as unknown as CoordinatePointParameters[])).toThrow(GeneratorValidationError);
        }
    });
});

describe('configured coordinate domains', () => {
    const domains = [['nonnegative', 'ordinary'], ['signed', 'ordinary'], ['signed', 'quadrant-complete']] as const;
    it.each(['integer', 'fraction', 'decimal'] as const)('produces truthful %s forms in every admitted sign/evidence domain', numberKind => {
        for (const [signDomain, quadrantEvidence] of domains) {
            const tags = new Set<string>();
            const steps = new Set<string>();
            for (let seed = 0; seed < 150; seed++) {
                setSeed(seed);
                const data = generator.generate({numberKind, signDomain, quadrantEvidence}).data;
                assertExact(data);
                expect(data.points).toHaveLength(quadrantEvidence === 'ordinary' ? 3 : 7);
                expect(new Set(data.points.map(point => `${point.x.tickIndex},${point.y.tickIndex}`)).size).toBe(data.points.length);
                for (const axis of [data.axes.x, data.axes.y]) {
                    steps.add(`${axis.step.numerator}/${axis.step.denominator}`);
                    expect(axis.tickNotations.every(notation => notation.kind === numberKind)).toBe(true);
                    if (signDomain === 'nonnegative') {
                        expect(axis.zeroIndex).toBe(0);
                        expect(axis.ticks.every(value => value.numerator >= 0)).toBe(true);
                    } else {
                        expect(axis.minimum.numerator).toBeLessThan(0);
                        expect(axis.maximum.numerator).toBeGreaterThan(0);
                    }
                }
                if (signDomain === 'signed') expect(data.points.some(point => point.x.sign < 0 || point.y.sign < 0)).toBe(true);
                if (numberKind !== 'integer') expect(data.points.some(point => point.x.value.denominator > 1 || point.y.value.denominator > 1)).toBe(true);
                for (const point of data.points) tags.add(point.locationTag);
                if (quadrantEvidence === 'quadrant-complete') expect(new Set(data.points.map(point => point.locationTag))).toEqual(
                    new Set(['quadrant-I', 'quadrant-II', 'quadrant-III', 'quadrant-IV', 'x-axis', 'y-axis', 'origin']));
            }
            expect(steps.size).toBeGreaterThan(1);
            expect(tags.has('origin')).toBe(true);
            if (signDomain === 'signed') for (const tag of ['quadrant-I', 'quadrant-II', 'quadrant-III', 'quadrant-IV']) expect(tags.has(tag)).toBe(true);
        }
    });

    it('replays exact canonical content and does not encode a learner question', () => {
        setSeed(782);
        const first = generator.generate({numberKind: 'decimal', signDomain: 'signed', quadrantEvidence: 'ordinary'});
        setSeed(782);
        expect(generator.generate({numberKind: 'decimal', signDomain: 'signed', quadrantEvidence: 'ordinary'})).toEqual(first);
        expect(first.data).not.toHaveProperty('numberKind');
        expect(first.data).not.toHaveProperty('unknown');
    });

    it.each([null, undefined, {}, {numberKind: 'integer'}, {numberKind: 'integer', signDomain: 'signed'},
        {signDomain: 'signed', quadrantEvidence: 'ordinary'}, {numberKind: 'integer', quadrantEvidence: 'ordinary'}])('rejects missing required config %j', config => {
        expect(() => generator.generate(config as unknown as CoordinatePointsGeneratorConfig)).toThrow(GeneratorValidationError);
    });

    it.each([{numberKind: 'rational', signDomain: 'signed', quadrantEvidence: 'ordinary'},
        {numberKind: 'integer', signDomain: 'positive', quadrantEvidence: 'ordinary'},
        {numberKind: 'integer', signDomain: 'signed', quadrantEvidence: false}])('rejects unsupported mathematical configuration %j', config => {
        expect(() => generator.generate(config as unknown as CoordinatePointsGeneratorConfig)).toThrow('Unsupported');
    });

    it('defensively enforces the declared quadrant/signed dependency', () => {
        expect(() => generator.generate({numberKind: 'integer', signDomain: 'nonnegative', quadrantEvidence: 'quadrant-complete'})).toThrow('requires the signed domain');
    });
});
