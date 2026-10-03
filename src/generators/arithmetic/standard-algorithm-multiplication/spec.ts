import {Area, Scope} from 'edugraph-ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'standard-algorithm-multiplication',
    generalLabels: [
        Area.MultiplicationStandardAlgorithm,
        Scope.TwoOperands,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.MultipleDigitSmallestOperand
    ]
};

export const StandardAlgorithmMultiplicationGeneratorSchema = {} as const;
export type StandardAlgorithmMultiplicationGeneratorConfig = ConfigFromSchema<
    typeof StandardAlgorithmMultiplicationGeneratorSchema
>;
