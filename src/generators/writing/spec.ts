import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, Scope, deductCompatible} from 'edugraph-ts';
import {ConfigFromSchema} from '../../types/schema.ts';
import {resolveRangeFromLabels} from '../../lib/ontology.ts';

export const spec: GeneratorSpec = {
    generatorId: 'writing',
    supportedLabels: [
        Area.DigitNotation,
        Area.Numeration,
        Scope.NumericRange,
        Scope.NumericZero
    ]
};


export const WritingGeneratorSchema = {
    // TODO: Add ontological relations for non-range properties
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller1000000]),
        resolveRangeFromLabels
    ]
} as const;

export type WritingGeneratorConfig = ConfigFromSchema<typeof WritingGeneratorSchema>;
