import {Area, Scope} from 'edugraph-ts';
import {
    canonicalRangeLabelChoices,
    canonicalRangeProfiles,
    resolveOptionalCanonicalRangeFromLabels
} from '../../../lib/canonical-range-labels.ts';
import type {CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';
import type {ArithmeticOperation} from '../../../types/problems.ts';
import {measurementIntegerTuples} from './integer-domain.ts';
import {
    measurementWordProblemOperandDigitChoices,
    resolveMeasurementWordProblemOperandDigits
} from './operation-labels.ts';

export const measurementRangeChoices = [[], ...canonicalRangeLabelChoices([5, 10, 20, 100])];
export const measurementRangeLabels = [...new Set(measurementRangeChoices.flat())];
const operations = [
    [Area.Addition, 'addition'], [Area.Subtraction, 'subtraction'],
    [Area.Multiplication, 'multiplication'], [Area.Division, 'division']
] as const;
const numberLabels = [Scope.IntegerNumbers, Scope.FractionNumbers, Scope.DecimalNumbers];
const selectNumberKind = selectExactLabelSetMap([
    [[Scope.IntegerNumbers], 'integer'],
    [[Scope.FractionNumbers, Scope.ProperFractions], 'fraction'],
    [[Scope.DecimalNumbers], 'decimal']
] as const);

/** Preserve the integer completion previously imposed by the integer-only range guard. */
export const resolveMeasurementNumberKind = withLabelChoices(exactResolver((labels: string[]) => {
    const requested = [...numberLabels, Scope.ProperFractions].some(label => labels.includes(label));
    return requested ? selectNumberKind(labels) : 'integer';
}), {
    ...selectNumberKind.labelChoices!, defaults: [{labels: [Scope.IntegerNumbers]}]
});
const digitLabels = measurementWordProblemOperandDigitChoices.flat();
export const measurementRangeContext = [...operations.map(([label]) => label), ...numberLabels, ...digitLabels];

const selectedOperation = (labels: readonly string[]): ArithmeticOperation | undefined =>
    operations.find(([label]) => labels.includes(label))?.[1];

/** No payload inspection: this checks the generator's authored, finite mathematical support. */
export function permitsMeasurementRange(labels: readonly string[], range: CanonicalNumericRange | false): boolean {
    const integer = labels.includes(Scope.IntegerNumbers);
    if (numberLabels.some(label => labels.includes(label)) && !integer) {
        // Decimal addition is the remaining mixed-band slice, adopted separately.
        if (labels.includes(Scope.DecimalNumbers) && selectedOperation(labels) === 'addition') return range === false;
        return range !== false && range.min === 0 && range.max === 5;
    }
    if (range === false) return !integer;
    const operation = selectedOperation(labels);
    if (!operation) return true;
    const digits = labels.includes(Scope.SingleDigitLargestOperand) ? 1
        : labels.includes(Scope.TwoDigitLargestOperand) ? 2 : undefined;
    return measurementIntegerTuples(operation, range, digits).length > 0;
}

export const resolveMeasurementRange = withLabelChoices(exactResolver((labels: string[]) => {
    const range = resolveOptionalCanonicalRangeFromLabels(labels);
    return range !== undefined && permitsMeasurementRange(labels, range) ? range : undefined;
}), {
    kind: 'alternatives', alternatives: measurementRangeChoices, relation: 'capability',
    defaults: [
        {whenAll: [Scope.FractionNumbers], labels: [Scope.NumbersSmaller5]},
        {whenAll: [Scope.DecimalNumbers, Area.Addition], labels: []},
        ...[Area.Subtraction, Area.Multiplication, Area.Division].map(operation => ({
            whenAll: [Scope.DecimalNumbers, operation], labels: [Scope.NumbersSmaller5]
        }))
    ],
    contextLabels: measurementRangeContext, resolvedContext: true
});

/** Direct extraction chooses only widths supported by the requested number/operation/range context. */
export const resolveMeasurementOperandDigits = withLabelChoices(exactResolver((labels: string[]) => {
    const digits = resolveMeasurementWordProblemOperandDigits(labels);
    const operation = selectedOperation(labels);
    const hasNumberKind = numberLabels.some(label => labels.includes(label));
    if (!operation || !hasNumberKind) return digits;
    const integer = labels.includes(Scope.IntegerNumbers);
    const valid = operation === 'division' ? digits && digits.role === 'divisor'
        : operation === 'multiplication' ? digits && digits.digits === 1 && digits.role === (integer ? 'smallest' : 'largest')
        : integer ? digits && digits.role === 'largest' : digits === false;
    if (!valid) return undefined;
    const requestedRange = labels.filter(label => measurementRangeLabels.includes(label));
    if (integer && requestedRange.length && !canonicalRangeProfiles.some(profile =>
        profile.range.max <= 100
        && requestedRange.every(label => profile.labels.includes(label))
        && permitsMeasurementRange(labels, profile.range))) return undefined;
    return digits;
}), {
    kind: 'alternatives', alternatives: measurementWordProblemOperandDigitChoices,
    contextLabels: [...operations.map(([label]) => label), ...numberLabels, ...measurementRangeLabels],
    resolvedContext: true
});
