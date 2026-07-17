import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../types/schema.ts';
import {resolveRangeFromLabels} from '../../lib/ontology.ts';
import {hasSubConcept} from '../../lib/resolvers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'counting-classify-sort',
    supportedLabels: [
        Area.Numeration,
        Area.ObjectSorting,
        Area.NumericOrder,
        Scope.NumericRange,
        Scope.NumericZero,
        Scope.Most,
        Scope.Least
    ]
};

export const CountingClassifySortGeneralLabels = [
    Area.Numeration,
    Area.ObjectSorting,
    Area.NumericOrder,
    Scope.NumericZero
];

export const CountingClassifySortGeneratorSchema = {
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller1000000]),
        (labels: string[]) => resolveRangeFromLabels(deductCompatible(labels as any))
    ],
    wantsMost: [
        [Scope.Most], // TODO: Consider ontological relations if applicable
        hasSubConcept(Scope.Most)
    ],
    wantsLeast: [
        [Scope.Least], // TODO: Consider ontological relations if applicable
        hasSubConcept(Scope.Least)
    ]
} as const;

export type CountingClassifySortGeneratorConfig = ConfigFromSchema<typeof CountingClassifySortGeneratorSchema>;
