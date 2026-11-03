import {Area, Scope} from 'edugraph-ts';
import {hasLabel, selectExactLabelMap} from '../../../lib/resolvers.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'fraction-equivalence',
    generalLabels: [
        Area.FractionEquivalence,
        Scope.Equal,
        Scope.EqualShares,
        Scope.ProperFractions,
        Scope.NumbersWithoutNegatives
    ]
};

export const FractionEquivalenceGeneratorSchema = {
    usesMultiplication: [[Area.Multiplication], hasLabel(Area.Multiplication)],
    usesProportionalScaling: [[Area.ProportionalScaling], hasLabel(Area.ProportionalScaling)],
    range: [[Scope.NumbersSmaller5, Scope.NumbersSmaller10], selectExactLabelMap([
        [Scope.NumbersSmaller5, createCanonicalNumericRange(5)],
        [Scope.NumbersSmaller10, createCanonicalNumericRange(10)]
    ])]
} as const;

export type FractionEquivalenceGeneratorConfig = ConfigFromSchema<
    typeof FractionEquivalenceGeneratorSchema
>;
