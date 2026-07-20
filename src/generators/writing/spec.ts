import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, Scope, deductCompatible} from 'edugraph-ts';
import {ConfigFromSchema} from '../../types/schema.ts';
import {resolveRangeFromLabels} from '../../lib/ontology.ts';
import {hasLabel} from '../../lib/resolvers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'writing',
    generalLabels: [
        Area.DigitNotation,
        Area.Numeration,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
    ]
};


export const WritingGeneratorSchema = {
    includeZero: [
        [Scope.NumbersWithZero, Scope.NumbersWithoutZero],
        hasLabel(Scope.NumbersWithZero)
    ],
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller10]),
        resolveRangeFromLabels
    ]
} as const;

export type WritingGeneratorConfig = ConfigFromSchema<typeof WritingGeneratorSchema>;
