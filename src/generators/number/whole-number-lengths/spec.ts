import {Area, Scope} from 'edugraph-ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'whole-number-lengths',
    generalLabels: [Area.NumerationWithIntegers, Scope.IntegerNumbers, Scope.Base10,
        Scope.NumbersWithoutNegatives, Scope.NumbersWithZero]
};

export const WholeNumberLengthsGeneratorSchema = {
    // Lower bounds above zero would be false of the complete rooted relation.
    range: [[Scope.NumbersSmaller5, Scope.NumbersSmaller10, Scope.NumbersSmaller20,
        Scope.NumbersSmaller100, Scope.NumbersSmaller120, Scope.NumbersSmaller1000,
        Scope.NumbersSmaller10000, Scope.NumbersSmaller100000, Scope.NumbersSmaller1000000],
    resolveRangeFromLabels]
} as const;

export type WholeNumberLengthsGeneratorConfig = ConfigFromSchema<typeof WholeNumberLengthsGeneratorSchema>;
