import {describe, expect, it} from 'vitest';
import type {FractionDivisionRelationProblem} from '../../../types/problems.ts';
import {
    divisionFactor, divisionNumber, fractionDivisionAnswerUnit, fractionDivisionMeaning,
    fractionDivisionStory, isValidFractionDivisionRelation, originalDivisionFraction, originalDivisionOperand
} from './fraction-division-helpers.ts';

const valid = (): FractionDivisionRelationProblem => ({
    kind: 'fraction-division-relation', operandProfile: 'fraction-by-fraction',
    dividend: {numerator: 7, denominator: 6}, divisor: {numerator: 3, denominator: 4},
    quotient: {numerator: 14, denominator: 9}, reciprocal: {numerator: 4, denominator: 3},
    reciprocalProduct: {numerator: 28, denominator: 18},
    inverse: {quotientFactor: {numerator: 14, denominator: 9}, divisorFactor: {numerator: 3, denominator: 4}, reconstructedDividend: {numerator: 7, denominator: 6}},
    model: {kind: 'common-unit-groups', ticksPerWhole: 12, dividendTicks: 14, divisorTicks: 9,
        completeGroups: 1, remainderTicks: 5, fractionalGroup: {numerator: 5, denominator: 9}, coverageTicks: 18,
        groups: [{startTick: 0, endTick: 9, filledTicks: 9}, {startTick: 9, endTick: 18, filledTicks: 5}]},
    context: {kind: 'sharing', material: 'juice', measureUnit: 'liter', groupUnit: 'batch',
        totalMeasure: {numerator: 7, denominator: 6}, groupCount: {numerator: 3, denominator: 4}, measurePerGroup: {numerator: 14, denominator: 9}},
    equationWitness: {firstFactor: {numerator: 3, denominator: 4}, secondFactor: {numerator: 14, denominator: 9}, product: {numerator: 7, denominator: 6}},
    multiplicationWitness: {unreducedProduct: {numerator: 42, denominator: 36}, reconstructedDividend: {numerator: 7, denominator: 6}}
});

describe('general fraction division invariants', () => {
    it('accepts original improper fractions and a fractional last divisor-sized group', () => {
        expect(isValidFractionDivisionRelation(valid())).toBe(true);
        const data = valid();
        delete data.equationWitness;
        delete data.multiplicationWitness;
        expect(isValidFractionDivisionRelation(data)).toBe(true);
    });

    it('retains a written zero fraction and a zero-group model without inventing a physical rectangle', () => {
        const data = valid();
        data.dividend = {numerator: 0, denominator: 6};
        data.quotient = {numerator: 0, denominator: 1};
        data.reciprocalProduct = {numerator: 0, denominator: 18};
        data.inverse = {quotientFactor: data.quotient, divisorFactor: data.divisor, reconstructedDividend: data.dividend};
        data.model = {...data.model, dividendTicks: 0, completeGroups: 0, remainderTicks: 0,
            fractionalGroup: {numerator: 0, denominator: 1}, coverageTicks: 12, groups: []};
        data.context = {kind: 'measured-groups', material: 'juice', measureUnit: 'liter', groupUnit: 'serving',
            totalMeasure: data.dividend, groupCount: data.quotient, measurePerGroup: data.divisor};
        delete data.equationWitness;
        delete data.multiplicationWitness;
        expect(isValidFractionDivisionRelation(data)).toBe(true);
        expect(originalDivisionOperand(data.dividend)).toBe('0/6');
        expect(divisionNumber(data.quotient)).toBe('0');
        expect(isValidFractionDivisionRelation({...data, context: {kind: 'rectangle', lengthUnit: 'meter', areaUnit: 'square meter',
            area: data.dividend, firstSide: data.divisor, secondSide: data.quotient}})).toBe(false);
    });

    it('rejects malformed operands, a zero divisor, altered inverse products, and reduced original witnesses', () => {
        const data = valid();
        for (const invalid of [null, [], {}, {...data, kind: 'other'}, {...data, operandProfile: 'integer-by-integer'},
            {...data, operandProfile: 'fraction-by-integer'}, {...data, operandProfile: 'integer-by-fraction'},
            {...data, dividend: {numerator: -1, denominator: 6}},
            {...data, dividend: {numerator: 7, denominator: 0}},
            {...data, dividend: {numerator: 25, denominator: 6}},
            {...data, divisor: {numerator: 0, denominator: 4}},
            {...data, divisor: {numerator: 17, denominator: 4}},
            {...data, quotient: {numerator: 28, denominator: 18}},
            {...data, quotient: {numerator: 15, denominator: 9}},
            {...data, reciprocal: {numerator: 3, denominator: 4}},
            {...data, reciprocalProduct: {numerator: 14, denominator: 9}},
            {...data, inverse: {...data.inverse, reconstructedDividend: {numerator: 7, denominator: 5}}}
        ]) expect(isValidFractionDivisionRelation(invalid)).toBe(false);
    });

    it('rejects rounding a partial group up, dropping its final frame, gaps, and inconsistent tick scales', () => {
        const data = valid();
        for (const model of [
            {...data.model, ticksPerWhole: 24}, {...data.model, dividendTicks: 15}, {...data.model, divisorTicks: 8},
            {...data.model, completeGroups: 2}, {...data.model, remainderTicks: 0},
            {...data.model, fractionalGroup: {numerator: 10, denominator: 18}},
            {...data.model, fractionalGroup: {numerator: 1, denominator: 2}},
            {...data.model, coverageTicks: 14}, {...data.model, groups: data.model.groups.slice(0, 1)},
            {...data.model, groups: [data.model.groups[0]!, {startTick: 10, endTick: 18, filledTicks: 5}]},
            {...data.model, groups: [data.model.groups[0]!, {startTick: 9, endTick: 18, filledTicks: 9}]}
        ]) expect(isValidFractionDivisionRelation({...data, model})).toBe(false);
    });

    it('checks contextual role assignments, geometry and selected mathematical witnesses', () => {
        const data = valid();
        const measured = {...data, context: {kind: 'measured-groups', material: 'juice', measureUnit: 'liter', groupUnit: 'serving',
            totalMeasure: data.dividend, groupCount: data.quotient, measurePerGroup: data.divisor}} as FractionDivisionRelationProblem;
        const rectangle = {...data, context: {kind: 'rectangle', lengthUnit: 'meter', areaUnit: 'square meter',
            area: data.dividend, firstSide: data.divisor, secondSide: data.quotient}} as FractionDivisionRelationProblem;
        expect(isValidFractionDivisionRelation(measured)).toBe(true);
        expect(isValidFractionDivisionRelation(rectangle)).toBe(true);
        for (const invalid of [
            {...data, context: {...data.context, measureUnit: 'meter'}},
            {...data, context: {...data.context, groupCount: data.quotient, measurePerGroup: data.divisor}},
            {...rectangle, context: {...rectangle.context, area: data.divisor}},
            {...rectangle, context: {...rectangle.context, firstSide: data.quotient}},
            {...data, equationWitness: {...data.equationWitness, product: {numerator: 1, denominator: 1}}},
            {...data, equationWitness: {firstFactor: {numerator: 2, denominator: 1}, secondFactor: {numerator: 7, denominator: 12}, product: data.dividend}},
            {...data, multiplicationWitness: {...data.multiplicationWitness, unreducedProduct: data.dividend}}
        ]) expect(isValidFractionDivisionRelation(invalid)).toBe(false);
    });
});

describe('fraction division wording and exact notation', () => {
    it('keeps original fractional roles separate from reduced quotient notation', () => {
        expect(originalDivisionFraction({numerator: 4, denominator: 2})).toBe('4/2');
        expect(originalDivisionOperand({numerator: 0, denominator: 3})).toBe('0/3');
        expect(originalDivisionOperand({numerator: 2, denominator: 1})).toBe('2');
        expect(divisionFactor({numerator: 3, denominator: 4})).toBe('(3/4)');
        expect(divisionFactor({numerator: 2, denominator: 1})).toBe('2');
    });

    it('distinguishes amount per batch, serving equivalents, and the missing rectangle length', () => {
        const data = valid();
        expect(fractionDivisionStory(data)).toContain('3/4 batches');
        expect(fractionDivisionMeaning(data)).toContain('liters needed for one whole batch');
        expect(fractionDivisionAnswerUnit(data.context)).toBe('liters per batch');
        data.context = {kind: 'measured-groups', material: 'juice', measureUnit: 'liter', groupUnit: 'serving',
            totalMeasure: data.dividend, groupCount: data.quotient, measurePerGroup: data.divisor};
        expect(fractionDivisionStory(data)).toContain('fractional serving');
        expect(fractionDivisionMeaning(data)).toContain('Fractional servings are included');
        expect(fractionDivisionAnswerUnit(data.context)).toBe('standard servings');
        data.context = {kind: 'rectangle', lengthUnit: 'meter', areaUnit: 'square meter', area: data.dividend,
            firstSide: data.divisor, secondSide: data.quotient};
        expect(fractionDivisionStory(data)).toContain('7/6 square meters');
        expect(fractionDivisionMeaning(data)).toContain('other side in meters');
        expect(fractionDivisionAnswerUnit(data.context)).toBe('meters');
    });
});
