import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';
import {ratioTableRangeProfiles} from './numeric-domain.ts';

export const spec: GeneratorSpec = {
    generatorId: 'ratio-tables',
    generalLabels: [Area.RatioEquivalence, Scope.IntegerNumbers, Scope.NumbersWithoutNegatives]
};

export const RatioTablesGeneratorSchema = {
    range: [[...new Set(ratioTableRangeProfiles.flatMap(profile => profile.labels))],
        selectExactLabelSetMap(ratioTableRangeProfiles.map(profile => [profile.labels, profile.range] as const)),
        ratioTableRangeProfiles.map(profile => profile.labels)]
} as const;

export type RatioTablesGeneratorConfig = ConfigFromSchema<typeof RatioTablesGeneratorSchema>;
