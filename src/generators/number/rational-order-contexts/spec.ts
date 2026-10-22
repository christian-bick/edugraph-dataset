import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'rational-order-contexts',
    generalLabels: [Area.Inequality, Scope.RationalNumbers]
};

export const RationalOrderContextsGeneratorSchema = {
    relation: [[Scope.Less, Scope.Greater], selectExactLabelMap([
        [Scope.Less, 'less'], [Scope.Greater, 'greater']
    ] as const)]
} as const;

export type RationalOrderContextsGeneratorConfig = ConfigFromSchema<typeof RationalOrderContextsGeneratorSchema>;
