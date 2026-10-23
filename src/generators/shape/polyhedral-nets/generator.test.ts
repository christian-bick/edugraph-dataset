import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {getRandomState, random, setSeed} from '../../../lib/random.ts';
import type {AlgebraicScalar, PolyhedralNetProblem} from '../../../types/problems.ts';
import {isPolyhedralNetProblem} from '../polyhedral-net-helpers.ts';
import {PolyhedralNetsGenerator} from './generator.ts';
import type {PolyhedralNetsGeneratorConfig} from './spec.ts';

type Fraction = {n: bigint; d: bigint};
const q = (value: AlgebraicScalar): Fraction => ({n: BigInt(value.numerator), d: BigInt(value.denominator)});
const add = (a: Fraction, b: Fraction): Fraction => ({n: a.n * b.d + b.n * a.d, d: a.d * b.d});
const multiply = (a: Fraction, b: Fraction): Fraction => ({n: a.n * b.n, d: a.d * b.d});
const equal = (actual: AlgebraicScalar, expected: Fraction) => expect(BigInt(actual.numerator) * expected.d)
    .toBe(expected.n * BigInt(actual.denominator));
const families = ['rectangular-prism', 'triangular-prism', 'pyramid'] as const;
const relations = ['boundary-incidence', 'surface-additivity'] as const;
const zero: Fraction = {n: 0n, d: 1n};

function verifyIndependentArea(data: PolyhedralNetProblem) {
    let surface = zero;
    for (const face of data.net.faces) {
        const crossSum = face.vertices.reduce((total, {point}, index) => {
            const next = face.vertices[(index + 1) % face.vertices.length]!.point;
            return add(total, add(multiply(q(point.x), q(next.y)),
                multiply({n: -q(next.x).n, d: q(next.x).d}, q(point.y))));
        }, zero);
        const area = {n: crossSum.n < 0n ? -crossSum.n : crossSum.n, d: crossSum.d * 2n};
        equal(face.measure.area, area);
        surface = add(surface, area);
    }
    equal(data.surfaceArea, surface);
}

describe('PolyhedralNetsGenerator', () => {
    const generator = new PolyhedralNetsGenerator();

    it('samples all six intended solid subcases with exact external surface areas and real proof selection', () => {
        const kinds = new Set<string>(), visibleInstances = new Map<string, string>();
        for (const solidFamily of families) for (const mathematicalRelation of relations) {
            const distinct = new Set<string>();
            for (let seed = 0; seed < 80; seed++) {
                setSeed(`net-${solidFamily}-${mathematicalRelation}-${seed}`);
                const data = generator.generate({solidFamily, mathematicalRelation}).data;
                expect(isPolyhedralNetProblem(data)).toBe(true);
                verifyIndependentArea(data);
                expect(data.unit).toEqual({length: 'centimeters', area: 'square-centimeters'});
                expect(data.surfaceAdditivity).toHaveLength(mathematicalRelation === 'surface-additivity' ? data.solid.faces.length : 0);
                expect(data.net.hinges).toHaveLength(data.solid.faces.length - 1);
                expect(data.net.hinges.length + data.net.cutSeams.length).toBe(data.solid.edges.length);
                if (solidFamily === 'pyramid') expect(['triangular-pyramid', 'rectangular-pyramid']).toContain(data.solidKind);
                else expect(data.solidKind).toBe(solidFamily);
                const rectangle = data.net.faces.find(face => face.measure.kind === 'rectangle');
                const baseShape = rectangle?.measure.kind === 'rectangle'
                    && rectangle.measure.base.numerator * rectangle.measure.height.denominator
                    === rectangle.measure.height.numerator * rectangle.measure.base.denominator ? 'square' : 'nonsquare';
                kinds.add(`${data.solidKind}:${baseShape}`);
                const visible = JSON.stringify({solidFamily, mathematicalRelation, unit: data.unit, solid: data.solid});
                const payload = JSON.stringify(data);
                if (visibleInstances.has(visible)) expect(payload).toBe(visibleInstances.get(visible));
                visibleInstances.set(visible, payload);
                distinct.add(visible);
                expect(data).not.toHaveProperty('task'); expect(data).not.toHaveProperty('question');
                expect(data).not.toHaveProperty('mathematicalRelation'); expect(data).not.toHaveProperty('requestedDisplay');
            }
            expect(distinct.size).toBeGreaterThan(12);
        }
        expect(kinds).toEqual(new Set(['rectangular-prism:square', 'rectangular-prism:nonsquare',
            'triangular-prism:nonsquare', 'triangular-pyramid:nonsquare',
            'rectangular-pyramid:square', 'rectangular-pyramid:nonsquare']));
    });

    it('uses one seeded instance draw and preserves the exact PRNG continuation', () => {
        for (const solidFamily of families) for (const mathematicalRelation of relations) {
            setSeed('net-continuation'); random(); const state = getRandomState(), next = random();
            setSeed('net-continuation'); const first = generator.generate({solidFamily, mathematicalRelation});
            expect(getRandomState()).toEqual(state); expect(random()).toBe(next);
            setSeed('net-continuation'); expect(generator.generate({solidFamily, mathematicalRelation})).toEqual(first);
        }
    });

    it('rejects missing or foreign configuration before consuming entropy', () => {
        const invalid = [{}, {solidFamily: 'pyramid'}, {mathematicalRelation: 'surface-additivity'},
            {solidFamily: 'cone', mathematicalRelation: 'boundary-incidence'},
            {solidFamily: 'rectangular-prism', mathematicalRelation: 'construction'}];
        for (const config of invalid) {
            setSeed(217); const state = getRandomState();
            expect(() => generator.generate(config as PolyhedralNetsGeneratorConfig)).toThrow(GeneratorValidationError);
            expect(getRandomState()).toEqual(state);
        }
    });
});
