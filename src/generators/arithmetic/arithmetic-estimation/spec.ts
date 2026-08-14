import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {arithmeticOperations, resolveExplicitOperation} from '../helpers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'arithmetic-estimation',
    generalLabels: [
        Area.Estimation,
        Area.IntegerRounding,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives
    ]
};

export const ArithmeticEstimationGeneratorSchema = {
    operation: [arithmeticOperations, resolveExplicitOperation],
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller1000]),
        resolveRangeFromLabels
    ]
} as const;

export type ArithmeticEstimationGeneratorConfig = ConfigFromSchema<
    typeof ArithmeticEstimationGeneratorSchema
>;
