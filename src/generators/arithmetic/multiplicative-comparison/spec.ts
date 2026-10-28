import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'multiplicative-comparison',
    generalLabels: [
        Area.ProportionalScaling,
        Scope.SingleStep,
        Scope.TwoOperands,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero
    ]
};

const operationProfiles = [
    [[Area.Multiplication, Scope.SingleDigitSmallestOperand], 'multiplication'],
    [[Area.Division], 'division']
] as const;

export const MultiplicativeComparisonGeneratorSchema = {
    operation: [
        [Area.Multiplication, Area.Division, Scope.SingleDigitSmallestOperand],
        selectExactLabelSetMap(operationProfiles),
        operationProfiles.map(([labels]) => labels)
    ]
} as const;

export type MultiplicativeComparisonGeneratorConfig = ConfigFromSchema<
    typeof MultiplicativeComparisonGeneratorSchema
>;
