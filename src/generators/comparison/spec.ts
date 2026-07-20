import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../types/schema.ts';
import {hasSubConcept} from '../../lib/resolvers.ts';
import {resolveRangeFromLabels} from '../../lib/ontology.ts';

export const spec: GeneratorSpec = {
    generatorId: 'comparison',
    supportedLabels: [
        Area.Numeration,
        Area.NumericComparison,
        Scope.IntegerNumbers,
        Scope.Base10,
    ]
};


export const ComparisonGeneratorSchema = {
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller1000000]),
        resolveRangeFromLabels
    ],
    wantsGreater: [
        [Scope.Greater], // TODO: Consider ontological relations if applicable
        hasSubConcept(Scope.Greater)
    ],
    wantsLess: [
        [Scope.Less], // TODO: Consider ontological relations if applicable
        hasSubConcept(Scope.Less)
    ],
    wantsEqual: [
        [Scope.Equal], // TODO: Consider ontological relations if applicable
        hasSubConcept(Scope.Equal)
    ]
} as const;

export type ComparisonGeneratorConfig = ConfigFromSchema<typeof ComparisonGeneratorSchema>;
