import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelMap, selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

const approximationModels = [
    [[], 'bounds-only'],
    [[Area.NumericApproximation], 'nearest-quarter']
] as const;

const resolveApproximationModel = selectExactLabelSetMap(approximationModels);

export const spec: GeneratorSpec = {
    generatorId: 'fraction-benchmark-arithmetic',
    generalLabels: [
        Area.FractionReferenceComparison,
        Scope.FractionNumbers,
        Scope.SingleFrameOfReference
    ]
};

export const FractionBenchmarkArithmeticGeneratorSchema = {
    operation: [[Area.Addition, Area.Subtraction], selectExactLabelMap([
        [Area.Addition, 'addition'],
        [Area.Subtraction, 'subtraction']
    ])],
    approximationModel: [[Area.NumericApproximation],
        resolveApproximationModel, approximationModels.map(([labels]) => labels)]
} as const;

export type FractionBenchmarkArithmeticGeneratorConfig = ConfigFromSchema<
    typeof FractionBenchmarkArithmeticGeneratorSchema
>;
