import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {setSeed} from '../../../lib/random.ts';
import {buildRationalMagnitudeContextProblem, RationalMagnitudeContextsGenerator} from './generator.ts';

const generator = new RationalMagnitudeContextsGenerator();
const rational = (numerator: number, denominator = 1) => ({numerator, denominator});

describe('contextual signed order and absolute magnitude are distinct exact relations', () => {
    it.each([
        [-40, -30, 'less', 'greater'], [-30, -40, 'greater', 'less'],
        [-3, 3, 'less', 'equal'], [3, -3, 'greater', 'equal'],
        [0, -2, 'greater', 'less'], [-2, 0, 'less', 'greater'],
        [2, 3, 'less', 'less'], [3, 2, 'greater', 'greater']
    ] as const)('keeps %s versus %s signed %s and magnitude %s', (first, second, signedRelation, magnitudeRelation) => {
        const data = buildRationalMagnitudeContextProblem('balance', rational(first), rational(second));
        expect(data.signedRelation).toBe(signedRelation);
        expect(data.magnitudeRelation).toBe(magnitudeRelation);
        expect(data.first.value).toEqual(rational(first));
        expect(data.second.value).toEqual(rational(second));
        expect(data.first.magnitude).toEqual(rational(Math.abs(first)));
        expect(data.second.magnitude).toEqual(rational(Math.abs(second)));
    });

    it('uses rational cross-products rather than rounded values or shared denominators', () => {
        const data = buildRationalMagnitudeContextProblem('elevation', rational(-7, 3), rational(9, 4));
        expect(data.signedRelation).toBe('less');
        expect(data.magnitudeRelation).toBe('greater');
        expect(data.context).toEqual({kind: 'elevation', reference: 'sea-level', unit: 'meters'});
        expect(() => buildRationalMagnitudeContextProblem('balance', rational(0), rational(0))).toThrow(GeneratorValidationError);
    });

    it('rejects missing, empty and unsupported mathematical sign domains', () => {
        for (const config of [{}, null, undefined, {signDomain: null}, {signDomain: []}, {signDomain: 'negative-only'}, {signDomain: 0}]) {
            expect(() => generator.generate(config as never)).toThrow(GeneratorValidationError);
        }
    });

    it.each(['signed', 'nonnegative'] as const)('samples %s pairs with true witnesses and full variation', signDomain => {
        const relations = new Set<string>();
        const features = new Set<string>();
        for (let seed = 0; seed < 1000; seed++) {
            setSeed(seed);
            const {data} = generator.generate({signDomain});
            expect(data.first.id).not.toBe(data.second.id);
            const first = data.first.value;
            const second = data.second.value;
            const difference = BigInt(first.numerator) * BigInt(second.denominator) - BigInt(second.numerator) * BigInt(first.denominator);
            const magnitudeDifference = BigInt(Math.abs(first.numerator)) * BigInt(second.denominator)
                - BigInt(Math.abs(second.numerator)) * BigInt(first.denominator);
            expect(difference).not.toBe(0n);
            expect(data.signedRelation).toBe(difference < 0n ? 'less' : 'greater');
            expect(data.magnitudeRelation).toBe(magnitudeDifference < 0n ? 'less' : magnitudeDifference > 0n ? 'greater' : 'equal');
            relations.add(data.magnitudeRelation);
            if (first.numerator === 0 || second.numerator === 0) features.add('zero');
            if (first.denominator > 1 || second.denominator > 1) features.add('fraction');
            if (data.first.sign === -1 && data.second.sign === -1) {
                features.add('two-negative');
                expect(data.signedRelation).not.toBe(data.magnitudeRelation);
            }
            if (signDomain === 'nonnegative') {
                expect(first.numerator).toBeGreaterThanOrEqual(0);
                expect(second.numerator).toBeGreaterThanOrEqual(0);
                expect(data.signedRelation).toBe(data.magnitudeRelation);
            } else expect(Math.min(first.numerator, second.numerator)).toBeLessThan(0);
        }
        expect(relations).toEqual(new Set(signDomain === 'signed' ? ['less', 'equal', 'greater'] : ['less', 'greater']));
        for (const feature of ['zero', 'fraction']) expect(features.has(feature)).toBe(true);
        if (signDomain === 'signed') expect(features.has('two-negative')).toBe(true);
    });

    it('replays the same complete pair without task-dependent metadata', () => {
        setSeed('magnitude-context-replay');
        const first = generator.generate({signDomain: 'signed'});
        setSeed('magnitude-context-replay');
        expect(generator.generate({signDomain: 'signed'})).toEqual(first);
        expect(Object.keys(first)).toEqual(['data']);
        expect(Object.keys(first.data)).toEqual(['kind', 'context', 'first', 'second', 'signedRelation', 'magnitudeRelation']);
    });
});
