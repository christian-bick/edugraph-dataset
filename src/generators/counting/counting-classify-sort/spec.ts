import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'counting-classify-sort',
    generalLabels: [
        Area.NumerationWithIntegers,
        Area.ObjectSorting,
        Scope.IntegerNumbers,
        Scope.NumbersWithoutZero,
        Scope.NumbersWithoutNegatives
    ]
};


export const CountingClassifySortGeneratorSchema = {
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller20]),
        resolveRangeFromLabels
    ],
    relation: [
        [Scope.Least, Scope.Most, Scope.AscendingOrder, Scope.DescendingOrder],
        selectExactLabelMap([
            [Scope.Least, 'least'],
            [Scope.Most, 'most'],
            [Scope.AscendingOrder, 'ascending'],
            [Scope.DescendingOrder, 'descending']
        ] as const)
    ],
} as const;

export type CountingClassifySortGeneratorConfig = ConfigFromSchema<typeof CountingClassifySortGeneratorSchema>;
