import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';
import {numericProfileBundles, numericProfileLabels, resolveNumericProfile} from '../numerical-power-expressions/numeric-profiles.ts';

const exponents = [[[], 'allow-zero'], [[Scope.PositiveExponent], 'positive']] as const;

export const spec: GeneratorSpec = {
    generatorId: 'numerical-power-expression-syntax',
    generalLabels: [Area.ArithmeticExpression, Area.Exponentiation, Scope.IntegerExponent,
        Scope.RationalNumbers, Scope.NumbersSmaller5],
    compatibility: [generatorLabelRule('literal-power-numeric-profile', [Scope.PositiveExponent, ...numericProfileLabels], selected => {
        const labels = numericProfileLabels.filter(selected);
        return numericProfileBundles.some((bundle, index) => labels.length === bundle.length && bundle.every(selected)
            && !(index === 3 && selected(Scope.PositiveExponent)));
    })]
};

export const NumericalPowerExpressionSyntaxGeneratorSchema = {
    exponents: [[Scope.PositiveExponent], selectExactLabelSetMap(exponents), exponents.map(([labels]) => labels)],
    numericProfile: [numericProfileLabels, resolveNumericProfile, numericProfileBundles]
} as const;
export type NumericalPowerExpressionSyntaxGeneratorConfig = ConfigFromSchema<typeof NumericalPowerExpressionSyntaxGeneratorSchema>;
