import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import {selectExactMatch} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'place-value-expanded',
    generalLabels: [
        Area.PlaceValue,
        Area.Sum,
        Scope.IntegerNumbers,
        Scope.Base10
    ]
};

export const PlaceValueExpandedGeneratorSchema = {
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller1000000]),
        resolveRangeFromLabels
    ],
    operandCardinality: [
        [Scope.TwoOperands, Scope.ThreeOperands],
        selectExactMatch
    ]
} as const;

export type PlaceValueExpandedGeneratorConfig = ConfigFromSchema<typeof PlaceValueExpandedGeneratorSchema>;
