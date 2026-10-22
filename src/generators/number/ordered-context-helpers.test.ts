import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../lib/errors.ts';
import {setSeed} from '../../lib/random.ts';
import type {SignedRational} from '../../types/problems.ts';
import {buildOrderedContextPair, sampleOrderedContextPair} from './ordered-context-helpers.ts';

const contexts = [
    ['temperature', 'celsius-zero', 'degrees-celsius'],
    ['elevation', 'sea-level', 'meters'],
    ['balance', 'settled-balance', 'dollars']
] as const;
const compare = (first: SignedRational, second: SignedRational): number => {
    const difference = BigInt(first.numerator) * BigInt(second.denominator) - BigInt(second.numerator) * BigInt(first.denominator);
    return difference < 0n ? -1 : difference > 0n ? 1 : 0;
};

describe('ordered contextual semantic facts and exact observations', () => {
    it.each(contexts)('preserves the %s datum, unit, original order and exact magnitudes', (kind, reference, unit) => {
        const first = {numerator: -3, denominator: 2};
        const second = {numerator: 5, denominator: 4};
        const data = buildOrderedContextPair(kind, first, second);
        expect(data).toEqual({context: {kind, reference, unit},
            first: {id: 'A', value: first, magnitude: {numerator: 3, denominator: 2}, sign: -1},
            second: {id: 'B', value: second, magnitude: second, sign: 1}, relation: 'less'});
        expect(data.first.value).not.toBe(first);
        expect(data.second.value).not.toBe(second);
        const reversed = buildOrderedContextPair(kind, second, first);
        expect(reversed.relation).toBe('greater');
        expect(reversed.first.value).toEqual(second);
        expect(reversed.second.value).toEqual(first);
        expect(data.context).not.toBe(reversed.context);
    });

    it('keeps a true zero observation and accepts the wide safe rational contract', () => {
        const zero = buildOrderedContextPair('elevation', {numerator: 0, denominator: 1}, {numerator: -1, denominator: 3});
        expect(zero.first).toEqual({id: 'A', value: {numerator: 0, denominator: 1}, magnitude: {numerator: 0, denominator: 1}, sign: 0});
        const maximum = Number.MAX_SAFE_INTEGER;
        const exact = buildOrderedContextPair('balance', {numerator: maximum, denominator: maximum - 1},
            {numerator: maximum - 1, denominator: maximum - 2});
        // Both convert to the same IEEE double, but the second fraction is strictly larger.
        expect(exact.relation).toBe('less');
        expect(exact.first.value.numerator).toBe(maximum);
    });

    it('agrees with independent cross-products for all admitted small canonical rational pairs', () => {
        const values: SignedRational[] = [];
        const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
        for (let denominator = 1; denominator <= 4; denominator++) for (let numerator = -5; numerator <= 5; numerator++) {
            if (gcd(Math.abs(numerator), denominator) === 1) values.push({numerator: numerator === 0 ? 0 : numerator, denominator});
        }
        for (const [kind] of contexts) for (const first of values) for (const second of values) {
            const sign = compare(first, second);
            if (sign === 0) continue;
            const pair = buildOrderedContextPair(kind, first, second);
            expect(pair.relation).toBe(sign < 0 ? 'less' : 'greater');
            for (const observation of [pair.first, pair.second]) {
                expect(observation.magnitude).toEqual({numerator: Math.abs(observation.value.numerator), denominator: observation.value.denominator});
                expect(observation.sign).toBe(Math.sign(observation.value.numerator));
            }
        }
    });

    it('rejects unsupported physical contexts, equal inputs and noncanonical values in either role', () => {
        const valid = {numerator: 1, denominator: 1};
        for (const kind of ['charge', 'kelvin', '__proto__', 'toString', null, undefined]) {
            expect(() => buildOrderedContextPair(kind as never, valid, {numerator: 2, denominator: 1})).toThrow(GeneratorValidationError);
        }
        expect(() => buildOrderedContextPair('balance', valid, valid)).toThrow(GeneratorValidationError);
        for (const invalid of [null, undefined, {}, [], {numerator: -0, denominator: 1}, {numerator: 0, denominator: 2},
            {numerator: 2, denominator: 4}, {numerator: 1, denominator: 0}, {numerator: 1, denominator: -1},
            {numerator: 0.5, denominator: 1}, {numerator: Infinity, denominator: 1},
            {numerator: Number.MAX_SAFE_INTEGER + 1, denominator: 1}]) {
            expect(() => buildOrderedContextPair('temperature', invalid as never, valid)).toThrow(GeneratorValidationError);
            expect(() => buildOrderedContextPair('temperature', valid, invalid as never)).toThrow(GeneratorValidationError);
        }
        expect(() => sampleOrderedContextPair('reading' as never)).toThrow(GeneratorValidationError);
    });
});

describe('constructive ordered contextual sampling', () => {
    it.each(['unrestricted', 'signed', 'nonnegative'] as const)('honors %s over a seeded corpus without retries or sign ambiguity', domain => {
        const kinds = new Set<string>();
        const features = new Set<string>();
        for (let seed = 0; seed < 1000; seed++) {
            setSeed(seed);
            const pair = sampleOrderedContextPair(domain);
            kinds.add(pair.context.kind);
            expect(pair.relation).toBe(compare(pair.first.value, pair.second.value) < 0 ? 'less' : 'greater');
            features.add(pair.relation);
            for (const observation of [pair.first, pair.second]) {
                const value = observation.value;
                expect(Math.abs(value.numerator)).toBeLessThanOrEqual(10 * value.denominator);
                expect(value.denominator).toBeLessThanOrEqual(6);
                if (pair.context.kind === 'balance') expect(100 % value.denominator).toBe(0);
                features.add(value.denominator === 1 ? 'integer' : 'fraction');
                if (value.numerator === 0) features.add('zero');
                if (Math.abs(value.numerator) === 10 * value.denominator) features.add('inclusive-ten');
            }
            if (domain === 'nonnegative') expect(Math.min(pair.first.sign, pair.second.sign)).toBeGreaterThanOrEqual(0);
            if (domain === 'signed') expect(Math.min(pair.first.sign, pair.second.sign)).toBe(-1);
            if (pair.first.sign === -1 && pair.second.sign === -1) features.add('two-negative');
            if (pair.first.sign === 1 && pair.second.sign === 1) features.add('two-positive');
            if (pair.first.sign * pair.second.sign === -1) {
                features.add(compare(pair.first.magnitude, pair.second.magnitude) === 0 ? 'opposites' : 'unequal-unlike');
            }
        }
        expect([...kinds].sort()).toEqual(['balance', 'elevation', 'temperature']);
        for (const feature of ['less', 'greater', 'integer', 'fraction', 'zero', 'inclusive-ten']) expect(features.has(feature)).toBe(true);
        if (domain !== 'nonnegative') for (const feature of ['two-negative', 'opposites', 'unequal-unlike']) expect(features.has(feature)).toBe(true);
        if (domain !== 'signed') expect(features.has('two-positive')).toBe(true);
    });
});
