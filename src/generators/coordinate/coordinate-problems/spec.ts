import {Scope} from 'edugraph-ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'coordinate-problems',
    generalLabels: [Scope.RationalNumbers]
};

export const CoordinateProblemsGeneratorSchema = {
    range: [[Scope.NumbersSmaller20, Scope.NumbersSmaller100], resolveRangeFromLabels]
} as const;

export type CoordinateProblemsGeneratorConfig = ConfigFromSchema<typeof CoordinateProblemsGeneratorSchema>;
