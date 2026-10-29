import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
export const spec: GeneratorSpec = {generatorId: 'fraction-tenths-equivalence', generalLabels: [Area.FractionEquivalence, Area.Multiplication, Scope.Equal, Scope.EqualShares, Scope.TenthFractions, Scope.NumbersWithoutNegatives]};
export const FractionTenthsEquivalenceGeneratorSchema = {
    fractionMagnitude: [[Scope.ProperFractions, Scope.ImproperFractions], selectExactLabelMap([
        [Scope.ProperFractions, 'proper'],
        [Scope.ImproperFractions, 'equal-whole']
    ])]
} as const;
export type FractionTenthsEquivalenceGeneratorConfig = ConfigFromSchema<typeof FractionTenthsEquivalenceGeneratorSchema>;
