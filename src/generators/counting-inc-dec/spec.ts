import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../types/schema.ts';
import {resolveRangeFromLabels} from '../../lib/ontology.ts';
import {hasSubConcept} from '../../lib/resolvers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'counting-inc-dec',
    supportedLabels: [
        Area.Numeration,
        Scope.AdditiveCount,
        Scope.SubtractiveCount,
        Scope.NumericRange,
        Scope.NumericZero
    ]
};

export const CountingIncDecGeneralLabels = [
    Area.Numeration,
    Scope.NumericZero
];

export const CountingIncDecGeneratorSchema = {
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller1000000]),
        (labels: string[]) => resolveRangeFromLabels(deductCompatible(labels as any))
    ],
    wantsSubtractive: [
        [Scope.SubtractiveCount], // TODO: Consider ontological relations if applicable
        hasSubConcept(Scope.SubtractiveCount)
    ],
    wantsAdditive: [
        [Scope.AdditiveCount], // TODO: Consider ontological relations if applicable
        hasSubConcept(Scope.AdditiveCount)
    ]
} as const;

export type CountingIncDecGeneratorConfig = ConfigFromSchema<typeof CountingIncDecGeneratorSchema>;
