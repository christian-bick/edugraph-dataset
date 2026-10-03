import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import type {FractionQuotientProblem} from '../../../types/problems.ts';
import {FractionQuotientModelGenerator} from '../../../generators/fraction/fraction-quotient-model/generator.ts';
import {formatOriginalFraction, isValidFractionQuotient} from './fraction-quotient-helpers.ts';

const generator = new FractionQuotientModelGenerator();
const profiles = [
    'fraction-as-quotient', 'whole-sharing-equation',
    'unit-dividend-basic', 'unit-dividend-inverse', 'unit-dividend-equation',
    'unit-divisor-basic', 'unit-divisor-inverse', 'unit-divisor-equation'
] as const;

describe('fraction quotient view contract', () => {
    it('accepts every producer profile, including zero and integral quotients', () => {
        let sawZero = false;
        let sawIntegralFraction = false;
        for (const relationProfile of profiles) {
            for (let seed = 0; seed < 80; seed++) {
                setSeed(`fraction-quotient-view-${relationProfile}-${seed}`);
                const data = generator.generate({relationProfile}).data;
                expect(isValidFractionQuotient(data)).toBe(true);
                sawZero ||= data.quotient.numerator === 0;
                sawIntegralFraction ||= data.orientation === 'whole-by-whole'
                    && data.dividend.numerator > 0
                    && data.dividend.numerator % data.divisor.numerator === 0;
            }
        }
        expect(sawZero).toBe(true);
        expect(sawIntegralFraction).toBe(true);
    });

    it('rejects contradictory original roles, partition counts, inverse, and optional witnesses', () => {
        setSeed('fraction-quotient-invalid');
        const unit = generator.generate({relationProfile: 'unit-dividend-equation'}).data;
        expect(unit.orientation).toBe('unit-fraction-by-whole');
        if (unit.orientation !== 'unit-fraction-by-whole') return;
        expect(isValidFractionQuotient({...unit, divisor: {numerator: 0, denominator: 1}})).toBe(false);
        expect(isValidFractionQuotient({...unit, model: {...unit.model, sharedFineParts: 1}})).toBe(false);
        expect(isValidFractionQuotient({...unit, inverse: {...unit.inverse,
            reconstructedDividend: {numerator: 2, denominator: 1}}})).toBe(false);
        expect(isValidFractionQuotient({...unit, equationWitness: {...unit.equationWitness!,
            groupCount: {numerator: 99, denominator: 1}}})).toBe(false);
        expect(isValidFractionQuotient({...unit, story: {...unit.story,
            recipientUnit: 'piece'}} as unknown as FractionQuotientProblem)).toBe(false);

        setSeed('fraction-quotient-invalid-multiplication');
        const inverse = generator.generate({relationProfile: 'unit-divisor-inverse'}).data;
        expect(isValidFractionQuotient({...inverse, multiplicationWitness: {...inverse.multiplicationWitness!,
            unreducedProduct: {numerator: 99, denominator: 1}}})).toBe(false);
    });

    it('retains unreduced fraction notation, including integral and zero forms', () => {
        expect(formatOriginalFraction({numerator: 0, denominator: 4})).toBe('0/4');
        expect(formatOriginalFraction({numerator: 6, denominator: 3})).toBe('6/3');
    });
});
