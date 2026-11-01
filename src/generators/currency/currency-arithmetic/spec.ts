import {Area, Scope} from 'edugraph-ts';
import {hasLabel, selectExactLabelSetMap, selectExactMatch} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';
import {resolveOptionalCanonicalRangeFromLabels} from '../../../lib/canonical-range-labels.ts';
import {currencyRangeChoices, currencyRangeContext, currencyRangeLabels, permitsCurrencyRange, resolveCurrencyRange} from './range-profile.ts';

export const currencyOperations = [Area.Addition, Area.Subtraction] as const;
export const coinDenominations = [
    Scope.QuarterDenomination,
    Scope.TenthDenomination,
    Scope.TwentiethDenomination,
    Scope.HundredthDenomination
] as const;

const singleDigitInteger = [Scope.IntegerNumbers, Scope.SingleDigitLargestOperand] as const;
const integerDenominations = coinDenominations.map(denomination => [
    denomination,
    Scope.IntegerNumbers,
    denomination === Scope.HundredthDenomination ? Scope.SingleDigitLargestOperand
        : denomination === Scope.QuarterDenomination ? Scope.TwoDigitSmallestOperand
            : Scope.TwoDigitLargestOperand
]);
const denominationChoices = [
    singleDigitInteger,
    ...coinDenominations.map(denomination => [denomination]),
    ...integerDenominations
];
const resolveCoinDenomination = selectExactLabelSetMap([
    [[], 'none'],
    [singleDigitInteger, 'none'],
    ...coinDenominations.map(denomination => [[denomination], denomination] as const),
    ...integerDenominations.map(labels => [labels, labels[0]] as const)
]);

export const spec: GeneratorSpec = {
    generatorId: 'currency-arithmetic',
    compatibility: [generatorLabelRule('currency-representation-denomination', [
        Scope.Coins, Scope.Banknotes, ...coinDenominations
    ], selected => {
        const coins = selected(Scope.Coins);
        return (coins || selected(Scope.Banknotes)) && coins === coinDenominations.some(selected);
    }), generatorLabelRule('currency-integer-denominations', [
        Scope.Coins, Scope.Banknotes, ...coinDenominations, Area.Subtraction,
        Scope.IntegerNumbers, Scope.SingleDigitLargestOperand,
        Scope.TwoDigitLargestOperand, Scope.TwoDigitSmallestOperand
    ], selected => {
        if (!selected(Scope.Coins)) return selected(Scope.IntegerNumbers)
            && selected(Scope.SingleDigitLargestOperand);
        if (selected(Scope.Banknotes)) return !selected(Scope.IntegerNumbers);
        if (selected(Scope.HundredthDenomination)) return selected(Scope.IntegerNumbers)
            && selected(Scope.SingleDigitLargestOperand);
        if (selected(Scope.TwentiethDenomination)) return selected(Scope.IntegerNumbers)
            && selected(Scope.TwoDigitLargestOperand);
        if (selected(Area.Subtraction)) return selected(Scope.IntegerNumbers)
            && selected(selected(Scope.QuarterDenomination)
                ? Scope.TwoDigitSmallestOperand : Scope.TwoDigitLargestOperand);
        return !selected(Scope.IntegerNumbers);
    }), generatorLabelRule('currency-canonical-range', [...currencyRangeLabels, ...currencyRangeContext], selected => {
        const labels = [...currencyRangeLabels, ...currencyRangeContext].filter(selected);
        const range = resolveOptionalCanonicalRangeFromLabels(labels);
        return range !== undefined && permitsCurrencyRange(labels, range);
    })],
    generalLabels: [
        Scope.Dollar,
        Scope.TwoOperands,
        Scope.SingleStep,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero
    ]
};

export const CurrencyArithmeticGeneratorSchema = {
    operation: [currencyOperations, selectExactMatch],
    useCoins: [[Scope.Coins], hasLabel(Scope.Coins)],
    useBanknotes: [[Scope.Banknotes, Scope.MajorDenomination], hasLabel(Scope.Banknotes)],
    coinDenomination: [[...new Set(denominationChoices.flat())], resolveCoinDenomination, denominationChoices],
    range: [currencyRangeLabels, resolveCurrencyRange, currencyRangeChoices]
} as const;

export type CurrencyArithmeticGeneratorConfig = ConfigFromSchema<typeof CurrencyArithmeticGeneratorSchema>;
