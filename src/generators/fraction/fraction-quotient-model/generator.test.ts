import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import type {FractionQuotientProblem, FractionQuotientValue} from '../../../types/problems.ts';
import {FractionQuotientModelGenerator} from './generator.ts';
import type {FractionQuotientModelGeneratorConfig} from './spec.ts';

const generator = new FractionQuotientModelGenerator();
const profiles = [
    'fraction-as-quotient', 'whole-sharing-equation',
    'unit-dividend-basic', 'unit-dividend-inverse', 'unit-dividend-equation',
    'unit-divisor-basic', 'unit-divisor-inverse', 'unit-divisor-equation'
] as const;

const sample = (profile: typeof profiles[number], seed: string): FractionQuotientProblem => {
    setSeed(seed);
    return generator.generate({relationProfile: profile}).data;
};

const equalValues = (first: FractionQuotientValue, second: FractionQuotientValue): boolean =>
    BigInt(first.numerator) * BigInt(second.denominator)
        === BigInt(second.numerator) * BigInt(first.denominator);

const validValue = (item: FractionQuotientValue): boolean =>
    Number.isSafeInteger(item.numerator) && item.numerator >= 0
        && Number.isSafeInteger(item.denominator) && item.denominator > 0;

describe('fraction-quotient-model exact division', () => {
    it.each(profiles)('maintains original operand roles and witnesses for %s across seeds', profile => {
        const seen = new Set<string>();
        for (let seed = 0; seed < 160; seed++) {
            const data = sample(profile, `${profile}-${seed}`);
            seen.add(JSON.stringify([data.dividend, data.divisor, data.quotient, data.story.material]));
            expect(data.kind).toBe('fraction-quotient');
            for (const item of [data.dividend, data.divisor, data.quotient,
                data.inverse.quotientFactor, data.inverse.divisorFactor,
                data.inverse.reconstructedDividend]) expect(validValue(item)).toBe(true);
            expect(data.divisor.numerator).toBeGreaterThan(0);
            expect(equalValues({
                numerator: data.quotient.numerator * data.divisor.numerator,
                denominator: data.quotient.denominator * data.divisor.denominator
            }, data.dividend)).toBe(true);
            expect(data.inverse.quotientFactor).toEqual(data.quotient);
            expect(data.inverse.divisorFactor).toEqual(data.divisor);
            expect(data.inverse.reconstructedDividend).toEqual(data.dividend);
            expect(data.story.material === 'ribbon' || data.story.material === 'rope').toBe(true);
            expect(data.story.measureUnit).toBe('meter');

            const withEquation = profile.endsWith('-equation');
            const withMultiplication = profile.endsWith('-inverse');
            expect(data.equationWitness !== undefined).toBe(withEquation);
            expect(data.multiplicationWitness !== undefined).toBe(withMultiplication);
            if (data.equationWitness) {
                const {totalMeasure, groupCount, measurePerGroup} = data.equationWitness;
                expect(totalMeasure).toEqual(data.dividend);
                expect(equalValues({numerator: groupCount.numerator * measurePerGroup.numerator,
                    denominator: groupCount.denominator * measurePerGroup.denominator}, totalMeasure)).toBe(true);
                if (data.orientation === 'whole-by-unit-fraction') {
                    expect(groupCount).toEqual(data.quotient);
                    expect(measurePerGroup).toEqual(data.divisor);
                } else {
                    expect(groupCount).toEqual(data.divisor);
                    expect(measurePerGroup).toEqual(data.quotient);
                }
            }
            if (data.multiplicationWitness) {
                expect(data.multiplicationWitness.unreducedProduct).toEqual({
                    numerator: data.quotient.numerator * data.divisor.numerator,
                    denominator: data.quotient.denominator * data.divisor.denominator
                });
                expect(data.multiplicationWitness.reconstructedDividend).toEqual(data.dividend);
                expect(equalValues(data.multiplicationWitness.unreducedProduct, data.dividend)).toBe(true);
            }

            switch (data.orientation) {
                case 'whole-by-whole': {
                    const {wholeUnitCount, recipientCount, partsPerWhole,
                        totalParts, partsPerRecipient} = data.model;
                    expect(data.model.kind).toBe('equal-sharing');
                    expect(wholeUnitCount).toBeGreaterThanOrEqual(0);
                    expect(wholeUnitCount).toBeLessThanOrEqual(6);
                    expect(recipientCount).toBeGreaterThanOrEqual(1);
                    expect(recipientCount).toBeLessThanOrEqual(6);
                    expect(data.dividend).toEqual({numerator: wholeUnitCount, denominator: 1});
                    expect(data.divisor).toEqual({numerator: recipientCount, denominator: 1});
                    expect(data.quotient).toEqual({numerator: wholeUnitCount, denominator: recipientCount});
                    expect(partsPerWhole).toBe(recipientCount);
                    expect(totalParts).toBe(wholeUnitCount * recipientCount);
                    expect(totalParts).toBeLessThanOrEqual(36);
                    expect(partsPerRecipient).toBe(wholeUnitCount);
                    expect(data.story.recipientUnit).toBe('person');
                    break;
                }
                case 'unit-fraction-by-whole': {
                    const {wholePartitionCount, recipientCount,
                        refinedPartitionCount, sharedFineParts} = data.model;
                    expect(data.model.kind).toBe('unit-part-sharing');
                    expect(wholePartitionCount).toBeGreaterThanOrEqual(2);
                    expect(wholePartitionCount).toBeLessThanOrEqual(6);
                    expect(recipientCount).toBeGreaterThanOrEqual(2);
                    expect(recipientCount).toBeLessThanOrEqual(6);
                    expect(data.dividend).toEqual({numerator: 1, denominator: wholePartitionCount});
                    expect(data.divisor).toEqual({numerator: recipientCount, denominator: 1});
                    expect(data.quotient).toEqual({numerator: 1,
                        denominator: wholePartitionCount * recipientCount});
                    expect(refinedPartitionCount).toBe(wholePartitionCount * recipientCount);
                    expect(refinedPartitionCount).toBeLessThanOrEqual(36);
                    expect(sharedFineParts).toBe(recipientCount);
                    expect(data.story.recipientUnit).toBe('person');
                    break;
                }
                case 'whole-by-unit-fraction': {
                    const {wholeUnitCount, partsPerWhole, groupCount} = data.model;
                    expect(data.model.kind).toBe('unit-part-group-count');
                    expect(wholeUnitCount).toBeGreaterThanOrEqual(0);
                    expect(wholeUnitCount).toBeLessThanOrEqual(6);
                    expect(partsPerWhole).toBeGreaterThanOrEqual(2);
                    expect(partsPerWhole).toBeLessThanOrEqual(6);
                    expect(data.dividend).toEqual({numerator: wholeUnitCount, denominator: 1});
                    expect(data.divisor).toEqual({numerator: 1, denominator: partsPerWhole});
                    expect(data.quotient).toEqual({numerator: wholeUnitCount * partsPerWhole, denominator: 1});
                    expect(groupCount).toBe(wholeUnitCount * partsPerWhole);
                    expect(groupCount).toBeLessThanOrEqual(36);
                    expect(data.story.groupUnit).toBe('piece');
                    break;
                }
            }
        }
        expect(seen.size).toBeGreaterThan(10);
    });

    it('includes zero, fractional, integral, and mixed-valued whole sharing', () => {
        const wholeSharing = Array.from({length: 400}, (_, seed) =>
            sample('whole-sharing-equation', `whole-forms-${seed}`));
        expect(wholeSharing.some(data => data.dividend.numerator === 0
            && data.quotient.numerator === 0 && data.quotient.denominator > 0)).toBe(true);
        expect(wholeSharing.some(data => data.dividend.numerator > 0
            && data.quotient.numerator < data.quotient.denominator)).toBe(true);
        expect(wholeSharing.some(data => data.dividend.numerator > 0
            && data.quotient.numerator % data.quotient.denominator === 0)).toBe(true);
        expect(wholeSharing.some(data => data.quotient.numerator > data.quotient.denominator
            && data.quotient.numerator % data.quotient.denominator !== 0)).toBe(true);
        expect(Array.from({length: 250}, (_, seed) =>
            sample('unit-divisor-basic', `zero-group-${seed}`))
            .some(data => data.dividend.numerator === 0 && data.quotient.numerator === 0)).toBe(true);
    });

    it('replays exact payloads and rejects missing or unsupported profiles', () => {
        for (const profile of profiles) {
            expect(sample(profile, `replay-${profile}`)).toEqual(sample(profile, `replay-${profile}`));
        }
        expect(() => generator.generate({} as FractionQuotientModelGeneratorConfig)).toThrow();
        expect(() => generator.generate({relationProfile: 'unknown'} as unknown as
            FractionQuotientModelGeneratorConfig)).toThrow(/Unsupported relation profile/);
    });
});
