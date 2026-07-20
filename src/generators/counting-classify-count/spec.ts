import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../types/schema.ts';
import {resolveRangeFromLabels} from '../../lib/ontology.ts';

export const spec: GeneratorSpec = {
    generatorId: 'counting-classify-count',
    generalLabels: [
        Area.Numeration,
        Area.ObjectSorting,
        Area.CollectionSense,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutZero,
        Scope.NumbersWithoutNegatives,
    ]
};


export const CountingClassifyCountGeneratorSchema = {
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller20]),
        resolveRangeFromLabels
    ]
} as const;

export type CountingClassifyCountGeneratorConfig = ConfigFromSchema<typeof CountingClassifyCountGeneratorSchema>;
