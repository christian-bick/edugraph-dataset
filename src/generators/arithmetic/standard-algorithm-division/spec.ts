import {Area, Scope} from 'edugraph-ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

const resolveDivisorDigits = selectExactLabelMap([
    [Scope.SingleDigitDivisor, 1],
    [Scope.TwoDigitDivisor, 2],
    [Scope.ThreeDigitDivisor, 3]
] as const);

export const spec: GeneratorSpec = {
    generatorId: 'standard-algorithm-division',
    generalLabels: [
        Area.DivisionStandardAlgorithm,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.MultipleDigitDividend
    ]
};

export const StandardAlgorithmDivisionGeneratorSchema = {
    range: [[Scope.NumbersSmaller10000, Scope.NumbersSmaller100000], resolveRangeFromLabels],
    divisorDigits: [[Scope.SingleDigitDivisor, Scope.TwoDigitDivisor, Scope.ThreeDigitDivisor], resolveDivisorDigits]
} as const;

export type StandardAlgorithmDivisionGeneratorConfig = ConfigFromSchema<typeof StandardAlgorithmDivisionGeneratorSchema>;
