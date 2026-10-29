import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {extractConfig, generateWithLabels} from '../../../lib/utils.ts';
import {DecimalPlaceComparisonGenerator} from './generator.ts';
import {DecimalPlaceComparisonGeneratorSchema, spec} from './spec.ts';

const commonLabels = [
    Area.PlaceValue,
    Scope.ThousandthDecimals,
    Scope.Base10,
    Scope.NumbersWithoutNegatives,
    Scope.TwoOperands,
    Scope.ArabicNumerals,
    Ability.ProcedureExecution
] as const;

const variants = [
    ['greater', Area.NumericInequality, Scope.Greater, 'inequality'],
    ['equal', Area.NumericEquality, Scope.Equal, 'equality'],
    ['less', Area.NumericInequality, Scope.Less, 'inequality']
] as const;

describe('DecimalPlaceComparisonGenerator spec integration', () => {
    const generator = new DecimalPlaceComparisonGenerator();

    it('declares the invariant place-value context without an Ability', () => {
        expect(spec.generatorId).toBe('decimal-place-comparison');
        expect(spec.generalLabels).toEqual([
            Area.PlaceValue,
            Scope.ThousandthDecimals,
            Scope.Base10,
            Scope.NumbersWithoutNegatives,
            Scope.TwoOperands
        ]);
        expect(spec.generalLabels).not.toContain(Ability.ProcedureExecution);
    });

    it.each(variants)('resolves the %s target to the correlated relation', (
        relation, area, scope, _comparisonKind
    ) => {
        const labels = [...commonLabels, area, scope];
        setSeed(`decimal-place-comparison-labels-${relation}`);
        const stub = generateWithLabels(generator, labels);
        expect(stub).not.toBeNull();
        expect(stub!.data.relation).toBe(relation);
        expect(stub!.labels).toEqual(expect.arrayContaining([area, scope]));
        expect(stub!.labels.filter(label => [Scope.NumbersWithZero, Scope.NumbersWithoutZero].includes(label as never)))
            .toHaveLength(1);
        expect(stub!.labels).not.toContain(Ability.ProcedureExecution);
        if (relation === 'equal') {
            expect(stub!.data.left.fractionalDigits[2]).toBe(0);
            expect(stub!.data.right.fractionalDigits[2]).toBe(0);
        }

        setSeed(`decimal-place-comparison-labels-${relation}`);
        const resolved = extractConfig(DecimalPlaceComparisonGeneratorSchema, labels);
        expect(generator.generate(resolved.config)?.data).toEqual(stub!.data);
    });

    it.each([Scope.Greater, Scope.Less])('constrains the requested zero profile for %s comparison', relation => {
        for (const zero of [Scope.NumbersWithZero, Scope.NumbersWithoutZero]) {
            const stub = generateWithLabels(generator, [...commonLabels, Area.NumericInequality, relation, zero])!;
            expect(stub.labels).toContain(zero);
            const digits = [stub.data.left, stub.data.right].flatMap(operand => [...operand.wholeDigits, ...operand.fractionalDigits]);
            expect(digits.includes(0)).toBe(zero === Scope.NumbersWithZero);
        }
    });
});
