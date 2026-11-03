import {quotientFixtureRange} from '../../../generators/fraction/fraction-quotient-model/range-fixtures.ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import type {FractionQuotientProblem} from '../../../types/problems.ts';
import {FractionQuotientFixtureGenerator as FractionQuotientModelGenerator} from '../../../generators/fraction/fraction-quotient-fixtures.ts';
import {formatOriginalFraction, isValidFractionPartitionQuotient as isValidFractionQuotient} from './fraction-quotient-helpers.ts';
import {isValidFractionQuotient as isValidLegacyQuotient, isValidFractionSharingQuotient,
    isValidFractionUnitPartition, isValidFractionUnitSharing} from './fraction-quotient-helpers.ts';
import {buildUnitPartitionProblem, buildUnitSharingProblem} from '../../../generators/fraction/fraction-unit-sharing-domain.ts';

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
                const numericProfile = relationProfile === 'fraction-as-quotient' ? seed % 2 ? 'proper' : 'improper'
                    : relationProfile.startsWith('unit-dividend-') ? 'nonzero' : seed % 2 ? 'zero' : 'nonzero';
                const data = generator.generate({range: quotientFixtureRange(relationProfile, numericProfile), relationProfile, numericProfile}).data;
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
        const unit = generator.generate({range: quotientFixtureRange('unit-dividend-equation', 'nonzero'), relationProfile: 'unit-dividend-equation', numericProfile: 'nonzero'}).data;
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
        const inverse = generator.generate({range: quotientFixtureRange('unit-divisor-inverse', 'nonzero'), relationProfile: 'unit-divisor-inverse', numericProfile: 'nonzero'}).data;
        expect(isValidFractionQuotient({...inverse, multiplicationWitness: {...inverse.multiplicationWitness!,
            unreducedProduct: {numerator: 99, denominator: 1}}})).toBe(false);
    });

    it('retains unreduced fraction notation, including integral and zero forms', () => {
        expect(formatOriginalFraction({numerator: 0, denominator: 4})).toBe('0/4');
        expect(formatOriginalFraction({numerator: 6, denominator: 3})).toBe('6/3');
    });

    it('keeps the fine and sharing contracts distinct at runtime', () => {
        const fine = buildUnitPartitionProblem(3, 4, 'unit-dividend-equation', 'ribbon');
        const sharing = buildUnitSharingProblem(3, 4, 'unit-dividend-inverse', 'rope');
        expect(isValidFractionUnitPartition(fine)).toBe(true);
        expect(isValidFractionUnitSharing(sharing)).toBe(true);
        expect(isValidLegacyQuotient(fine)).toBe(false);
        expect(isValidLegacyQuotient(sharing)).toBe(false);
        expect(isValidFractionUnitPartition(sharing)).toBe(false);
        expect(isValidFractionUnitSharing(fine)).toBe(false);
        expect(isValidFractionQuotient(sharing)).toBe(false);
        expect(isValidFractionSharingQuotient(fine)).toBe(false);
        expect(isValidFractionUnitPartition({...fine, model: undefined})).toBe(false);
        expect(isValidFractionUnitPartition({...fine, model: {...fine.model, refinedPartitionCount: 11}})).toBe(false);
        expect(isValidFractionUnitSharing({...sharing, recipientCount: 3})).toBe(false);
        for (const key of ['model', 'wholePartitionCount', 'refinedPartitionCount', 'sharedFineParts']) {
            expect(isValidFractionUnitSharing({...sharing, [key]: undefined})).toBe(false);
        }
    });
});
