import {Area, Scope} from 'edugraph-ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'coordinate-reflection-relations',
    generalLabels: [Area.OrderedCoordinatePair, Area.Reflection, Area.SignNotation, Scope.RationalNumbers]
};

export const CoordinateReflectionRelationsGeneratorSchema = {
    range: [[Scope.NumbersSmaller5, Scope.NumbersSmaller10], resolveRangeFromLabels]
} as const;

export type CoordinateReflectionRelationsGeneratorConfig = ConfigFromSchema<typeof CoordinateReflectionRelationsGeneratorSchema>;
