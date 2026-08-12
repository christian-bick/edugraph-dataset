import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {resolveExplicitOperation} from '../../arithmetic/helpers.ts';

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
    operation: [[Area.Addition, Area.Subtraction], resolveExplicitOperation],
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller1000]),
        resolveRangeFromLabels
    ]
} as const;

export type PlaceValueArithmeticGeneratorConfig = ConfigFromSchema<typeof PlaceValueArithmeticGeneratorSchema>;
