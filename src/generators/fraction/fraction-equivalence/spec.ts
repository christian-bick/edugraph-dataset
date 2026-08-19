import {Area, Scope} from 'edugraph-ts';
import {hasLabel} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'fraction-equivalence',
    generalLabels: [
        Area.FractionEquivalence,
        Area.FractionNotation,
        Scope.Equal
    ]
};

export const FractionEquivalenceGeneratorSchema = {
    usesMultiplication: [[Area.Multiplication], hasLabel(Area.Multiplication)],
    usesEqualShares: [[Scope.EqualShares], hasLabel(Scope.EqualShares)],
    usesImproperFractions: [[Scope.ImproperFractions], hasLabel(Scope.ImproperFractions)],
    usesIntegerNumbers: [[Scope.IntegerNumbers], hasLabel(Scope.IntegerNumbers)]
} as const;

export type FractionEquivalenceGeneratorConfig = ConfigFromSchema<
    typeof FractionEquivalenceGeneratorSchema
>;
