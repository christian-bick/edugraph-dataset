import {Area, Scope} from 'edugraph-ts';
import {hasLabel} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'fraction-equivalence',
    generalLabels: [
        Area.FractionEquivalence,
        Scope.Equal,
        Scope.EqualShares,
        Scope.ProperFractions
    ]
};

export const FractionEquivalenceGeneratorSchema = {
    usesMultiplication: [[Area.Multiplication], hasLabel(Area.Multiplication)]
} as const;

export type FractionEquivalenceGeneratorConfig = ConfigFromSchema<
    typeof FractionEquivalenceGeneratorSchema
>;
