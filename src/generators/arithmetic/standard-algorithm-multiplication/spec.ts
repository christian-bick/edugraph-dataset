import {Area, Scope} from 'edugraph-ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import {withLabelChoices, type ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'standard-algorithm-multiplication',
    generalLabels: [
        Area.MultiplicationStandardAlgorithm,
        Scope.TwoOperands,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.MultipleDigitSmallestOperand,
        // Every aligned-row sum includes a genuine shifted-zero addend.
        Scope.NumbersWithZero
    ]
};

const rangeLabels = [Scope.NumbersSmaller1000, Scope.NumbersSmaller10000,
    Scope.NumbersSmaller100000, Scope.NumbersSmaller1000000] as const;
const rangeChoices = [[], ...rangeLabels.map(label => [label])];
const resolveRange = withLabelChoices(selectExactLabelSetMap([
    [[], false],
    [[Scope.NumbersSmaller1000], createCanonicalNumericRange(1000)],
    [[Scope.NumbersSmaller10000], createCanonicalNumericRange(10000)],
    [[Scope.NumbersSmaller100000], createCanonicalNumericRange(100000)],
    [[Scope.NumbersSmaller1000000], createCanonicalNumericRange(1000000)]
] as const), {kind: 'alternatives', relation: 'capability', alternatives: rangeChoices});

export const StandardAlgorithmMultiplicationGeneratorSchema = {
    // The empty alternative is exclusively the native product>1,000,000 domain.
    range: [rangeLabels, resolveRange]
} as const;
export type StandardAlgorithmMultiplicationGeneratorConfig = ConfigFromSchema<
    typeof StandardAlgorithmMultiplicationGeneratorSchema
>;
