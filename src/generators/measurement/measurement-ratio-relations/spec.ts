import {Area, Scope} from 'edugraph-ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'measurement-ratio-relations',
    generalLabels: [Area.UnitConversion, Area.RatioEquivalence, Scope.RationalNumbers]
};

export const MeasurementRatioRelationsGeneratorSchema = {
    range: [[Scope.NumbersSmaller10000, Scope.NumbersSmaller100000], resolveRangeFromLabels]
} as const;

export type MeasurementRatioRelationsGeneratorConfig = ConfigFromSchema<typeof MeasurementRatioRelationsGeneratorSchema>;
