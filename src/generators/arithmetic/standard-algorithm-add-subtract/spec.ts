import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import {selectCanonicalLabel} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

const resolveOperation = selectCanonicalLabel([
    [[Area.AdditionStandardAlgorithm], 'addition'],
    [[Area.SubtractionStandardAlgorithm], 'subtraction']
] as const);

export const spec: GeneratorSpec = {
    generatorId: 'standard-algorithm-add-subtract',
    generalLabels: [
        Scope.TwoOperands,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero
    ]
};

export const StandardAlgorithmAddSubtractGeneratorSchema = {
    operation: [
        [Area.AdditionStandardAlgorithm, Area.SubtractionStandardAlgorithm],
        resolveOperation
    ],
    range: [
        deductCompatible([Scope.NumbersLarger1000, Scope.NumbersSmaller1000000]),
        resolveRangeFromLabels
    ]
} as const;

export type StandardAlgorithmAddSubtractGeneratorConfig = ConfigFromSchema<
    typeof StandardAlgorithmAddSubtractGeneratorSchema
>;
