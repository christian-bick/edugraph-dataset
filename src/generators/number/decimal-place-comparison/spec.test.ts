import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {DecimalPlaceComparisonGenerator} from './generator.ts';
import {spec} from './spec.ts';

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
        relation, area, scope, comparisonKind
    ) => {
        const labels = [...commonLabels, area, scope];
        setSeed(`decimal-place-comparison-labels-${relation}`);
        const stub = generateWithLabels(generator, labels);
        expect(stub).not.toBeNull();
        expect(stub!.data.relation).toBe(relation);
        expect(stub!.labels).toEqual([area, scope]);
        expect(stub!.labels).not.toContain(Ability.ProcedureExecution);

        setSeed(`decimal-place-comparison-labels-${relation}`);
        expect(generator.generate({comparisonKind, relation})?.data).toEqual(stub!.data);
    });
});
