import {Area, Scope} from 'edugraph-ts';
import {canonicalRangeLabelChoices, canonicalRangeLabels} from '../../../lib/canonical-range-labels.ts';
import {hasAllLabels, hasLabel} from '../../../lib/resolvers.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {arithmeticOperations, resolveDeclaredOperation} from '../helpers.ts';
import {canSampleCanonicalPair} from '../canonical-pair-sampling.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';
import {canonicalPairConfigFromSelection, canonicalPairContextLabels, largestOperandWidthLabels, largestOperandWidthValue, resolveLargestOperandDigits} from './operand-width.ts';
import {resolveZeroOccurrence} from './zero-occurrence.ts';
import {resolveCanonicalPairRange} from './canonical-range.ts';

export const spec: GeneratorSpec = {
    generatorId: 'arithmetic-ops-pairs',
    compatibility: [generatorLabelRule('canonical-pair-domain', [
        ...canonicalPairContextLabels, ...largestOperandWidthLabels
    ], selected => {
        const widths = largestOperandWidthLabels.filter(selected);
        const config = widths.length === 1 ? canonicalPairConfigFromSelection(selected, largestOperandWidthValue(widths[0]!)) : null;
        return config !== null && canSampleCanonicalPair(config);
    })],
    generalLabels: [Scope.IntegerNumbers, Scope.Base10, Scope.TwoOperands, Scope.SingleStep]
};

export const ArithmeticOpsPairsGeneratorSchema = {
    operation: [arithmeticOperations, resolveDeclaredOperation],
    requireNegative: [[Scope.NumbersWithNegatives, Scope.NumbersWithoutNegatives], hasLabel(Scope.NumbersWithNegatives),
        [[Scope.NumbersWithNegatives], [Scope.NumbersWithoutNegatives]]],
    requireZero: [[Scope.NumbersWithZero, Scope.NumbersWithoutZero], resolveZeroOccurrence,
        [[Scope.NumbersWithZero], [Scope.NumbersWithoutZero]]],
    requireMultipleOf10: [[Scope.MultiplesOf10], hasLabel(Scope.MultiplesOf10)],
    requireEqualAddends: [[Area.IteratedOperation], hasAllLabels([Area.Addition, Area.IteratedOperation])],
    requireEvenResult: [[Scope.EvenNumbers], hasLabel(Scope.EvenNumbers)],
    range: [canonicalRangeLabels, resolveCanonicalPairRange, canonicalRangeLabelChoices()],
    largestOperandDigits: [largestOperandWidthLabels, resolveLargestOperandDigits,
        largestOperandWidthLabels.map(label => [label])]
} as const;

export type ArithmeticOpsPairsGeneratorConfig = ConfigFromSchema<typeof ArithmeticOpsPairsGeneratorSchema>;
