import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../types/schema.ts';
import {resolveRangeFromLabels} from '../../lib/ontology.ts';
import {hasSubConcept} from '../../lib/resolvers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'counting-classify-sort',
    generalLabels: [
        Area.Numeration,
        Area.ObjectSorting,
        Area.NumericOrder,
        Scope.NumericRange,
        Scope.NumericZero
    ,
        Scope.Base10,
        Scope.IntegerNumbers]
};


export const CountingClassifySortGeneratorSchema = {
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller1000000]),
        resolveRangeFromLabels
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
