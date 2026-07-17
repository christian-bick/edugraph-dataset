import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../types/schema.ts';
import {resolveRangeFromLabels} from '../../lib/ontology.ts';

export const spec: GeneratorSpec = {
    generatorId: 'counting-classify-count',
    supportedLabels: [
        Area.Numeration,
        Area.ObjectSorting,
        Area.CollectionSense,
        Scope.NumericRange,
        Scope.NumericZero
    ]
};

export const CountingClassifyCountGeneralLabels = [
    Area.Numeration,
    Area.ObjectSorting,
    Area.CollectionSense,
    Scope.NumericZero
];

export const CountingClassifyCountGeneratorSchema = {
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller1000000]),
        (labels: string[]) => resolveRangeFromLabels(deductCompatible(labels as any))
    ]
} as const;

export type CountingClassifyCountGeneratorConfig = ConfigFromSchema<typeof CountingClassifyCountGeneratorSchema>;
