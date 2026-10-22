import {Area, Scope} from 'edugraph-ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'standard-algorithm-decimal-multiplication',
    generalLabels: [
        Area.MultiplicationStandardAlgorithm, Scope.DecimalNumbers, Scope.Base10,
        Scope.NumbersWithoutNegatives, Scope.MultipleDigitLargestOperand
    ]
};

export const StandardAlgorithmDecimalMultiplicationGeneratorSchema = {
    range: [[Scope.NumbersSmaller100000, Scope.NumbersSmaller1000000], resolveRangeFromLabels]
} as const;

export type StandardAlgorithmDecimalMultiplicationGeneratorConfig = ConfigFromSchema<
    typeof StandardAlgorithmDecimalMultiplicationGeneratorSchema
>;
