import {Area, Scope} from 'edugraph-ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'ratio-tables',
    generalLabels: [Area.RatioEquivalence, Scope.IntegerNumbers, Scope.NumbersWithoutNegatives]
};

export const RatioTablesGeneratorSchema = {
    range: [[Scope.NumbersSmaller20, Scope.NumbersSmaller100], resolveRangeFromLabels]
} as const;

export type RatioTablesGeneratorConfig = ConfigFromSchema<typeof RatioTablesGeneratorSchema>;
