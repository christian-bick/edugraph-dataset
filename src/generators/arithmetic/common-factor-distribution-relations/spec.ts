import {Area, Scope} from 'edugraph-ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'common-factor-distribution-relations',
    generalLabels: [Area.GreatestCommonDivisor, Area.DistributiveLaw,
        Scope.IntegerNumbers, Scope.NumbersWithoutNegatives]
};

export const CommonFactorDistributionRelationsGeneratorSchema = {
    range: [[Scope.NumbersSmaller100, Scope.NumbersSmaller1000], resolveRangeFromLabels]
} as const;

export type CommonFactorDistributionRelationsGeneratorConfig = ConfigFromSchema<
    typeof CommonFactorDistributionRelationsGeneratorSchema
>;
