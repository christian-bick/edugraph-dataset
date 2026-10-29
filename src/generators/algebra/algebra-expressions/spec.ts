import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import {exactResolver, withLabelChoices, type ConfigFromSchema} from '../../../types/schema.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';
import {allowedNumericProfiles, numericContextLabels, numericProfileBundles, numericProfileLabels,
    resolveNumericProfile} from './numeric-profiles.ts';

const relations = [
    [[Area.AlgebraicExpression, Scope.RationalNumbers], 'plain'],
    [[Area.ArithmeticExpression, Area.Term, Scope.RationalNumbers], 'numeric-terms'],
    [[Area.AlgebraicExpression, Area.Term], 'symbolic-terms'],
    [[Area.ArithmeticExpression, Area.Factor, Scope.RationalNumbers], 'numeric-factors'],
    [[Area.AlgebraicExpression, Area.Factor], 'symbolic-factors'],
    [[Area.AlgebraicExpression, Area.Coefficient], 'symbolic-coefficient'],
    [[Area.ArithmeticExpression, Area.Addition, Scope.RationalNumbers], 'numeric-sum'],
    [[Area.AlgebraicExpression, Area.Addition], 'symbolic-sum'],
    [[Area.ArithmeticExpression, Area.Multiplication, Scope.RationalNumbers], 'numeric-product'],
    [[Area.AlgebraicExpression, Area.Multiplication], 'symbolic-product'],
    [[Area.ArithmeticExpression, Area.Division, Scope.RationalNumbers], 'numeric-quotient'],
    [[Area.AlgebraicExpression, Area.Division], 'symbolic-quotient'],
    [[Area.ArithmeticExpression, Area.GroupingSymbol, Area.Operand, Scope.RationalNumbers], 'numeric-grouped'],
    [[Area.AlgebraicExpression, Area.GroupingSymbol, Area.Operand], 'symbolic-grouped'],
    [[Area.AlgebraicExpression, Area.AlgebraicSubstitution, Area.OrderOfOperations], 'substitution'],
    [[Area.AlgebraicExpression, Area.AlgebraicModeling], 'modeling']
] as const;
// These symbolic frames all display integral constants or coefficients. Integer
// presence describes those values; it does not assert a domain for the unbound variable.
const canonicalRelations = relations.map(([labels, value]) => [
    value.startsWith('symbolic-') ? [...labels, Scope.IntegerNumbers] : labels, value
] as const);
const exactRelation = selectExactLabelSetMap([
    ...canonicalRelations, ...relations.filter(([, value]) => value.startsWith('symbolic-'))
]);
const resolveRelation = withLabelChoices(exactResolver((labels: string[]) => {
    // Preserve original RationalNumbers routes when fallback probing combines a
    // requested broad kind with a newly declared integer-literal alternative.
    if (labels.includes(Scope.RationalNumbers) && labels.includes(Scope.IntegerNumbers)) return undefined;
    try { return exactRelation(labels); } catch (error) {
        // A fallback can specialize Factor to Coefficient. Reject the blended
        // exact roles instead of treating that probe as an authored conjunction.
        if (labels.includes(Scope.IntegerNumbers) && error instanceof Error
            && error.message.startsWith('Unsupported exact label combination:')) return undefined;
        throw error;
    }
}), exactRelation.labelChoices!);
const powers = [[[], 'none'], [[Area.Exponentiation, Scope.IntegerExponent], 'allow-zero'],
    [[Area.Exponentiation, Scope.IntegerExponent, Scope.PositiveExponent], 'positive']] as const;

export const spec: GeneratorSpec = {
    generatorId: 'algebra-expressions',
    generalLabels: [],
    compatibility: [{
        id: 'algebra-power-substitution',
        description: 'Powered calculations belong to the substitution and precedence relation.',
        dependencies: [{scope: 'generator', label: Area.Exponentiation}, {scope: 'generator', label: Area.AlgebraicSubstitution}],
        predicate: labels => !labels.has('generator', Area.Exponentiation) || labels.has('generator', Area.AlgebraicSubstitution)
    }, generatorLabelRule('algebra-expression-evidenced-numeric-profile',
        [...numericContextLabels, ...numericProfileLabels], selected => {
            const chosen = numericProfileLabels.filter(selected);
            const index = numericProfileBundles.findIndex(bundle => bundle.length === chosen.length
                && bundle.every(selected));
            const profile = chosen.length ? index + 1 : 0;
            return index >= 0 || !chosen.length
                ? allowedNumericProfiles(selected).some(value => value === profile) : false;
        }), {
        id: 'algebra-original-rational-context',
        dependencies: [{scope: 'target', label: Scope.RationalNumbers},
            {scope: 'generator', label: Scope.RationalNumbers}],
        predicate: labels => !labels.exact('target', Scope.RationalNumbers)
            || labels.exact('generator', Scope.RationalNumbers)
    }]
};

export const AlgebraExpressionsGeneratorSchema = {
    relation: [[...new Set(canonicalRelations.flatMap<string>(([labels]) => labels))],
        resolveRelation, canonicalRelations.map(([labels]) => labels)],
    power: [[Area.Exponentiation, Scope.IntegerExponent, Scope.PositiveExponent], selectExactLabelSetMap(powers), powers.map(([labels]) => labels)],
    numericProfile: [numericProfileLabels, resolveNumericProfile, [[], ...numericProfileBundles]]
} as const;
export type AlgebraExpressionsGeneratorConfig = ConfigFromSchema<typeof AlgebraExpressionsGeneratorSchema>;
