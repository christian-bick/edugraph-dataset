import {Area, Scope} from 'edugraph-ts';
import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {CurrencyAmount, CurrencyArithmeticProblem} from '../../../types/problems.ts';
import {CurrencyArithmeticGeneratorConfig, CurrencyArithmeticGeneratorSchema} from './spec.ts';
import {banknoteRowsForRange, pennyRowsForRange, centOnlyRowsForRange} from './numeric-domain.ts';

const denominationCents: Record<string, number> = {
    [Scope.QuarterDenomination]: 25,
    [Scope.TenthDenomination]: 10,
    [Scope.TwentiethDenomination]: 5,
    [Scope.HundredthDenomination]: 1
};

const randomInteger = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));

function makeAmount(useCoins: boolean, useBanknotes: boolean, coinValueCents: number | null): CurrencyAmount {
    const items: CurrencyAmount['items'] = [];

    if (useBanknotes) {
        items.push({kind: 'banknote', denominationCents: 100, count: randomInteger(1, 3)});
    }
    if (useCoins && coinValueCents !== null) {
        const maxCoins = useBanknotes ? 3 : Math.max(2, Math.min(6, Math.floor(75 / coinValueCents)));
        items.push({kind: 'coin', denominationCents: coinValueCents, count: randomInteger(1, maxCoins)});
    }

    return {
        items,
        totalCents: items.reduce((total, item) => total + item.denominationCents * item.count, 0)
    };
}

export class CurrencyArithmeticGenerator implements ProblemGenerator<CurrencyArithmeticProblem, CurrencyArithmeticGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = CurrencyArithmeticGeneratorSchema;

    generate(config: CurrencyArithmeticGeneratorConfig): ProblemStub<CurrencyArithmeticProblem> | null {
        validateConfigFields('currency-arithmetic', config, [
            'operation',
            'useCoins',
            'useBanknotes',
            'coinDenomination'
        ]);

        if (!config.useCoins && !config.useBanknotes) {
            throw new GeneratorValidationError('currency-arithmetic', 'At least one currency representation is required.');
        }

        const coinValueCents = config.coinDenomination === 'none'
            ? null
            : denominationCents[config.coinDenomination!];
        if (config.useCoins && coinValueCents === null) {
            throw new GeneratorValidationError('currency-arithmetic', 'A coin denomination is required when coins are used.');
        }
        if (!config.useCoins && config.coinDenomination !== 'none') {
            throw new GeneratorValidationError('currency-arithmetic', 'A coin denomination cannot be used without coins.');
        }

        const operation = config.operation === Area.Addition
            ? 'addition'
            : config.operation === Area.Subtraction ? 'subtraction' : null;
        if (!operation) return null;
        if (!config.useCoins) {
            validateConfigFields('currency-arithmetic', config, ['range']);
            const rows = config.range === false ? [] : banknoteRowsForRange(operation, config.range!);
            if (rows.length === 0) throw new GeneratorValidationError('currency-arithmetic', 'Unsupported canonical banknote range.');
            const row = rows[Math.floor(random() * rows.length)]!;
            const amount = (count: number): CurrencyAmount => ({
                items: [{kind: 'banknote', denominationCents: 100, count}], totalCents: count * 100
            });
            return {data: {operation, amounts: [amount(row.first), amount(row.second)], answerCents: row.answer * 100}};
        }
        if (!config.useBanknotes && coinValueCents === 1) {
            validateConfigFields('currency-arithmetic', config, ['range']);
            const rows = config.range === false ? [] : pennyRowsForRange(operation, config.range!);
            if (rows.length === 0) throw new GeneratorValidationError('currency-arithmetic', 'Unsupported canonical penny range.');
            const row = rows[Math.floor(random() * rows.length)]!;
            const amount = (count: number): CurrencyAmount => ({
                items: [{kind: 'coin', denominationCents: 1, count}], totalCents: count
            });
            return {data: {operation, amounts: [amount(row.first), amount(row.second)], answerCents: row.answer}};
        }
        if (!config.useBanknotes && (coinValueCents === 5 || coinValueCents === 10 && operation === 'subtraction')) {
            validateConfigFields('currency-arithmetic', config, ['range']);
            const rows = config.range === false ? [] : centOnlyRowsForRange(operation, coinValueCents, config.range!);
            if (rows.length === 0) throw new GeneratorValidationError('currency-arithmetic', 'Unsupported canonical cents-only range.');
            const row = rows[Math.floor(random() * rows.length)]!;
            const amount = (count: number): CurrencyAmount => ({
                items: [{kind: 'coin', denominationCents: coinValueCents, count}], totalCents: count * coinValueCents
            });
            return {data: {operation, amounts: [amount(row.first), amount(row.second)], answerCents: row.answer * coinValueCents}};
        }
        if (config.range !== undefined && config.range !== false) {
            throw new GeneratorValidationError('currency-arithmetic', 'Range qualification for this currency representation is outside this adoption.');
        }

        let first = makeAmount(config.useCoins!, config.useBanknotes!, coinValueCents);
        let second = makeAmount(config.useCoins!, config.useBanknotes!, coinValueCents);
        if (first.totalCents === second.totalCents) {
            first.items[0].count += 1;
            first.totalCents += first.items[0].denominationCents;
        }

        if (operation === 'subtraction' && first.totalCents < second.totalCents) {
            [first, second] = [second, first];
        }

        const answerCents = operation === 'addition'
            ? first.totalCents + second.totalCents
            : first.totalCents - second.totalCents;

        return {
            data: {
                operation,
                amounts: [first, second],
                answerCents
            }
        };
    }
}
