import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractConfig, findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {numericProfileBundles} from '../numerical-power-expressions/numeric-profiles.ts';
import {NumericalPowerExpressionSyntaxGenerator} from './generator.ts';
import {NumericalPowerExpressionSyntaxGeneratorSchema, spec} from './spec.ts';

describe('literal-power syntax capability contract', () => {
    it('owns syntax magnitudes and accepts every feasible exponent/sign/zero bundle directly', () => {
        expect(spec.generalLabels).toEqual([Area.ArithmeticExpression, Area.Exponentiation, Scope.IntegerExponent,
            Scope.RationalNumbers, Scope.NumbersSmaller5]);
        expect(findSchemaFallbackContractIssues(NumericalPowerExpressionSyntaxGeneratorSchema)).toEqual([]);
        for (const positive of [false, true]) for (const [index, profile] of numericProfileBundles.entries()) {
            const labels = [...profile, ...(positive ? [Scope.PositiveExponent] : [])];
            if (positive && index === 3) {
                expect(() => generateWithLabels(new NumericalPowerExpressionSyntaxGenerator(), labels)).toThrow();
                continue;
            }
            expect(extractConfig(NumericalPowerExpressionSyntaxGeneratorSchema, labels).config)
                .toEqual({exponents: positive ? 'positive' : 'allow-zero', numericProfile: index + 1});
            const data = generateWithLabels(new NumericalPowerExpressionSyntaxGenerator(), labels)!.data;
            expect(data.expression.base.value.numerator < 0).toBe(index > 1);
            expect(data.expression.base.value.numerator === 0 || data.expression.exponent === 0).toBe(index % 2 === 1);
        }
    });

});
