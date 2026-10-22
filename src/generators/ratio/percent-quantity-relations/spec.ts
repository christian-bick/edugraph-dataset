import {Area, Scope} from 'edugraph-ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'percent-quantity-relations',
    generalLabels: [
        Area.PercentageEquivalence, Area.ProportionalScaling,
        Scope.RationalNumbers, Scope.NumbersWithoutNegatives
    ]
};

export const PercentQuantityRelationsGeneratorSchema = {
    range: [[Scope.NumbersSmaller1000, Scope.NumbersSmaller10000], resolveRangeFromLabels]
} as const;

export type PercentQuantityRelationsGeneratorConfig = ConfigFromSchema<typeof PercentQuantityRelationsGeneratorSchema>;
