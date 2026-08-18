import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import {selectCanonicalLabel} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

const resolveOperation = selectCanonicalLabel([
    [[Area.AdditionPlaceValuePartitioning, Area.Addition], Area.Addition],
    [[Area.SubtractionPlaceValuePartitioning, Area.Subtraction], Area.Subtraction]
] as const);

export const spec: GeneratorSpec = {
    generatorId: 'place-value-arithmetic',
    generalLabels: [
        Area.PlaceValue,
        Area.IntegerRegrouping,
        Scope.TwoOperands,
        Scope.IntegerNumbers,
        Scope.Base10
    ]
};

export const PlaceValueArithmeticGeneratorSchema = {
    operation: [[
        Area.AdditionPlaceValuePartitioning,
        Area.SubtractionPlaceValuePartitioning,
        Area.Addition,
        Area.Subtraction
    ], resolveOperation],
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller1000]),
        resolveRangeFromLabels
    ]
} as const;

export type PlaceValueArithmeticGeneratorConfig = ConfigFromSchema<typeof PlaceValueArithmeticGeneratorSchema>;
