import {Area, Scope} from 'edugraph-ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'standard-algorithm-decimal-add-subtract',
    generalLabels: [Scope.DecimalNumbers, Scope.Base10, Scope.NumbersWithoutNegatives, Scope.MultipleDigitLargestOperand]
};

export const StandardAlgorithmDecimalAddSubtractGeneratorSchema = {
    operation: [[Area.AdditionStandardAlgorithm, Area.SubtractionStandardAlgorithm], selectExactLabelMap([
        [Area.AdditionStandardAlgorithm, 'addition'],
        [Area.SubtractionStandardAlgorithm, 'subtraction']
    ] as const)],
    range: [[Scope.NumbersSmaller100000, Scope.NumbersSmaller1000000], resolveRangeFromLabels]
} as const;

export type StandardAlgorithmDecimalAddSubtractGeneratorConfig = ConfigFromSchema<
    typeof StandardAlgorithmDecimalAddSubtractGeneratorSchema
>;
