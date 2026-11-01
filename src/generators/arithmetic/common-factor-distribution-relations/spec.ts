import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'common-factor-distribution-relations',
    generalLabels: [Area.GreatestCommonDivisor, Area.DistributiveLaw,
        Scope.IntegerNumbers, Scope.NumbersWithoutNegatives]
};

export const CommonFactorDistributionRelationsGeneratorSchema = {
    range: (() => {
        const profiles = canonicalRangeProfiles.filter(({range}) => range.min === 0 && range.max <= 1000);
        return [[...new Set(profiles.flatMap(({labels}) => labels))],
            selectExactLabelSetMap(profiles.map(({labels, range}) => [labels, range] as const)),
            profiles.map(({labels}) => labels)] as const;
    })()
} as const;

export type CommonFactorDistributionRelationsGeneratorConfig = ConfigFromSchema<
    typeof CommonFactorDistributionRelationsGeneratorSchema
>;
