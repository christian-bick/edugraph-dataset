import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {hasLabel} from '../../../lib/resolvers.ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'place-value-bundles',
    generalLabels: [
        Area.PlaceValue,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero
    ]
};

export const PlaceValueBundlesGeneratorSchema = {
    useMultipleTens: [
        [Scope.MultiplesOf10],
        hasLabel(Scope.MultiplesOf10)
    ],
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller100]),
        resolveRangeFromLabels
    ]
} as const;

export type PlaceValueBundlesGeneratorConfig = ConfigFromSchema<typeof PlaceValueBundlesGeneratorSchema>;
