import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../types/schema.ts';
import {resolveRangeFromLabels} from '../../lib/ontology.ts';
import {hasSubConcept} from '../../lib/resolvers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'counting-inc-dec',
    generalLabels: [
        Area.Numeration,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutZero,
        Scope.NumbersWithoutNegatives
    ]
};


export const CountingIncDecGeneratorSchema = {
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller20]),
        resolveRangeFromLabels
    ],
    direction: [Scope.SubtractiveCount, Scope.AdditiveCount]
} as const;

export type CountingIncDecGeneratorConfig = ConfigFromSchema<typeof CountingIncDecGeneratorSchema>;
