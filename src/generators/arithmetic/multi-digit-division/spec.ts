import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {selectExactLabelMap, selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {ConfigFromSchema, exactResolver, withLabelChoices} from '../../../types/schema.ts';
import {canonicalRangeProfiles, resolveCanonicalRangeFromLabels} from '../../../lib/canonical-range-labels.ts';
import {partialQuotientDomain} from './domain.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';
import {resolvePartialQuotientZero} from './zero-profile.ts';

const divisorProfiles = [
    [Scope.SingleDigitDivisor, Area.ImperfectDivisibility, Scope.NumbersWithoutZero],
    [Scope.TwoDigitDivisor]
] as const;

const divisorDigitsFromLabels = selectExactLabelSetMap([
    [divisorProfiles[0], 1],
    [divisorProfiles[1], 2],
    // The two-digit domain also has a zero-free conditional mathematical profile.
    [[Scope.TwoDigitDivisor, Scope.NumbersWithoutZero], 2]
] as const);

const dividendDigitsFromLabels = selectExactLabelMap([
    [Scope.SingleDigitDividend, 1],
    [Scope.TwoDigitDividend, 2],
    [Scope.ThreeDigitDividend, 3],
    [Scope.FourDigitDividend, 4]
] as const);

const dividendLabels = [Scope.SingleDigitDividend, Scope.TwoDigitDividend, Scope.ThreeDigitDividend, Scope.FourDigitDividend];
const contextLabels = [...dividendLabels, Scope.SingleDigitDivisor, Scope.TwoDigitDivisor,
    Scope.NumbersWithZero, Scope.NumbersWithoutZero];
const permitsRange = (labels: string[], range: Parameters<typeof partialQuotientDomain>[3]): boolean => {
    if (!contextLabels.some(label => labels.includes(label))) return true;
    const dividend = dividendLabels.filter(label => labels.includes(label));
    const divisor = [Scope.SingleDigitDivisor, Scope.TwoDigitDivisor].filter(label => labels.includes(label));
    const zero = labels.includes(Scope.NumbersWithZero), nonzero = labels.includes(Scope.NumbersWithoutZero);
    return dividend.length === 1 && divisor.length === 1 && zero !== nonzero
        && partialQuotientDomain(dividendLabels.indexOf(dividend[0]!) + 1,
            divisor[0] === Scope.SingleDigitDivisor ? 1 : 2, zero, range).count > 0;
};
const ranges = canonicalRangeProfiles.filter(({range}) => range.max <= 10000 && [0, 5].includes(range.min)
    && [1, 2, 3, 4].some(dividend => [1, 2].some(divisor => [false, true]
        .some(zero => partialQuotientDomain(dividend, divisor, zero, range).count > 0))));
const rangeChoices = ranges.map(({labels}) => labels);
const rangeLabels = [...new Set(rangeChoices.flat())];
const feasible = ranges.flatMap(profile => [1, 2, 3, 4].flatMap(dividend => [1, 2].flatMap(divisor => [false, true].flatMap(zero =>
    partialQuotientDomain(dividend, divisor, zero, profile.range).count > 0
        ? [{labels: [...profile.labels, dividendLabels[dividend - 1]!, divisor === 1 ? Scope.SingleDigitDivisor : Scope.TwoDigitDivisor,
            zero ? Scope.NumbersWithZero : Scope.NumbersWithoutZero, ...(divisor === 1 ? [Area.ImperfectDivisibility] : [])]}] : []))));
const feasibilityLabels = [...contextLabels, ...rangeLabels, Area.ImperfectDivisibility];
const admitsRequest = (labels: string[]) => feasible.some(profile => feasibilityLabels.filter(label => labels.includes(label))
    .every(label => profile.labels.includes(label)));
const resolveDivisorDigits = withLabelChoices(exactResolver((labels: string[]) => {
    const digits = divisorDigitsFromLabels(labels);
    return digits !== undefined && admitsRequest(labels) ? digits : undefined;
}), {...divisorDigitsFromLabels.labelChoices!, contextLabels: [...dividendLabels, ...rangeLabels, Scope.NumbersWithZero]});
const resolveDividendDigits = withLabelChoices(exactResolver((labels: string[]) => {
    const digits = dividendDigitsFromLabels(labels);
    return digits !== undefined && admitsRequest(labels) ? digits : undefined;
}), {...dividendDigitsFromLabels.labelChoices!, contextLabels: [...rangeLabels, Scope.SingleDigitDivisor,
    Scope.TwoDigitDivisor, Scope.NumbersWithZero, Scope.NumbersWithoutZero], resolvedContext: true});
const resolveZero = withLabelChoices(exactResolver((labels: string[]) => {
    const zero = resolvePartialQuotientZero(labels);
    return zero !== undefined && admitsRequest(labels) ? zero : undefined;
}), {...resolvePartialQuotientZero.labelChoices!, contextLabels: [...dividendLabels, Scope.SingleDigitDivisor,
    Scope.TwoDigitDivisor, ...rangeLabels], resolvedContext: true});
const resolveRange = withLabelChoices(exactResolver((labels: string[]) => {
    const range = resolveCanonicalRangeFromLabels(labels);
    return range && permitsRange(labels, range) ? range : undefined;
}), {kind: 'alternatives', relation: 'capability', alternatives: rangeChoices, contextLabels, resolvedContext: true});

export const spec: GeneratorSpec = {
    generatorId: 'multi-digit-division',
    generalLabels: [
        Area.DivisionPartialQuotients,
        Area.Modulo,
        Area.Multiplication,
        Area.Subtraction,
        Scope.TwoOperands,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives
    ],
    compatibility: [generatorLabelRule('divisor-dividend-width', [
        Scope.TwoDigitDivisor, Scope.SingleDigitDividend
    ], selected => !selected(Scope.TwoDigitDivisor) || !selected(Scope.SingleDigitDividend)),
        generatorLabelRule('partial-quotient-zero-profile', [
            Scope.SingleDigitDivisor, Scope.NumbersWithZero, Scope.NumbersWithoutZero
        ], selected => selected(Scope.NumbersWithZero) !== selected(Scope.NumbersWithoutZero)
            && !(selected(Scope.SingleDigitDivisor) && selected(Scope.NumbersWithZero))),
        generatorLabelRule('partial-quotient-canonical-band', [...contextLabels, ...rangeLabels], selected => {
            const labels = [...contextLabels, ...rangeLabels].filter(selected);
            const range = resolveCanonicalRangeFromLabels(labels);
            return range !== undefined && permitsRange(labels, range);
        })]
};

export const MultiDigitDivisionGeneratorSchema = {
    divisorDigits: [
        [
            Scope.SingleDigitDivisor,
            Scope.TwoDigitDivisor,
            Area.ImperfectDivisibility,
            Scope.NumbersWithoutZero
        ],
        resolveDivisorDigits,
        divisorProfiles
    ],
    dividendDigits: [
        [
            Scope.SingleDigitDividend,
            Scope.TwoDigitDividend,
            Scope.ThreeDigitDividend,
            Scope.FourDigitDividend
        ],
        resolveDividendDigits,
        dividendLabels.map(label => [label])
    ],
    requireZero: [
        [Scope.NumbersWithZero, Scope.NumbersWithoutZero],
        resolveZero,
        [[Scope.NumbersWithZero], [Scope.NumbersWithoutZero]]
    ],
    range: [rangeLabels, resolveRange, rangeChoices]
} as const;

export type MultiDigitDivisionGeneratorConfig = ConfigFromSchema<
    typeof MultiDigitDivisionGeneratorSchema
>;
