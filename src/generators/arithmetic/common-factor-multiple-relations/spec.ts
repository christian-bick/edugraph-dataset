import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'common-factor-multiple-relations',
    generalLabels: [Scope.IntegerNumbers, Scope.NumbersWithoutNegatives]
};

const profiles = ([
    [Area.GreatestCommonDivisor, 'gcd', 100],
    [Area.LeastCommonMultiple, 'lcm', 1000]
] as const).flatMap(([area, operation, maximum]) => canonicalRangeProfiles
    .filter(({range}) => range.min === 0 && range.max <= maximum)
    .map(({labels, range}) => [[area, ...labels], {operation, range}] as const));

export const CommonFactorMultipleRelationsGeneratorSchema = {
    profile: [[...new Set(profiles.flatMap(([labels]) => labels))], selectExactLabelSetMap(profiles),
        profiles.map(([labels]) => labels)]
} as const;

export type CommonFactorMultipleRelationsGeneratorConfig = ConfigFromSchema<typeof CommonFactorMultipleRelationsGeneratorSchema>;
