import {describe, expect, it} from 'vitest';
import type {RatioRelationProblem, UnitRateRelationProblem} from '../../../types/problems.ts';
import {isRatioRational, isRatioRelation, isUnitRateRelation, rateInterpretation, rateRequest, rateStory, ratioMeasure, ratioNumber, ratioQuantityMeasure, scaledRateAnswer} from './ratio-language-presentation.ts';

const rational = (numerator: number, denominator = 1) => ({numerator, denominator});
const rate: UnitRateRelationProblem = {
    kind: 'unit-rate', context: 'price',
    antecedent: {name: 'cost', unit: 'dollars', value: rational(15)},
    consequent: {name: 'apples', unit: 'kilograms', value: rational(6)},
    unitRate: rational(5, 2), scaleFactor: rational(1, 3),
    scaled: {antecedent: rational(5), consequent: rational(2)}
};

describe('ratio language presentation', () => {
    it('formats exact rationals and singular units without rounding', () => {
        expect(ratioNumber(rational(5, 3))).toBe('5/3');
        expect(ratioNumber(rational(5))).toBe('5');
        expect(ratioMeasure(rational(1), 'hours')).toBe('1 hour');
        expect(ratioMeasure(rational(2), 'hours')).toBe('2 hours');
        expect(ratioMeasure(rational(1), 'beads')).toBe('1 bead');
    });

    it('keeps measurement units and count names in natural quantity phrases', () => {
        expect(ratioQuantityMeasure({name: 'flour', unit: 'cups', value: rational(3)})).toBe('3 cups of flour');
        expect(ratioQuantityMeasure({name: 'paint', unit: 'liters', value: rational(1)})).toBe('1 liter of paint');
        expect(ratioQuantityMeasure({name: 'red beads', unit: 'beads', value: rational(1)})).toBe('1 red bead');
        expect(ratioQuantityMeasure({name: 'apples', unit: 'apples', value: rational(1)})).toBe('1 apple');
    });

    it.each([null, {}, rational(1, 0), rational(-1), rational(2, 4), rational(1.5), rational(0, 2), rational(Number.MAX_SAFE_INTEGER + 1)])('rejects malformed or noncanonical rational %j', value => {
        expect(isRatioRational(value)).toBe(false);
    });

    it('checks ordered quantities and nonzero consequents', () => {
        const data: RatioRelationProblem = {kind: 'ratio-relation', antecedent: rate.antecedent, consequent: rate.consequent};
        expect(isRatioRelation(data)).toBe(true);
        expect(isRatioRelation({...data, consequent: {...data.consequent, value: rational(0)}})).toBe(false);
        expect(isRatioRelation({...data, antecedent: {...data.antecedent, name: ' '}})).toBe(false);
        expect(isRatioRelation({...data, consequent: undefined})).toBe(false);
    });

    it('validates a scale factor below one and exact quotient witnesses', () => {
        expect(isUnitRateRelation(rate)).toBe(true);
        expect(isUnitRateRelation({...rate, unitRate: rational(3)})).toBe(false);
        expect(isUnitRateRelation({...rate, scaleFactor: rational(0)})).toBe(false);
        expect(isUnitRateRelation({...rate, scaled: {...rate.scaled, antecedent: rational(6)}})).toBe(false);
        expect(isUnitRateRelation({...rate, scaled: {...rate.scaled, consequent: rational(3)}})).toBe(false);
        expect(isUnitRateRelation({...rate, context: 'unknown'})).toBe(false);
        expect(isUnitRateRelation({...rate, scaled: null})).toBe(false);
    });

    it('keeps price context, rate orientation and requested amount explicit', () => {
        expect(rateStory(rate)).toContain('6 kilograms of apples costs 15 dollars');
        expect(rateInterpretation(rate)).toBe('For every 1 kilogram of apples, the cost is 5/2 dollars.');
        expect(rateRequest(rate)).toContain('cost of 2 kilograms of apples');
        expect(scaledRateAnswer(rate)).toContain('2 kilograms of apples is 5 dollars');
    });

    it('handles speed context and a scale factor above one', () => {
        const speed: UnitRateRelationProblem = {
            ...rate, context: 'speed',
            antecedent: {name: 'distance', unit: 'kilometers', value: rational(15)},
            consequent: {name: 'time', unit: 'hours', value: rational(6)},
            scaleFactor: rational(3, 2), scaled: {antecedent: rational(45, 2), consequent: rational(9)}
        };
        expect(isUnitRateRelation(speed)).toBe(true);
        expect(rateStory(speed)).toContain('15 kilometers in 6 hours');
        expect(rateInterpretation(speed)).toBe('For every 1 hour of travel, the distance is 5/2 kilometers.');
        expect(rateRequest(speed)).toContain('distance traveled in 9 hours');
        expect(scaledRateAnswer(speed)).toContain('9 hours, the traveler covers 45/2 kilometers');
    });
});
