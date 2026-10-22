import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {generatorId: 'rational-order-relations', generalLabels: [Area.Inequality, Scope.RationalNumbers]};
export const RationalOrderRelationsGeneratorSchema = {
    relation: [[Scope.Less, Scope.Greater], selectExactLabelMap([[Scope.Less, 'less'], [Scope.Greater, 'greater']] as const),
        [[Scope.Less], [Scope.Greater]]]
} as const;
export type RationalOrderRelationsGeneratorConfig = ConfigFromSchema<typeof RationalOrderRelationsGeneratorSchema>;
