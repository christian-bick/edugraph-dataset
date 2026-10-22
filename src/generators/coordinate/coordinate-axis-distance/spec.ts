import {Area, Scope} from 'edugraph-ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'coordinate-axis-distance',
    generalLabels: [Area.CoordinateDistance, Area.AbsoluteNumberMagnitude, Scope.RationalNumbers]
};

export const CoordinateAxisDistanceGeneratorSchema = {
    range: [[Scope.NumbersSmaller20, Scope.NumbersSmaller100], resolveRangeFromLabels]
} as const;

export type CoordinateAxisDistanceGeneratorConfig = ConfigFromSchema<typeof CoordinateAxisDistanceGeneratorSchema>;
