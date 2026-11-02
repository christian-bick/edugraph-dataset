import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';
import {standardColumnRangeLabels, standardColumnZeroLabels, resolveStandardColumnRange, resolveStandardColumnZero} from './range-profile.ts';

export const spec: GeneratorSpec = {
    generatorId: 'standard-algorithm-decimal-add-subtract',
    compatibility: [generatorLabelRule('standard-decimal-column-range', [...standardColumnRangeLabels, ...standardColumnZeroLabels], selected =>
        !selected(Scope.NumbersSmaller10) || !selected(Scope.NumbersWithoutZero))],
    generalLabels: [Scope.DecimalNumbers, Scope.Base10, Scope.NumbersWithoutNegatives, Scope.MultipleDigitLargestOperand, Scope.TwoOperands]
};

export const StandardAlgorithmDecimalAddSubtractGeneratorSchema = {
    operation: [[Area.AdditionStandardAlgorithm, Area.SubtractionStandardAlgorithm], selectExactLabelMap([
        [Area.AdditionStandardAlgorithm, 'addition'],
        [Area.SubtractionStandardAlgorithm, 'subtraction']
    ] as const)],
    zeroPresence: [standardColumnZeroLabels, resolveStandardColumnZero, standardColumnZeroLabels.map(label => [label])],
    range: [standardColumnRangeLabels, resolveStandardColumnRange, standardColumnRangeLabels.map(label => [label])]
} as const;

export type StandardAlgorithmDecimalAddSubtractGeneratorConfig = ConfigFromSchema<
    typeof StandardAlgorithmDecimalAddSubtractGeneratorSchema
>;
