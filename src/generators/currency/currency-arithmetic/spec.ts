import {Area, Scope} from 'edugraph-ts';
import {hasLabel, selectExactLabelSetMap, selectExactMatch} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const currencyOperations = [Area.Addition, Area.Subtraction] as const;
export const coinDenominations = [
    Scope.QuarterDenomination,
    Scope.TenthDenomination,
    Scope.TwentiethDenomination,
    Scope.HundredthDenomination
] as const;

const resolveCoinDenomination = selectExactLabelSetMap([
    [[], 'none'],
    ...coinDenominations.map(denomination => [[denomination], denomination] as const)
]);

import {generatorLabelRule} from '../../compatibility-rules.ts';

export const spec: GeneratorSpec = {
    generatorId: 'currency-arithmetic',
    compatibility: [generatorLabelRule('currency-representation-denomination', [
        Scope.Coins, Scope.Banknotes, ...coinDenominations
    ], selected => {
        const coins = selected(Scope.Coins);
        return (coins || selected(Scope.Banknotes)) && coins === coinDenominations.some(selected);
    })],
    generalLabels: [Scope.Dollar, Scope.TwoOperands, Scope.SingleStep]
};

export const CurrencyArithmeticGeneratorSchema = {
    operation: [currencyOperations, selectExactMatch],
    useCoins: [[Scope.Coins], hasLabel(Scope.Coins)],
    useBanknotes: [[Scope.Banknotes, Scope.MajorDenomination], hasLabel(Scope.Banknotes)],
    coinDenomination: [coinDenominations, resolveCoinDenomination]
} as const;

export type CurrencyArithmeticGeneratorConfig = ConfigFromSchema<typeof CurrencyArithmeticGeneratorSchema>;
