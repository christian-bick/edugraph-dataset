import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../types/schema.ts';
import {resolveRangeFromLabels} from '../../lib/ontology.ts';

export const spec: GeneratorSpec = {
    generatorId: 'counting-classify-sort',
    generalLabels: [
        Area.Numeration,
        Area.ObjectSorting,
        Area.NumericOrder,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutZero,
        Scope.NumbersWithoutNegatives
    ]
};


export const CountingClassifySortGeneratorSchema = {
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller20]),
        resolveRangeFromLabels
    ],
    relation: [Scope.Least, Scope.Most],
} as const;

export type CountingClassifySortGeneratorConfig = ConfigFromSchema<typeof CountingClassifySortGeneratorSchema>;
