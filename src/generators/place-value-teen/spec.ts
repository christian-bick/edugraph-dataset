import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, Scope, deductCompatible} from 'edugraph-ts';
import {ConfigFromSchema} from '../../types/schema.ts';
import {resolveRangeFromLabels} from '../../lib/ontology.ts';

export const spec: GeneratorSpec = {
    generatorId: 'place-value-teen',
    supportedLabels: [
        Area.BaseOperations,
        Scope.Base10,
        Scope.NumbersWithoutZero,
        Scope.NumbersWithNegatives
    ]
};


export const PlaceValueTeenGeneratorSchema = {
    range: [
        deductCompatible([Scope.NumbersSmaller20]),
        resolveRangeFromLabels
    ]
    // TODO: Add ontological relations for other properties once supported,
    // e.g., deducting base 10 vs base 2 constraints.
} as const;

export type PlaceValueTeenGeneratorConfig = ConfigFromSchema<typeof PlaceValueTeenGeneratorSchema>;
