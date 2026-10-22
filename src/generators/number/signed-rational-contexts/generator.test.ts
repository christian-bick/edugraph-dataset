import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {setSeed} from '../../../lib/random.ts';
import type {SignedRationalContextMetadata, SignedRationalContextProblem} from '../../../types/problems.ts';
import {buildSignedRationalContextProblem, SignedRationalContextsGenerator} from './generator.ts';

const generator = new SignedRationalContextsGenerator();
const contexts = [
    ['temperature', 'celsius-zero', 'degrees-celsius'], ['elevation', 'sea-level', 'meters'],
    ['balance', 'settled-balance', 'dollars'], ['charge', 'neutral-net-charge', 'coulombs']
] as const;
const gcd = (first: bigint, second: bigint): bigint => second === 0n ? first : gcd(second, first % second);

function assertExactObservations(data: SignedRationalContextProblem): void {
    expect(data.observations.length).toBeGreaterThan(0);
    expect(new Set(data.observations.map(({id}) => id)).size).toBe(data.observations.length);
    for (const {id, value, magnitude, sign} of data.observations) {
        expect(id.length).toBeGreaterThan(0);
        expect(Number.isSafeInteger(value.numerator)).toBe(true);
        expect(Number.isSafeInteger(value.denominator)).toBe(true);
        expect(value.denominator).toBeGreaterThan(0);
        expect(gcd(BigInt(Math.abs(value.numerator)), BigInt(value.denominator))).toBe(1n);
        expect(Object.is(value.numerator, -0)).toBe(false);
        expect(sign).toBe(value.numerator === 0 ? 0 : value.numerator < 0 ? -1 : 1);
        expect(magnitude.numerator).toBeGreaterThanOrEqual(0);
        expect(BigInt(magnitude.numerator) * BigInt(value.denominator)).toBe(BigInt(Math.abs(value.numerator)) * BigInt(magnitude.denominator));
        expect(gcd(BigInt(magnitude.numerator), BigInt(magnitude.denominator))).toBe(1n);
        if (value.numerator === 0) expect(value).toEqual({numerator: 0, denominator: 1});
    }
    expect(Object.keys(data).sort()).toEqual(['context', 'kind', 'observations']);
    expect(data).not.toHaveProperty('referenceValue');
}

describe('uniform signed contextual quantities', () => {
    it.each(contexts)('preserves the exact %s reference and unit independently of signs', (kind, reference, unit) => {
        const values = [{numerator: -3, denominator: 2}, {numerator: 5, denominator: 4}, {numerator: 0, denominator: 1}];
        const original = structuredClone(values);
        const data = buildSignedRationalContextProblem(kind, values);
        expect(data.context).toEqual({kind, reference, unit});
        expect(data.observations).toEqual([
            {id: 'A', value: values[0], magnitude: {numerator: 3, denominator: 2}, sign: -1},
            {id: 'B', value: values[1], magnitude: {numerator: 5, denominator: 4}, sign: 1},
            {id: 'V3', value: values[2], magnitude: {numerator: 0, denominator: 1}, sign: 0}
        ]);
        assertExactObservations(data);
        expect(values).toEqual(original);
        expect(data.observations[0].value).not.toBe(values[0]);
    });

    it('distinguishes unlike signs from equal magnitudes and preserves a sole zero', () => {
        const charge = buildSignedRationalContextProblem('charge', [{numerator: -2, denominator: 3}, {numerator: 2, denominator: 3}]);
        expect(charge.observations.map(({magnitude}) => magnitude)).toEqual([{numerator: 2, denominator: 3}, {numerator: 2, denominator: 3}]);
        const zero = buildSignedRationalContextProblem('elevation', [{numerator: 0, denominator: 1}]);
        expect(zero.observations).toEqual([{id: 'A', value: {numerator: 0, denominator: 1}, magnitude: {numerator: 0, denominator: 1}, sign: 0}]);
        assertExactObservations(zero);
    });

    it('accepts coherent wide-domain values without narrowing the shared payload to sampling bounds', () => {
        const values = [{numerator: Number.MAX_SAFE_INTEGER, denominator: 2}, {numerator: -1001, denominator: 3}];
        const data = buildSignedRationalContextProblem('balance', values);
        expect(data.observations.map(({value}) => value)).toEqual(values);
        assertExactObservations(data);
    });

    it('does not share mutable metadata between independent results', () => {
        const first = buildSignedRationalContextProblem('balance', [{numerator: 1, denominator: 1}]);
        const second = buildSignedRationalContextProblem('balance', [{numerator: 1, denominator: 1}]);
        expect(first.context).not.toBe(second.context);
    });

    it('rejects malformed contexts, empty/sparse arrays and noncanonical exact values', () => {
        for (const context of ['debit', 'toString', '__proto__', '', null, undefined]) {
            expect(() => buildSignedRationalContextProblem(context as never, [{numerator: 1, denominator: 1}])).toThrow(GeneratorValidationError);
        }
        for (const values of [null, undefined, {}, [], new Array(1), [{numerator: -0, denominator: 1}],
            [{numerator: 0, denominator: 2}], [{numerator: 2, denominator: 4}], [{numerator: 1, denominator: 0}],
            [{numerator: 0.5, denominator: 2}], [{numerator: Infinity, denominator: 1}],
            [{numerator: Number.MAX_SAFE_INTEGER + 1, denominator: 1}], [{numerator: 1, denominator: -2}]]) {
            expect(() => buildSignedRationalContextProblem('temperature', values as never)).toThrow(GeneratorValidationError);
        }
    });
});

describe('signed contextual mathematical sampling domains', () => {
    it('rejects missing or unsupported relation configurations', () => {
        expect(() => generator.generate({})).toThrow(GeneratorValidationError);
        expect(() => generator.generate(null!)).toThrow(GeneratorValidationError);
        for (const relation of ['', 'interpret', 0, null, false]) expect(() => generator.generate({relation} as never)).toThrow(GeneratorValidationError);
    });

    it.each(['reference-zero', 'directed-pair'] as const)('samples the real %s domain with all contexts and exact bounds', relation => {
        const contextKinds = new Set<SignedRationalContextMetadata['kind']>();
        const features = new Set<string>();
        for (let seed = 0; seed < 1000; seed++) {
            setSeed(seed);
            const stub = generator.generate({relation});
            expect(Object.keys(stub)).toEqual(['data']);
            const data = stub.data;
            contextKinds.add(data.context.kind);
            expect(data.context).toEqual(expect.objectContaining({reference: expect.any(String), unit: expect.any(String)}));
            assertExactObservations(data);
            for (const {value} of data.observations) {
                expect(BigInt(Math.abs(value.numerator))).toBeLessThanOrEqual(10n * BigInt(value.denominator));
                expect(value.denominator).toBeLessThanOrEqual(6);
                if (data.context.kind === 'balance') expect(100 % value.denominator).toBe(0);
                if (value.denominator > 1) features.add('noninteger');
                else features.add('integer');
                if (Math.abs(value.numerator) === 10 * value.denominator) features.add('inclusive-ten');
            }
            if (relation === 'reference-zero') {
                expect(data.observations).toHaveLength(1);
                expect(data.observations[0].value).toEqual({numerator: 0, denominator: 1});
            } else {
                expect(data.observations).toHaveLength(2);
                const [first, second] = data.observations;
                expect(first.sign * second!.sign).toBe(-1);
                features.add(first.sign === 1 ? 'positive-first' : 'negative-first');
                const equal = BigInt(first.magnitude.numerator) * BigInt(second!.magnitude.denominator)
                    === BigInt(second!.magnitude.numerator) * BigInt(first.magnitude.denominator);
                features.add(equal ? 'equal-magnitudes' : 'unequal-magnitudes');
            }
        }
        expect([...contextKinds].sort()).toEqual(contexts.map(([kind]) => kind).sort());
        if (relation === 'directed-pair') {
            for (const feature of ['integer', 'noninteger', 'inclusive-ten', 'positive-first', 'negative-first', 'equal-magnitudes', 'unequal-magnitudes']) {
                expect(features.has(feature)).toBe(true);
            }
        }
    });

    it('replays exact canonical content without learner-task or ontology fields', () => {
        for (const relation of ['reference-zero', 'directed-pair'] as const) {
            setSeed(413);
            const first = generator.generate({relation});
            setSeed(413);
            expect(generator.generate({relation})).toEqual(first);
            expect(Object.keys(first)).toEqual(['data']);
            expect(first.data).not.toHaveProperty('relation');
        }
    });
});
