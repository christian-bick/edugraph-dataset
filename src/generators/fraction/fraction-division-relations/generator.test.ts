import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import type {FractionDivisionRelationProblem, FractionQuotientValue} from '../../../types/problems.ts';
import {greatestCommonDivisor} from '../../ratio/helpers.ts';
import {FractionDivisionRelationsGenerator} from './generator.ts';

const generator = new FractionDivisionRelationsGenerator();
const operandProfiles = ['fraction-by-fraction', 'fraction-by-integer', 'integer-by-fraction'] as const;
const productEquals = (first: FractionQuotientValue, second: FractionQuotientValue, product: FractionQuotientValue) => {
    expect(first.numerator * second.numerator * product.denominator)
        .toBe(product.numerator * first.denominator * second.denominator);
};
const reduced = (value: FractionQuotientValue) => {
    expect(Number.isSafeInteger(value.numerator)).toBe(true);
    expect(Number.isSafeInteger(value.denominator)).toBe(true);
    expect(value.numerator).toBeGreaterThanOrEqual(0);
    expect(value.denominator).toBeGreaterThan(0);
    expect(greatestCommonDivisor(value.numerator, value.denominator)).toBe(1);
};

describe('FractionDivisionRelationsGenerator', () => {
    it('requires all mathematical configuration fields without silent defaults', () => {
        for (const config of [
            null, {}, {operandProfile: 'fraction-by-fraction'},
            {operandProfile: 'fraction-by-fraction', withEquation: false},
            {operandProfile: 'fraction-by-fraction', withEquation: null, withMultiplication: false},
            {operandProfile: 'fraction-by-fraction', withEquation: 'false', withMultiplication: false},
            {operandProfile: 'fraction-by-fraction', withEquation: false, withMultiplication: 0},
            {operandProfile: 'whole-by-whole', withEquation: false, withMultiplication: false}
        ]) {
            expect(() => generator.generate(config as never)).toThrow();
        }
    });

    it.each(operandProfiles)('retains exact original operands, quotient and inverse for %s', operandProfile => {
        const contexts = new Set<string>();
        const firstDenominators = new Set<number>();
        const secondDenominators = new Set<number>();
        let zero = 0;
        let improper = 0;
        let nonUnitProper = 0;
        let mixedQuotients = 0;
        let partialGroups = 0;
        let literalNonReducedReciprocals = 0;
        const problems = new Set<string>();
        for (let seed = 0; seed < 500; seed++) {
            setSeed(seed);
            const stub = generator.generate({operandProfile, withEquation: false, withMultiplication: false});
            expect(Object.keys(stub)).toEqual(['data']);
            const {data} = stub;
            expect(data.kind).toBe('fraction-division-relation');
            expect(data.operandProfile).toBe(operandProfile);
            const {dividend, divisor, quotient, reciprocal, reciprocalProduct, inverse, model, context} = data;
            for (const value of [dividend, divisor]) {
                expect(Number.isSafeInteger(value.numerator)).toBe(true);
                expect(Number.isSafeInteger(value.denominator)).toBe(true);
                expect(value.numerator).toBeGreaterThanOrEqual(0);
                expect(value.numerator).toBeLessThanOrEqual(4 * value.denominator);
            }
            expect(divisor.numerator).toBeGreaterThan(0);
            firstDenominators.add(dividend.denominator);
            secondDenominators.add(divisor.denominator);
            reduced(quotient);
            expect(reciprocal).toEqual({numerator: divisor.denominator, denominator: divisor.numerator});
            expect(reciprocalProduct).toEqual({
                numerator: dividend.numerator * divisor.denominator,
                denominator: dividend.denominator * divisor.numerator
            });
            expect(quotient.numerator * reciprocalProduct.denominator)
                .toBe(reciprocalProduct.numerator * quotient.denominator);
            expect(inverse).toEqual({quotientFactor: quotient, divisorFactor: divisor, reconstructedDividend: dividend});
            productEquals(quotient, divisor, dividend);
            expect(model.kind).toBe('common-unit-groups');
            expect(model.ticksPerWhole).toBe(dividend.denominator * divisor.denominator
                / greatestCommonDivisor(dividend.denominator, divisor.denominator));
            expect(model.ticksPerWhole).toBeLessThanOrEqual(12);
            expect(model.dividendTicks).toBe(dividend.numerator * model.ticksPerWhole / dividend.denominator);
            expect(model.divisorTicks).toBe(divisor.numerator * model.ticksPerWhole / divisor.denominator);
            expect(model.completeGroups).toBe(Math.floor(model.dividendTicks / model.divisorTicks));
            expect(model.remainderTicks).toBe(model.dividendTicks % model.divisorTicks);
            reduced(model.fractionalGroup);
            expect(model.fractionalGroup.numerator * model.divisorTicks)
                .toBe(model.remainderTicks * model.fractionalGroup.denominator);
            expect(model.groups).toHaveLength(model.completeGroups + (model.remainderTicks > 0 ? 1 : 0));
            expect(model.groups.reduce((sum, group) => sum + group.filledTicks, 0)).toBe(model.dividendTicks);
            model.groups.forEach((group, index) => {
                expect(group.startTick).toBe(index * model.divisorTicks);
                expect(group.endTick).toBe((index + 1) * model.divisorTicks);
                expect(group.filledTicks).toBe(index < model.completeGroups ? model.divisorTicks : model.remainderTicks);
                expect(model.coverageTicks).toBeGreaterThanOrEqual(group.endTick);
            });
            expect(model.coverageTicks).toBeGreaterThanOrEqual(model.divisorTicks);
            expect(model.coverageTicks).toBeGreaterThanOrEqual(model.ticksPerWhole);
            expect(model.coverageTicks).toBeLessThanOrEqual(96);
            contexts.add(context.kind);
            if (context.kind === 'rectangle') {
                expect(context.area).toEqual(dividend);
                expect(context.area.numerator).toBeGreaterThan(0);
                expect(context.firstSide).toEqual(divisor);
                expect(context.secondSide).toEqual(quotient);
                expect(context.lengthUnit).toBe('meter');
                expect(context.areaUnit).toBe('square meter');
                const firstSide = divisor.numerator / divisor.denominator;
                const secondSide = quotient.numerator / quotient.denominator;
                expect(Math.max(firstSide, secondSide) / Math.min(firstSide, secondSide)).toBeLessThanOrEqual(6);
                productEquals(context.firstSide, context.secondSide, context.area);
            } else {
                expect(context.totalMeasure).toEqual(dividend);
                expect(context.material).toBe('juice');
                expect(context.measureUnit).toBe('liter');
                expect(context.groupCount).toEqual(context.kind === 'sharing' ? divisor : quotient);
                expect(context.measurePerGroup).toEqual(context.kind === 'sharing' ? quotient : divisor);
                expect(context.groupUnit).toBe(context.kind === 'sharing' ? 'batch' : 'serving');
                productEquals(context.groupCount, context.measurePerGroup, context.totalMeasure);
            }
            if (dividend.numerator === 0) {
                zero++;
                expect(quotient).toEqual({numerator: 0, denominator: 1});
                expect(model.groups).toEqual([]);
                expect(model.completeGroups).toBe(0);
                expect(model.remainderTicks).toBe(0);
                expect(context.kind).not.toBe('rectangle');
            }
            for (const value of [dividend, divisor]) {
                if (value.denominator > 1 && value.numerator > value.denominator) improper++;
                if (value.numerator > 1 && value.numerator < value.denominator) nonUnitProper++;
            }
            if (quotient.numerator > quotient.denominator && quotient.denominator > 1) mixedQuotients++;
            if (model.remainderTicks > 0) partialGroups++;
            if (greatestCommonDivisor(reciprocal.numerator, reciprocal.denominator) > 1) literalNonReducedReciprocals++;
            expect(data).not.toHaveProperty('equationWitness');
            expect(data).not.toHaveProperty('multiplicationWitness');
            expect(Object.keys(data).sort()).toEqual([
                'context', 'dividend', 'divisor', 'inverse', 'kind', 'model', 'operandProfile',
                'quotient', 'reciprocal', 'reciprocalProduct'
            ]);
            problems.add(JSON.stringify(data));
        }
        expect(firstDenominators).toEqual(operandProfile === 'integer-by-fraction'
            ? new Set([1]) : new Set([2, 3, 4, 6]));
        expect(secondDenominators).toEqual(operandProfile === 'fraction-by-integer'
            ? new Set([1]) : new Set([2, 3, 4, 6]));
        expect(contexts).toEqual(new Set(['sharing', 'measured-groups', 'rectangle']));
        expect(zero).toBeGreaterThan(15);
        expect(improper).toBeGreaterThan(200);
        expect(nonUnitProper).toBeGreaterThan(15);
        expect(mixedQuotients).toBeGreaterThan(20);
        expect(partialGroups).toBeGreaterThan(150);
        if (operandProfile !== 'fraction-by-integer') expect(literalNonReducedReciprocals).toBeGreaterThan(40);
        expect(problems.size).toBeGreaterThan(300);
    });

    it.each([[false, false], [true, false], [false, true], [true, true]] as const)(
        'adds exact equation=%s and multiplication=%s witnesses without changing the instance', (withEquation, withMultiplication) => {
            for (const operandProfile of operandProfiles) {
                for (let seed = 0; seed < 40; seed++) {
                    setSeed(seed);
                    const data = generator.generate({operandProfile, withEquation, withMultiplication}).data;
                    setSeed(seed);
                    const baseline = generator.generate({operandProfile, withEquation: false, withMultiplication: false}).data;
                    const {equationWitness, multiplicationWitness, ...relation} = data;
                    expect(relation).toEqual(baseline);
                    expect(!!equationWitness).toBe(withEquation);
                    expect(!!multiplicationWitness).toBe(withMultiplication);
                    if (equationWitness) {
                        expect(equationWitness.product).toEqual(data.dividend);
                        expect(equationWitness.firstFactor).toEqual(data.context.kind === 'measured-groups' ? data.quotient : data.divisor);
                        expect(equationWitness.secondFactor).toEqual(data.context.kind === 'measured-groups' ? data.divisor : data.quotient);
                        productEquals(equationWitness.firstFactor, equationWitness.secondFactor, equationWitness.product);
                    }
                    if (multiplicationWitness) {
                        expect(multiplicationWitness.unreducedProduct).toEqual({
                            numerator: data.quotient.numerator * data.divisor.numerator,
                            denominator: data.quotient.denominator * data.divisor.denominator
                        });
                        expect(multiplicationWitness.reconstructedDividend).toEqual(data.dividend);
                        productEquals(data.quotient, data.divisor, multiplicationWitness.unreducedProduct);
                    }
                }
            }
        }
    );

    it('replays identical original forms, physical context and model groups', () => {
        const config = {operandProfile: 'fraction-by-fraction', withEquation: true, withMultiplication: true} as const;
        setSeed(123);
        const first: FractionDivisionRelationProblem = generator.generate(config).data;
        setSeed(123);
        expect(generator.generate(config).data).toEqual(first);
    });
});
